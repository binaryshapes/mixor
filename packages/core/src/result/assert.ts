/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Any } from '../utils';
import { type Failure } from './failure';
import { type Result, err, ok } from './result';

/**
 * Creates a assert function that returns a result.
 *
 * @typeParam T - The type of the value to validate.
 * @typeParam E - The type of the error.
 * @param fn - The predicate function to validate the value.
 * @param error - The error to return if the predicate returns false.
 * @returns A assert function that returns a result.
 *
 * @public
 */
const assert =
  <T, E extends Failure<Any> | string>(fn: (v: T) => boolean, error: E) =>
  (v: T): Result<T, E> =>
    fn(v) ? ok(v) : err(error);

export { assert };
