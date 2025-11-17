/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { config } from './config.ts';
import { logger } from './logger.ts';

/**
 * A panic represents a runtime error that is not recoverable.
 * It is used to signal that the application is in an invalid state and should be terminated.
 * All core components should throw a panic error when they are in an invalid state.
 *
 * @param S - The scope of the panic.
 * @param T - The tag of the panic.
 *
 * @internal
 */
class PanicError<S extends string, T extends string> extends Error {
  /**
   * Unique code of the panic error.
   *
   * @remarks
   * This a convenient way to identify the panic error origin, for instance in error handling
   * with pattern matching.
   */
  public readonly code: `${S}.${T}`;

  /**
   * Hint of the panic error.
   *
   * @remarks
   * This is a hint to help the user understand the panic error.
   */
  public readonly hint?: string;

  constructor(scope: S, tag: T, message: string, hint?: string) {
    // The error message will include both the message and the hint.
    super(`${message} ${hint ? `${hint}` : ''}`);
    this.code = `${scope}.${tag}`;
    this.hint = hint;

    if (config.get('NUXO_DEBUG')) {
      // Print the panic error to the console.
      logger.error(`${tag}: ${message}`);

      // The hint will be printed as a debug message.
      if (hint) {
        logger.hint(`Hint: ${hint}`);
      }
    }
  }

  /**
   * Returns a JSON representation of the panic error.
   * @returns A JSON representation of the panic error.
   */
  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
    };
  }
}

/**
 * Factory function to create a panic error for the given scope.
 *
 * @remarks
 * Useful to create panic errors with a specific scope ensuring type safety and consistency.
 *
 * @param scope - The scope of the panic.
 * @returns A panic error class for the given scope.
 *
 * @public
 */
const panic = <S extends string, T extends string>(scope: S) =>
  class Panic extends PanicError<S, T> {
    constructor(tag: T, message: string, hint?: string) {
      super(scope, tag, message, hint);
    }
  };

export { panic, PanicError };
