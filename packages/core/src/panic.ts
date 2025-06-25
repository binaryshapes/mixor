/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * A panic key is a string that is used to identify a panic error.
 * It is used to identify the scope and tag of the panic error.
 */
type PanicKey = Uppercase<string>;

/**
 * A panic represents a runtime error that is not recoverable.
 * It is used to signal that the application is in an invalid state and should be terminated.
 * All core components should throw a panic error when they are in an invalid state.
 *
 * @param S - The scope of the panic.
 * @param T - The tag of the panic.
 *
 * @example
 * ```ts
 * throw new PanicError('AUTH', 'INVALID_TOKEN', 'Token is invalid');
 * ```
 */
class PanicError<S extends PanicKey, T extends PanicKey> extends Error {
  readonly key: `${S}:${T}`;
  constructor(scope: S, tag: T, message: string) {
    super(message);
    this.name = 'Panic';
    this.key = `${scope}:${tag}`;
  }

  /**
   * Returns a JSON representation of the panic error.
   * @returns A JSON representation of the panic error.
   */
  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      key: this.key,
    };
  }
}

/**
 * Creates a panic error factory for the given scope.
 * Useful to create panic errors with a specific scope ensuring type safety.
 *
 * @param scope - The scope of the panic.
 * @returns A panic error factory for the given scope.
 *
 * @example
 * ```ts
 * class ContainerError extends Panic<
 *   'CONTAINER',
 *   | 'NO_ADAPTER_BOUND'
 *   | 'MISSING_DEPENDENCY'
 *   | 'INVALID_DEFINITION_TYPE'
 *   | 'CANNOT_OVERRIDE_UNBOUND_PORT'
 * >('CONTAINER') {}
 * ```
 *
 * @public
 */
function Panic<S extends PanicKey, T extends PanicKey>(scope: S) {
  return class extends PanicError<S, T> {
    constructor(tag: T, message: string) {
      super(scope, tag, message);
    }
  };
}

export { Panic, PanicError };
