/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { ErrorMode } from './_err';
import type { Any } from './generics';
import { Panic } from './panic';
import type { Schema } from './schema';

/**
 * Panic error for the schema module.
 *
 * @public
 */
const EnvError = Panic<
  'ENV',
  // Unsupported runtime (if not Deno, Bun, Node.js).
  | 'UNSUPPORTED_RUNTIME'
  // When a schema field is not a value.
  | 'MISSING_ENV_VARIABLES'
>('ENV');

/**
 * Returns a copy of environment variables from the detected runtime (Node.js, Deno, or Bun).
 *
 * @returns A copy of the environment variables from the detected runtime.
 *
 * @internal
 */
function getEnvSource(): Record<string, string | undefined> {
  const g = globalThis as Any;

  if (typeof g.Deno !== 'undefined' && typeof g.Deno.env?.toObject === 'function') {
    return g.Deno.env.toObject();
  }

  if (typeof g.Bun !== 'undefined' && typeof g.Bun.env === 'object') {
    return g.Bun.env;
  }

  if (typeof process !== 'undefined' && typeof process.env === 'object') {
    return process.env;
  }

  throw new EnvError(
    'UNSUPPORTED_RUNTIME',
    'Unsupported runtime: environment variables are not accessible. Please use Deno, Bun, or Node.',
  );
}

/**
 * Loads and validates environment variables based on a schema.
 * Compatible with Node.js 20+, Bun, and Deno.
 * Uses the centralized error mode concept from {@link ErrorMode}.
 *
 * @typeParam F - The schema fields type.
 * @param schema - The schema to validate the environment variables against.
 * @returns A function that validates environment variables with optional error mode.
 *
 * @example
 * ```ts
 * // env-001: Basic environment variable validation with schema.
 * const redisConfig = env(schema({
 *   REDIS_HOST: value((value: string) => value.length > 0 ? ok(value) : err('EMPTY_HOST')),
 *   REDIS_PORT: value((value: number) => {
 *     return Number.isInteger(value) && value > 0 ? ok(value) : err('INVALID_PORT');
 *   }),
 * }));
 *
 * // Suppose process.env = { REDIS_HOST: 'localhost', REDIS_PORT: '6379' }
 * // You must coerce REDIS_PORT to number before calling redisConfig.
 *
 * const result = redisConfig();
 * // ok({ REDIS_HOST: 'localhost', REDIS_PORT: 6379 }).
 * ```
 *
 * @example
 * ```ts
 * // env-002: Error handling for missing environment variables.
 * const config = env(schema({
 *   DATABASE_URL: value((value: string) => value.length > 0 ? ok(value) : err('EMPTY_URL')),
 *   API_KEY: value((value: string) => value.length > 0 ? ok(value) : err('EMPTY_KEY')),
 * }));
 *
 * // Suppose process.env = {}
 *
 * const result = config();
 * // Should throw an error with the message:
 * // "Missing environment variables: DATABASE_URL, API_KEY. Please check your .env file."
 * ```
 *
 * @example
 * ```ts
 * // env-003: Using different error modes for validation.
 * const config = env(schema({
 *   DATABASE_URL: value((value: string) => value.length > 0 ? ok(value) : err('EMPTY_URL')),
 *   API_KEY: value((value: string) => value.length > 0 ? ok(value) : err('EMPTY_KEY')),
 *   PORT: value((value: number) => value > 0 ? ok(value) : err('INVALID_PORT')),
 * }));
 *
 * // Strict mode - stops at first error
 * const strictResult = config('strict');
 * // err({ DATABASE_URL: ['EMPTY_URL'] }) - stops at first error
 *
 * // All mode - collects all errors
 * const allResult = config('all');
 * // err({ DATABASE_URL: ['EMPTY_URL'], API_KEY: ['EMPTY_KEY'], PORT: ['INVALID_PORT'] })
 * ```
 *
 * @public
 */
function env<F>(schema: Schema<F>) {
  return <Mode extends ErrorMode = 'all'>(mode?: Mode) => {
    const rawEnv = getEnvSource();

    // This filter is to avoid including the schema metadata fields.
    const fields = Object.keys(schema).filter(
      (key) => !['~trace', 'meta', 'parent', 'trace', 'Type'].includes(key),
    );

    // Filtering only the schema fields.
    const input = Object.fromEntries(
      Object.entries(rawEnv)
        .filter(([key]) => fields.includes(key))
        .map(([key, value]) => [key, value as string]),
    );

    // All all fields present in the schema.
    const missingFields = fields.filter((field) => !Object.keys(input).includes(field));
    if (missingFields.length > 0) {
      throw new EnvError(
        'MISSING_ENV_VARIABLES',
        `Missing environment variables: ${missingFields.join(', ')}. Please check your .env file.`,
      );
    }

    return schema(input as Any, mode);
  };
}

export { env, EnvError };
