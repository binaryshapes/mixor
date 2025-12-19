/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { n } from '@nuxo/core';
import process from 'node:process';

import { DEFAULT_ERROR_MODE } from './constants.ts';
import type { Schema, SchemaErrors, SchemaValues } from './schema.ts';

/**
 * The tag for the env component.
 *
 * @internal
 */
const ENV_TAG = 'Env' as const;

/**
 * Panic error for the env module.
 * - `MissingEnvVariables`: Some environment variables are missing.
 * - `UnsupportedRuntime`: The runtime is not supported in order to access the environment variables.
 *
 * @public
 */
class EnvPanic extends n.panic<'Env', 'MissingEnvVariables' | 'UnsupportedRuntime'>('Env') {}

/**
 * Returns a copy of environment variables from the detected runtime (Node.js, Deno, or Bun).
 *
 * @returns A copy of the environment variables from the detected runtime.
 * @throws A {@link EnvError} when the runtime is not supported (Deno, Bun, or Node.js).
 *
 * @internal
 */
const getEnvSource = (): Record<string, string | undefined> => {
  const g = globalThis as n.Any;

  if (typeof g.Deno !== 'undefined' && typeof g.Deno.env?.toObject === 'function') {
    return g.Deno.env.toObject();
  }

  if (typeof g.Bun !== 'undefined' && typeof g.Bun.env === 'object') {
    return g.Bun.env;
  }

  if (typeof process !== 'undefined' && typeof process.env === 'object') {
    return process.env;
  }

  throw new EnvPanic(
    'UnsupportedRuntime',
    'Unsupported runtime: environment variables are not accessible. Please use Deno, Bun, or Node.',
  );
};

/**
 * Env component type.
 *
 * @typeParam V - The schema values type.
 *
 * @public
 */
type Env<V extends SchemaValues> = n.Component<
  typeof ENV_TAG,
  () => n.Result<Schema<V>['Type'], SchemaErrors<V, typeof DEFAULT_ERROR_MODE>>
>;

/**
 * Loads and validates environment variables based on a schema.
 * Compatible with Node.js 20+, Bun, and Deno 2.0+.
 *
 * @typeParam V - The schema values type.
 * @param schema - The schema to validate the environment variables against.
 * @returns A function that validates environment variables.
 * @throws A {@link EnvError} when environment variables are missing or runtime is not supported.
 *
 * @public
 */
const env = <V extends SchemaValues>(schema: Schema<V>): Env<V> => {
  const envFn = () => {
    const rawEnv = getEnvSource();
    const values = Object.keys(schema.values);

    // Extract only the schema values from the environment variables.
    const input: n.Any = Object.fromEntries(
      Object.entries(rawEnv)
        .filter(([key]) => values.includes(key))
        .map(([key, value]) => [key, value as string]),
    );

    // Check if all values are present in the environment variables.
    const missingValues = values.filter((value) => !Object.keys(input).includes(value));
    if (missingValues.length > 0) {
      throw new EnvPanic(
        'MissingEnvVariables',
        `Missing environment variables: ${missingValues.join(', ')}`,
        'Please check your .env file',
      );
    }

    // Using the schema in strict mode to ensure all fields are present.
    return schema(input, { mode: DEFAULT_ERROR_MODE });
  };

  // Creates the env component with the schema as a child.
  const envComponent = n.component(ENV_TAG, envFn, { schema });

  // Adding the env component as a referenced object of the schema.
  n.info(schema).refs(envComponent);

  return envComponent as Env<V>;
};

export { env, EnvPanic };
export type { Env };
