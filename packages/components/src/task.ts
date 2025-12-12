/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { n } from '@nuxo/core';
import { delay } from '@std/async';

/**
 * The tag for the task component.
 *
 * @internal
 */
const TASK_TAG = 'Task' as const;

/**
 * The type of the task contract.
 *
 * @remarks
 * A task contract can be any contract type. The contract defines the input validation,
 * output validation, and error types for the task.
 *
 * @internal
 */
type TaskContract = n.Contract<n.Any, n.Any, n.Any, true>;

/**
 * A function that can be used to handle unexpected errors (throws) as a side-effect.
 *
 * @remarks
 * This handler is called when all retry attempts have been exhausted and the task
 * has failed. It's typically used to clean up resources, undo operations, or perform
 * rollback logic. The handler receives the input that was used, the last error that occurred,
 * and the resolved task dependencies.
 *
 * @typeParam C - The type of the contract.
 * @typeParam D - The type of the task dependencies.
 *
 * @internal
 */
type FallbackHandler<
  C extends TaskContract,
  D extends TaskDependencies,
> = (
  params: {
    input: n.Implementation<C>['Input'];
    error: n.PanicError<n.Any, n.Any>;
    dependencies: [D] extends [never] ? never : {
      [K in keyof D]: D[K]['Type'];
    };
  },
) => Promise<void>;

/**
 * The type of the task dependencies.
 *
 * @remarks
 * Task dependencies are providers that are injected into the handler function.
 * The dependencies are resolved when the task is built and passed to the handler.
 *
 * @internal
 */
type TaskDependencies =
  | Record<string, n.Provider<n.Any, n.Any>>
  | Record<string, n.Provider<n.Any, never>>;

/**
 * The type of the task handler.
 *
 * @remarks
 * This is a conditional type that represents the handler function type.
 * - If the task has no dependencies (`D` is `never`), it's a function that returns an
 *   implementation function for a contract.
 * - If the task has dependencies, it's a function that receives the resolved dependencies.
 *
 * @typeParam C - The type of the contract.
 * @typeParam D - The type of the dependencies.
 *
 * @internal
 */
type TaskHandler<
  C extends TaskContract,
  D extends TaskDependencies,
> = [D] extends [never] ? () => n.Implementation<C> : (
  deps: {
    [K in keyof D]: D[K]['Type'];
  },
) => n.Implementation<C>;

/**
 * Task component type that represents a configurable task.
 *
 * @remarks
 * A task is a callable component that implements a contract with additional features:
 * - Retry logic with exponential backoff
 * - Fallback handlers for error cleanup
 * - Optional dependency injection
 * - Error handling and recovery
 *
 * @typeParam C - The type of the contract related to the task.
 * @typeParam D - The type of the task dependencies (providers).
 *
 * @public
 */
type Task<
  C extends TaskContract,
  D extends TaskDependencies = never,
> = n.Component<
  typeof TASK_TAG,
  & n.Implementation<C>['Signature']
  & TaskBuilder<C, D>
  & {
    /** Task errors type. */
    Errors: n.Implementation<C>['Errors'];
    /** Task input type. */
    Input: n.Implementation<C>['Input'];
    /** Task output type. */
    Output: n.Implementation<C>['Output'];
    /** Task contract. */
    input: n.Implementation<C>['Input'];
    /** Task output. */
    output: n.Implementation<C>['Output'];
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
 * Provides a fluent API for configuring the task. Use the builder methods to set:
 * - Dependencies (via {@link TaskBuilder.use}).
 * - Handler function (via {@link TaskBuilder.handler}).
 * - Fallback handler (via {@link TaskBuilder.fallback}).
 * - Retry configuration (via {@link TaskBuilder.retries} and {@link TaskBuilder.retryDelay}).
 * - Error handling behavior (via {@link TaskBuilder.throwable}).
 *
 * Call {@link TaskBuilder.build} to create the final task component wrapped in a provider.
 *
 * @typeParam C - The type of the contract.
 * @typeParam D - The type of the task dependencies.
 *
 * @internal
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
  public callerFn?: n.Implementation<C>;

  /**
   * The fallback handler function that processes the unexpected errors.
   */
  public fallbackHandler?: FallbackHandler<C, D>;

  /**
   * The dependencies of the task.
   */
  public dependencies?: D;

  /**
   * Creates a task builder.
   *
   * @param contract - The contract to build the task for.
   * @param attempts - The current attempt number (used internally for retry logic).
   * @param throwOnError - Whether to throw errors instead of returning failed results.
   * @param maxRetries - The maximum number of retry attempts (default: 3).
   * @param delay - The base delay in milliseconds between retries (default: 200).
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
   * @remarks
   * The handler can be:
   * - A function that returns an implementation function (if dependencies are needed, it receives
   *   them as a parameter).
   * - A function that returns an existing implementation component.
   *
   * If the handler returns an existing implementation, nested error keys are automatically cleaned.
   *
   * @typeParam EE - The error type of the handler function.
   * @param fn - The function that handles the business logic. Must return an implementation function
   *   or component.
   * @returns The task instance for method chaining.
   */
  public handler(fn: TaskHandler<C, D>) {
    this.handlerFn = fn as unknown as TaskHandler<C, D>;
    return this as unknown as Task<C, D>;
  }

  /**
   * Sets the fallback handler for unexpected errors.
   *
   * @remarks
   * The fallback handler is called when all retry attempts have been exhausted.
   * It's used for cleanup operations, rollback logic, or logging. The handler
   * receives an object with the input that was used, the error that occurred, and
   * the resolved task dependencies. If the fallback handler itself throws an error,
   * it will be handled according to the {@link throwable} configuration.
   *
   * @param fn - The function that handles unexpected errors (called after all retries fail).
   *   Receives an object with `{ input, error, dependencies }` where `input` is typed
   *   according to the contract and `dependencies` contains the resolved task dependencies.
   * @returns The task instance for method chaining.
   */
  public fallback(fn: FallbackHandler<C, D>) {
    this.fallbackHandler = fn;
    return this as unknown as Task<C, D>;
  }

  /**
   * Sets whether the task should throw errors instead of returning failed results.
   *
   * @remarks
   * When `true`, the task will throw panic errors instead of returning `Result` with errors.
   * This affects both handler errors and fallback handler errors.
   *
   * @param throwOnError - Whether to throw errors instead of returning failed results.
   * @returns The task instance for method chaining.
   */
  public throwable(throwOnError: boolean) {
    this.throwOnError = throwOnError;
    return this as unknown as Task<C, D>;
  }

  /**
   * Sets the maximum number of retry attempts for the task.
   *
   * @remarks
   * The task will retry up to `maxRetries` times if the handler throws an error.
   * The total number of attempts is `maxRetries + 1` (initial attempt + retries).
   * Retries use exponential backoff based on the delay set by {@link retryDelay}.
   *
   * @param maxRetries - The maximum number of retry attempts (must be >= 0).
   * @returns The task instance for method chaining.
   * @throws {TaskPanic} If maxRetries is negative.
   */
  public retries(maxRetries: number) {
    if (maxRetries < 0) {
      throw new TaskPanic('InvalidRetries', 'Retries must be a positive number');
    }
    this.maxRetries = maxRetries;
    return this as unknown as Task<C, D>;
  }

  /**
   * Sets the base delay between retry attempts in milliseconds.
   *
   * @remarks
   * This is the base delay used for exponential backoff. The actual delay for each
   * retry attempt is calculated as: `delay * 2^(attempt - 1)`.
   * For example, with delay=200ms:
   * - First retry: 200ms
   * - Second retry: 400ms
   * - Third retry: 800ms
   *
   * @param delay - The base delay in milliseconds between retry attempts (must be >= 0).
   * @returns The task instance for method chaining.
   * @throws {TaskPanic} If delay is negative.
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
   * @remarks
   * This method:
   * 1. Validates that a handler has been set.
   * 2. Resolves the handler function (wrapping it in an implementation if needed).
   * 3. Creates the task component with retry and error handling logic.
   * 4. Wraps the task in a provider for dependency injection.
   *
   * The returned provider can be used in containers or called directly if no dependencies
   * are needed.
   *
   * @returns A provider that, when resolved, returns the task component.
   * @throws {TaskPanic} If the handler function has not been set.
   */
  public build(): n.Provider<Task<C, D>, D> {
    let taskProvider = n.provider<Task<C, D>, D>();

    // Add the dependencies to the provider (if any).
    if (this.dependencies) {
      taskProvider = taskProvider.use(this.dependencies);
    }

    return taskProvider.provide((deps) => {
      // The handler function is required to build the task component.
      if (!this.handlerFn) {
        throw new TaskPanic('HandlerNotSet', 'Handler function not set');
      }

      // Only create a new implementation if the handler is just a function.
      const callerFn = this.handlerFn(deps as D);
      this.callerFn = n.isImplementation(callerFn)
        ? callerFn
        : n.implementation(this.contract, callerFn);

      // Create the task component and add the contract as a child.
      const taskComponent = n.component(
        TASK_TAG,
        Object.assign(
          taskFn(
            this,
            deps as [D] extends [never] ? never : {
              [K in keyof D]: D[K]['Type'];
            },
          ),
          {
            input: this.contract.in,
            output: this.contract.out,
          },
        ),
        // This preserve the uniqueness of the task component.
        this,
      );

      // Add the contract as a child of the task component.
      n.meta(taskComponent).children(this.contract);

      // Add the task component as a referenced object of the contract.
      n.info(this.contract).refs(taskComponent);

      return taskComponent;
    }, {
      input: this.contract.in,
      output: this.contract.out,
    }) as n.Provider<Task<C, D>, D>;
  }
}

/**
 * The function that is used to execute the task.
 *
 * @remarks
 * This function implements the task execution logic with:
 * - Retry mechanism with exponential backoff.
 * - Error handling and fallback support.
 * - Attempt tracking.
 *
 * The function will retry up to `maxRetries` times if the handler throws an error.
 * After all retries are exhausted, the fallback handler (if set) is called for cleanup.
 *
 * @typeParam C - The type of the contract.
 * @typeParam D - The type of the task dependencies.
 *
 * @param taskBuilder - The task builder containing the configuration and handler.
 * @returns The task execution function that can be called with the contract's input.
 *
 * @internal
 */
const taskFn = <
  C extends TaskContract,
  D extends TaskDependencies,
>(
  taskBuilder: TaskBuilder<C, D>,
  dependencies: [D] extends [never] ? never : {
    [K in keyof D]: D[K]['Type'];
  },
) => {
  const fn = async (input: n.Any) => {
    if (!taskBuilder.callerFn) {
      throw new TaskPanic('CallerNotSet', 'Caller function not set');
    }

    let lastError: n.PanicError<string, string> | undefined = undefined;
    let attempt = 0;

    while (attempt < taskBuilder.maxRetries + 1) {
      taskBuilder.attempts = attempt;

      try {
        // This call automatically applies the contract input and output validation.
        // Remember the task caller function is wrapped in a contract implementation.
        const result = await taskBuilder.callerFn(input);

        if (n.isErr(result)) {
          const error = result.error as n.Any;

          if (error.$error === 'PANIC_ERROR') {
            throw new Error(error.$error);
          }
        }

        return result;
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
            await taskBuilder.fallbackHandler({
              input,
              error: lastError,
              dependencies: dependencies as [D] extends [never] ? never : {
                [K in keyof D]: D[K]['Type'];
              },
            });
          } catch (error) {
            const fallbackError = error instanceof Error
              ? new TaskPanic('FallbackError', error.message)
              : new TaskPanic('FallbackError', 'Fallback handler failed with unknown error');

            n.logger.debug(`Fallback handler failed: ${fallbackError.message}`);

            if (taskBuilder.throwOnError) {
              throw fallbackError;
            }

            return n.err({ $error: fallbackError.code });
          }

          if (taskBuilder.throwOnError) {
            throw lastError;
          }

          return n.err({ $error: lastError.code });
        }
      }
    }

    return n.err({ $error: lastError?.message ?? 'PANIC_ERROR' });
  };

  return fn;
};

/**
 * Creates a task builder in order to configure a new task component before building it.
 *
 * @remarks
 * A task component is a representation of a contract implementation. It handles:
 * - Input validation (via the contract's input component).
 * - Business logic execution (via the handler function).
 * - Output validation (via the contract's output component).
 * - Error handling and recovery.
 * - Retry logic with exponential backoff.
 * - Fallback handlers for cleanup operations.
 *
 * Use the builder methods to configure the task, then call {@link TaskBuilder.build} to
 * create the final task component wrapped in a provider.
 *
 * @typeParam C - The type of the contract.
 * @typeParam D - The type of the task dependencies.
 *
 * @param contract - The contract to build the task for.
 * @returns A task builder ready to be configured and built into a task component.
 *
 * @public
 */
const task = <C extends TaskContract>(
  contract: C,
): Task<C> => new TaskBuilder(contract) as Task<C>;

export { task, TaskPanic };
export type { Task, TaskContract, TaskDependencies };
