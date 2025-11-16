/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { n } from '@nuxo/core';
import { delay } from '@std/async';

import { isSchema, type Schema, type SchemaErrors, type SchemaValues } from './schema.ts';
import { isValue } from './value.ts';

/**
 * The tag for the task component.
 *
 * @internal
 */
const TASK_TAG = 'Task' as const;

/**
 * The default task type.
 *
 * @internal
 */
const DEFAULT_TASK_TYPE = 'async' as const;

/**
 * The default error mode for the task.
 *
 * @internal
 */
const DEFAULT_ERROR_MODE = 'strict' as const;

/**
 * The type of the task contract. For now, it must be a contract with a schema input and output.
 *
 * @internal
 */
type TaskContract = n.Contract<n.Any, n.Any>;

/**
 * A function that can be used to handle expected errors.
 *
 * @typeParam E - The type of the error schema. Must be a SchemaErrors.
 *
 * @internal
 */
type ErrorHandler<E> = (errors: E) => n.Result<never, n.Any>;

/**
 * A function that can be used to handle unexpected errors (throws) as a side-effect.
 * This is typically used to clean up resources or undo operations.
 *
 * @internal
 */
type FallbackHandler = (error: n.PanicError<n.Any, n.Any>) => void;

/**
 * Type representing the contract errors.
 *
 * @remarks
 * Includes the input, output and handler errors.
 *
 * @typeParam C - The contract type.
 *
 * @public
 */
type ContractErrors<C> = C extends n.Contract<infer I, infer O> ?
    | (I extends Schema<infer II extends SchemaValues> ? SchemaErrors<II, typeof DEFAULT_ERROR_MODE>
      : never)
    | (O extends Schema<infer OO extends SchemaValues> ? SchemaErrors<OO, typeof DEFAULT_ERROR_MODE>
      : never)
  : never;

/**
 * Type representing the contract handler function.
 *
 * @typeParam C - The contract type.
 *
 * @public
 */
type ContractHandler<
  C extends TaskContract,
  Async extends 'async' | 'sync' = typeof DEFAULT_TASK_TYPE,
> = C extends n.Contract<n.Any, n.Any> ? (
    input: C['Input'],
  ) => n.Promisify<n.Result<C['Output'], ContractErrors<C>>, Async>
  : never;

/**
 * Type representing the contract caller function.
 *
 * @typeParam C - The contract type.
 *
 * @public
 */
type ContractCaller<
  C extends TaskContract,
  Async extends 'async' | 'sync' = typeof DEFAULT_TASK_TYPE,
> = C extends n.Contract<n.Any, n.Any>
  ? (input: C['Input']) => n.Promisify<n.Result<C['Output'], ContractErrors<C>>, Async>
  : never;

/**
 * Task internal state type for managing retry attempts and configuration.
 *
 * @internal
 */
type TaskState<C extends TaskContract, Name extends string = never> = {
  name: Name;
  attempts: number;
  throwOnError: boolean;
  maxRetries: number;
  retryDelay: number;
  lastError?: Error;
  contract: C;
  handlerFn?: ContractHandler<C, typeof DEFAULT_TASK_TYPE>;
  errorHandler?: ErrorHandler<n.Any>;
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
class TaskPanic extends n.panic<
  typeof TASK_TAG,
  | 'HandlerNotSet'
  | 'InvalidRetries'
  | 'InvalidRetryDelay'
  | 'InvalidName'
>(TASK_TAG) {}

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
class TaskBuilder<C extends TaskContract, Name extends string = never> {
  /**
   * Internal state of the task.
   */
  public state: TaskState<C, Name>;

  /**
   * Creates a task builder.
   *
   * @param contract - The contract to build the task for.
   */
  constructor(name: Name, contract: C) {
    this.state = {
      name,
      contract,
      attempts: 0,
      throwOnError: false,
      maxRetries: 1,
      retryDelay: 1000,
    };
  }

  /**
   * Sets the name of the task.
   *
   * @param name - The name of the task.
   * @returns The task instance for method chaining.
   */
  public name<N extends string>(name: N) {
    if (!name || typeof name !== 'string') {
      throw new TaskPanic('InvalidName', 'Name must be a non-empty string');
    }
    this.state.name = name as unknown as Name;
    return this as unknown as Task<C, N>;
  }

  /**
   * Sets the handler function that processes the input and produces the output.
   *
   * @param fn - The function that handles the business logic.
   * @returns The task instance for method chaining.
   */
  public handler(fn: ContractHandler<C, typeof DEFAULT_TASK_TYPE>) {
    this.state.handlerFn = fn;
    return this as unknown as Task<C, Name>;
  }

  /**
   * Sets the error handler for expected errors.
   *
   * @param fn - The function that handles expected errors.
   * @returns The task instance for method chaining.
   */
  public errors(fn: ErrorHandler<ContractErrors<C>>) {
    this.state.errorHandler = fn;
    return this as unknown as Task<C, Name>;
  }

  /**
   * Sets the fallback handler for unexpected errors.
   *
   * @param fn - The function that handles unexpected errors.
   * @returns The task instance for method chaining.
   */
  public fallback(fn: FallbackHandler) {
    this.state.fallbackHandler = fn;
    return this as unknown as Task<C, Name>;
  }

  /**
   * Sets the throw on error flag.
   *
   * @param throwOnError - The throw on error flag.
   * @returns The task instance for method chaining.
   */
  public throwable(throwOnError: boolean) {
    this.state.throwOnError = throwOnError;
    return this as unknown as Task<C, Name>;
  }

  /**
   * Sets the maximum number of retry attempts for the task.
   *
   * @param maxRetries - The maximum number of retry attempts.
   * @returns The task instance for method chaining.
   */
  public retries(maxRetries: number) {
    if (maxRetries < 0) {
      throw new TaskPanic('InvalidRetries', 'Retries must be a positive number');
    }
    this.state.maxRetries = maxRetries;
    return this as unknown as Task<C, Name>;
  }

  /**
   * Sets the delay between retry attempts in milliseconds.
   *
   * @param delay - The delay in milliseconds between retry attempts.
   * @returns The task instance for method chaining.
   */
  public retryDelay(delay: number) {
    if (delay < 0) {
      throw new TaskPanic('InvalidRetryDelay', 'Retry delay must be a positive number');
    }
    this.state.retryDelay = delay;
    return this as unknown as Task<C, Name>;
  }
}

/**
 * Task component type that represents a configurable task.
 *
 * @typeParam C - The type of the contract.
 *
 * @public
 */
type Task<C extends TaskContract, Name extends string = never> = n.Component<
  typeof TASK_TAG,
  ContractCaller<C, typeof DEFAULT_TASK_TYPE> & TaskBuilder<C, Name> & {
    Errors: ContractErrors<C>;
  },
  ContractHandler<C, typeof DEFAULT_TASK_TYPE>
>;

/**
 * Creates a task component for the given contract.
 *
 * @remarks
 * A task component is a representation of a contract implementation. It handles input validation,
 * business logic execution, output validation, error handling, and retry logic with exponential
 * backoff technique.
 *
 * @param name - The name of the task.
 * @param contract - The {@link Contract} to build the task for.
 * @returns A task component.
 */
function task<C extends TaskContract, Name extends string = never>(
  name: Name,
  contract: C,
): Task<C, Name> {
  const taskBuilder = new TaskBuilder(name, contract);
  const taskFn = async (input: n.Any) => {
    const state = taskBuilder.state;
    if (!state.handlerFn) {
      throw new TaskPanic('HandlerNotSet', 'Handler function not set');
    }

    const { maxRetries, retryDelay } = state;
    let lastError: n.Any;
    let attempt = 1;

    while (attempt <= maxRetries) {
      if (maxRetries > 1) {
        n.logger.debug(`Attempt ${attempt} of ${maxRetries}`);
      }

      state.attempts = attempt;

      try {
        let inputResult: n.Any;
        // Validate input.
        if (isSchema(state.contract.in) || isValue(state.contract.in)) {
          inputResult = state.contract.in(input);
        } else {
          inputResult = input;
        }

        // Expected input error handling.
        if (n.isErr(inputResult)) {
          if (state.errorHandler) {
            return state.errorHandler({ input: inputResult.error });
          }
          return inputResult;
        }

        // Execute handler.
        const handlerResult = await state.handlerFn(
          n.isOk(inputResult) ? inputResult.value : inputResult,
        );

        // Expected handler function error.
        if (n.isErr(handlerResult)) {
          if (state.errorHandler) {
            return state.errorHandler({ handler: handlerResult.error });
          }
          return handlerResult;
        }

        // Validate output.
        if (isSchema(state.contract.out) || isValue(state.contract.out)) {
          const outputResult = state.contract.out(
            n.isOk(handlerResult) ? handlerResult.value : handlerResult,
          );
          // Expected output error handling.
          if (n.isErr(outputResult)) {
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
          n.logger.debug(`Rolling back failed task: ${state.name}`);

          // If throwOnError is false, return the fallback handler.
          if (!state.throwOnError) {
            return state.fallbackHandler(lastError);
          }

          state.fallbackHandler(lastError);
        }

        throw lastError;
      }
    }

    throw lastError;
  };

  // Add the task builder methods to the run function.
  const taskComponent = n.component(TASK_TAG, taskFn, taskBuilder);

  // Add the contract as a child of the task component.
  n.meta(taskComponent).children(contract);

  return taskComponent as Task<C, Name>;
}

export { task, TaskPanic };
export type { Task, TaskContract };
