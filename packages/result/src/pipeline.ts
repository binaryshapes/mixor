/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Result } from './result';
import { fail, isFail, isSuccess, success } from './result';

type PipelineStep = {
  type: 'mapSuccess' | 'mapFailure' | 'mapBoth' | 'tap' | 'bind' | 'pipeline' | 'if';
  description: string;
};

type FlattenIntersection<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

type BindValue<T> = {
  __bind: true;
  value: T;
};

type BindAllValue<T, F> = {
  [K in keyof T]: () => Result<T[K], F> | Promise<Result<T[K], F>>;
};

/**
 * Helper function to handle both synchronous and asynchronous operations on a Result.
 */
function handleResult<S, F, NS, NF>(
  result: Result<S, F> | Promise<Result<S, F>>,
  handler: (r: Result<S, F>) => Result<NS, NF> | Promise<Result<NS, NF>>,
): Promise<Result<NS, NF>> {
  return result instanceof Promise ? result.then(handler) : Promise.resolve(handler(result));
}

type TryOptions<S, NF> = {
  try: () => S | Promise<S>;
  catch: (error: unknown) => NF;
};

/**
 * A class that provides a fluent API for working with Result types.
 */
class Pipeline<S, F> {
  private constructor(
    private readonly result:
      | Result<S, F>
      | Promise<Result<S, F>>
      | (() => Result<S, F> | Promise<Result<S, F>>),
    private readonly steps: PipelineStep[] = [],
  ) {}

  /**
   * Creates a new Pipeline from a Result or a function that returns a Result.
   */
  static from<S, F>(
    result: Result<S, F> | Promise<Result<S, F>> | (() => Result<S, F> | Promise<Result<S, F>>),
  ): Pipeline<S, F> {
    return new Pipeline(result, [
      {
        type: 'mapSuccess',
        description: 'Initial value',
      },
    ]);
  }

  /**
   * Creates a new Pipeline from a function that returns a Result.
   */
  static fromFunction<S, F>(fn: () => Result<S, F> | Promise<Result<S, F>>): Pipeline<S, F> {
    return new Pipeline(fn, [
      {
        type: 'pipeline',
        description: 'Initial pipeline',
      },
    ]);
  }

  /**
   * Executes a function that might throw an error and handles it gracefully.
   */
  static try<S, NF>(options: TryOptions<S, NF>): Pipeline<S, NF> {
    return new Pipeline(async () => {
      try {
        const value = await options.try();
        return success(value);
      } catch (error) {
        return fail(options.catch(error as Error));
      }
    }, [
      {
        type: 'pipeline',
        description: 'Try operation',
      },
    ]);
  }

  /**
   * Gets the current result value, executing the function if necessary.
   */
  private async getCurrentResult(): Promise<Result<S, F>> {
    if (typeof this.result === 'function') {
      return this.result();
    }
    return this.result;
  }

  /**
   * Maps the success value to a new value.
   */
  mapSuccess<NS>(
    fn: (value: S extends BindValue<infer T> ? FlattenIntersection<T> : S) => NS | Promise<NS>,
  ): Pipeline<NS, F> {
    return new Pipeline(async () => {
      const result = await this.getCurrentResult();
      return handleResult<S, F, NS, F>(result, async (r) => {
        if (isSuccess(r)) {
          const value =
            typeof r.isValue === 'object' && r.isValue !== null && 'value' in r.isValue
              ? r.isValue.value
              : r.isValue;
          const newValue = await fn(
            value as S extends BindValue<infer T> ? FlattenIntersection<T> : S,
          );
          return success(newValue);
        }
        return r as Result<NS, F>;
      });
    }, [
      ...this.steps,
      {
        type: 'mapSuccess',
        description: `Transform success value`,
      },
    ]);
  }

  /**
   * Maps the failure value to a new value.
   */
  mapFailure<NF>(fn: (failure: F) => NF | Promise<NF>): Pipeline<S, NF> {
    return new Pipeline(async () => {
      const result = await this.getCurrentResult();
      return handleResult<S, F, S, NF>(result, async (r) => {
        if (isFail(r)) {
          const newFailure = await fn(r.isFailure);
          return fail(newFailure);
        }
        return r as Result<S, NF>;
      });
    }, [
      ...this.steps,
      {
        type: 'mapFailure',
        description: `Transform failure value`,
      },
    ]);
  }

  /**
   * Maps both success and failure values.
   */
  mapBoth<NS, NF>(
    successFn: (value: S) => NS | Promise<NS>,
    failureFn: (failure: F) => NF | Promise<NF>,
  ): Pipeline<NS, NF> {
    return new Pipeline(async () => {
      const result = await this.getCurrentResult();
      return handleResult<S, F, NS, NF>(result, async (r) => {
        if (isSuccess(r)) {
          const newValue = await successFn(r.isValue);
          return success(newValue);
        }
        const newFailure = await failureFn(r.isFailure);
        return fail(newFailure);
      });
    }, [
      ...this.steps,
      {
        type: 'mapBoth',
        description: `Transform both success and failure values`,
      },
    ]);
  }

  /**
   * Executes a side effect on the success value and returns the same Result.
   * If the side effect throws an error, the pipeline will fail with that error.
   */
  tap(fn: (value: S) => void | Promise<void>): Pipeline<S, F> {
    return new Pipeline(async () => {
      try {
        const result = await this.getCurrentResult();
        if (isSuccess(result)) {
          await fn(result.isValue);
        }
        return result;
      } catch (error) {
        return fail(error as F);
      }
    }, [
      ...this.steps,
      {
        type: 'pipeline',
        description: 'Side effect',
      },
    ]);
  }

  /**
   * Binds a new value to the pipeline, making it available for subsequent operations.
   * Each bind operation accumulates properties in a new object, ignoring the initial pipeline value.
   * The accumulation of binds is reset when a non-bind operation is performed.
   */
  bind<K extends string, NS>(
    key: K,
    fn: (
      value: S extends BindValue<infer T> ? FlattenIntersection<T> : S,
    ) => Result<NS, F> | Promise<Result<NS, F>>,
  ): Pipeline<
    BindValue<S extends BindValue<infer T> ? T & { [P in K]: NS } : { [P in K]: NS }>,
    F
  > {
    return new Pipeline(async () => {
      const result = await this.getCurrentResult();
      return handleResult<
        S,
        F,
        BindValue<S extends BindValue<infer T> ? T & { [P in K]: NS } : { [P in K]: NS }>,
        F
      >(result, async (r) => {
        if (isSuccess(r)) {
          const value =
            typeof r.isValue === 'object' && r.isValue !== null && 'value' in r.isValue
              ? r.isValue.value
              : r.isValue;
          const boundResult = await fn(
            value as S extends BindValue<infer T> ? FlattenIntersection<T> : S,
          );
          if (isSuccess(boundResult)) {
            // Check if this is the first bind in the chain
            const isFirstBind = !this.steps.some((step) => step.type === 'bind');

            // Get the current accumulated object or start with an empty one
            const currentValue =
              !isFirstBind &&
              isSuccess(r) &&
              typeof r.isValue === 'object' &&
              r.isValue !== null &&
              'value' in r.isValue &&
              typeof r.isValue.value === 'object' &&
              r.isValue.value !== null
                ? { ...r.isValue.value }
                : {};

            // Add the new property to the accumulated object
            const newValue = {
              ...currentValue,
              [key]: boundResult.isValue,
            };
            return success({ __bind: true, value: newValue } as BindValue<
              S extends BindValue<infer T> ? T & { [P in K]: NS } : { [P in K]: NS }
            >);
          }
          return boundResult as Result<
            BindValue<S extends BindValue<infer T> ? T & { [P in K]: NS } : { [P in K]: NS }>,
            F
          >;
        }
        return r as Result<
          BindValue<S extends BindValue<infer T> ? T & { [P in K]: NS } : { [P in K]: NS }>,
          F
        >;
      });
    }, [
      ...this.steps,
      {
        type: 'bind',
        description: `Bind value to key: ${key}`,
      },
    ]);
  }

  /**
   * Binds multiple values at once in a declarative way.
   * This is useful when you need to create a nested object with multiple bindings.
   *
   * @example
   * ```typescript
   * Pipeline.from(success(42))
   *   .bind('id', () => success('30'))
   *   .bindAll('user', ({ id }) => ({
   *     name: () => success('John'),
   *     age: () => success(25)
   *   }))
   * ```
   */
  bindAll<K extends string, T extends Record<string, unknown>>(
    key: K,
    fn: (value: S extends BindValue<infer U> ? FlattenIntersection<U> : S) => BindAllValue<T, F>,
  ): Pipeline<BindValue<S extends BindValue<infer U> ? U & { [P in K]: T } : { [P in K]: T }>, F> {
    return new Pipeline(async () => {
      const result = await this.getCurrentResult();
      return handleResult<
        S,
        F,
        BindValue<S extends BindValue<infer U> ? U & { [P in K]: T } : { [P in K]: T }>,
        F
      >(result, async (r) => {
        if (isSuccess(r)) {
          const value =
            typeof r.isValue === 'object' && r.isValue !== null && 'value' in r.isValue
              ? r.isValue.value
              : r.isValue;

          const bindings = fn(value as S extends BindValue<infer U> ? FlattenIntersection<U> : S);
          const boundValues: Partial<T> = {};

          // Execute all bindings in parallel
          await Promise.all(
            Object.entries(bindings).map(async ([k, v]) => {
              const result = await v();
              if (isSuccess(result)) {
                boundValues[k as keyof T] = result.isValue as T[keyof T];
              } else {
                return result;
              }
            }),
          );

          // Check if this is the first bind in the chain
          const isFirstBind = !this.steps.some((step) => step.type === 'bind');

          // Get the current accumulated object or start with an empty one
          const currentValue =
            !isFirstBind &&
            isSuccess(r) &&
            typeof r.isValue === 'object' &&
            r.isValue !== null &&
            'value' in r.isValue &&
            typeof r.isValue.value === 'object' &&
            r.isValue.value !== null
              ? { ...r.isValue.value }
              : {};

          // Add the new properties to the accumulated object
          const newValue = {
            ...currentValue,
            [key]: boundValues,
          };

          return success({ __bind: true, value: newValue } as BindValue<
            S extends BindValue<infer U> ? U & { [P in K]: T } : { [P in K]: T }
          >);
        }
        return r as Result<
          BindValue<S extends BindValue<infer U> ? U & { [P in K]: T } : { [P in K]: T }>,
          F
        >;
      });
    }, [
      ...this.steps,
      {
        type: 'bind',
        description: `Bind multiple values to key: ${key}`,
      },
    ]);
  }

  /**
   * Matches the result against success and failure cases.
   */
  async match<NS, NF>(
    successFn: (value: S) => NS | Promise<NS>,
    failureFn: (failure: F) => NF | Promise<NF>,
  ): Promise<NS | NF> {
    const result = await this.getCurrentResult();
    if (isSuccess(result)) {
      return successFn(result.isValue);
    }
    return failureFn(result.isFailure);
  }

  /**
   * Executes the pipeline and returns the result.
   */
  async run(): Promise<Result<S, F>> {
    return this.getCurrentResult();
  }

  /**
   * Returns a string representation of the pipeline steps.
   */
  toString(): string {
    return this.steps
      .map((step, index) => `${index + 1}. ${step.type}: ${step.description}`)
      .join('\n');
  }

  /**
   * Internal implementation of if that takes three separate parameters.
   * @private
   */
  private _if<NS>(
    condition: (
      value: S extends BindValue<infer T> ? FlattenIntersection<T> : S,
    ) => boolean | Promise<boolean>,
    thenFn: (
      value: S extends BindValue<infer T> ? FlattenIntersection<T> : S,
    ) => Result<NS, F> | Promise<Result<NS, F>>,
    elseFn: (
      value: S extends BindValue<infer T> ? FlattenIntersection<T> : S,
    ) => Result<NS, F> | Promise<Result<NS, F>>,
  ): Pipeline<NS, F> {
    return new Pipeline(async () => {
      const result = await this.getCurrentResult();
      return handleResult<S, F, NS, F>(result, async (r) => {
        if (isSuccess(r)) {
          const value =
            typeof r.isValue === 'object' && r.isValue !== null && 'value' in r.isValue
              ? r.isValue.value
              : r.isValue;

          try {
            const conditionResult = await condition(
              value as S extends BindValue<infer T> ? FlattenIntersection<T> : S,
            );

            try {
              const branchResult = conditionResult
                ? await thenFn(value as S extends BindValue<infer T> ? FlattenIntersection<T> : S)
                : await elseFn(value as S extends BindValue<infer T> ? FlattenIntersection<T> : S);

              if (isSuccess(branchResult)) {
                // Only extract value if the branch result is a BindValue
                if (
                  typeof branchResult.isValue === 'object' &&
                  branchResult.isValue !== null &&
                  '__bind' in branchResult.isValue &&
                  'value' in branchResult.isValue
                ) {
                  return success(branchResult.isValue.value as NS);
                }
              }
              return branchResult;
            } catch (error) {
              return fail(error as F);
            }
          } catch (error) {
            return fail(error as F);
          }
        }
        return r as Result<NS, F>;
      });
    }, [
      ...this.steps,
      {
        type: 'if',
        description: 'Conditional branch',
      },
    ]);
  }

  /**
   * Executes one of two branches based on a condition using a declarative options object.
   * The condition can be synchronous or asynchronous.
   *
   * @example
   * ```typescript
   * Pipeline.from(success(42))
   *   .if({
   *     predicate: (value) => value > 40,
   *     onTrue: (value) => success(value * 2),
   *     onFalse: (value) => success(value / 2)
   *   })
   * ```
   */
  if<NS>(options: {
    predicate: (
      value: S extends BindValue<infer T> ? FlattenIntersection<T> : S,
    ) => boolean | Promise<boolean>;
    onTrue: (
      value: S extends BindValue<infer T> ? FlattenIntersection<T> : S,
    ) => Result<NS, F> | Promise<Result<NS, F>>;
    onFalse: (
      value: S extends BindValue<infer T> ? FlattenIntersection<T> : S,
    ) => Result<NS, F> | Promise<Result<NS, F>>;
  }): Pipeline<NS, F> {
    return this._if(options.predicate, options.onTrue, options.onFalse);
  }
}

export { Pipeline };
