/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Represents the outcome of an operation that can either succeed with a value of type `S`
 * or fail with a value of type `F`.
 */
type Result<S, F> = Success<S> | Failure<F>;

/**
 * Represents a successful outcome with a value of type `S`.
 */
interface Success<S> {
  /**
   * The successful value.
   */
  readonly isValue: S;
  /**
   * Indicates that the result is a success.
   */
  readonly _isSuccess: true;
  /**
   * Indicates that the result is not a failure.
   */
  readonly _isFailure?: undefined;
}

/**
 * Represents a failed outcome with a value of type `F`.
 */
interface Failure<F> {
  /**
   * The failure value.
   */
  readonly isFailure: F;
  /**
   * Indicates that the result is a failure.
   */
  readonly _isFailure: true;
  /**
   * Indicates that the result is not a success.
   */
  readonly _isSuccess?: undefined;
}

/**
 * Creates a `Result` representing a successful outcome with the given value.
 *
 * @param value The successful value of type `S`.
 * @returns A `Result` instance representing success.
 */
function success<S>(value: S): Result<S, never> {
  return { isValue: value, _isSuccess: true };
}

/**
 * Creates a `Result` representing a failed outcome with the given failure value.
 *
 * @param failure The failure value of type `F`.
 * @returns A `Result` instance representing failure.
 */
function fail<F>(failure: F): Result<never, F> {
  return { isFailure: failure, _isFailure: true };
}

/**
 * Checks if a `Result` is a `Success`.
 *
 * @param result The `Result` to check.
 * @returns `true` if the `Result` is a `Success`, `false` otherwise.
 */
function isSuccess<S, F>(result: Result<S, F>): result is Success<S> {
  return 'isValue' in result;
}

/**
 * Checks if a `Result` is a `Failure`.
 *
 * @param result The `Result` to check.
 * @returns `true` if the `Result` is a `Failure`, `false` otherwise.
 */
function isFail<S, F>(result: Result<S, F>): result is Failure<F> {
  return 'isFailure' in result;
}

/**
 * A class that provides a fluent API for working with Result types.
 */
class ResultPipeline<S, F> {
  private constructor(private readonly result: Result<S, F> | Promise<Result<S, F>>) {}

  /**
   * Creates a new ResultPipeline from a Result.
   */
  static from<S, F>(result: Result<S, F> | Promise<Result<S, F>>): ResultPipeline<S, F> {
    return new ResultPipeline(result);
  }

  /**
   * Maps the success value to a new value.
   */
  mapSuccess<NS>(fn: (value: S) => NS | Promise<NS>): ResultPipeline<NS, F> {
    const newResult =
      this.result instanceof Promise
        ? this.result.then(async (r) => {
            if (isSuccess(r)) {
              const newValue = await fn(r.isValue);
              return success(newValue);
            }
            return r as Result<NS, F>;
          })
        : (() => {
            const r = this.result as Result<S, F>;
            if (isSuccess(r)) {
              return Promise.resolve(fn(r.isValue)).then(success);
            }
            return r as Result<NS, F>;
          })();

    return ResultPipeline.from(newResult);
  }

  /**
   * Maps the failure value to a new value.
   */
  mapFailure<NF>(fn: (failure: F) => NF | Promise<NF>): ResultPipeline<S, NF> {
    const newResult =
      this.result instanceof Promise
        ? this.result.then(async (r) => {
            if (isFail(r)) {
              const newFailure = await fn(r.isFailure);
              return fail(newFailure);
            }
            return r as Result<S, NF>;
          })
        : (() => {
            const r = this.result as Result<S, F>;
            if (isFail(r)) {
              return Promise.resolve(fn(r.isFailure)).then(fail);
            }
            return r as Result<S, NF>;
          })();

    return ResultPipeline.from(newResult);
  }

  /**
   * Maps both success and failure values.
   */
  mapBoth<NS, NF>(
    successFn: (value: S) => NS | Promise<NS>,
    failureFn: (failure: F) => NF | Promise<NF>,
  ): ResultPipeline<NS, NF> {
    const newResult =
      this.result instanceof Promise
        ? this.result.then(async (r) => {
            if (isSuccess(r)) {
              const newValue = await successFn(r.isValue);
              return success(newValue);
            }
            const newFailure = await failureFn(r.isFailure);
            return fail(newFailure);
          })
        : (() => {
            const r = this.result as Result<S, F>;
            if (isSuccess(r)) {
              return Promise.resolve(successFn(r.isValue)).then(success);
            }
            return Promise.resolve(failureFn(r.isFailure)).then(fail);
          })();

    return ResultPipeline.from(newResult);
  }

  /**
   * Performs a side effect on the success value without modifying it.
   */
  tap(fn: (value: S) => void | Promise<void>): ResultPipeline<S, F> {
    const newResult =
      this.result instanceof Promise
        ? this.result.then(async (r) => {
            if (isSuccess(r)) {
              await fn(r.isValue);
            }
            return r;
          })
        : (() => {
            const r = this.result as Result<S, F>;
            if (isSuccess(r)) {
              return Promise.resolve(fn(r.isValue)).then(() => r);
            }
            return r;
          })();

    return ResultPipeline.from(newResult);
  }

  /**
   * Binds a new value to the pipeline, making it available for subsequent operations.
   */
  bind<K extends string, NS>(
    key: K,
    fn: (value: S) => Result<NS, F> | Promise<Result<NS, F>>,
  ): ResultPipeline<S & { [P in K]: NS }, F> {
    const newResult =
      this.result instanceof Promise
        ? this.result.then(async (r) => {
            if (isSuccess(r)) {
              const boundResult = await fn(r.isValue);
              if (isSuccess(boundResult)) {
                const newValue = {
                  ...r.isValue,
                  [key]: boundResult.isValue,
                } as S & { [P in K]: NS };
                return success(newValue);
              }
              return boundResult as Result<S & { [P in K]: NS }, F>;
            }
            return r as Result<S & { [P in K]: NS }, F>;
          })
        : (() => {
            const r = this.result as Result<S, F>;
            if (isSuccess(r)) {
              return Promise.resolve(fn(r.isValue)).then((boundResult) => {
                if (isSuccess(boundResult)) {
                  const newValue = {
                    ...r.isValue,
                    [key]: boundResult.isValue,
                  } as S & { [P in K]: NS };
                  return success(newValue);
                }
                return boundResult as Result<S & { [P in K]: NS }, F>;
              });
            }
            return r as Result<S & { [P in K]: NS }, F>;
          })();

    return ResultPipeline.from(newResult);
  }

  /**
   * Matches the result against success and failure cases.
   */
  async match<NS, NF>(
    successFn: (value: S) => NS | Promise<NS>,
    failureFn: (failure: F) => NF | Promise<NF>,
  ): Promise<NS | NF> {
    const result = await this.result;
    if (isSuccess(result)) {
      return successFn(result.isValue);
    }
    return failureFn(result.isFailure);
  }

  /**
   * Gets the underlying result value.
   */
  async getResult(): Promise<Result<S, F>> {
    return this.result;
  }
}

export { success, fail, isSuccess, isFail, ResultPipeline };
export type { Result, Success, Failure };
