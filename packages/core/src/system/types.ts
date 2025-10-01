/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Any, FlatArray } from '../utils';

/**
 * The error mode to apply.
 *
 * @public
 */
type ErrorMode = 'strict' | 'all';

/**
 * Helper to apply the error mode for a given error type.
 *
 * @typeParam E - The errors type.
 * @typeParam Mode - The error mode.
 * @returns The errors type.
 *
 * @public
 */
type ApplyErrorMode<E, Mode extends ErrorMode, FE = FlatArray<E>> = Mode extends 'strict'
  ? Exclude<FE, Array<Any>>
  : FE[];

/**
 * Extracts the type of a component.
 *
 * @typeParam T - The component to extract the type from.
 * @returns The type of the component.
 *
 * @public
 */
type TypeOf<T> = T extends { Type: infer U; Tag: string } ? U : never;

export type { TypeOf };

export type { ApplyErrorMode, ErrorMode };
