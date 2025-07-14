/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Result, err, ok } from '@mixor/core';

/**
 * A regex for any UUID-like identifier: 8-4-4-4-12 hex pattern
 * @param version - The version of the UUID to generate.
 * @returns A regex for the UUID.
 *
 * @example
 * ```ts
 * const uuid = uuid();
 * ```
 *
 * @internal
 */
const uuid = (version?: number | undefined): RegExp =>
  !version
    ? /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000)$/
    : new RegExp(
        `^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`,
      );

// Based on Zod source code.
const ids = {
  guid: /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/,
  cuid: /^[cC][^\s-]{8,}$/,
  cuid2: /^[0-9a-z]+$/,
  ulid: /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/,
  xid: /^[0-9a-vA-V]{20}$/,
  ksuid: /^[A-Za-z0-9]{27}$/,
  nanoid: /^[a-zA-Z0-9_-]{21}$/,
  uuidv4: uuid(4),
  uuidv6: uuid(6),
  uuidv7: uuid(7),
};

/**
 * The type of the ID to validate.
 *
 * @internal
 */
type IdType = keyof typeof ids;

/**
 * Validates if the given string is a valid ID.
 *
 * @param type - The type of the ID to validate.
 * @returns A result indicating if the value is a valid ID.
 *
 * @example
 * ```ts
 * const nanoId = id('uuidv4')('123e4567-e89b-12d3-a456-426614174000');
 * ```
 *
 * @public
 */
const id =
  <T extends IdType, E extends string = Uppercase<T>>(type: T) =>
  (value: string): Result<string, `INVALID_${E}`> =>
    ids[type].test(value) ? ok(value) : err(`INVALID_${type.toUpperCase()}` as `INVALID_${E}`);

/**
 * Validates if the given string is a valid GUID.
 * Use this function for tree-shaking purposes.
 *
 * @param value - The value to validate.
 * @returns A result indicating if the value is a valid GUID.
 *
 * @example
 * ```ts
 * // id-001: Basic GUID validation.
 * const result = guid('550e8400-e29b-41d4-a716-446655440000');
 * // result: ok('550e8400-e29b-41d4-a716-446655440000')
 * ```
 *
 * @example
 * ```ts
 * // id-002: Invalid GUID validation.
 * const result = guid('invalid-guid');
 * // result: err('INVALID_GUID')
 * ```
 *
 * @public
 */
const guid = id('guid');

/**
 * Validates if the given string is a valid CUID.
 * Use this function for tree-shaking purposes.
 *
 * @param value - The value to validate.
 * @returns A result indicating if the value is a valid CUID.
 *
 * @example
 * ```ts
 * // id-003: Basic CUID validation.
 * const result = cuid('ch72gsb320000udocl363eofy');
 * // result: ok('ch72gsb320000udocl363eofy')
 * ```
 *
 * @example
 * ```ts
 * // id-004: Invalid CUID validation.
 * const result = cuid('invalid-cuid');
 * // result: err('INVALID_CUID')
 * ```
 *
 * @public
 */
const cuid = id('cuid');

/**
 * Validates if the given string is a valid CUID2.
 * Use this function for tree-shaking purposes.
 *
 * @param value - The value to validate.
 * @returns A result indicating if the value is a valid CUID2.
 *
 * @example
 * ```ts
 * // id-005: Basic CUID2 validation.
 * const result = cuid2('tfp0qj8q8q8q8q8q8q8q8q');
 * // result: ok('tfp0qj8q8q8q8q8q8q8q8q')
 * ```
 *
 * @example
 * ```ts
 * // id-006: Invalid CUID2 validation.
 * const result = cuid2('invalid-cuid2');
 * // result: err('INVALID_CUID2')
 * ```
 *
 * @public
 */
const cuid2 = id('cuid2');

/**
 * Validates if the given string is a valid ULID.
 * Use this function for tree-shaking purposes.
 *
 * @param value - The value to validate.
 * @returns A result indicating if the value is a valid ULID.
 *
 * @example
 * ```ts
 * // id-007: Basic ULID validation.
 * const result = ulid('01ARZ3NDEKTSV4RRFFQ69G5FAV');
 * // result: ok('01ARZ3NDEKTSV4RRFFQ69G5FAV')
 * ```
 *
 * @example
 * ```ts
 * // id-008: Invalid ULID validation.
 * const result = ulid('invalid-ulid');
 * // result: err('INVALID_ULID')
 * ```
 *
 * @public
 */
const ulid = id('ulid');

/**
 * Validates if the given string is a valid XID.
 * Use this function for tree-shaking purposes.
 *
 * @param value - The value to validate.
 * @returns A result indicating if the value is a valid XID.
 *
 * @example
 * ```ts
 * // id-009: Basic XID validation.
 * const result = xid('9m4e2mr0ui3e8a215n4g');
 * // result: ok('9m4e2mr0ui3e8a215n4g')
 * ```
 *
 * @example
 * ```ts
 * // id-010: Invalid XID validation.
 * const result = xid('invalid-xid');
 * // result: err('INVALID_XID')
 * ```
 *
 * @public
 */
const xid = id('xid');

/**
 * Validates if the given string is a valid KSUID.
 * Use this function for tree-shaking purposes.
 *
 * @param value - The value to validate.
 * @returns A result indicating if the value is a valid KSUID.
 *
 * @example
 * ```ts
 * // id-011: Basic KSUID validation.
 * const result = ksuid('2zsoKss5fh8cxz6RqvW5JnAsRrL');
 * // result: ok('2zsoKss5fh8cxz6RqvW5JnAsRrL')
 * ```
 *
 * @example
 * ```ts
 * // id-012: Invalid KSUID validation.
 * const result = ksuid('invalid-ksuid');
 * // result: err('INVALID_KSUID')
 * ```
 *
 * @public
 */
const ksuid = id('ksuid');
const nanoid = id('nanoid');

/**
 * Validates if the given string is a valid UUID v4.
 * Use this function for tree-shaking purposes.
 *
 * @param value - The value to validate.
 * @returns A result indicating if the value is a valid UUID v4.
 *
 * @example
 * ```ts
 * const uuidv4 = uuidv4('d89f8c77-90f3-4ab0-90dd-3c1bd3293870');
 * // ok('d89f8c77-90f3-4ab0-90dd-3c1bd3293870')
 *
 * const uuidv4 = uuidv4('123e4567-e89b-12d3-a456');
 * // err('INVALID_UUIDV4')
 * ```
 *
 * @public
 */
const uuidv4 = id('uuidv4');
const uuidv6 = id('uuidv6');
const uuidv7 = id('uuidv7');

export { id, guid, cuid, cuid2, ulid, xid, ksuid, nanoid, uuidv4, uuidv6, uuidv7 };
