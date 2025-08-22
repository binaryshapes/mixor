/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Component, component } from './component';
import type { Contract, ContractCaller, ContractHandler } from './contract';
import type { Any } from './generics';
import type { PanicError } from './panic';
import { type Result, isErr, isOk } from './result';
import { isSchema } from './schema';

/**
 * A function that can be used to handle expected errors (result errors).
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
type TaskState = {
  maxRetries: number;
  retryDelay: number;
  currentAttempt: number;
  lastError?: Any;
  contract: Contract<Any, Any, Any>;
  handlerFn?: ContractHandler<Contract<Any, Any, Any>>;
  errorHandler?: ErrorHandler<Any>;
  fallbackHandler?: FallbackHandler;
};

interface TaskBuilder<C extends Contract<Any, Any, Any>> extends ContractCaller<C> {
  /**
   * Internal state of the task.
   */
  state: TaskState;

  /**
   * Sets the handler function that processes the input and produces output.
   *
   * @param fn - The function that handles the business logic.
   * @returns The task instance for method chaining.
   */
  handler: <HF extends ContractHandler<C>>(fn: HF) => Task<C>;

  /**
   * Sets the error handler for expected errors (Result.err).
   *
   * @param fn - The function that handles expected errors.
   * @returns The task instance for method chaining.
   */
  errors: (fn: ErrorHandler<C['signature']['errors']>) => Task<C>;

  /**
   * Sets the fallback handler for unexpected errors (throws).
   *
   * @param fn - The function that handles cleanup for unexpected errors.
   * @returns The task instance for method chaining.
   */
  fallback: (fn: FallbackHandler) => Task<C>;

  /**
   * Sets the maximum number of retry attempts for the task.
   *
   * @param retries - The maximum number of retry attempts.
   * @returns The task instance for method chaining.
   */
  retries: (retries: number) => Task<C>;

  /**
   * Sets the delay between retry attempts in milliseconds.
   *
   * @param delay - The delay in milliseconds between retry attempts.
   * @returns The task instance for method chaining.
   */
  retryDelay: (delay: number) => Task<C>;
}

/**
 * Task component type that represents a configurable task.
 * Tasks handle input validation, business logic execution, output validation,
 * error handling, and retry logic with exponential backoff.
 *
 * @typeParam I - The type of the input schema.
 * @typeParam O - The type of the output schema.
 * @typeParam E - The type of the error schema.
 *
 * @public
 */
type Task<C extends Contract<Any, Any, Any>> = Component<'Task', TaskBuilder<C>>;

/**
 * Helper function for delay that works in both Node.js and browser.
 *
 * @param ms - The number of milliseconds to delay.
 * @returns A promise that resolves after the specified number of milliseconds.
 *
 * @internal
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Creates a task builder instance that allows configuring input/output schemas,
 * handler functions, error handling, retry logic, and fallback behavior.
 *
 * The task must be configured with input schema, output schema, and handler
 * function before calling build(). The build() method returns the final callable
 * task function.
 *
 * @param contract - The {@link Contract} to build the task for.
 * @returns A task builder instance with fluent API for configuration.
 *
 * @public
 */
function task<C extends Contract<Any, Any, Any>>(contract: C) {
  // Create a task builder with method chaining.
  const taskBuilder = {
    state: {
      maxRetries: 0,
      retryDelay: 1000,
      currentAttempt: 0,
      contract,
    } as TaskState,

    handler: (fn: ContractHandler<Any>) => ((taskBuilder.state.handlerFn = fn), taskFn),

    // For EXPECTED errors (Result.err) - business logic.
    errors: (fn: ErrorHandler<Any>) => ((taskBuilder.state.errorHandler = fn), taskFn),

    // For UNEXPECTED errors (throws) - side-effect for cleanup.
    fallback: (fn: FallbackHandler) => ((taskBuilder.state.fallbackHandler = fn), taskFn),

    retries: (maxRetries: number) => {
      if (maxRetries < 0) {
        throw new Error('Retries must be a non-negative number');
      }
      taskBuilder.state.maxRetries = maxRetries;
      return taskFn;
    },

    retryDelay: (delayMs: number) => {
      if (delayMs < 0) {
        throw new Error('Retry delay must be a non-negative number');
      }
      taskBuilder.state.retryDelay = delayMs;
      return taskFn;
    },
  };

  // The task function should be the exported component.
  const taskFn = component(
    'Task',
    async (input: Any) => {
      const state = taskBuilder.state as TaskState;

      if (!state.handlerFn) {
        throw new Error('Handler function not set');
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

            if (isErr(inputResult)) {
              return inputResult;
            }
          } else {
            inputResult = input;
          }

          if (isErr(inputResult)) {
            // EXPECTED error - use errorHandler if configured.
            if (state.errorHandler) {
              return state.errorHandler(inputResult.error);
            }
            return inputResult;
          }

          // Execute handler.
          const handlerResult = await state.handlerFn({
            input: isOk(inputResult) ? inputResult.value : inputResult,
            context: contract.signature.context,
          });

          // Check if handler was successful.
          if (isErr(handlerResult)) {
            // EXPECTED error from handler - use errorHandler if configured.
            if (state.errorHandler) {
              return state.errorHandler(handlerResult.error);
            }
            return handlerResult;
          }

          // Validate output.
          if (isSchema(state.contract.signature.output)) {
            const outputResult = state.contract.signature.output(
              isOk(handlerResult) ? handlerResult.value : handlerResult,
            );
            if (isErr(outputResult)) {
              // EXPECTED validation error - use errorHandler if configured.
              if (state.errorHandler) {
                return state.errorHandler(outputResult.error);
              }
              return outputResult;
            }
          }

          return handlerResult;
        } catch (error) {
          // UNEXPECTED error (throw) - use fallbackHandler if configured for cleanup.
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
    },
    {
      state: taskBuilder.state,
    },
  );

  // Add the task builder methods to the run function.
  Object.assign(taskFn, taskBuilder);

  // Make contract as a child of the task.
  taskFn.addChildren(contract);

  return taskFn as Task<C>;
}

export type { Task };
export { task };
