/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { builder, err, ok } from '@mixor/core';

// Regular expressions for different data types (from Zod source code).
const bigint = /^\d+n?$/;
const integer = /^\d+$/;
const number = /^-?\d+(?:\.\d+)?/i;
const boolean = /true|false/i;
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const numeric = /^[0-9]+$/;
const hexadecimal = /^[0-9a-fA-F]+$/;
const base64 = /^[A-Za-z0-9+/]+={0,2}$/;
const date = /^\d{4}-\d{2}-\d{2}$/;
const dateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})?$/;
const time = /^\d{2}:\d{2}:\d{2}$/;
// https://blog.stevenlevithan.com/archives/validate-phone-number#r4-3 (regex sans spaces)
const phoneNumber = /^\+(?:[0-9]){6,14}[0-9]$/;
const emoji = /^(\p{Extended_Pictographic}|\p{Emoji_Component})+$/u;
const rgba = /^rgba?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*([01]|0\.\d+)\)$/;
const rgb = /^rgb?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/;
const alpha = /^[a-zA-Z]+$/;
const alphaNumeric = /^[a-zA-Z0-9]+$/;
const lowerCase = /^[a-z]+$/;
const upperCase = /^[A-Z]+$/;
const capitalized = /^[A-Z][a-z]*$/;

/**
 * Coerces a value to a string.
 * It uses the `String` function to convert the value to a string.
 *
 * @param value - The value to coerce.
 * @returns The coerced string value.
 *
 * @example
 * ```ts
 * // string-001: Coerce string value.
 * const result = coerce('hello');
 * // result: ok('hello').
 * ```
 *
 * @example
 * ```ts
 * // string-002: Coerce number to string.
 * const result = coerce(123);
 * // result: ok('123').
 * ```
 */
const coerce = (value: unknown) => (typeof value !== 'string' ? ok(String(value)) : ok(value));

/**
 * Validates that the value is a string.
 *
 * @param value - The unknown value to validate.
 * @returns A result indicating whether the value is a string.
 *
 * @example
 * ```ts
 * // string-003: Validate string value.
 * const result = isString('hello');
 * // result: ok('hello').
 * ```
 *
 * @example
 * ```ts
 * // string-004: Reject number value.
 * const result = isString(1.23);
 * // result: err('NOT_STRING').
 * ```
 *
 * @example
 * ```ts
 * // string-005: Reject boolean value.
 * const result = isString(true);
 * // result: err('NOT_STRING').
 * ```
 *
 * @example
 * ```ts
 * // string-006: Reject null value.
 * const result = isString(null);
 * // result: err('NOT_STRING').
 * ```
 *
 * @example
 * ```ts
 * // string-007: Reject undefined value.
 * const result = isString(undefined);
 * // result: err('NOT_STRING').
 * ```
 *
 * @example
 * ```ts
 * // string-008: Reject object value.
 * const result = isString({});
 * // result: err('NOT_STRING').
 * ```
 *
 * @example
 * ```ts
 * // string-009: Reject array value.
 * const result = isString([]);
 * // result: err('NOT_STRING').
 * ```
 *
 * @public
 */
const isString = (value: unknown) => (typeof value === 'string' ? ok(value) : err('NOT_STRING'));

/**
 * Validates that the value is not empty.
 *
 * @param value - The string value to validate.
 * @returns A result indicating whether the value is not empty.
 *
 * @example
 * ```ts
 * // string-010: Validate non-empty string.
 * const result = isNotEmpty('hello');
 * // result: ok('hello').
 * ```
 *
 * @example
 * ```ts
 * // string-011: Reject empty string.
 * const result = isNotEmpty('');
 * // result: err('IS_EMPTY').
 * ```
 *
 * @public
 */
const isNotEmpty = (value: string) => (value.trim().length !== 0 ? ok(value) : err('IS_EMPTY'));

/**
 * Validates that the value has a minimum length.
 *
 * @param minLength - The minimum length of the value.
 * @returns A result indicating whether the value has a minimum length.
 *
 * @example
 * ```ts
 * // string-012: Validate string with minimum length.
 * const result = hasMinLength(10)('hello world');
 * // result: ok('hello world').
 * ```
 *
 * @example
 * ```ts
 * // string-013: Reject string with insufficient length.
 * const result = hasMinLength(10)('short');
 * // result: err('TOO_SHORT').
 * ```
 *
 * @public
 */
const hasMinLength = (minLength: number) => (value: string) =>
  value.length >= minLength ? ok(value) : err('TOO_SHORT');

/**
 * Validates that the value has a maximum length.
 *
 * @param maxLength - The maximum length of the value.
 * @returns A result indicating whether the value has a maximum length.
 *
 * @example
 * ```ts
 * // string-014: Validate string with maximum length.
 * const result = hasMaxLength(10)('short');
 * // result: ok('short').
 * ```
 *
 * @example
 * ```ts
 * // string-015: Reject string exceeding maximum length.
 * const result = hasMaxLength(10)('too long string');
 * // result: err('TOO_LONG').
 * ```
 *
 * @public
 */
const hasMaxLength = (maxLength: number) => (value: string) =>
  value.length <= maxLength ? ok(value) : err('TOO_LONG');

/**
 * Validates that the value contains a value from a list.
 *
 * @param list - The list of values to check.
 * @returns A result indicating whether the value contains a value from the list.
 *
 * @example
 * ```ts
 * // string-016: Validate string contained in list.
 * const result = contains(['hello', 'world'])('hello');
 * // result: ok('hello').
 * ```
 *
 * @example
 * ```ts
 * // string-017: Reject string not contained in list.
 * const result = contains(['hello', 'world'])('other');
 * // result: err('NOT_CONTAIN').
 * ```
 *
 * @public
 */
const contains = (list: string[]) => (value: string) =>
  list.includes(value) ? ok(value) : err('NOT_CONTAIN');

/**
 * Validates that the value matches a regular expression.
 *
 * @param pattern - The regular expression to match.
 * @returns A result indicating whether the value matches the regular expression.
 *
 * @example
 * ```ts
 * const result = matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)('hello-world'); // ok('hello-world').
 * const result = matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)('Hello World'); // err('NOT_MATCH').
 * ```
 *
 * @public
 */
const matches = (pattern: RegExp) => (value: string) =>
  pattern.test(value) ? ok(value) : err('NOT_MATCH');

/**
 * Validates that the value is a valid slug.
 *
 * @param value - The string value to validate.
 * @returns A result indicating whether the value is a valid slug.
 *
 * @example
 * ```ts
 * const result = isSlug('hello-world'); // ok('hello-world').
 * const result = isSlug('Hello World'); // err('INVALID_SLUG').
 * ```
 *
 * @public
 */
const isSlug = (value: string) => (slug.test(value) ? ok(value) : err('INVALID_SLUG'));

/**
 * Validates that the value is a numeric string.
 *
 * @param value - The string value to validate.
 * @returns A result indicating whether the value is a numeric string.
 *
 * @example
 * ```ts
 * const result = isNumeric('1234567890'); // ok('1234567890').
 * const result = isNumeric('123abc'); // err('NOT_NUMERIC').
 * ```
 *
 * @public
 */
const isNumeric = (value: string) => (numeric.test(value) ? ok(value) : err('NOT_NUMERIC'));

/**
 * Validates that the value is a valid hexadecimal string.
 *
 * @param value - The string value to validate.
 * @returns A result indicating whether the value is a valid hexadecimal string.
 *
 * @example
 * ```ts
 * const result = isHexadecimal('FFAA00'); // ok('FFAA00').
 * const result = isHexadecimal('FFAA00GG'); // err('NOT_HEXADECIMAL').
 * ```
 *
 * @public
 */
const isHexadecimal = (value: string) =>
  hexadecimal.test(value) ? ok(value) : err('NOT_HEXADECIMAL');

/**
 * Validates that the value is a valid base64 string.
 *
 * @param value - The string value to validate.
 * @returns A result indicating whether the value is a valid base64 string.
 *
 * @example
 * ```ts
 * const result = isBase64('SGVsbG8gV29ybGQ='); // ok('SGVsbG8gV29ybGQ=').
 * const result = isBase64('invalid-base64'); // err('NOT_BASE64').
 * ```
 *
 * @public
 */
const isBase64 = (value: string) => (base64.test(value) ? ok(value) : err('NOT_BASE64'));

/**
 * Validates that the value is a valid date.
 *
 * @param value - The string value to validate.
 * @returns A result indicating whether the value is a valid date.
 *
 * @example
 * ```ts
 * const result = isDate('2021-01-01'); // ok('2021-01-01').
 * const result = isDate('invalid-date'); // err('INVALID_DATE').
 * ```
 *
 * @public
 */
const isDate = (value: string) => (date.test(value) ? ok(value) : err('INVALID_DATE'));

/**
 * Validates that the value is a valid date and time.
 *
 * @param value - The string value to validate.
 * @returns A result indicating whether the value is a valid date and time.
 *
 * @example
 * ```ts
 * const result = isDateTime('2021-01-01T12:34:56'); // ok('2021-01-01T12:34:56').
 * const result = isDateTime('2021-01-01 12:34:56'); // ok('2021-01-01 12:34:56').
 * const result = isDateTime('2020-01-01T00:00:00+02:00'); // ok('2020-01-01T00:00:00+02:00').
 * const result = isDateTime('2020-01-01T00:00:00Z'); // ok('2020-01-01T00:00:00Z').
 * const result = isDateTime('invalid-datetime'); // err('INVALID_DATE_TIME').
 * ```
 *
 * @public
 */
const isDateTime = (value: string) => (dateTime.test(value) ? ok(value) : err('INVALID_DATE_TIME'));

/**
 * Validates that the value is a valid time.
 *
 * @param value - The string value to validate.
 * @returns A result indicating whether the value is a valid time.
 *
 * @example
 * ```ts
 * const result = isTime('12:34:56'); // ok('12:34:56').
 * const result = isTime('invalid-time'); // err('INVALID_TIME').
 * ```
 *
 * @public
 */
const isTime = (value: string) => (time.test(value) ? ok(value) : err('INVALID_TIME'));

/**
 * Validates that the value is a valid phone number.
 *
 * @param value - The string value to validate.
 * @returns A result indicating whether the value is a valid phone number.
 *
 * @example
 * ```ts
 * const result = isPhoneNumber('+1234567890'); // ok('+1234567890').
 * const result = isPhoneNumber('invalid-phone'); // err('INVALID_PHONE_NUMBER').
 * ```
 *
 * @public
 */
const isPhoneNumber = (value: string) =>
  phoneNumber.test(value) ? ok(value) : err('INVALID_PHONE_NUMBER');

/**
 * Validates that the value is a valid emoji.
 *
 * @privateRemarks
 * References:
 * - https://thekevinscott.com/emojis-in-javascript/#writing-a-regular-expression
 * - https://github.com/colinhacks/zod/blob/3782fe29920c311984004c350b9fefaf0ae4c54a/src/types.ts#L666C20-L666C75
 *
 * @param value - The string value to validate.
 * @returns A result indicating whether the value is a valid emoji.
 *
 * @example
 * ```ts
 * const result = isEmoji('👍'); // ok('👍').
 * const result = isEmoji('not-emoji'); // err('INVALID_EMOJI').
 * ```
 *
 * @public
 */
const isEmoji = (value: string) => (emoji.test(value) ? ok(value) : err('INVALID_EMOJI'));

/**
 * Validates that the value is a valid RGBA color.
 *
 * @param value - The string value to validate.
 * @returns A result indicating whether the value is a valid RGBA color.
 *
 * @example
 * ```ts
 * const result = isRGBA('rgba(255, 170, 0, 0.1)'); // ok('rgba(255, 170, 0, 0.1)').
 * const result = isRGBA('invalid-rgba'); // err('INVALID_RGBA').
 * ```
 *
 * @public
 */
const isRGBA = (value: string) => (rgba.test(value) ? ok(value) : err('INVALID_RGBA'));

/**
 * Validates that the value is a valid RGB color.
 *
 * @param value - The string value to validate.
 * @returns A result indicating whether the value is a valid RGB color.
 *
 * @example
 * ```ts
 * const result = isRGB('rgb(0, 0, 0)'); // ok('rgb(0, 0, 0)').
 * const result = isRGB('invalid-rgb'); // err('INVALID_RGB').
 * ```
 *
 * @public
 */
const isRGB = (value: string) => (rgb.test(value) ? ok(value) : err('INVALID_RGB'));

/**
 * Validates that the value contains only alphabetic characters.
 *
 * @param value - The string value to validate.
 * @returns A result indicating whether the value contains only letters.
 *
 * @example
 * ```ts
 * const result = isAlpha('Hello'); // ok('Hello').
 * const result = isAlpha('Hello123'); // err('NOT_ALPHA').
 * const result = isAlpha('Hello World'); // err('NOT_ALPHA').
 * ```
 *
 * @public
 */
const isAlpha = (value: string) => (alpha.test(value) ? ok(value) : err('NOT_ALPHA'));

/**
 * Validates that the value contains only alphanumeric characters.
 *
 * @param value - The string value to validate.
 * @returns A result indicating whether the value contains only letters and numbers.
 *
 * @example
 * ```ts
 * const result = isAlphaNumeric('Hello123'); // ok('Hello123').
 * const result = isAlphaNumeric('Hello 123'); // err('NOT_ALPHANUMERIC').
 * const result = isAlphaNumeric('Hello@123'); // err('NOT_ALPHANUMERIC').
 * ```
 *
 * @public
 */
const isAlphaNumeric = (value: string) =>
  alphaNumeric.test(value) ? ok(value) : err('NOT_ALPHANUMERIC');

/**
 * Validates that the value contains only lowercase letters.
 *
 * @param value - The string value to validate.
 * @returns A result indicating whether the value contains only lowercase letters.
 *
 * @example
 * ```ts
 * const result = isLowerCase('hello'); // ok('hello').
 * const result = isLowerCase('Hello'); // err('NOT_LOWERCASE').
 * const result = isLowerCase('hello123'); // err('NOT_LOWERCASE').
 * ```
 *
 * @public
 */
const isLowerCase = (value: string) => (lowerCase.test(value) ? ok(value) : err('NOT_LOWERCASE'));

/**
 * Validates that the value contains only uppercase letters.
 *
 * @param value - The string value to validate.
 * @returns A result indicating whether the value contains only uppercase letters.
 *
 * @example
 * ```ts
 * const result = isUpperCase('HELLO'); // ok('HELLO').
 * const result = isUpperCase('Hello'); // err('NOT_UPPERCASE').
 * const result = isUpperCase('HELLO123'); // err('NOT_UPPERCASE').
 * ```
 *
 * @public
 */
const isUpperCase = (value: string) => (upperCase.test(value) ? ok(value) : err('NOT_UPPERCASE'));

/**
 * Validates that the value is capitalized (first letter uppercase, rest lowercase).
 *
 * @param value - The string value to validate.
 * @returns A result indicating whether the value is properly capitalized.
 *
 * @example
 * ```ts
 * const result = isCapitalized('Hello'); // ok('Hello').
 * const result = isCapitalized('hello'); // err('NOT_CAPITALIZED').
 * const result = isCapitalized('HELLO'); // err('NOT_CAPITALIZED').
 * const result = isCapitalized('Hello World'); // err('NOT_CAPITALIZED').
 * ```
 *
 * @public
 */
const isCapitalized = (value: string) =>
  capitalized.test(value) ? ok(value) : err('NOT_CAPITALIZED');

/**
 * Validates that the value starts with a specific prefix.
 *
 * @param prefix - The prefix to check for.
 * @returns A result indicating whether the value starts with the prefix.
 *
 * @example
 * ```ts
 * const result = isStartsWith('Hello')('Hello World'); // ok('Hello World').
 * const result = isStartsWith('Hello')('World Hello'); // err('NOT_STARTS_WITH').
 * ```
 *
 * @public
 */
const isStartsWith = (prefix: string) => (value: string) =>
  value.startsWith(prefix) ? ok(value) : err('NOT_STARTS_WITH');

/**
 * Validates that the value ends with a specific suffix.
 *
 * @param suffix - The suffix to check for.
 * @returns A result indicating whether the value ends with the suffix.
 *
 * @example
 * ```ts
 * const result = isEndsWith('World')('Hello World'); // ok('Hello World').
 * const result = isEndsWith('World')('World Hello'); // err('NOT_ENDS_WITH').
 * ```
 *
 * @public
 */
const isEndsWith = (suffix: string) => (value: string) =>
  value.endsWith(suffix) ? ok(value) : err('NOT_ENDS_WITH');

const isBigInt = (value: string) => (bigint.test(value) ? ok(BigInt(value)) : err('NOT_BIGINT'));

const isInteger = (value: string) =>
  integer.test(value) ? ok(Number.parseInt(value)) : err('NOT_INTEGER');

const isBoolean = (value: string) =>
  boolean.test(value) ? ok(value === 'true') : err('NOT_BOOLEAN');

const isNumber = (value: string) =>
  number.test(value) ? ok(Number.parseFloat(value)) : err('NOT_NUMBER');

/**
 * Creates a validation chain for string values using the builder pattern.
 *
 * This function creates a type-safe builder that allows chaining multiple string validations
 * together, providing a fluent API similar to Zod but compatible with the Result type.
 *
 * @returns A string validation builder.
 *
 * @example
 * ```ts
 * // Basic string validation.
 * const emailValidator = str
 *   .isString()
 *   .isNotEmpty()
 *   .isEmail()
 *   .build();
 *
 * const result = emailValidator('me@example.com'); // ok('me@example.com').
 * const error = emailValidator('invalid'); // err('INVALID_EMAIL').
 * ```
 *
 * @example
 * ```ts
 * // String validation with length constraints.
 * const passwordValidator = str
 *   .isString()
 *   .hasMinLength(8)
 *   .hasMaxLength(50)
 *   .matches(/[A-Z]/) // Must contain uppercase
 *   .matches(/[a-z]/) // Must contain lowercase
 *   .matches(/\d/) // Must contain digit
 *   .build();
 *
 * const result = passwordValidator('SecurePass123'); // ok('SecurePass123').
 * const error = passwordValidator('weak'); // err('TOO_SHORT').
 * ```
 *
 * @example
 * ```ts
 * // String validation with different error modes.
 * const userValidator = str
 *   .isString()
 *   .isNotEmpty()
 *   .isEmail()
 *   .build('all'); // Collect all errors
 *
 * const result = userValidator(''); // err(['IS_EMPTY', 'INVALID_EMAIL']).
 * ```
 *
 * @public
 */
const str = builder(
  {
    coerce,
    isString,
    isNotEmpty,
    hasMinLength,
    hasMaxLength,
    contains,
    matches,
    isSlug,
    isNumeric,
    isHexadecimal,
    isBase64,
    isDate,
    isDateTime,
    isTime,
    isPhoneNumber,
    isEmoji,
    isRGBA,
    isRGB,
    isAlpha,
    isAlphaNumeric,
    isLowerCase,
    isUpperCase,
    isCapitalized,
    isStartsWith,
    isEndsWith,
    isBigInt,
    isInteger,
    isBoolean,
    isNumber,
  },
  [
    // Repeatable functions that can be called multiple times
    'hasMinLength',
    'hasMaxLength',
    'matches',
    'contains',
    'isStartsWith',
    'isEndsWith',
  ],
);

export {
  str,
  coerce,
  isString,
  isNotEmpty,
  hasMinLength,
  hasMaxLength,
  contains,
  matches,
  isSlug,
  isNumeric,
  isHexadecimal,
  isBase64,
  isDate,
  isDateTime,
  isTime,
  isPhoneNumber,
  isEmoji,
  isRGBA,
  isRGB,
  isAlpha,
  isAlphaNumeric,
  isLowerCase,
  isUpperCase,
  isCapitalized,
  isStartsWith,
  isEndsWith,
  isBigInt,
  isInteger,
  isBoolean,
  isNumber,
};
