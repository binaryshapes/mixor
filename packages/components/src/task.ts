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
 * The type of the task dependencies.
 *
 * @internal
 */
type TaskDependencies = Record<string, n.Provider<n.Any, n.Any>>;

type InputErrors<C extends TaskContract> = C extends n.Contract<infer I, n.Any>
  ? I extends Schema<infer II extends SchemaValues> ? SchemaErrors<II, typeof DEFAULT_ERROR_MODE>
  : I extends { Errors: infer E } ? E
  : never
  : never;

type OutputErrors<C extends TaskContract> = C extends n.Contract<n.Any, infer O>
  ? O extends Schema<infer OO extends SchemaValues> ? SchemaErrors<OO, typeof DEFAULT_ERROR_MODE>
  : O extends { Errors: infer E } ? E
  : O extends n.Provider<infer T, n.Any> ? T extends { Errors: infer E } ? E : never
  : never
  : never;

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
type ContractErrors<C extends TaskContract> =
  | InputErrors<C>
  | OutputErrors<C>
  // TODO: This must only be integrated when the task is not throwable.
  | { task: 'Task.HandlerError' | 'Task.FallbackError' };

type ContractInput<C extends TaskContract> = C extends n.Contract<infer I, n.Any>
  ? I extends { Tag: 'Aggregate' } ? I
  : C['Input']
  : never;

type ContractOutput<C extends TaskContract> = C extends n.Contract<n.Any, infer O>
  ? O extends { Tag: 'Aggregate' } ? O
  : O extends n.Provider<infer T, n.Any> ? T
  : C['Output']
  : never;

type ContractCallerOutput<C extends TaskContract> = C extends n.Contract<n.Any, n.Any>
  ? ContractOutput<C> extends new (...args: n.Any[]) => n.Any ? InstanceType<ContractOutput<C>>
  : C['Output']
  : never;

/**
 * Type representing the contract caller function.
 *
 * @typeParam C - The contract type.
 *
 * @public
 */
type TaskSignature<C extends TaskContract> = (
  input: ContractInput<C>,
) => n.Promisify<n.Result<ContractCallerOutput<C>, ContractErrors<C>> & {}, 'async'>;

type TaskHandler<
  C extends TaskContract,
  D extends TaskDependencies = never,
> = (
  deps: {
    [K in keyof D]: D[K]['Type'];
  },
) => TaskSignature<C>;

/**
 * Task component type that represents a configurable task.
 *
 * @typeParam C - The type of the contract related to the task.
 * @typeParam Key - The key of the task.
 *
 * @public
 */
type Task<
  C extends TaskContract,
  D extends TaskDependencies = never,
> = n.Component<
  typeof TASK_TAG,
  TaskSignature<C> & TaskBuilder<C, D> & {
    Errors: ContractErrors<C>;
    Input: ContractInput<C>;
    Output: ContractOutput<C>;
    CallerOutput: ContractCallerOutput<C>;
    Handler: TaskHandler<C, D>;
    Caller: TaskSignature<C>;
    Dependencies: D;
  }
>;

/**
 * Panic error for the task module.
 *
 * - HandlerNotSet: The handler function is not set.
 * - CallerNotSet: The caller function is not set.
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
  | 'CallerNotSet'
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
class TaskBuilder<
  C extends TaskContract,
  D extends TaskDependencies = never,
> {
  /**
   * The handler function that processes the input and produces the output.
   */
  public handlerFn?: TaskHandler<C, D>;

  /**
   * The caller function that is used to call the task.
   */
  public callerFn?: TaskSignature<C>;

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
   * The dependencies of the task.
   */
  public dependencies?: D;

  /**
   * Creates a task builder.
   *
   * @param contract - The contract to build the task for.
   */
  constructor(
    public contract: C,
    public attempts = 0,
    public throwOnError = false,
    public maxRetries = 3,
    public delay = 200,
  ) {}

  /**
   * Sets the dependencies of the task.
   *
   * @param dependencies - The dependencies of the task.
   * @returns The task instance for method chaining.
   */
  public use<DD extends TaskDependencies>(dependencies: DD) {
    this.dependencies = dependencies as unknown as D;
    return this as unknown as Task<C, DD>;
  }

  /**
   * Sets the handler function that processes the input and produces the output.
   *
   * @param fn - The function that handles the business logic.
   * @returns The task instance for method chaining.
   */
  public handler(fn: TaskHandler<C, D>) {
    this.handlerFn = fn;
    return this as unknown as Task<C, D>;
  }

  /**
   * Sets the error handler for expected errors.
   *
   * @param fn - The function that handles expected errors.
   * @returns The task instance for method chaining.
   */
  public errors(fn: ErrorHandler<ContractErrors<C>>) {
    this.errorHandler = fn;
    return this as unknown as Task<C, D>;
  }

  /**
   * Sets the fallback handler for unexpected errors.
   *
   * @param fn - The function that handles unexpected errors.
   * @returns The task instance for method chaining.
   */
  public fallback(fn: FallbackHandler) {
    this.fallbackHandler = fn;
    return this as unknown as Task<C, D>;
  }

  /**
   * Sets the throw on error flag.
   *
   * @param throwOnError - The throw on error flag.
   * @returns The task instance for method chaining.
   */
  public throwable(throwOnError: boolean) {
    this.throwOnError = throwOnError;
    return this as unknown as Task<C, D>;
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
    return this as unknown as Task<C, D>;
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
    return this as unknown as Task<C, D>;
  }

  /**
   * Builds the task component with the builder configuration.
   *
   * @returns The task component.
   */
  public build(): n.Provider<Task<C, D>, D> {
    // Creating a task provider
    const taskProvider = n.provider()
      .use(this.dependencies ?? {} as unknown as D)
      .provide((deps) => {
        // The handler function is required to build the task component.
        if (!this.handlerFn) {
          throw new TaskPanic('HandlerNotSet', 'Handler function not set');
        }

        this.callerFn = this.handlerFn(deps);
        const fn = taskFn<C, D>(this);
        const tc = n.component(TASK_TAG, fn, this);

        // Adding the contract as a child of the task component.
        n.meta(tc).children(this.contract);

        // Adding the task component as a referenced object of the contract.
        n.info(this.contract).refs(tc);

        return tc;
      });

    return taskProvider as unknown as n.Provider<Task<C, D>, D>;
  }
}

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
const taskFn = <
  C extends TaskContract,
  D extends TaskDependencies = never,
>(
  taskBuilder: TaskBuilder<C, D>,
) => {
  const fn = async (input: n.Any) => {
    if (!taskBuilder.callerFn) {
      throw new TaskPanic('CallerNotSet', 'Caller function not set');
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
        const handlerResult = await taskBuilder.callerFn(
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
          n.logger.debug(`Rolling back failed task: ${taskBuilder}`);

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

            return n.err({ panic: fallbackError.code });
          }

          if (taskBuilder.throwOnError) {
            throw lastError;
          }

          return n.err({ panic: lastError.code });
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
const task = <
  C extends TaskContract,
  D extends TaskDependencies = never,
>(
  contract: C,
): TaskBuilder<C, D> => new TaskBuilder(contract);

export { task, TaskPanic };
export type { Task, TaskContract };
