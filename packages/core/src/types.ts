/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Component } from './component.ts';
import type { Any, FlatArray } from './generics.ts';

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
  : [FE];

/**
 * Helper type that ensures a type is a Component.
 * This will be `never` if the input is not a Component (e.g., primitives, functions, objects).
 * Used to enforce type safety at compile time.
 *
 * @public
 */
type EnsureComponent<T> = T extends Component<string, Any> ? T extends {
    Type: Any;
    Tag: Any;
    id: string;
    tag: string;
    keys: string[];
    refCount: number;
  } ? T
  : never
  : never;

export type { ApplyErrorMode, EnsureComponent, ErrorMode };
