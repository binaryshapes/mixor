/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
