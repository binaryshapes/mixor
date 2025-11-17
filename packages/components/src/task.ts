/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { n } from '@nuxo/core';
import { delay } from '@std/async';

import type { DEFAULT_ERROR_MODE } from './constants.ts';
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
type FallbackHandler = (error: n.PanicError<n.Any, n.Any>) => Promise<void>;

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
    | 'HandlerError'
    | 'FallbackError'
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
 * Panic error for the task module.
 *
 * - HandlerNotSet: The handler function is not set.
 * - InvalidRetries: The retries are not a positive number.
 * - InvalidRetryDelay: The retry delay is not a positive number.
 * - HandlerError: The handler function failed with an error.
 * - FallbackError: The fallback handler failed with an error.
 *
 * @public
 */
class TaskPanic extends n.panic<
  typeof TASK_TAG,
  | 'HandlerNotSet'
  | 'InvalidRetries'
  | 'InvalidRetryDelay'
  | 'HandlerError'
  | 'FallbackError'
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
class TaskBuilder<C extends TaskContract, Key extends string = never> {
  /**
   * The handler function that processes the input and produces the output.
   */
  public handlerFn?: ContractHandler<C, typeof DEFAULT_TASK_TYPE>;

  /**
   * The error handler function that processes expected errors such as input or output validations
   * or business logic errors.
   */
  public errorHandler?: ErrorHandler<n.Any>;

  /**
   * The fallback handler function that processes the unexpected errors.
   */
  public fallbackHandler?: FallbackHandler;

  /**
   * Creates a task builder.
   *
   * @param contract - The contract to build the task for.
   */
  constructor(
    public key: Key,
    public contract: C,
    public attempts = 0,
    public throwOnError = false,
    public maxRetries = 0,
    public delay = 1000,
  ) {}

  /**
   * Sets the handler function that processes the input and produces the output.
   *
   * @param fn - The function that handles the business logic.
   * @returns The task instance for method chaining.
   */
  public handler(fn: ContractHandler<C, typeof DEFAULT_TASK_TYPE>) {
    this.handlerFn = fn;
    return this as unknown as Task<C, Key>;
  }

  /**
   * Sets the error handler for expected errors.
   *
   * @param fn - The function that handles expected errors.
   * @returns The task instance for method chaining.
   */
  public errors(fn: ErrorHandler<ContractErrors<C>>) {
    this.errorHandler = fn;
    return this as unknown as Task<C, Key>;
  }

  /**
   * Sets the fallback handler for unexpected errors.
   *
   * @param fn - The function that handles unexpected errors.
   * @returns The task instance for method chaining.
   */
  public fallback(fn: FallbackHandler) {
    this.fallbackHandler = fn;
    return this as unknown as Task<C, Key>;
  }

  /**
   * Sets the throw on error flag.
   *
   * @param throwOnError - The throw on error flag.
   * @returns The task instance for method chaining.
   */
  public throwable(throwOnError: boolean) {
    this.throwOnError = throwOnError;
    return this as unknown as Task<C, Key>;
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
    this.maxRetries = maxRetries;
    return this as unknown as Task<C, Key>;
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
    this.delay = delay;
    return this as unknown as Task<C, Key>;
  }

  /**
   * Builds the task component with the builder configuration.
   *
   * @returns The task component.
   */
  public build(): Task<C, Key> {
    // The handler function is required to build the task component.
    if (!this.handlerFn) {
      throw new TaskPanic('HandlerNotSet', 'Handler function not set');
    }

    const fn = taskFn(this);
    const tc = n.component(TASK_TAG, fn, this);

    // Adding the contract as a child of the task component.
    n.meta(tc).children(this.contract);

    // Adding the task component as a referenced object of the contract.
    n.info(this.contract).refs(tc);

    return tc as Task<C, Key>;
  }
}

/**
 * Task component type that represents a configurable task.
 *
 * @typeParam C - The type of the contract related to the task.
 * @typeParam Key - The key of the task.
 *
 * @public
 */
type Task<C extends TaskContract, Key extends string = never> = n.Component<
  typeof TASK_TAG,
  ContractCaller<C, typeof DEFAULT_TASK_TYPE> & TaskBuilder<C, Key> & {
    Errors: ContractErrors<C>;
  },
  ContractHandler<C, typeof DEFAULT_TASK_TYPE>
>;

/**
 * The function that is used to execute the task.
 *
 * @typeParam C - The type of the contract.
 * @typeParam Name - The name of the task.
 *
 * @param taskBuilder - The task builder to use.
 * @returns The task function.
 *
 * @internal
 */
const taskFn = <C extends TaskContract, Key extends string = never>(
  taskBuilder: TaskBuilder<C, Key>,
) => {
  const fn = async (input: n.Any) => {
    if (!taskBuilder.handlerFn) {
      throw new TaskPanic('HandlerNotSet', 'Handler function not set');
    }

    let lastError: n.PanicError<string, string>;
    let attempt = 0;

    while (attempt < taskBuilder.maxRetries + 1) {
      taskBuilder.attempts = attempt;

      try {
        let inputResult: n.Any;
        // Validate input.
        if (isSchema(taskBuilder.contract.in) || isValue(taskBuilder.contract.in)) {
          inputResult = taskBuilder.contract.in(input);
        } else {
          inputResult = input;
        }

        // Expected input error handling.
        if (n.isErr(inputResult)) {
          if (taskBuilder.errorHandler) {
            return taskBuilder.errorHandler({ input: inputResult.error });
          }
          return inputResult;
        }

        // Execute handler.
        const handlerResult = await taskBuilder.handlerFn(
          n.isOk(inputResult) ? inputResult.value : inputResult,
        );

        // Expected handler function error.
        if (n.isErr(handlerResult)) {
          if (taskBuilder.errorHandler) {
            return taskBuilder.errorHandler({ handler: handlerResult.error });
          }
          return handlerResult;
        }

        // Validate output.
        if (isSchema(taskBuilder.contract.out) || isValue(taskBuilder.contract.out)) {
          const outputResult = taskBuilder.contract.out(
            n.isOk(handlerResult) ? handlerResult.value : handlerResult,
          );
          // Expected output error handling.
          if (n.isErr(outputResult)) {
            if (taskBuilder.errorHandler) {
              return taskBuilder.errorHandler({ output: outputResult.error });
            }
            return outputResult;
          }
        }

        return handlerResult;
      } catch (error) {
        // Use fallbackHandler if configured for cleanup.
        lastError = error instanceof Error
          ? new TaskPanic('HandlerError', error.message)
          : new TaskPanic('HandlerError', 'Handler function failed with unknown error');

        attempt++;

        // If we still have retries left, wait and retry.
        if (attempt < taskBuilder.maxRetries + 1) {
          n.logger.debug(`Attempt ${attempt} of ${taskBuilder.maxRetries}`);

          const delayMs = taskBuilder.delay * Math.pow(2, attempt - 1); // Exponential backoff
          await delay(delayMs);
          continue;
        }

        // No more retries, handle with fallback for cleanup then throw.
        if (taskBuilder.fallbackHandler) {
          n.logger.debug(`Rolling back failed task: ${taskBuilder.key}`);

          // TODO: It would be great to have a retry mechanism for the fallback handler.
          try {
            await taskBuilder.fallbackHandler(lastError);
          } catch (error) {
            const fallbackError = error instanceof Error
              ? new TaskPanic('FallbackError', error.message)
              : new TaskPanic('FallbackError', 'Fallback handler failed with unknown error');

            n.logger.debug(`Fallback handler failed: ${fallbackError.message}`);

            if (taskBuilder.throwOnError) {
              throw fallbackError;
            }

            return n.err(fallbackError.code);
          }

          if (taskBuilder.throwOnError) {
            throw lastError;
          }

          return n.err(lastError.code);
        }
      }
    }
  };

  return fn;
};

/**
 * Creates a task builder in order to configure a new task component before building it.
 *
 * @remarks
 * A task component is a representation of a contract implementation. It handles input validation,
 * business logic execution, output validation, error handling, and retry logic with exponential
 * backoff technique.
 *
 * @param key - The key of the task.
 * @param contract - The {@link Contract} to build the task for.
 * @returns A task builder ready to be built into a task component.
 */
const task = <C extends TaskContract, Key extends string = never>(
  key: Key,
  contract: C,
): TaskBuilder<C, Key> => new TaskBuilder(key, contract);

export { task, TaskPanic };
export type { Task, TaskContract };
