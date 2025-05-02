import type { Result } from './result';
import { fail } from './result';

export type BindValue<T> = {
  __bind: true;
  value: T;
};

export type FlattenIntersection<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

/**
 * Helper function to handle both synchronous and asynchronous operations on a Result.
 */
export function handleResult<S, F, NS, NF>(
  result: Result<S, F> | Promise<Result<S, F>>,
  handler: (r: Result<S, F>) => Result<NS, NF> | Promise<Result<NS, NF>>,
): Promise<Result<NS, NF>> {
  return result instanceof Promise ? result.then(handler) : Promise.resolve(handler(result));
}

/**
 * Extracts the value from a Result, handling BindValue cases.
 */
export function extractValue<S>(
  value: S,
): S extends BindValue<infer T> ? FlattenIntersection<T> : S {
  if (typeof value === 'object' && value !== null && 'value' in value) {
    return value.value as S extends BindValue<infer T> ? FlattenIntersection<T> : S;
  }
  return value as S extends BindValue<infer T> ? FlattenIntersection<T> : S;
}

/**
 * Checks if a value is a BindValue.
 */
export function isBindValue(value: unknown): value is BindValue<unknown> {
  return typeof value === 'object' && value !== null && '__bind' in value && 'value' in value;
}

/**
 * Creates a new BindValue.
 */
export function createBindValue<T>(value: T): BindValue<T> {
  return { __bind: true, value };
}

/**
 * Safely executes an async operation and returns a Result.
 */
export async function safeExecute<S, F>(
  operation: () => Promise<S> | S,
  errorHandler: (error: unknown) => F,
): Promise<Result<S, F>> {
  try {
    const result = await operation();
    return { _isSuccess: true, isValue: result };
  } catch (error) {
    return fail(errorHandler(error));
  }
}

/**
 * Merges multiple bind values into a single object.
 */
export function mergeBindValues<T extends Record<string, unknown>>(
  currentValue: Partial<T> | undefined,
  newKey: string,
  newValue: unknown,
): T {
  return {
    ...(currentValue || {}),
    [newKey]: newValue,
  } as T;
}
