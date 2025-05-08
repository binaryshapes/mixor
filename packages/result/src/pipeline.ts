/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { Flow } from './flow';
import type { BindValue, ExtractBindValueType, MergeBindValueType } from './helpers';
import {
  createBindValue,
  errorSafe,
  extractValue,
  handleResult,
  isBindValue,
  isFailureOfType,
  isSuccessOfType,
  mergeBindValues,
} from './helpers';
import type { Result } from './result';
import { failure, isFail, isSuccess, success } from './result';

/**
 * Represents the available operations in a Pipeline.
 * This type is inferred from the method names in the Pipeline class,
 * excluding internal methods and properties, plus special operation types.
 *
 * @internal
 */
export type PipelineOperation =
  | keyof Omit<
      Pipeline<unknown, unknown>,
      'constructor' | 'getCurrentResult' | 'getFlow' | 'toString' | 'toJSON' | 'run' | 'match'
    >
  | 'pipeline'
  | 'function';

/**
 * Represents a collection of bindings for multiple values.
 * Each key in the object is a function that returns a Result.
 *
 * @typeParam T - The type of the values to bind
 * @typeParam F - The type of the failure
 *
 * @internal
 */
type BindAllValue<T, F> = {
  [K in keyof T]: () => Result<T[K], F> | Promise<Result<T[K], F>>;
};

/**
 * Represents the options for the if method.
 *
 * @typeParam S - The success type of the pipeline.
 * @typeParam NS - The new success type.
 * @typeParam F - The failure type.
 *
 * @internal
 */
type IfOptions<S, NS, F> = {
  predicate: (value: ExtractBindValueType<S>) => boolean | Promise<boolean>;
  onTrue: (value: ExtractBindValueType<S>) => Result<NS, F> | Promise<Result<NS, F>>;
  onFalse: (value: ExtractBindValueType<S>) => Result<NS, F> | Promise<Result<NS, F>>;
};

/**
 * A class that provides a fluent API for working with Result types.
 * The Pipeline class allows for chaining operations on Results in a type-safe way.
 * Each pipeline maintains a flow that tracks its operations and structure.
 *
 * @typeParam S - The success type.
 * @typeParam F - The failure type.
 *
 * @example
 * ```ts
 * // Create a pipeline from a success value
 * const pipeline = Pipeline.from(success("hello"))
 *   .map(str => str.toUpperCase())
 *   .tap(console.log);
 *
 * // Create a pipeline from a function
 * const pipeline2 = Pipeline.fromFunction(async () => {
 *   const data = await fetchData();
 *   return success(data);
 * });
 * ```
 *
 * @public
 */
class Pipeline<S, F> {
  private constructor(
    private readonly result:
      | Result<S, F>
      | Promise<Result<S, F>>
      | (() => Result<S, F> | Promise<Result<S, F>>),
    private readonly flow: Flow<PipelineOperation>,
  ) {}

  /**
   * Creates a new Pipeline from a Result or a function that returns a Result.
   *
   * @typeParam S - The success type.
   * @typeParam F - The failure type.
   * @param result - The initial Result or a function that returns a Result.
   * @param description - Optional description for this pipeline
   * @returns A new Pipeline instance.
   */
  public static from<S, F>(
    result: Result<S, F> | Promise<Result<S, F>> | (() => Result<S, F> | Promise<Result<S, F>>),
    description?: string,
  ): Pipeline<S, F> {
    const flow = Flow.create<PipelineOperation>(description || 'Initial value');
    return new Pipeline(result, flow);
  }

  /**
   * Creates a new Pipeline from a function that returns a Result.
   * This is a convenience method for creating pipelines from functions.
   *
   * @typeParam S - The success type.
   * @typeParam F - The failure type.
   * @param fn - The function that returns a Result.
   * @param description - Optional description for this pipeline
   * @returns A new Pipeline instance.
   */
  static fromFunction<S, F>(
    fn: () => Result<S, F> | Promise<Result<S, F>>,
    description?: string,
  ): Pipeline<S, F> {
    const flow = Flow.create<PipelineOperation>(description || 'Initial pipeline').addStep(
      'function',
      description || 'Initial function',
    );
    return new Pipeline(fn, flow);
  }

  /**
   * Gets the current result value, executing the function if necessary.
   * This is an internal method used by other pipeline methods.
   *
   * @returns A Promise that resolves to the current Result.
   *
   * @example
   * ```ts
   * // Internal usage
   * const result = await this.getCurrentResult();
   * ```
   *
   * @internal
   */
  private async getCurrentResult(): Promise<Result<S, F>> {
    if (typeof this.result === 'function') {
      return this.result();
    }
    return this.result;
  }

  /**
   * Maps the success value to a new value.
   * This operation only affects the success case and preserves the failure type.
   *
   * @typeParam NS - The new success type.
   * @param fn - The function to transform the success value.
   * @returns A new Pipeline with the transformed success type.
   *
   * @example
   * ```ts
   * const pipeline = Pipeline.from(success("hello"))
   *   .map(str => str.toUpperCase())
   *   .map(str => str.length);
   * // Result: Result<number, never>
   * ```
   *
   * @public
   */
  public map<NS>(fn: (value: ExtractBindValueType<S>) => NS | Promise<NS>): Pipeline<NS, F> {
    const nextDescription = this.flow.getNextStepDescription();
    return new Pipeline(
      async () => {
        const result = await this.getCurrentResult();
        return handleResult<S, F, NS, F>(
          result,
          errorSafe(
            async (r) => {
              if (isSuccess(r)) {
                const value = extractValue(r.value);
                const newValue = await fn(value);
                return success(newValue);
              }
              return r as Result<NS, F>;
            },
            (error) => error as F,
          ),
        );
      },
      this.flow.addStep('map', nextDescription || 'Transform success value'),
    );
  }

  /**
   * Maps the failure value to a new value.
   * This operation only affects the failure case and preserves the success type.
   *
   * @typeParam NF - The new failure type.
   * @param fn - The function to transform the failure value.
   * @returns A new Pipeline with the transformed failure type.
   *
   * @example
   * ```ts
   * const pipeline = Pipeline.from(failure("error"))
   *   .mapFailure(err => `Error: ${err}`)
   *   .mapFailure(err => ({ message: err }));
   * ```
   *
   * @public
   */
  public mapFailure<NF>(fn: (failure: F) => NF | Promise<NF>): Pipeline<S, NF> {
    return new Pipeline(
      async () => {
        const result = await this.getCurrentResult();
        return handleResult<S, F, S, NF>(
          result,
          errorSafe(
            async (r) => {
              if (isFail(r)) {
                const newFailure = await fn(r.cause);
                return failure(newFailure);
              }
              return r as Result<S, NF>;
            },
            (error) => error as NF,
          ),
        );
      },
      this.flow.addStep('mapFailure', 'Transform failure value'),
    );
  }

  /**
   * Maps both success and failure values.
   * This operation allows transforming both cases in a single step.
   *
   * @typeParam NS - The new success type.
   * @typeParam NF - The new failure type.
   * @param successFn - The function to transform the success value.
   * @param failureFn - The function to transform the failure value.
   * @returns A new Pipeline with both types transformed.
   *
   * @example
   * ```ts
   * const pipeline = Pipeline.from(success("hello"))
   *   .mapBoth(
   *     str => str.toUpperCase(),
   *     err => `Error: ${err}`
   *   );
   * // Result: success("HELLO")
   *
   * const pipeline2 = Pipeline.from(failure("error"))
   *   .mapBoth(
   *     str => str.toUpperCase(),
   *     err => `Error: ${err}`
   *   );
   * // Result: failure("Error: error")
   * ```
   *
   * @public
   */

  // TODO: make params as object.
  public mapBoth<NS, NF>(
    successFn: (value: S) => NS | Promise<NS>,
    failureFn: (failure: F) => NF | Promise<NF>,
  ): Pipeline<NS, NF> {
    return new Pipeline(
      async () => {
        const result = await this.getCurrentResult();
        return handleResult<S, F, NS, NF>(
          result,
          errorSafe(
            async (r) => {
              if (isSuccess(r)) {
                const newValue = await successFn(r.value);
                return success(newValue);
              }
              const newFailure = await failureFn(r.cause);
              return failure(newFailure);
            },
            (error) => error as NF,
          ),
        );
      },
      this.flow.addStep('mapBoth', 'Transform both success and failure values'),
    );
  }

  /**
   * Executes a side effect on the success value and returns the same Result.
   * This is useful for logging, metrics, or other side effects that shouldn't affect the value.
   *
   * @param fn - The function to execute as a side effect.
   * @returns A new Pipeline with the same types.
   *
   * @example
   * ```ts
   * const pipeline = Pipeline.from(success("hello"))
   *   .tap(console.log) // Logs: "hello"
   *   .tap(async (value) => {
   *     await saveToDatabase(value);
   *   });
   * // Result: success("hello")
   * ```
   *
   * @public
   */
  public tap(fn: (value: S) => void | Promise<void>): Pipeline<S, F> {
    return new Pipeline(
      async () => {
        const result = await this.getCurrentResult();
        return handleResult<S, F, S, F>(
          result,
          errorSafe(
            async (r) => {
              if (isSuccess(r)) {
                await fn(r.value);
              }
              return r;
            },
            (error) => error as F,
          ),
        );
      },
      this.flow.addStep('tap', 'Side effect'),
    );
  }

  /**
   * Binds a new value to the pipeline.
   * This operation allows adding new values to the pipeline's context.
   *
   * @typeParam K - The key to bind the value to.
   * @typeParam NS - The type of the value to bind.
   * @param key - The key to bind the value to.
   * @param fn - The function that returns a Result with the value to bind.
   * @returns A new Pipeline with the bound value.
   *
   * @example
   * ```ts
   * const pipeline = Pipeline.from(success({ name: "John" }))
   *   .bind("age", () => success(30))
   *   .bind("email", () => success("john@mycompany.com"));
   * // Result: success({ name: "John", age: 30, email: "john@mycompany.com" })
   * ```
   *
   * @public
   */
  public bind<K extends string, NS>(
    key: K,
    fn: (value: ExtractBindValueType<S>) => Result<NS, F> | Promise<Result<NS, F>>,
  ): Pipeline<BindValue<MergeBindValueType<S, K, NS>>, F> {
    const description = `Bind value to key: ${key}`;

    return new Pipeline(
      async () => {
        const result = await this.getCurrentResult();
        return handleResult<S, F, BindValue<MergeBindValueType<S, K, NS>>, F>(
          result,
          errorSafe(
            async (r) => {
              if (isSuccess(r)) {
                const value = extractValue(r.value);
                const boundResult = await fn(value);

                if (isSuccess(boundResult)) {
                  const isFirstBind = !this.flow
                    .getSteps()
                    .some((step: { type: string }) => step.type === 'bind');
                  let currentValue: Record<string, unknown> = {};

                  if (!isFirstBind && isBindValue(r.value)) {
                    currentValue = r.value.value as Record<string, unknown>;
                  }

                  const newValue = mergeBindValues(currentValue, key, boundResult.value);
                  return success(createBindValue(newValue as MergeBindValueType<S, K, NS>));
                }
                return boundResult;
              }
              return r as Result<BindValue<MergeBindValueType<S, K, NS>>, F>;
            },
            (error) => error as F,
          ),
        );
      },
      this.flow.addStep('bind', description),
    );
  }

  /**
   * Binds multiple values at once in a declarative way.
   * This is useful when you need to bind multiple related values.
   *
   * @typeParam K - The key to bind the values to.
   * @typeParam T - The type of the values to bind.
   * @param key - The key to bind the values to.
   * @param fn - The function that returns an object of binding functions.
   * @returns A new Pipeline with the bound values.
   *
   * @example
   * ```ts
   * const pipeline = Pipeline.from(success({ name: "John" }))
   *   .bindAll("profile", () => ({
   *     age: () => success(30),
   *     email: () => success("john@mycompany.com"),
   *     address: () => success("123 Main St")
   *   }));
   * // Result: success({
   * //   name: "John",
   * //   profile: {
   * //     age: 30,
   * //     email: "john@mycompany.com",
   * //     address: "123 Main St"
   * //   }
   * // })
   * ```
   *
   * @public
   */
  public bindAll<K extends string, T extends Record<string, unknown>>(
    key: K,
    fn: (value: ExtractBindValueType<S>) => BindAllValue<T, F>,
  ): Pipeline<BindValue<MergeBindValueType<S, K, T>>, F> {
    return new Pipeline(
      async () => {
        const result = await this.getCurrentResult();
        return handleResult<S, F, BindValue<MergeBindValueType<S, K, T>>, F>(
          result,
          errorSafe(
            async (r) => {
              if (isSuccess(r)) {
                const value = extractValue(r.value);
                const bindings = fn(value);
                const boundValues: Partial<T> = {};

                await Promise.all(
                  Object.entries(bindings).map(async ([k, v]) => {
                    const result = await v();
                    if (isSuccess(result)) {
                      boundValues[k as keyof T] = result.value as T[keyof T];
                    } else {
                      return result;
                    }
                  }),
                );

                const isFirstBind = !this.flow
                  .getSteps()
                  .some((step: { type: string }) => step.type === 'bind');
                const currentValue =
                  !isFirstBind && isSuccess(r) && isBindValue(r.value)
                    ? (r.value.value as Record<string, unknown>)
                    : {};
                const newValue = mergeBindValues(currentValue, key, boundValues);
                return success(createBindValue(newValue as MergeBindValueType<S, K, T>));
              }
              return r as Result<BindValue<MergeBindValueType<S, K, T>>, F>;
            },
            (error) => error as F,
          ),
        );
      },
      this.flow.addStep('bind', `Bind multiple values to key: ${key}`),
    );
  }

  /**
   * Matches the result against success and failure cases.
   * This is useful for handling both cases in a single operation.
   *
   * @typeParam NS - The type to return for success.
   * @typeParam NF - The type to return for failure.
   * @param successFn - The function to handle the success case.
   * @param failureFn - The function to handle the failure case.
   * @returns A Promise that resolves to either the success or failure result.
   *
   * @example
   * ```ts
   * const result = await Pipeline.from(success("hello"))
   *   .match(
   *     str => `Success: ${str}`,
   *     err => `Error: ${err}`
   *   );
   *
   * const result2 = await Pipeline.from(failure("error"))
   *   .match(
   *     str => `Success: ${str}`,
   *     err => `Error: ${err}`
   *   );
   * ```
   *
   * @public
   */
  public async match<NS, NF>(
    successFn: (value: S) => NS | Promise<NS>,
    failureFn: (failure: F) => NF | Promise<NF>,
  ): Promise<NS | NF> {
    const result = await this.getCurrentResult();
    if (isSuccess(result)) {
      return successFn(result.value);
    }
    return failureFn(result.cause);
  }

  /**
   * Executes the pipeline and returns the result.
   * This is the final step in the pipeline that actually runs all the operations.
   *
   * @returns A Promise that resolves to the final Result.
   *
   * @example
   * ```ts
   * const result = await Pipeline.from(success("hello"))
   *   .map(str => str.toUpperCase())
   *   .run();
   * ```
   *
   * @public
   */
  public async run(): Promise<Result<S, F>> {
    return this.getCurrentResult();
  }

  /**
   * Returns a string representation of the pipeline steps.
   * This is useful for debugging and understanding the pipeline's structure.
   *
   * @returns A string showing all steps in the pipeline.
   */
  public toString(): string {
    return this.flow.toString();
  }

  /**
   * Returns a JSON representation of the pipeline steps.
   * This is useful for serialization and programmatic access to the pipeline structure.
   *
   * @returns An array of step objects with their type and description.
   */
  public toJSON(): Array<{ step: number; type: string; description: string }> {
    return this.flow
      .getSteps()
      .map((step: { type: string; description: string }, index: number) => ({
        step: index + 1,
        type: step.type,
        description: step.description,
      }));
  }

  /**
   * Gets the flow of the pipeline.
   * This is useful for analyzing the pipeline's structure programmatically.
   *
   * @returns The pipeline flow
   */
  public getFlow(): Flow<PipelineOperation> {
    return this.flow;
  }

  /**
   * Executes one of two branches based on a condition using a declarative options object.
   * This is useful for conditional logic in the pipeline.
   *
   * @typeParam NS - The type of the result from either branch.
   * @param options - The options object containing the condition and branch functions.
   * @returns A new Pipeline with the result from the chosen branch.
   *
   * @example
   * ```ts
   * const pipeline = Pipeline.from(success(5))
   *   .if({
   *     predicate: n => n > 0,
   *     onTrue: n => success(`Positive: ${n}`),
   *     onFalse: n => success(`Negative: ${n}`)
   *   });
   *
   * const pipeline2 = Pipeline.from(success(-5))
   *   .if({
   *     predicate: n => n > 0,
   *     onTrue: n => success(`Positive: ${n}`),
   *     onFalse: n => success(`Negative: ${n}`)
   *   });
   * ```
   *
   * @public
   */
  public if<NS>(options: IfOptions<S, NS, F>): Pipeline<NS, F> {
    return new Pipeline(
      async () => {
        const result = await this.getCurrentResult();
        return handleResult<S, F, NS, F>(
          result,
          errorSafe(
            async (r) => {
              if (isSuccess(r)) {
                const value = extractValue(r.value);
                const conditionResult = await options.predicate(value);

                const branchResult = conditionResult
                  ? await options.onTrue(value)
                  : await options.onFalse(value);

                if (isSuccess(branchResult)) {
                  if (isBindValue(branchResult.value)) {
                    return success(branchResult.value.value as NS);
                  }
                }
                return branchResult;
              }
              return r as Result<NS, F>;
            },
            (error) => error as F,
          ),
        );
      },
      this.flow.addStep('if', 'Conditional branch'),
    );
  }

  /**
   * Executes multiple pipelines in parallel and collects their results.
   * This is useful for running independent operations concurrently.
   * Preserves the steps from all individual pipelines.
   *
   * @typeParam T - The type of the values to collect.
   * @typeParam F - The type of the failure.
   * @param pipelines - An array of pipelines to execute.
   * @param description - Optional description for this combination
   * @returns A new Pipeline that collects all results.
   */
  public static all<T, F>(pipelines: Pipeline<T, F>[], description?: string): Pipeline<T[], F> {
    // Collect all steps from individual pipelines with correct typing
    const allSteps = pipelines.flatMap(
      (pipeline) =>
        pipeline.flow.getSteps().map((step) => ({
          type: step.type,
          description: step.description,
        })) as Array<{ type: PipelineOperation; description: string }>,
    );

    return new Pipeline(
      async () => {
        const results = await Promise.all(pipelines.map((p) => p.run()));

        // Check if any pipeline failed
        const failure = results.find(isFailureOfType<F, F>);
        if (failure) {
          return failure as Result<T[], F>;
        }

        // All pipelines succeeded, collect their values
        const values = results.map((r) => {
          if (isSuccessOfType<T, never>(r)) {
            return r.value;
          }
          throw new Error('Unexpected failure in all operation: Pipeline execution failed');
        });
        return success(values);
      },
      Flow.create<PipelineOperation>(
        description ?? 'Execute multiple pipelines in parallel',
      ).addSteps(...allSteps),
    );
  }

  /**
   * Combines two pipelines into a single pipeline that produces a tuple of their results.
   * This is useful when you need to run two independent pipelines and combine their results.
   *
   * @typeParam T2 - The type of the second pipeline's success value.
   * @typeParam F2 - The type of the second pipeline's failure value.
   * @param other - The other pipeline to combine with.
   * @returns A new Pipeline that produces a tuple of both results.
   *
   * @example
   * ```ts
   * const result = await Pipeline.from(success("hello"))
   *   .zip(Pipeline.from(success(42)))
   *   .run();
   * ```
   *
   * @public
   */
  public zip<T2, F2>(other: Pipeline<T2, F2>): Pipeline<[S, T2], F | F2> {
    return new Pipeline(
      async () => {
        const [currentResult, otherResult] = await Promise.all([
          this.getCurrentResult(),
          other.run(),
        ]);

        // If either pipeline fails, return the first failure
        if (!isSuccess(currentResult)) {
          return currentResult as Result<[S, T2], F | F2>;
        }
        if (!isSuccess(otherResult)) {
          return otherResult as Result<[S, T2], F | F2>;
        }

        // Both pipelines succeeded, combine their values
        return success([currentResult.value, otherResult.value]);
      },
      this.flow.addStep('pipeline', 'Combine with another pipeline'),
    );
  }

  /**
   * Combines two pipelines into a single pipeline using a custom function.
   * This is useful when you need to run two independent pipelines and combine their results
   * in a specific way.
   *
   * @typeParam T2 - The type of the second pipeline's success value.
   * @typeParam F2 - The type of the second pipeline's failure value.
   * @typeParam R - The type of the combined result.
   * @param other - The other pipeline to combine with.
   * @param fn - The function to combine the results.
   * @returns A new Pipeline that produces the combined result.
   *
   * @example
   * ```ts
   * const result = await Pipeline.from(success("hello"))
   *   .zipWith(
   *     Pipeline.from(success(42)),
   *     (str, num) => `${str} ${num}`
   *   )
   *   .run();
   * ```
   *
   * @public
   */
  public zipWith<T2, F2, R>(
    other: Pipeline<T2, F2>,
    fn: (a: S, b: T2) => R | Promise<R>,
  ): Pipeline<R, F | F2> {
    return new Pipeline(
      async () => {
        const [currentResult, otherResult] = await Promise.all([
          this.getCurrentResult(),
          other.run(),
        ]);

        // If either pipeline fails, return the first failure
        if (!isSuccess(currentResult)) {
          return currentResult as Result<R, F | F2>;
        }
        if (!isSuccess(otherResult)) {
          return otherResult as Result<R, F | F2>;
        }

        // Both pipelines succeeded, combine their values using the provided function
        const combinedValue = await fn(currentResult.value, otherResult.value);
        return success(combinedValue);
      },
      this.flow.addStep('pipeline', 'Combine with another pipeline using a custom function'),
    );
  }

  /**
   * Combines multiple pipelines into a single pipeline that returns an array of their results.
   * All pipelines must succeed for the result to be a success.
   * If any pipeline fails, the result will be a failure.
   * Preserves the steps from all individual pipelines.
   *
   * @typeParam T - The type of the values in the pipelines.
   * @typeParam F - The type of the failure.
   * @param pipelines - The pipelines to combine.
   * @param description - Optional description for this combination
   * @returns A new Pipeline that returns an array of the results.
   */
  public static zipAll<T extends readonly unknown[], F>(
    pipelines: {
      [K in keyof T]: Pipeline<T[K], F>;
    },
    description?: string,
  ): Pipeline<T, F> {
    return new Pipeline(
      async () => {
        const results = await Promise.all(pipelines.map((p) => p.run()));
        const failures = results.filter(isFail);
        if (failures.length > 0) {
          return failures[0] as Result<T, F>;
        }
        const values = results.map((r) => {
          if (isSuccess(r)) {
            return r.value;
          }
          throw new Error('Unexpected failure in zipAll operation: Pipeline execution failed');
        });
        return success(values as unknown as T);
      },
      Flow.combine(
        pipelines.map((p) => p.flow),
        description || 'Combine multiple pipelines',
        'parallel',
      ),
    );
  }

  /**
   * Starts a new pipeline with a description.
   * This is a more fluent way to create pipelines.
   *
   * @param description - The description for this pipeline
   * @returns A new Pipeline instance
   */
  public static start(description: string): Pipeline<unknown, unknown> {
    return new Pipeline(success(undefined), Flow.create<PipelineOperation>(`${description}`));
  }

  /**
   * Defines the next step in the pipeline.
   * This helps document the purpose of the next operation.
   * Similar to tap, it doesn't affect the pipeline flow or result.
   *
   * @param description - The description of the next operation
   * @returns The same Pipeline instance for chaining
   */
  public step(description: string): Pipeline<S, F> {
    return new Pipeline(this.result, this.flow.setNextStepDescription(description));
  }
}

export { Pipeline };
