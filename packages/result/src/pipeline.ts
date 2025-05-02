/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { BindValue, FlattenIntersection } from './helpers';
import {
  createBindValue,
  extractValue,
  handleResult,
  isBindValue,
  mergeBindValues,
  safeExecute,
} from './helpers';
import type { Result } from './result';
import { fail, isFail, isSuccess, success } from './result';

type PipelineStep = {
  type: 'mapSuccess' | 'mapFailure' | 'mapBoth' | 'tap' | 'bind' | 'pipeline' | 'if';
  description: string;
};

type BindAllValue<T, F> = {
  [K in keyof T]: () => Result<T[K], F> | Promise<Result<T[K], F>>;
};

type TryOptions<S, NF> = {
  try: () => S | Promise<S>;
  catch: (error: unknown) => NF;
};

type IfOptions<S, NS, F> = {
  predicate: (
    value: S extends BindValue<infer T> ? FlattenIntersection<T> : S,
  ) => boolean | Promise<boolean>;
  onTrue: (
    value: S extends BindValue<infer T> ? FlattenIntersection<T> : S,
  ) => Result<NS, F> | Promise<Result<NS, F>>;
  onFalse: (
    value: S extends BindValue<infer T> ? FlattenIntersection<T> : S,
  ) => Result<NS, F> | Promise<Result<NS, F>>;
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
    return new Pipeline(
      () => safeExecute(options.try, options.catch),
      [
        {
          type: 'pipeline',
          description: 'Try operation',
        },
      ],
    );
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
          const value = extractValue(r.isValue);
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
   */
  tap(fn: (value: S) => void | Promise<void>): Pipeline<S, F> {
    return new Pipeline(async () => {
      const result = await this.getCurrentResult();
      if (isSuccess(result)) {
        try {
          await fn(result.isValue);
          return result;
        } catch (error) {
          return fail(error as F);
        }
      }
      return result;
    }, [
      ...this.steps,
      {
        type: 'tap',
        description: 'Side effect',
      },
    ]);
  }

  /**
   * Binds a new value to the pipeline.
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
          const value = extractValue(r.isValue);
          const boundResult = await fn(
            value as S extends BindValue<infer T> ? FlattenIntersection<T> : S,
          );

          if (isSuccess(boundResult)) {
            const isFirstBind = !this.steps.some((step) => step.type === 'bind');
            const currentValue =
              !isFirstBind && isSuccess(r) && isBindValue(r.isValue)
                ? (r.isValue.value as Record<string, unknown>)
                : {};
            const newValue = mergeBindValues(currentValue, key, boundResult.isValue);
            return success(
              createBindValue(
                newValue as S extends BindValue<infer T> ? T & { [P in K]: NS } : { [P in K]: NS },
              ),
            );
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
          const value = extractValue(r.isValue);
          const bindings = fn(value as S extends BindValue<infer U> ? FlattenIntersection<U> : S);
          const boundValues: Partial<T> = {};

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

          const isFirstBind = !this.steps.some((step) => step.type === 'bind');
          const currentValue =
            !isFirstBind && isSuccess(r) && isBindValue(r.isValue)
              ? (r.isValue.value as Record<string, unknown>)
              : {};
          const newValue = mergeBindValues(currentValue, key, boundValues);
          return success(
            createBindValue(
              newValue as S extends BindValue<infer U> ? U & { [P in K]: T } : { [P in K]: T },
            ),
          );
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
   * Executes one of two branches based on a condition using a declarative options object.
   */
  if<NS>(options: IfOptions<S, NS, F>): Pipeline<NS, F> {
    return new Pipeline(async () => {
      const result = await this.getCurrentResult();
      return handleResult<S, F, NS, F>(result, async (r) => {
        if (isSuccess(r)) {
          const value = extractValue(r.isValue);

          try {
            const conditionResult = await options.predicate(
              value as S extends BindValue<infer T> ? FlattenIntersection<T> : S,
            );

            try {
              const branchResult = conditionResult
                ? await options.onTrue(
                    value as S extends BindValue<infer T> ? FlattenIntersection<T> : S,
                  )
                : await options.onFalse(
                    value as S extends BindValue<infer T> ? FlattenIntersection<T> : S,
                  );

              if (isSuccess(branchResult)) {
                if (isBindValue(branchResult.isValue)) {
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
}

export { Pipeline };
