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
 * // string-018: Validate string matching regex pattern.
 * const result = matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)('hello-world');
 * // result: ok('hello-world').
 * ```
 *
 * @example
 * ```ts
 * // string-019: Reject string not matching regex pattern.
 * const result = matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)('Hello World');
 * // result: err('NOT_MATCH').
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
 * // string-020: Validate valid slug.
 * const result = isSlug('my-awesome-blog-post-2024-with-special-characters');
 * // result: ok('my-awesome-blog-post-2024-with-special-characters').
 * ```
 *
 * @example
 * ```ts
 * // string-021: Reject invalid slug.
 * const result = isSlug('my--invalid-slug-with-double-dash$$$');
 * // result: err('INVALID_SLUG').
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
 * // string-022: Validate numeric string.
 * const result = isNumeric('1234567890');
 * // result: ok('1234567890').
 * ```
 *
 * @example
 * ```ts
 * // string-023: Reject non-numeric string.
 * const result = isNumeric('123abc');
 * // result: err('NOT_NUMERIC').
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
 * // string-024: Validate hexadecimal string.
 * const result = isHexadecimal('FFAA00');
 * // result: ok('FFAA00').
 * ```
 *
 * @example
 * ```ts
 * // string-025: Reject invalid hexadecimal string.
 * const result = isHexadecimal('FFAA00GG');
 * // result: err('NOT_HEXADECIMAL').
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
 * // string-026: Validate base64 string.
 * const result = isBase64('SGVsbG8gV29ybGQ=');
 * // result: ok('SGVsbG8gV29ybGQ=').
 * ```
 *
 * @example
 * ```ts
 * // string-027: Reject invalid base64 string.
 * const result = isBase64('invalid-base64');
 * // result: err('NOT_BASE64').
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
 * // string-028: Validate date string.
 * const result = isDate('2021-01-01');
 * // result: ok('2021-01-01').
 * ```
 *
 * @example
 * ```ts
 * // string-029: Reject invalid date string.
 * const result = isDate('invalid-date');
 * // result: err('INVALID_DATE').
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
 * // string-030: Validate date time string.
 * const result = isDateTime('2021-01-01T12:34:56');
 * // result: ok('2021-01-01T12:34:56').
 * ```
 *
 * @example
 * ```ts
 * // string-031: Reject invalid date time string.
 * const result = isDateTime('invalid-datetime');
 * // result: err('INVALID_DATE_TIME').
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
 * // string-032: Validate time string.
 * const result = isTime('12:34:56');
 * // result: ok('12:34:56').
 * ```
 *
 * @example
 * ```ts
 * // string-033: Reject invalid time string.
 * const result = isTime('invalid-time');
 * // result: err('INVALID_TIME').
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
 * // string-034: Validate phone number.
 * const result = isPhoneNumber('+1234567890');
 * // result: ok('+1234567890').
 * ```
 *
 * @example
 * ```ts
 * // string-035: Reject invalid phone number.
 * const result = isPhoneNumber('invalid-phone');
 * // result: err('INVALID_PHONE_NUMBER').
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
 * // string-036: Validate emoji.
 * const result = isEmoji('👍');
 * // result: ok('👍').
 * ```
 *
 * @example
 * ```ts
 * // string-037: Reject invalid emoji.
 * const result = isEmoji('not-emoji');
 * // result: err('INVALID_EMOJI').
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
 * // string-038: Validate RGBA color.
 * const result = isRGBA('rgba(255, 170, 0, 0.1)');
 * // result: ok('rgba(255, 170, 0, 0.1)').
 * ```
 *
 * @example
 * ```ts
 * // string-039: Reject invalid RGBA color.
 * const result = isRGBA('invalid-rgba');
 * // result: err('INVALID_RGBA').
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
 * // string-040: Validate RGB color.
 * const result = isRGB('rgb(0, 0, 0)');
 * // result: ok('rgb(0, 0, 0)').
 * ```
 *
 * @example
 * ```ts
 * // string-041: Reject invalid RGB color.
 * const result = isRGB('invalid-rgb');
 * // result: err('INVALID_RGB').
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
 * // string-042: Validate alphabetic string.
 * const result = isAlpha('Hello');
 * // result: ok('Hello').
 * ```
 *
 * @example
 * ```ts
 * // string-043: Reject string with numbers.
 * const result = isAlpha('Hello123');
 * // result: err('NOT_ALPHA').
 * ```
 *
 * @example
 * ```ts
 * // string-044: Reject string with spaces.
 * const result = isAlpha('Hello World');
 * // result: err('NOT_ALPHA').
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
 * // string-045: Validate alphanumeric string.
 * const result = isAlphaNumeric('Hello123');
 * // result: ok('Hello123').
 * ```
 *
 * @example
 * ```ts
 * // string-046: Reject string with spaces.
 * const result = isAlphaNumeric('Hello 123');
 * // result: err('NOT_ALPHANUMERIC').
 * ```
 *
 * @example
 * ```ts
 * // string-047: Reject string with symbols.
 * const result = isAlphaNumeric('Hello@123');
 * // result: err('NOT_ALPHANUMERIC').
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
 * // string-048: Validate lowercase string.
 * const result = isLowerCase('hello');
 * // result: ok('hello').
 * ```
 *
 * @example
 * ```ts
 * // string-049: Reject string with uppercase.
 * const result = isLowerCase('Hello');
 * // result: err('NOT_LOWERCASE').
 * ```
 *
 * @example
 * ```ts
 * // string-050: Reject string with numbers.
 * const result = isLowerCase('hello123');
 * // result: err('NOT_LOWERCASE').
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
 * // string-051: Validate uppercase string.
 * const result = isUpperCase('HELLO');
 * // result: ok('HELLO').
 * ```
 *
 * @example
 * ```ts
 * // string-052: Reject string with lowercase.
 * const result = isUpperCase('Hello');
 * // result: err('NOT_UPPERCASE').
 * ```
 *
 * @example
 * ```ts
 * // string-053: Reject string with numbers.
 * const result = isUpperCase('HELLO123');
 * // result: err('NOT_UPPERCASE').
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
 * // string-054: Validate capitalized string.
 * const result = isCapitalized('Hello');
 * // result: ok('Hello').
 * ```
 *
 * @example
 * ```ts
 * // string-055: Reject all lowercase string.
 * const result = isCapitalized('hello');
 * // result: err('NOT_CAPITALIZED').
 * ```
 *
 * @example
 * ```ts
 * // string-056: Reject all uppercase string.
 * const result = isCapitalized('HELLO');
 * // result: err('NOT_CAPITALIZED').
 * ```
 *
 * @example
 * ```ts
 * // string-057: Reject multi-word string.
 * const result = isCapitalized('Hello World');
 * // result: err('NOT_CAPITALIZED').
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
 * // string-058: Validate string starts with prefix.
 * const result = isStartsWith('Hello')('Hello World');
 * // result: ok('Hello World').
 * ```
 *
 * @example
 * ```ts
 * // string-059: Reject string not starting with prefix.
 * const result = isStartsWith('Hello')('World Hello');
 * // result: err('NOT_STARTS_WITH').
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
 * // string-060: Validate string ends with suffix.
 * const result = isEndsWith('World')('Hello World');
 * // result: ok('Hello World').
 * ```
 *
 * @example
 * ```ts
 * // string-061: Reject string not ending with suffix.
 * const result = isEndsWith('World')('World Hello');
 * // result: err('NOT_ENDS_WITH').
 * ```
 *
 * @public
 */
const isEndsWith = (suffix: string) => (value: string) =>
  value.endsWith(suffix) ? ok(value) : err('NOT_ENDS_WITH');

/**
 * Validates that the value is a valid BigInt string.
 *
 * @param value - The string value to validate.
 * @returns A result indicating whether the value is a valid BigInt string.
 *
 * @example
 * ```ts
 * // string-062: Validate BigInt string.
 * const result = isBigInt('1234567890123456789012345678901234567890');
 * // result: ok(BigInt('1234567890123456789012345678901234567890')).
 * ```
 *
 * @example
 * ```ts
 * // string-063: Reject invalid BigInt string.
 * const result = isBigInt('123.45');
 * // result: err('NOT_BIGINT').
 * ```
 *
 * @public
 */
const isBigInt = (value: string) => (bigint.test(value) ? ok(BigInt(value)) : err('NOT_BIGINT'));

/**
 * Validates that the value is a valid integer string.
 *
 * @param value - The string value to validate.
 * @returns A result indicating whether the value is a valid integer string.
 *
 * @example
 * ```ts
 * // string-064: Validate integer string.
 * const result = isInteger('123456');
 * // result: ok(123456).
 * ```
 *
 * @example
 * ```ts
 * // string-065: Reject invalid integer string.
 * const result = isInteger('123.45');
 * // result: err('NOT_INTEGER').
 * ```
 *
 * @public
 */
const isInteger = (value: string) =>
  integer.test(value) ? ok(Number.parseInt(value)) : err('NOT_INTEGER');

/**
 * Validates that the value is a valid boolean string.
 *
 * @param value - The string value to validate.
 * @returns A result indicating whether the value is a valid boolean string.
 *
 * @example
 * ```ts
 * // string-066: Validate boolean string.
 * const result = isBoolean('true');
 * // result: ok(true).
 * ```
 *
 * @example
 * ```ts
 * // string-067: Reject invalid boolean string.
 * const result = isBoolean('maybe');
 * // result: err('NOT_BOOLEAN').
 * ```
 *
 * @public
 */
const isBoolean = (value: string) =>
  boolean.test(value) ? ok(value === 'true') : err('NOT_BOOLEAN');

/**
 * Validates that the value is a valid number string.
 *
 * @param value - The string value to validate.
 * @returns A result indicating whether the value is a valid number string.
 *
 * @example
 * ```ts
 * // string-068: Validate number string.
 * const result = isNumber('123.45');
 * // result: ok(123.45).
 * ```
 *
 * @example
 * ```ts
 * // string-069: Reject invalid number string.
 * const result = isNumber('not-a-number');
 * // result: err('NOT_NUMBER').
 * ```
 *
 * @public
 */
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
 * // string-070: Basic string validation with type checking.
 * const stringValidator = str
 *   .isString()
 *   .isNotEmpty()
 *   .build();
 *
 * const result = stringValidator('hello');
 * // result: ok('hello').
 * ```
 *
 * @example
 * ```ts
 * // string-071: Password validation with multiple constraints.
 * const passwordValidator = str
 *   .isString()
 *   .hasMinLength(8)
 *   .hasMaxLength(50)
 *   .matches(/[A-Z]/) // Must contain uppercase
 *   .matches(/[a-z]/) // Must contain lowercase
 *   .matches(/\d/) // Must contain digit
 *   .build();
 *
 * const result = passwordValidator('SecurePass123');
 * // result: ok('SecurePass123').
 * ```
 *
 * @example
 * ```ts
 * // string-072: Username validation with specific requirements.
 * const usernameValidator = str
 *   .isString()
 *   .hasMinLength(3)
 *   .hasMaxLength(20)
 *   .isAlphaNumeric()
 *   .build();
 *
 * const result = usernameValidator('john123');
 * // result: ok('john123').
 * ```
 *
 * @example
 * ```ts
 * // string-073: Color validation for CSS.
 * const colorValidator = str
 *   .isString()
 *   .matches(/^#[0-9A-Fa-f]{6}$/) // Hex color
 *   .build();
 *
 * const result = colorValidator('#FF5733');
 * // result: ok('#FF5733').
 * ```
 *
 * @example
 * ```ts
 * // string-074: Slug validation for URLs.
 * const slugValidator = str
 *   .isString()
 *   .isSlug()
 *   .hasMaxLength(100)
 *   .build();
 *
 * const result = slugValidator('my-awesome-blog-post');
 * // result: ok('my-awesome-blog-post').
 * ```
 *
 * @example
 * ```ts
 * // string-075: Phone number validation with format checking.
 * const phoneValidator = str
 *   .isString()
 *   .isPhoneNumber()
 *   .build();
 *
 * const result = phoneValidator('+1234567890');
 * // result: ok('+1234567890').
 * ```
 *
 * @example
 * ```ts
 * // string-076: Date validation for forms.
 * const dateValidator = str
 *   .isString()
 *   .isDate()
 *   .build();
 *
 * const result = dateValidator('2024-01-15');
 * // result: ok('2024-01-15').
 * ```
 *
 * @example
 * ```ts
 * // string-077: Multiple validation with error collection.
 * const userValidator = str
 *   .isString()
 *   .isNotEmpty()
 *   .hasMinLength(3)
 *   .build('all'); // Collect all errors
 *
 * const result = userValidator('');
 * // result: err(['IS_EMPTY', 'TOO_SHORT']).
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
