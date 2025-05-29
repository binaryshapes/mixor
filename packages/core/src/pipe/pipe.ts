/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Option, type Result, isOption, isResult } from '../monads';
import type { Any, DeepAwaited, HasPromise, Prettify } from '../utils';
import { getMetadata, setMetadata, toCamelCase } from '../utils';

// TODO: We need to ensure that all the data in the pipeline is immutable and that the pipeline is
// a pure function. This is a good practice to avoid side effects and to make the pipeline more
// predictable. We need consider use Object.freeze and DeepReadonly type.

/**
 * Helper type to prettify the value types in the pipeline context.
 * It ensures to keep the type in some scenarios, like when the value is an Array,
 * Option or a Result.
 *
 * Under the hood, it uses the {@link Prettify} type from the `utils` package.
 *
 * @typeParam T - The type to prettify.
 * @returns The prettified type.
 *
 * @internal
 */
type PipePrettify<T> = T extends Any[]
  ? T
  : T extends { readonly _tag: 'Some' | 'None' }
    ? T
    : Prettify<T>;

/**
 * Normalizes the value type of the pipe.
 * It ensures to unwrap the pipe value and resolve all the promises deeply.
 * It also ensures to keep the Option and Result structure if it is present.
 *
 * @typeParam T - The type to normalize.
 * @returns The normalized type.
 *
 * @internal
 */
type NormalizePipeValue<T> = DeepAwaited<ExtractPipeValue<T>, Option<Any> | Result<Any, Any>>;

/**
 * Metadata for a pipe function.
 *
 * @public
 */
type PipeMetadata = {
  /**
   * The name of the pipe.
   */
  name: string;
  /**
   * The operator of the pipe.
   */
  operator: string;
  /**
   * Whether the pipe is async.
   */
  isAsync: boolean;
};

/**
 * A pipe function is a function that can be applied to a value.
 *
 * @typeParam A - The type of the input value.
 * @typeParam B - The type of the output value.
 *
 * @public
 */
type PipeFn<A, B> = (a: A) => B;

/**
 * Kind of pipe value.
 *
 * @internal
 */
type PipeValueKind = 'primitive' | 'object' | 'array' | 'result' | 'option';

/**
 * A pipe value is a value that can be used in a pipeline.
 *
 * @typeParam T - The type of the value.
 * @typeParam O - Operator that generates the value.
 * @typeParam K - Kind of the value.
 *
 * @public
 */
type PipeValue<T, O extends string, K extends PipeValueKind = PipeValueKind> = {
  readonly _tag: 'Value';
  readonly _operator: O;
  readonly _kind: K;
  readonly value: T;
};

/**
 * A pipe step is a object that contains a key and a function that can be applied to a value.
 * Potentially used to trace and debug the pipeline.
 *
 * @typeParam A - The type of the input value.
 * @typeParam B - The type of the output value.
 *
 * @internal
 */
type PipeStep<A = Any, B = Any> = {
  readonly key: symbol;
  readonly description: string;
  readonly fn: PipeFn<A, B>;
};

/**
 * Helper type to extract the value from a PipeValue.
 * If value is not a PipeValue, it will return the value itself.
 *
 * @typeParam T - The type to extract the value from.
 * @returns The extracted value or the value itself if it is not a PipeValue.
 *
 * @internal
 */
type ExtractPipeValue<T> = T extends {
  readonly _tag: 'Value';
  readonly _operator: Any;
  readonly _kind: Any;
  readonly value: infer U;
}
  ? U
  : T;

/**
 * Helper type to detect if any step in the pipeline returns a Promise
 *
 * @typeParam S - The type of the steps array.
 * @returns True if any step returns a Promise.
 *
 * @internal
 */
type HasAsyncStep<S extends PipeStep[]> = S extends [infer First, ...infer Rest]
  ? First extends { fn: infer F }
    ? F extends PipeFn<never, infer R>
      ? HasPromise<R> extends true
        ? true
        : Rest extends PipeStep[]
          ? HasAsyncStep<Rest>
          : false
      : false
    : false
  : false;

/**
 * Represents the return type of the build function.
 * This type is used to ensure that the build function returns the correct execution type ,
 * depending on the pipeline being async or not.
 * If the pipeline is async, the function will return a promise.
 * If the pipeline is sync, the function will return a value.
 *
 * @typeParam A - The type of the input value.
 * @typeParam B - The type of the output value.
 * @typeParam Async - Whether the pipeline is async.
 *
 * @internal
 */
type BuildReturnFn<
  A,
  B,
  Async extends boolean,
  R = PipePrettify<ExtractPipeValue<B>>,
> = Async extends true ? (value: A) => Promise<R> : (value: A) => R;

/**
 * The Pipe type represents a pipeline of functions that can be applied to a value.
 * In most cases, this type is not going to be used, because is the representation of the
 * pipeline created by the {@link pipe} function.
 *
 * @typeParam A - The type of the input value.
 * @typeParam B - The type of the output value.
 * @typeParam S - The type of the steps array.
 *
 * @public
 */
type Pipe<I, O = I, S extends PipeStep[] = [], Async extends boolean = HasAsyncStep<[...S]>> = {
  /**
   * Adds a new step to the pipeline.
   * The new step will be added to the end of the pipeline and will be applied to the output
   * of the previous step.
   *
   * @param description - The description of the step.
   * @param fn - The function to apply to the pipeline.
   * @returns A new Pipe Builder.
   */
  step: <OF>(
    description: string,
    fn: PipeFn<O, OF>,
  ) => Pipe<I, NormalizePipeValue<OF>, [...S, PipeStep<O, OF>]>;

  /**
   * Returns the steps of the pipeline as a list of steps with the respective metadata.
   *
   * @returns The steps of the pipeline.
   */
  steps: () => PipePrettify<{
    name: string;
    steps: (Pick<PipeStep, 'key' | 'description'> & PipeMetadata)[];
  }>;

  /**
   * Builds the pipeline and returns a function that can be used to run the pipeline.
   * Depending on the pipeline being async or sync, the function will return a promise or a value.
   *
   * @returns The pipeline function.
   */
  build: () => BuildReturnFn<I, O, Async>;
};

// *********************************************************************************************
// Private functions.
// *********************************************************************************************

/**
 * Type guard to check if a variable is a PipeValue.
 *
 * @typeParam T - The type of the value.
 * @typeParam O - The operator type.
 * @param value - The variable to check.
 * @returns True if the variable is a PipeValue.
 *
 * @internal
 */
function isPipeValue(value: unknown): value is PipeValue<Any, string, PipeValueKind> {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_tag' in value &&
    '_operator' in value &&
    '_kind' in value &&
    'value' in value
  );
}

/**
 * Extracts the value from a PipeValue or returns the value itself.
 *
 * @typeParam T - The type of the value.
 * @param value - The value to extract from.
 * @returns The extracted value.
 *
 * @internal
 */
function extractValue<T>(value: T | PipeValue<T, string, PipeValueKind>): T {
  return isPipeValue(value) ? value.value : value;
}

/**
 * Builds an async pipeline.
 * Takes the input value and the steps and executes each step in sequence.
 * It handles any partial promise and resolves them, and it also handles the PipeValue passed
 * through the pipeline operators.
 *
 * @typeParam I - The type of the input value.
 * @typeParam O - The type of the output value.
 * @param input - The input value.
 * @param steps - The steps of the pipeline.
 * @returns The async pipeline function that can be used to run the pipeline.
 *
 * @internal
 */
function buildAsyncPipe<I, O>(input: I, steps: PipeStep<I, O>[]) {
  return (async () => {
    let currentValue: Any = input;
    for (const step of steps) {
      currentValue = await step.fn(currentValue);
      currentValue = extractValue(currentValue);

      // The async operator can return an object with promises, so we need to resolve them.
      if (typeof currentValue === 'object' && currentValue !== null) {
        for (const [key, value] of Object.entries(currentValue)) {
          if (value instanceof Promise) {
            currentValue[key] = await value;
          }
        }
      }
    }

    return currentValue;
  })();
}

/**
 * Builds a sync pipeline.
 * Takes the input value and the steps and executes each step in sequence.
 * It handles the PipeValue passed through the pipeline operators.
 *
 * @typeParam I - The type of the input value.
 * @typeParam O - The type of the output value.
 * @param input - The input value.
 * @param steps - The steps of the pipeline.
 * @returns The sync pipeline function that can be used to run the pipeline.
 *
 * @internal
 */
function buildSyncPipe<I, O>(input: I, steps: PipeStep<I, O>[]) {
  return steps.reduce<Any>((acc, step) => extractValue(step.fn(acc)), input);
}

/**
 * Applies the given metadata to the pipe function.
 * If metadata is not provided, it will be inferred from the function.
 *
 * @param fn - The pipe function to create metadata for.
 * @param metadata - The metadata object.
 * @returns The pipe function with the metadata applied.
 *
 * @internal
 */
function applyPipeMetadata<F extends PipeFn<Any, Any>, M extends Partial<PipeMetadata>>(
  fn: F,
  metadata?: M,
) {
  let existingMetadata: PipeMetadata | undefined;
  try {
    existingMetadata = getMetadata<PipeMetadata>(fn);
  } catch {
    existingMetadata = undefined;
  }

  if (!existingMetadata) {
    // If no metadata is provided, we infer it from the function.
    const { name, operator = 'function', isAsync } = metadata ?? {};

    setMetadata(fn, {
      name: !!name || toCamelCase(`${operator}_${Date.now()}`),
      operator,
      isAsync: isAsync || fn.constructor.name === 'AsyncFunction',
    });
  }

  return fn;
}

/**
 * Determines the kind of the value.
 *
 * @param value - The value to determine the kind of.
 * @returns The kind of the value.
 *
 * @internal
 */
const getPipeValueKind = (value: unknown): PipeValueKind =>
  typeof value === 'object'
    ? 'object'
    : Array.isArray(value)
      ? 'array'
      : isResult(value)
        ? 'result'
        : isOption(value)
          ? 'option'
          : 'primitive';

/**
 * Creates a new PipeValue.
 *
 * @param value - The value to wrap.
 * @param operator - The operator that generated the value.
 * @returns A PipeValue with the value, operator and kind.
 *
 * @internal
 */
const pipeValue = <T, O extends string>(value: T, operator: O) =>
  ({
    _tag: 'Value',
    _operator: operator,
    _kind: getPipeValueKind(value),
    value,
  }) as const;

// *********************************************************************************************
// Public functions.
// *********************************************************************************************

/**
 * Creates a new function that can be used as a operator in a pipeline.
 *
 * @param operator - The operator name.
 * @param fn - The function with the operator logic.
 * @returns A function that can be used as a operator in a pipeline. The internal function will
 * return a PipeValue with data transformed by the operator and the function is wrapped with the
 * metadata applied.
 *
 * @example
 * ```ts
 * // Tap operator definition.
 * const tap = pipeOperator('tap', <A>(fn: PipeFn<A, void>) => (a: A) => {
 *  fn(a);
 *  return a;
 * });
 *
 * // Using the tap operator in a pipeline.
 * const pipeline = pipe<number>("Use tap operator")
 * .step('tap', tap((n) => Logger.info('Current value:', n)))
 * .build();
 * ```
 *
 * @public
 */
function pipeOperator<A, B, R, P extends Any[], O extends string = string>(
  operator: O,
  fn: (...args: [...P, ...[fn: PipeFn<A, B>]]) => (a: A) => R,
) {
  return (...args: Parameters<typeof fn>) => {
    // Always the last argument is the function defined by the user inside the operator.
    const opFn = args[args.length - 1];
    const op = (a: A) => pipeValue<R, O>(fn(...args)(a), operator);

    return applyPipeMetadata(op, {
      name: opFn.name,
      operator,
      isAsync: opFn.constructor.name === 'AsyncFunction',
    });
  };
}

/**
 * Creates a new Pipe Builder.
 *
 * @typeParam A - The type of the input value.
 * @param name - The name of the pipeline.
 * @returns A new Pipe Builder
 *
 * @example
 * ```ts
 * const pipeline = pipe<User>()
 *   .step('map', bind('ageRange', (u) => (u.age >= 18 ? 'adult' : 'minor')))
 *   .step('bind', bind('password', () => 'securePassword'))
 *   .step('tap', tap((u) => logger.print('The tap:', u)))
 *   .step('map', map((user) => user.ageRange))
 *   .build();
 * ```
 *
 * @public
 */
function pipe<A>(name: string): Pipe<A, A, []> {
  const steps: PipeStep[] = [];
  const pipelineName = name;

  const pipeline = {
    step: <C>(description: string, fn: PipeFn<A, C>) => {
      // Registering the step in the steps array, and applying the metadata to the function.
      // If the metadata is not provided, it will be inferred from the function.
      steps.push({
        key: Symbol(description),
        description,
        fn: applyPipeMetadata(fn),
      });

      // Returning a new Pipe Builder with the new step added.
      return {
        step: <D>(nextDescription: string, nextFn: PipeFn<C, D>) =>
          pipeline.step(nextDescription, nextFn as Any),
        steps: () => {
          return {
            name: pipelineName,
            steps: steps.map((step) => ({
              key: step.key,
              description: step.description,
              ...getMetadata<PipeMetadata>(step.fn),
            })),
          };
        },
        // If we have steps, we need to build the runner function.
        build: () => (a: A) => {
          const isAsync = steps.some((step) => getMetadata<PipeMetadata>(step.fn).isAsync);
          return isAsync ? buildAsyncPipe(a, steps) : buildSyncPipe(a, steps);
        },
      };
    },
    // If no steps are added, the pipeline is empty and the steps will be an empty array.
    steps: () => {
      return {
        name: pipelineName,
        steps: [],
      };
    },
    // If no steps are added, the pipeline is empty and the build function will return the
    // input value.
    build: () => (a: A) => a,
  };

  return pipeline as Pipe<A, A, []>;
}

export type { Pipe, PipeFn, PipeValue };
export { pipe, pipeOperator };
