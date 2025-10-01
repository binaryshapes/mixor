/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { delay } from '@std/async';

import type { Contract, ContractCaller, ContractErrors, ContractHandler } from '../di';
import { isErr, isOk, type Result } from '../result';
import { isSchema } from '../schema';
import { type Component, component, Panic, type PanicError } from '../system';
import type { Any } from '../utils';

/**
 * A function that can be used to handle expected errors.
 *
 * @typeParam E - The type of the error schema. Must be a SchemaErrors.
 *
 * @internal
 */
type ErrorHandler<E> = (errors: E) => Result<never, Any>;

/**
 * A function that can be used to handle unexpected errors (throws) as a side-effect.
 * This is typically used to clean up resources or undo operations.
 *
 * @internal
 */
type FallbackHandler = (error: PanicError<Any, Any>) => void;

/**
 * Task internal state type for managing retry attempts and configuration.
 *
 * @internal
 */
type TaskState<C extends Contract<Any, Any, Any, Any>> = {
  maxRetries: number;
  retryDelay: number;
  currentAttempt: number;
  lastError?: Any;
  contract: C;
  handlerFn?: ContractHandler<C>;
  errorHandler?: ErrorHandler<Any>;
  fallbackHandler?: FallbackHandler;
};

/**
 * Panic error for the task module.
 *
 * - HandlerNotSet: The handler function is not set.
 * - InvalidRetries: The retries are not a positive number.
 * - InvalidRetryDelay: The retry delay is not a positive number.
 *
 * @public
 */
class TaskError extends Panic<'Task', 'HandlerNotSet' | 'InvalidRetries' | 'InvalidRetryDelay'>(
  'Task',
) {}

/**
 * Task builder type.
 *
 * @remarks
 * Provides a fluent API for configuring the task.
 *
 * @typeParam C - The type of the contract.
 *
 * @public
 */
class TaskBuilder<C extends Contract<Any, Any, Any, Any>> {
  /**
   * Internal state of the task.
   */
  public state: TaskState<C>;

  /**
   * Creates a task builder.
   *
   * @param contract - The contract to build the task for.
   */
  constructor(contract: C) {
    this.state = {
      maxRetries: 0,
      retryDelay: 1000,
      currentAttempt: 0,
      contract,
    };
  }

  /**
   * Sets the handler function that processes the input and produces the output.
   *
   * @param fn - The function that handles the business logic.
   * @returns The task instance for method chaining.
   */
  handler(fn: ContractHandler<C>) {
    this.state.handlerFn = fn;
    return this;
  }

  /**
   * Sets the error handler for expected errors.
   *
   * @param fn - The function that handles expected errors.
   * @returns The task instance for method chaining.
   */
  errors(fn: ErrorHandler<ContractErrors<C>>) {
    this.state.errorHandler = fn;
    return this;
  }

  /**
   * Sets the fallback handler for unexpected errors.
   *
   * @param fn - The function that handles unexpected errors.
   * @returns The task instance for method chaining.
   */
  fallback(fn: FallbackHandler) {
    this.state.fallbackHandler = fn;
    return this;
  }

  /**
   * Sets the maximum number of retry attempts for the task.
   *
   * @param maxRetries - The maximum number of retry attempts.
   * @returns The task instance for method chaining.
   */
  retries(maxRetries: number) {
    if (maxRetries < 0) {
      throw new TaskError('InvalidRetries', 'Retries must be a positive number');
    }
    this.state.maxRetries = maxRetries;
    return this;
  }

  /**
   * Sets the delay between retry attempts in milliseconds.
   *
   * @param delay - The delay in milliseconds between retry attempts.
   * @returns The task instance for method chaining.
   */
  retryDelay(delay: number) {
    if (delay < 0) {
      throw new TaskError('InvalidRetryDelay', 'Retry delay must be a positive number');
    }
    this.state.retryDelay = delay;
    return this;
  }
}

/**
 * Task component type that represents a configurable task.
 *
 * @typeParam C - The type of the contract.
 *
 * @public
 */
type Task<C extends Contract<Any, Any, Any, Any>> = Component<
  'Task',
  ContractCaller<C> & TaskBuilder<C>,
  ContractHandler<C>
>;

/**
 * Creates a task.
 *
 * @remarks
 * A task component is a representation contract implementation. It handles input validation,
 * business logic execution, output validation, error handling, and retry logic with exponential
 * backoff. For now, a task always is an async function.
 *
 * @param contract - The {@link Contract} to build the task for.
 * @returns A task component.
 *
 * @public
 */
function task<C extends Contract<Any, Any, Any, Any>>(contract: C) {
  // Create a task builder with method chaining.
  const taskBuilder = new TaskBuilder(contract);

  // The task function should be the exported component.
  const taskFn = async (input: Any) => {
    const state = taskBuilder.state;
    if (!state.handlerFn) {
      throw new TaskError('HandlerNotSet', 'Handler function not set');
    }

    const { maxRetries, retryDelay } = state;
    let lastError: Any;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        let inputResult: Any;
        // Validate input.
        if (isSchema(state.contract.signature.input)) {
          inputResult = state.contract.signature.input(input);
        } else {
          inputResult = input;
        }

        // Expected input error handling.
        if (isErr(inputResult)) {
          if (state.errorHandler) {
            return state.errorHandler({ input: inputResult.error });
          }
          return inputResult;
        }

        // Execute handler.
        const handlerResult = await state.handlerFn(
          isOk(inputResult) ? inputResult.value : inputResult,
          state.contract.signature.context,
        );

        // Expected handler function error.
        if (isErr(handlerResult)) {
          if (state.errorHandler) {
            return state.errorHandler({ handler: handlerResult.error });
          }
          return handlerResult;
        }

        // Validate output.
        if (isSchema(state.contract.signature.output)) {
          const outputResult = state.contract.signature.output(
            isOk(handlerResult) ? handlerResult.value : handlerResult,
          );
          // Expected output error handling.
          if (isErr(outputResult)) {
            if (state.errorHandler) {
              return state.errorHandler({ output: outputResult.error });
            }
            return outputResult;
          }
        }

        return handlerResult;
      } catch (error) {
        // Use fallbackHandler if configured for cleanup.
        lastError = error;
        attempt++;

        // If we still have retries left, wait and retry.
        if (attempt <= maxRetries) {
          const delayMs = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          await delay(delayMs);
          continue;
        }

        // No more retries, handle with fallback for cleanup then throw.
        if (state.fallbackHandler) {
          state.fallbackHandler(lastError);
        }

        throw lastError;
      }
    }

    throw lastError;
  };

  // Add the task builder methods to the run function.
  return component('Task', taskFn, taskBuilder).addChildren(contract) as Task<C>;
}

export { task, TaskError };
export type { Task };
