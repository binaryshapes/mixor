/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Any, FlatArray } from './generics';

/**
 * The error mode to apply to the errors.
 *
 * @public
 */
type ErrorMode = 'strict' | 'all';

/**
 * Applies the error mode to the errors.
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

export type { ErrorMode, ApplyErrorMode };
