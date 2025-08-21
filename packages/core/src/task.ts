/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Component, component } from './component';
import type { Any } from './generics';
import type { PanicError } from './panic';
import { type Result, isErr } from './result';
import type { Schema, SchemaErrors, SchemaValues } from './schema';

/**
 * A function that can be used as a task.
 * Can be either sync or async and must return a Result.
 *
 * @typeParam I - The type of the input schema.
 * @typeParam O - The type of the output schema.
 * @typeParam E - The type of the error schema.
 *
 * @internal
 */
type Callable<I, O, E> = (input: I) => Promise<Result<O, E>>;

/**
 * A function that can be used to handle expected errors (Result.err).
 *
 * @typeParam E - The type of the error schema.
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
 * Task state interface for managing retry attempts and configuration.
 *
 * @internal
 */
interface TaskState {
  maxRetries: number;
  retryDelay: number;
  currentAttempt: number;
  lastError?: Any;
  inputSchema?: Schema<Any>;
  outputSchema?: Schema<Any>;
  handlerFn?: Callable<Any, Any, Any>;
  errorHandler?: ErrorHandler<Any>;
  fallbackHandler?: FallbackHandler;
}

/**
 * Task constructor interface that provides a fluent API for building tasks.
 * Each method returns the task instance for method chaining.
 *
 * @typeParam I - The type of the input schema.
 * @typeParam O - The type of the output schema.
 * @typeParam E - The type of the error schema.
 *
 * @public
 */
interface TaskBuilder<I = never, O = never, E = never> {
  /**
   * Sets the input schema for the task.
   *
   * @param i - The schema to validate input data.
   * @returns The task instance for method chaining.
   */
  input: <IF>(i: Schema<IF>) => TaskBuilder<IF, O, E | SchemaErrors<IF, 'strict'>>;

  /**
   * Sets the output schema for the task.
   *
   * @param o - The schema to validate output data.
   * @returns The task instance for method chaining.
   */
  output: <OF>(o: Schema<OF>) => TaskBuilder<I, OF, E | SchemaErrors<OF, 'strict'>>;

  /**
   * Sets the handler function that processes the input and produces output.
   *
   * @param fn - The function that handles the business logic.
   * @returns The task instance for method chaining.
   */
  handler: <HF extends Callable<SchemaValues<I>, SchemaValues<O>, E>>(
    fn: HF,
  ) => TaskBuilder<I, O, E>;

  /**
   * Sets the error handler for expected errors (Result.err).
   *
   * @param fn - The function that handles expected errors.
   * @returns The task instance for method chaining.
   */
  errors: (fn: ErrorHandler<E>) => TaskBuilder<I, O, E>;

  /**
   * Sets the fallback handler for unexpected errors (throws).
   *
   * @param fn - The function that handles cleanup for unexpected errors.
   * @returns The task instance for method chaining.
   */
  fallback: (fn: FallbackHandler) => TaskBuilder<I, O, E>;

  /**
   * Sets the maximum number of retry attempts for the task.
   *
   * @param retries - The maximum number of retry attempts.
   * @returns The task instance for method chaining.
   */
  retries: (retries: number) => TaskBuilder<I, O, E>;

  /**
   * Sets the delay between retry attempts in milliseconds.
   *
   * @param delay - The delay in milliseconds between retry attempts.
   * @returns The task instance for method chaining.
   */
  retryDelay: (delay: number) => TaskBuilder<I, O, E>;

  /**
   * Builds the final callable task function.
   *
   * @returns A function that can be called with input data and returns a Result.
   */
  build(): Task<I, O, E>;
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
type Task<I = never, O = never, E = never> = Component<
  'Task',
  {
    (input: SchemaValues<I>): Promise<Result<SchemaValues<O>, E>>;
  }
>;

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
 * @returns A task builder instance with fluent API for configuration.
 *
 * @public
 */
function task() {
  // Create a task builder with method chaining.
  const taskInstance = {
    _state: {
      maxRetries: 0,
      retryDelay: 1000,
      currentAttempt: 0,
    } as TaskState,

    input: (schema: Schema<Any>) => ((taskInstance._state.inputSchema = schema), taskInstance),

    output: (schema: Schema<Any>) => ((taskInstance._state.outputSchema = schema), taskInstance),

    handler: (fn: Callable<Any, Any, Any>) => ((taskInstance._state.handlerFn = fn), taskInstance),

    // For EXPECTED errors (Result.err) - business logic
    errors: (fn: ErrorHandler<Any>) => ((taskInstance._state.errorHandler = fn), taskInstance),

    // For UNEXPECTED errors (throws) - side-effect for cleanup
    fallback: (fn: FallbackHandler) => ((taskInstance._state.fallbackHandler = fn), taskInstance),

    retries: (maxRetries: number) => {
      if (maxRetries < 0) {
        throw new Error('Retries must be a non-negative number');
      }
      taskInstance._state.maxRetries = maxRetries;
      return taskInstance;
    },

    retryDelay: (delayMs: number) => {
      if (delayMs < 0) {
        throw new Error('Retry delay must be a non-negative number');
      }
      taskInstance._state.retryDelay = delayMs;
      return taskInstance;
    },

    build: () =>
      component(
        'Task',
        async (input: Any): Promise<Result<Any, Any>> => {
          const state = taskInstance._state;

          // Validate required components
          if (!state.inputSchema) {
            throw new Error('Input schema not set');
          }
          if (!state.outputSchema) {
            throw new Error('Output schema not set');
          }
          if (!state.handlerFn) {
            throw new Error('Handler function not set');
          }

          const { maxRetries, retryDelay } = state;
          let lastError: Any;
          let attempt = 0;

          while (attempt <= maxRetries) {
            try {
              // Validate input
              const inputResult = state.inputSchema(input);
              if (isErr(inputResult)) {
                // EXPECTED error - use errorHandler if configured
                if (state.errorHandler) {
                  return state.errorHandler(inputResult.error);
                }
                return inputResult;
              }

              // Execute handler
              const handlerResult = await state.handlerFn(inputResult.value);

              // Check if handler was successful
              if (isErr(handlerResult)) {
                // EXPECTED error from handler - use errorHandler if configured
                if (state.errorHandler) {
                  return state.errorHandler(handlerResult.error);
                }
                return handlerResult;
              }

              // Validate output
              const outputResult = state.outputSchema(handlerResult.value);
              if (isErr(outputResult)) {
                // EXPECTED validation error - use errorHandler if configured
                if (state.errorHandler) {
                  return state.errorHandler(outputResult.error);
                }
                return outputResult;
              }

              return outputResult;
            } catch (error) {
              // UNEXPECTED error (throw) - use fallbackHandler if configured for cleanup
              lastError = error;
              attempt++;

              // If we still have retries left, wait and retry
              if (attempt <= maxRetries) {
                const delayMs = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
                await delay(delayMs);
                continue;
              }

              // No more retries, handle with fallback for cleanup then throw
              if (state.fallbackHandler) {
                state.fallbackHandler(lastError);
              }

              throw lastError;
            }
          }

          throw lastError;
        },
        {
          state: taskInstance._state,
        },
      ),
  };

  return taskInstance as unknown as TaskBuilder;
}

export type { Task };
export { task };
