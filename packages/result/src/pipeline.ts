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
  type: 'mapSuccess' | 'mapFailure' | 'mapBoth' | 'tap' | 'bind';
  description: string;
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
        type: 'mapSuccess',
        description: 'Initial function',
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
  mapSuccess<NS>(fn: (value: S) => NS | Promise<NS>): Pipeline<NS, F> {
    return new Pipeline(async () => {
      const result = await this.getCurrentResult();
      return handleResult<S, F, NS, F>(result, async (r) => {
        if (isSuccess(r)) {
          const newValue = await fn(r.isValue);
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
   * Performs a side effect on the success value without modifying it.
   */
  tap(fn: (value: S) => void | Promise<void>): Pipeline<S, F> {
    return new Pipeline(async () => {
      const result = await this.getCurrentResult();
      return handleResult<S, F, S, F>(result, async (r) => {
        if (isSuccess(r)) {
          await fn(r.isValue);
        }
        return r;
      });
    }, [
      ...this.steps,
      {
        type: 'tap',
        description: `Perform side effect`,
      },
    ]);
  }

  /**
   * Binds a new value to the pipeline, making it available for subsequent operations.
   */
  bind<K extends string, NS>(
    key: K,
    fn: (value: S) => Result<NS, F> | Promise<Result<NS, F>>,
  ): Pipeline<S & { [P in K]: NS }, F> {
    return new Pipeline(async () => {
      const result = await this.getCurrentResult();
      return handleResult<S, F, S & { [P in K]: NS }, F>(result, async (r) => {
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
    }, [
      ...this.steps,
      {
        type: 'bind',
        description: `Bind value to key: ${key}`,
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
}

export { Pipeline };
