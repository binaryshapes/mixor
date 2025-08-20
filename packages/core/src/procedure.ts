/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Component, component } from './component';
import type { Any, Prettify } from './generics';
import { panic } from './panic';
import { type Result, isErr } from './result';
import type { Schema, SchemaErrors, SchemaValues } from './schema';

/**
 * A function that can be used as a procedure.
 * Can be either sync or async and must return a Result.
 *
 * @typeParam I - The type of the input schema.
 * @typeParam O - The type of the output schema.
 * @typeParam E - The type of the error schema.
 *
 * @public
 */
type Callable<I, O, E> = (input: I) => Promise<Result<O, E>>;

/**
 * A function that can be used as a fallback.
 *
 * @typeParam E - The type of the error schema.
 *
 * @public
 */
type Fallback<E> = (errors: E) => void;

interface ProcedureConstructor<I = never, O = never, E = never, H = never, F = never, R = never> {
  input: <IF>(i: Schema<IF>) => Procedure<IF, O, E | Prettify<SchemaErrors<IF, 'strict'>>, H, F, R>;
  output: <OF>(
    o: Schema<OF>,
  ) => Procedure<I, OF, E | Prettify<SchemaErrors<OF, 'strict'>>, H, F, R>;
  handler: <HF extends Callable<SchemaValues<I>, SchemaValues<O>, E>>(
    fn: HF,
  ) => Procedure<I, O, E, H, F, R>;
  fallback: (fn: Fallback<E>) => Procedure<I, O, E, H, F, R>;
  retries: (retries: number) => Procedure<I, O, E, H, F, R>;
  retryDelay: (delay: number) => Procedure<I, O, E, H, F, R>;
  call: (i: Any) => Result<O, E>;
}

const ProcedureError = panic<
  'Procedure',
  | 'InputNotSet'
  | 'OutputNotSet'
  | 'HandlerNotSet'
  | 'FallbackNotSet'
  | 'RetriesNotSet'
  | 'FallbackNotFunction'
>('Procedure');

// Helper function for delay that works in both Node.js and browser
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const ProcedurePrototype = () => {
  let inputFnOrValue: (i: Any) => Result<Any, Any>;
  let outputFnOrValue: (o: Any) => Result<Any, Any>;
  let handlerFn: (i: Any) => Result<Any, Any>;
  let fallbackFn: ((e: Any) => Result<Any, Any>) | null = null;
  let maxRetries = 0;
  let retryDelay = 1000; // Default delay in ms

  const self = {
    input: (i: Schema<Any>) => ((inputFnOrValue = i), self),
    output: (o: Schema<Any>) => ((outputFnOrValue = o), self),
    handler: (fn: Any) => ((handlerFn = fn), self),
    fallback: (fn: Any) => ((fallbackFn = fn), self),
    retries: (r: number) => {
      if (r < 0) {
        throw new ProcedureError('RetriesNotSet', 'Retries must be a non-negative number');
      }
      maxRetries = r;
      return self;
    },
    retryDelay: (delay: number) => {
      if (delay < 0) {
        throw new ProcedureError('RetriesNotSet', 'Retry delay must be a non-negative number');
      }
      retryDelay = delay;
      return self;
    },
    call: async (i: Any): Promise<Result<Any, Any>> => {
      if (!inputFnOrValue) {
        throw new ProcedureError('InputNotSet', 'Input not set');
      }

      if (!outputFnOrValue) {
        throw new ProcedureError('OutputNotSet', 'Output not set');
      }

      if (!handlerFn) {
        throw new ProcedureError('HandlerNotSet', 'Handler function not set');
      }

      let lastError: Any;
      let attempt = 0;

      while (attempt <= maxRetries) {
        try {
          // Validate input
          const inputResult = inputFnOrValue(i) as unknown as Result<Any, Any>;
          if (isErr(inputResult)) {
            return inputResult;
          }

          // Execute handler
          const handlerResult = await handlerFn(inputResult.value);

          // Validate output
          return outputFnOrValue(handlerResult);
        } catch (error) {
          lastError = error;
          attempt++;

          // If we still have retries left, wait and retry
          if (attempt <= maxRetries) {
            const delayMs = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
            await delay(delayMs);
            continue;
          }

          // No more retries, handle with fallback or throw
          if (fallbackFn !== null && typeof fallbackFn === 'function') {
            return fallbackFn(lastError);
          }

          // This is a bad state for the procedure, we need a function to handle the error.
          if (!!fallbackFn && typeof fallbackFn !== 'function') {
            throw new ProcedureError('FallbackNotFunction', 'Fallback function is not a function');
          }

          throw lastError;
        }
      }

      // This should never be reached, but just in case
      throw lastError;
    },
  };

  return self;
};

/**
 * Procedure component type.
 *
 * @typeParam I - The type of the input schema.
 * @typeParam O - The type of the output schema.
 * @typeParam E - The type of the error schema.
 *
 * @public
 */
type Procedure<II = never, OO = never, E = never, H = never, F = never, R = never> = Component<
  'Procedure',
  ProcedureConstructor<II, OO, E, H, F, R>
>;

/**
 * Creates a procedure between with the given input and output schemas.
 *
 * @remarks
 * A procedure defines the shape of the expected input and output of a procedure.
 *
 * @returns A procedure object.
 */
function procedure() {
  const proc = Object.assign({}, ProcedurePrototype());

  return component('Procedure', proc) as unknown as Procedure;
}

export { procedure };
