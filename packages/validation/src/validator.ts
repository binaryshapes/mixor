/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Result } from '@daikit/result';

/**
 * Represents a validator function that takes an input and returns a Result.
 *
 * @typeParam T - The type of the input value.
 * @typeParam E - The type of the error message.
 * @param input - The input value to validate.
 * @returns A Result indicating the success or failure of the validation.
 *
 * @public
 */
type Validator<T, E extends string> = (input: T) => Result<void, E>;

export type { Validator };
