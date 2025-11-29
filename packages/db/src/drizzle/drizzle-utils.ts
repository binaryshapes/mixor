/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { n } from '@nuxo/core';
import { DrizzleError, DrizzleQueryError } from 'drizzle-orm';
import { DatabaseError } from 'pg';

/**
 * Type for the result of a Drizzle ORM error handler.
 *
 * @internal
 */
type ErrorHandlerResult = {
  message: string;
  constraint: string | null;
  code: string;
};

/**
 * Type for a function that handles a Drizzle ORM error.
 * @param error The error object from Drizzle.
 * @returns A result object with the main error message, constraint name (if applicable),
 * and error code.
 *
 * @internal
 */
type ErrorHandler = (error: DatabaseError) => ErrorHandlerResult;

/**
 * Object containing the error codes for Drizzle ORM errors.
 *
 * @internal
 */
const DrizzlePostgresErrorCodes = {
  UNIQUE_CONSTRAINT_ERROR_CODE: '23505',
  FOREIGN_KEY_VIOLATION_ERROR_CODE: '23503',
  INVALID_FORMAT_ERROR_CODE: '22P02',
  CHECK_CONSTRAINT_VIOLATION_ERROR_CODE: '23514',
  REQUIRED_FIELD_MISSING_ERROR_CODE: '23502',
  UNDEFINED_COLUMN_REFERENCED_ERROR_CODE: '42703',
  SYNTAX_ERROR_CODE: '42601',
  TRANSACTION_FAILED_ERROR_CODE: '25000',
  DATABASE_CONNECTION_FAILED_ERROR_CODE: '08006',
  REFERENCED_TABLE_NOT_FOUND_ERROR_CODE: '42P01',
  TRANSACTION_SERIALIZATION_FAILURE_ERROR_CODE: '40001',
  DEFAULT_ERROR_CODE: 'default',
} as const;

/**
 * Type for the error codes of Drizzle PostgreSQL errors.
 *
 * @internal
 */
type DrizzlePostgresErrorCodes =
  typeof DrizzlePostgresErrorCodes[keyof typeof DrizzlePostgresErrorCodes];

/**
 * Maps PostgreSQL error codes to specific handler functions.
 *
 * Ref: https://github.com/drizzle-team/drizzle-orm/discussions/916#discussioncomment-14498892
 *
 * @internal
 */
const PostgresErrorHandlers: Record<DrizzlePostgresErrorCodes, ErrorHandler> = {
  [DrizzlePostgresErrorCodes.UNIQUE_CONSTRAINT_ERROR_CODE]: (error) => ({
    message: 'A duplicate entry was found for a unique field.',
    constraint: error.constraint || null,
    code: DrizzlePostgresErrorCodes.UNIQUE_CONSTRAINT_ERROR_CODE,
  }),
  [DrizzlePostgresErrorCodes.FOREIGN_KEY_VIOLATION_ERROR_CODE]: (error) => ({
    message: 'A foreign key violation occurred. The record you are trying to link does not exist.',
    constraint: error.constraint || null,
    code: DrizzlePostgresErrorCodes.FOREIGN_KEY_VIOLATION_ERROR_CODE,
  }),
  [DrizzlePostgresErrorCodes.INVALID_FORMAT_ERROR_CODE]: () => ({
    message: 'The data provided is in an invalid format (e.g., not a valid UUID).',
    constraint: null,
    code: DrizzlePostgresErrorCodes.INVALID_FORMAT_ERROR_CODE,
  }),
  [DrizzlePostgresErrorCodes.CHECK_CONSTRAINT_VIOLATION_ERROR_CODE]: (error) => ({
    message: 'A check constraint was violated.',
    constraint: error.constraint || null,
    code: DrizzlePostgresErrorCodes.CHECK_CONSTRAINT_VIOLATION_ERROR_CODE,
  }),
  [DrizzlePostgresErrorCodes.REQUIRED_FIELD_MISSING_ERROR_CODE]: (error) => ({
    message: `A required field is missing. The column '${error.column}' cannot be null.`,
    constraint: error.column || null,
    code: DrizzlePostgresErrorCodes.REQUIRED_FIELD_MISSING_ERROR_CODE,
  }),
  [DrizzlePostgresErrorCodes.UNDEFINED_COLUMN_REFERENCED_ERROR_CODE]: (error) => ({
    message: 'An undefined column was referenced in the query.',
    constraint: error.column || null,
    code: DrizzlePostgresErrorCodes.UNDEFINED_COLUMN_REFERENCED_ERROR_CODE,
  }),
  [DrizzlePostgresErrorCodes.SYNTAX_ERROR_CODE]: () => ({
    message: "There's a syntax error in the database query.",
    constraint: null,
    code: DrizzlePostgresErrorCodes.SYNTAX_ERROR_CODE,
  }),
  [DrizzlePostgresErrorCodes.TRANSACTION_FAILED_ERROR_CODE]: () => ({
    message: 'Transaction failed: a data integrity issue occurred within a database transaction.',
    constraint: null,
    code: DrizzlePostgresErrorCodes.TRANSACTION_FAILED_ERROR_CODE,
  }),
  [DrizzlePostgresErrorCodes.DATABASE_CONNECTION_FAILED_ERROR_CODE]: () => ({
    message: 'Database connection failed. The database may be unavailable.',
    constraint: null,
    code: DrizzlePostgresErrorCodes.DATABASE_CONNECTION_FAILED_ERROR_CODE,
  }),
  [DrizzlePostgresErrorCodes.REFERENCED_TABLE_NOT_FOUND_ERROR_CODE]: () => ({
    message: 'A referenced table does not exist in the database.',
    constraint: null,
    code: DrizzlePostgresErrorCodes.REFERENCED_TABLE_NOT_FOUND_ERROR_CODE,
  }),
  [DrizzlePostgresErrorCodes.TRANSACTION_SERIALIZATION_FAILURE_ERROR_CODE]: () => ({
    message:
      'Transaction serialization failure. Please retry the transaction as it could not be completed due to concurrent modifications.',
    constraint: null,
    code: DrizzlePostgresErrorCodes.TRANSACTION_SERIALIZATION_FAILURE_ERROR_CODE,
  }),
  [DrizzlePostgresErrorCodes.DEFAULT_ERROR_CODE]: (error) => ({
    message: `A database error occurred: ${error.message}`,
    constraint: null,
    code: DrizzlePostgresErrorCodes.DEFAULT_ERROR_CODE,
  }),
};

/**
 * Extracts a user-friendly message and constraint from a Drizzle ORM error.
 * @param error The error object from Drizzle.
 * @returns An object with the main error message and constraint name (if applicable).
 *
 * @public
 */
function getDrizzlePostgresErrorMessage(
  error: unknown,
): ErrorHandlerResult {
  if (error instanceof DrizzleQueryError && error.cause instanceof DatabaseError) {
    const originalError = error.cause;
    const handler = PostgresErrorHandlers[
      originalError.code as DrizzlePostgresErrorCodes ??
        DrizzlePostgresErrorCodes.DEFAULT_ERROR_CODE
    ];

    if (handler) {
      return handler(originalError);
    }
  }

  // Fallback for generic Drizzle errors or other Error instances.
  if (error instanceof DrizzleError || error instanceof Error) {
    return {
      message: error.message || 'An unexpected error occurred.',
      constraint: null,
      code: DrizzlePostgresErrorCodes.DEFAULT_ERROR_CODE,
    };
  }

  // Final fallback for unknown error types.
  return {
    message: 'An unknown error occurred.',
    constraint: null,
    code: DrizzlePostgresErrorCodes.DEFAULT_ERROR_CODE,
  };
}

/**
 * Prints a Drizzle ORM error to the console.
 * @param error The error object from Drizzle.
 *
 * @public
 */
const debugDrizzleError = (error: ErrorHandlerResult): void => {
  n.logger.debug(
    `Drizzle error (${error.code}): ${error.message} ${
      error.constraint ? `(constraint: ${error.constraint})` : ''
    }`,
  );
};

export { debugDrizzleError, DrizzlePostgresErrorCodes, getDrizzlePostgresErrorMessage };
