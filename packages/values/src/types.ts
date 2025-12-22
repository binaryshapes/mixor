/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Validator } from '@nuxo/components';
import type { n } from '@nuxo/core';

/**
 * Extracts the error types from a tuple of validators.
 *
 * @typeParam V - The tuple of validators.
 *
 * @internal
 */
type ValidatorsErrorTypes<V extends readonly Validator<n.Any, n.Any>[]> = V extends readonly []
  ? never
  : V[number] extends Validator<n.Any, infer E> ? E
  : never;

export type { ValidatorsErrorTypes };
