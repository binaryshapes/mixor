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
import { panic } from './panic';
import type { Schema } from './schema';

/**
 * Panic error for the schema module.
 *
 * @public
 */
const EnvError = panic<
  'Env',
  // Unsupported runtime (if not Deno, Bun, Node.js).
  | 'UnsupportedRuntime'
  // When a schema field is not a value.
  | 'MissingEnvVariables'
>('Env');

/**
 * Returns a copy of environment variables from the detected runtime (Node.js, Deno, or Bun).
 *
 * @returns A copy of the environment variables from the detected runtime.
 * @throws A {@link EnvError} when the runtime is not supported (Deno, Bun, or Node.js).
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
    'UnsupportedRuntime',
    'Unsupported runtime: environment variables are not accessible. Please use Deno, Bun, or Node.',
  );
}

/**
 * Loads and validates environment variables based on a schema.
 * Compatible with Node.js 20+, Bun, and Deno.
 * Uses the centralized error mode concept from {@link ErrorMode}.
 *
 * @remarks
 * The default error mode is the same used by the schema module.
 *
 * @typeParam F - The schema fields type.
 * @param schema - The schema to validate the environment variables against.
 * @returns A function that validates environment variables with optional error mode.
 * @throws A {@link EnvError} when environment variables are missing or runtime is not supported.
 *
 * @public
 */
function env<F>(schema: Schema<F>) {
  return <Mode extends ErrorMode = 'all'>(mode?: Mode) => {
    const rawEnv = getEnvSource();

    // Avoid including the schema properties inherited from the component.
    const fields = Object.keys(schema).filter(
      (key) =>
        ![
          'meta',
          'addChildren',
          'traceable',
          'Type',
          'info',
          'subType',
          'injectable',
          'tree',
        ].includes(key),
    );

    // Extract only the schema fields from the environment variables.
    const input = Object.fromEntries(
      Object.entries(rawEnv)
        .filter(([key]) => fields.includes(key))
        .map(([key, value]) => [key, value as string]),
    );

    // Check if all fields present in the schema are present in the environment variables.
    const missingFields = fields.filter((field) => !Object.keys(input).includes(field));
    if (missingFields.length > 0) {
      throw new EnvError(
        'MissingEnvVariables',
        `Missing environment variables: ${missingFields.join(', ')}. Please check your .env file.`,
      );
    }

    return schema(input as Any, mode);
  };
}

export { env, EnvError };
