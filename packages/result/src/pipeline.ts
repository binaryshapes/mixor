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

/**
 * Helper function to handle both synchronous and asynchronous operations on a Result.
 */
function handleResult<S, F, NS, NF>(
  result: Result<S, F> | Promise<Result<S, F>>,
  handler: (r: Result<S, F>) => Result<NS, NF> | Promise<Result<NS, NF>>,
): Promise<Result<NS, NF>> {
  return result instanceof Promise ? result.then(handler) : Promise.resolve(handler(result));
}

/**
 * A class that provides a fluent API for working with Result types.
 */
class Pipeline<S, F> {
  private constructor(private readonly result: Result<S, F> | Promise<Result<S, F>>) {}

  /**
   * Creates a new Pipeline from a Result.
   */
  static from<S, F>(result: Result<S, F> | Promise<Result<S, F>>): Pipeline<S, F> {
    return new Pipeline(result);
  }

  /**
   * Maps the success value to a new value.
   */
  mapSuccess<NS>(fn: (value: S) => NS | Promise<NS>): Pipeline<NS, F> {
    const newResult = handleResult<S, F, NS, F>(this.result, (r) => {
      if (isSuccess(r)) {
        return Promise.resolve(fn(r.isValue)).then(success);
      }
      return r as Result<NS, F>;
    });

    return Pipeline.from(newResult);
  }

  /**
   * Maps the failure value to a new value.
   */
  mapFailure<NF>(fn: (failure: F) => NF | Promise<NF>): Pipeline<S, NF> {
    const newResult = handleResult<S, F, S, NF>(this.result, (r) => {
      if (isFail(r)) {
        return Promise.resolve(fn(r.isFailure)).then(fail);
      }
      return r as Result<S, NF>;
    });

    return Pipeline.from(newResult);
  }

  /**
   * Maps both success and failure values.
   */
  mapBoth<NS, NF>(
    successFn: (value: S) => NS | Promise<NS>,
    failureFn: (failure: F) => NF | Promise<NF>,
  ): Pipeline<NS, NF> {
    const newResult = handleResult<S, F, NS, NF>(this.result, (r) => {
      if (isSuccess(r)) {
        return Promise.resolve(successFn(r.isValue)).then(success);
      }
      return Promise.resolve(failureFn(r.isFailure)).then(fail);
    });

    return Pipeline.from(newResult);
  }

  /**
   * Performs a side effect on the success value without modifying it.
   */
  tap(fn: (value: S) => void | Promise<void>): Pipeline<S, F> {
    const newResult = handleResult<S, F, S, F>(this.result, async (r) => {
      if (isSuccess(r)) {
        await fn(r.isValue);
      }
      return r;
    });

    return Pipeline.from(newResult);
  }

  /**
   * Binds a new value to the pipeline, making it available for subsequent operations.
   */
  bind<K extends string, NS>(
    key: K,
    fn: (value: S) => Result<NS, F> | Promise<Result<NS, F>>,
  ): Pipeline<S & { [P in K]: NS }, F> {
    const newResult = handleResult<S, F, S & { [P in K]: NS }, F>(this.result, async (r) => {
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
    });

    return Pipeline.from(newResult);
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

export { Pipeline };
