/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Schema } from '../schema';
import { type Component, Panic, component } from '../system';
import type { Any } from '../utils';

/**
 * Panic error for the env module.
 * - `MissingEnvVariables`: Some environment variables are missing.
 * - `UnsupportedRuntime`: The runtime is not supported in order to access the environment variables.
 *
 * @public
 */
class EnvError extends Panic<'Env', 'MissingEnvVariables' | 'UnsupportedRuntime'>('Env') {}

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
 * Env component type.
 *
 * @typeParam F - The schema fields type.
 *
 * @public
 */
type Env<F> = Component<
  'Env',
  {
    (): Schema<F>;
  }
>;

/**
 * Loads and validates environment variables based on a schema.
 * Compatible with Node.js 20+, Bun, and Deno 2.0+.
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
  const envFn = () => {
    const rawEnv = getEnvSource();
    const fields = Object.keys(schema.fields as Any);

    // Extract only the schema fields from the environment variables.
    const input: Any = Object.fromEntries(
      Object.entries(rawEnv)
        .filter(([key]) => fields.includes(key))
        .map(([key, value]) => [key, value as string]),
    );

    // Check if all fields are present in the environment variables.
    const missingFields = fields.filter((field) => !Object.keys(input).includes(field));
    if (missingFields.length > 0) {
      throw new EnvError(
        'MissingEnvVariables',
        `Missing environment variables: ${missingFields.join(', ')}. Please check your .env file.`,
      );
    }

    // Using the schema in strict mode to ensure all fields are present.
    return schema(input, 'strict');
  };

  // Creates the env component with the schema as a child.
  return component('Env', envFn, { schema }).addChildren(schema);
}

export { EnvError, env };
export type { Env };
