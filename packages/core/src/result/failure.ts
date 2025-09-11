/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Struct, type StructShape, struct } from '../components';
import { type Value } from '../schema';
import { string } from '../values';

/**
 * Values related to the failure struct.
 *
 * @internal
 */
type FailureValues = {
  /**
   * The message of the failure.
   */
  message: Value<string, never>;

  /**
   * The origin of the failure.
   */
  origin: Value<string, never>;
};

/**
 * The failure struct shape type.
 *
 * @typeParam Code - The code of the failure.
 *
 * @public
 */
type Failure<Code extends string> = StructShape<FailureValues, Code>;

/**
 * The failure struct builder type.
 *
 * @typeParam Code - The code of the failure.
 *
 * @internal
 */
type FailureBuilder<Code extends string> = Struct<'Failure', Failure<Code>>;

/**
 * Create a failure builder with the given code.
 *
 * @remarks
 * A failure is a struct component with more detailed information about an error.
 * Useful for more explicit error handling for expected errors. For runtime error handling
 * use `Panic` instead.
 *
 * @typeParam Code - The code of the failure.
 *
 * @param code - The code of the failure.
 * @returns A failure builder.
 *
 * @public
 */
const failure = <Code extends string>(code: Code) => {
  // The failure has always the same struct values.
  const failureStruct = struct('Failure', {
    message: string(),
    origin: string(),
  });

  return failureStruct(code) as unknown as FailureBuilder<Code>;
};

export { failure };
export type { Failure };
