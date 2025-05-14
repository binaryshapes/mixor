/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { ValidationChain } from './chain';
import { type BooleanValidator, createValidator } from './validator';

/**
 * Validates that the value is a string.
 *
 * @returns A result indicating whether the value is a string.
 *
 * @example
 * ```ts
 * const result = isString('hello'); // true
 * const result = isString(1.23); // false
 * const result = isString(true); // false
 * const result = isString(null); // false
 * const result = isString(undefined); // false
 * const result = isString({}); // false
 * const result = isString([]); // false
 * ```
 *
 * @public
 */
const isString: BooleanValidator = () => (value: unknown) => typeof value === 'string';

/**
 * Validates that the value is not empty.
 *
 * @returns A result indicating whether the value is not empty.
 *
 * @example
 * ```ts
 * const result = isNotEmpty('');
 * ```
 *
 * @public
 */
const isNotEmpty: BooleanValidator = () => (value: string) => value.trim().length !== 0;

/**
 * Validates that the value has a minimum length.
 *
 * @param minLength - The minimum length of the value.
 * @returns A result indicating whether the value has a minimum length.
 *
 * @example
 * ```ts
 * const result = hasMinLength(10);
 * ```
 *
 * @public
 */
const hasMinLength: BooleanValidator = (minLength: number) => (value: string) =>
  value.length >= minLength;

/**
 * Validates that the value has a maximum length.
 *
 * @param maxLength - The maximum length of the value.
 * @returns A result indicating whether the value has a maximum length.
 *
 * @example
 * ```ts
 * const result = hasMaxLength(10);
 * ```
 *
 * @public
 */
const hasMaxLength: BooleanValidator = (maxLength: number) => (value: string) =>
  value.length > maxLength;

/**
 * Validates that the value contains a value from a list.
 *
 * @param list - The list of values to check.
 * @returns A result indicating whether the value contains a value from the list.
 *
 * @example
 * ```ts
 * const result = contains(['hello', 'world']);
 * ```
 *
 * @public
 */
const contains: BooleanValidator = (list: string[]) => (value: string) => list.includes(value);

/**
 * Validates that the value matches a regular expression.
 *
 * @param pattern - The regular expression to match.
 * @returns A result indicating whether the value matches the regular expression.
 *
 * @example
 * ```ts
 * const result = matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
 * ```
 *
 * @public
 */
const matches: BooleanValidator = (pattern: RegExp) => (value: string) => pattern.test(value);

/**
 * Validates that the value is a valid email address.
 *
 * @returns A result indicating whether the value is a valid email address.
 *
 * @example
 * ```ts
 * const result = isEmail('me@example.com');
 * ```
 *
 * @public
 */
const isEmail: BooleanValidator = () => (value: string) => {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return matches(emailPattern)(value);
};

/**
 * Validates that the value is a valid URL.
 *
 * @returns A result indicating whether the value is a valid URL.
 *
 * @example
 * ```ts
 * const result = isURL('https://example.com');
 * ```
 *
 * @public
 */
const isURL: BooleanValidator = () => (value: string) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates that the value is a valid UUID.
 * @see https://www.rfc-editor.org/rfc/rfc4122
 *
 * @returns A result indicating whether the value is a valid UUID.
 *
 * @example
 * ```ts
 * const result = isUUID('123e4567-e89b-12d3-a456-426614174000');
 * ```
 *
 * @public
 */
const isUUID: BooleanValidator = () => (value: string) => {
  const uuidPattern =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return matches(uuidPattern)(value);
};

/**
 * Validates that the value is a valid ULID.
 * @see https://github.com/ulid/spec
 *
 * @returns A result indicating whether the value is a valid ULID.
 *
 * @example
 * ```ts
 * const result = isULID('01J352A070000000000000000');
 * ```
 *
 * @public
 */
const isULID: BooleanValidator = () => (value: string) => {
  const ulidPattern = /^[0-9a-fA-F]{26}$/;
  return matches(ulidPattern)(value);
};

/**
 * Validates that the value is a valid slug.
 *
 * @returns A result indicating whether the value is a valid slug.
 *
 * @example
 * ```ts
 * const result = isSlug('hello-world');
 * ```
 *
 * @public
 */
const isSlug: BooleanValidator = () => (value: string) => {
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return matches(slugPattern)(value);
};

/**
 * Validates that the value is a numeric string.
 *
 * @returns A result indicating whether the value is a numeric string.
 *
 * @example
 * ```ts
 * const result = isNumeric('1234567890');
 * ```
 *
 * @public
 */
const isNumeric: BooleanValidator = () => (value: string) => {
  const numericPattern = /^[0-9]+$/;
  return matches(numericPattern)(value);
};

/**
 * Validates that the value is a valid hexadecimal string.
 *
 * @returns A result indicating whether the value is a valid hexadecimal string.
 *
 * @example
 * ```ts
 * const result = isHexadecimal('FFAA00');
 * ```
 *
 * @public
 */
const isHexadecimal: BooleanValidator = () => (value: string) => {
  const hexadecimalPattern = /^[0-9a-fA-F]+$/;
  return matches(hexadecimalPattern)(value);
};

/**
 * Validates that the value is a valid base64 string.
 *
 * @returns A result indicating whether the value is a valid base64 string.
 *
 * @example
 * ```ts
 * const result = isBase64('SGVsbG8gV29ybGQ=');
 * ```
 *
 * @public
 */
const isBase64: BooleanValidator = () => (value: string) => {
  const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;
  return matches(base64Pattern)(value);
};

/**
 * Validates that the value is a valid IPv4 address.
 *
 * @returns A result indicating whether the value is a valid IPv4 address.
 *
 * @example
 * ```ts
 * const result = isIPv4('192.168.1.1');
 * ```
 *
 * @public
 */
const isIPv4: BooleanValidator = () => (value: string) => {
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  return matches(ipv4Pattern)(value);
};

/**
 * Validates that the value is a valid IPv6 address.
 *
 * @returns A result indicating whether the value is a valid IPv6 address.
 *
 * @example
 * ```ts
 * const result = isIPv4('84d5:51a0:9114:1855:4cfa:f2d7:1f12:7003');
 * ```
 *
 * @public
 */
const isIPv6: BooleanValidator = () => (value: string) => {
  const ipv6Pattern = /^([0-9A-Fa-f]{2}[:-]){7}[0-9A-Fa-f]{2}$/;
  return matches(ipv6Pattern)(value);
};

/**
 * Validates that the value is a valid IP range.
 *
 * @returns A result indicating whether the value is a valid IP range.
 *
 * @example
 * ```ts
 * const result = isIPRange('192.168.1.1/24');
 * ```
 *
 * @public
 */
const isIPRange: BooleanValidator = () => (value: string) => {
  const ipRangePattern = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,3}$/;
  return matches(ipRangePattern)(value);
};

/**
 * Validates that the value is a valid MAC address.
 *
 * @returns A result indicating whether the value is a valid MAC address.
 *
 * @public
 */
const isMAC: BooleanValidator = () => (value: string) => {
  const macPattern = /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/;
  return matches(macPattern)(value);
};

/**
 * Validates that the value is a valid date.
 *
 * @returns A result indicating whether the value is a valid date.
 *
 * @example
 * ```ts
 * const result = isDate('2021-01-01');
 * ```
 *
 * @public
 */
const isDate: BooleanValidator = () => (value: string) => {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  return matches(datePattern)(value);
};

/**
 * Validates that the value is a valid date and time.
 *
 * @returns A result indicating whether the value is a valid date and time.
 *
 * @example
 * ```ts
 * const result = isDateTime('2021-01-01T12:34:56');
 * const result = isDateTime('2021-01-01 12:34:56');
 * const result = isDateTime('2020-01-01T00:00:00+02:00');
 * const result = isDateTime('2020-01-01T00:00:00Z');
 * ```
 *
 * @public
 */
const isDateTime: BooleanValidator = () => (value: string) => {
  const dateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/;
  return matches(dateTimePattern)(value);
};

/**
 * Validates that the value is a valid time.
 *
 * @returns A result indicating whether the value is a valid time.
 *
 * @example
 * ```ts
 * const result = isTime('12:34:56');
 * ```
 *
 * @public
 */
const isTime: BooleanValidator = () => (value: string) => {
  const timePattern = /^\d{2}:\d{2}:\d{2}$/;
  return matches(timePattern)(value);
};

/**
 * Validates that the value is a valid phone number.
 *
 * @returns A result indicating whether the value is a valid phone number.
 *
 * @example
 * ```ts
 * const result = isPhoneNumber('+1234567890');
 * ```
 *
 * @public
 */
const isPhoneNumber: BooleanValidator = () => (value: string) => {
  const phoneNumberPattern = /^\+?\d{1,3}?\s?\d{3}\s?\d{3}\s?\d{4}$/;
  return matches(phoneNumberPattern)(value);
};

/**
 * Validates that the value is a valid emoji.
 *
 * @privateRemarks
 * References:
 * - https://thekevinscott.com/emojis-in-javascript/#writing-a-regular-expression
 * - https://github.com/colinhacks/zod/blob/3782fe29920c311984004c350b9fefaf0ae4c54a/src/types.ts#L666C20-L666C75
 *
 * @returns A result indicating whether the value is a valid emoji.
 *
 * @example
 * ```ts
 * const result = isEmoji('👍');
 * ```
 *
 * @public
 */
const isEmoji: BooleanValidator = () => (value: string) => {
  const emojiPattern = /^(\p{Extended_Pictographic}|\p{Emoji_Component})+$/u;
  return matches(emojiPattern)(value);
};

/**
 * Validates that the value is a valid RGBA color.
 *
 * @returns A result indicating whether the value is a valid RGBA color.
 *
 * @example
 * ```ts
 * const result = isRGBA('rgba(255, 170, 0, 0.1)');
 * ```
 *
 * @public
 */
const isRGBA: BooleanValidator = () => (value: string) => {
  const rgbaPattern = /^rgba?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/;
  return matches(rgbaPattern)(value);
};

/**
 * Validates that the value is a valid RGB color.
 *
 * @returns A result indicating whether the value is a valid RGB color.
 *
 * @example
 * ```ts
 * const result = isRGB('rgb(0, 0, 0)');
 * ```
 *
 * @public
 */
const isRGB: BooleanValidator = () => (value: string) => {
  const rgbPattern = /^rgb?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/;
  return matches(rgbPattern)(value);
};

/**
 * A set of string validators for the `str` chain.
 *
 * @internal
 */
const strings = {
  isString: createValidator(isString, 'NOT_STRING'),
  isNotEmpty: createValidator(isNotEmpty, 'IS_EMPTY'),
  hasMinLength: createValidator(hasMinLength, 'TOO_SHORT'),
  hasMaxLength: createValidator(hasMaxLength, 'TOO_LONG'),
  contains: createValidator(contains, 'NOT_CONTAIN'),
  matches: createValidator(matches, 'NOT_MATCH'),
  isEmail: createValidator(isEmail, 'INVALID_EMAIL'),
  isURL: createValidator(isURL, 'INVALID_URL'),
  isUUID: createValidator(isUUID, 'INVALID_UUID'),
  isULID: createValidator(isULID, 'INVALID_ULID'),
  isSlug: createValidator(isSlug, 'INVALID_SLUG'),
  isNumeric: createValidator(isNumeric, 'NOT_NUMERIC'),
  isHexadecimal: createValidator(isHexadecimal, 'NOT_HEXADECIMAL'),
  isBase64: createValidator(isBase64, 'NOT_BASE64'),
  isIPv4: createValidator(isIPv4, 'INVALID_IPV4'),
  isIPv6: createValidator(isIPv6, 'INVALID_IPV6'),
  isIPRange: createValidator(isIPRange, 'INVALID_IP_RANGE'),
  isMAC: createValidator(isMAC, 'INVALID_MAC'),
  isDate: createValidator(isDate, 'INVALID_DATE'),
  isDateTime: createValidator(isDateTime, 'INVALID_DATE_TIME'),
  isTime: createValidator(isTime, 'INVALID_TIME'),
  isPhoneNumber: createValidator(isPhoneNumber, 'INVALID_PHONE_NUMBER'),
  isEmoji: createValidator(isEmoji, 'INVALID_EMOJI'),
  isRGBA: createValidator(isRGBA, 'INVALID_RGBA'),
  isRGB: createValidator(isRGB, 'INVALID_RGB'),
};

/**
 * Creates a validation chain for string values.
 *
 * @returns A validation chain for string values.
 *
 * @example
 * ```ts
 * const email = str().isEmail('INVALID_EMAIL').build();
 * email('me@example.com') // (value: string) => Result<true, 'INVALID_EMAIL'>
 * ```
 *
 * @public
 */
const str = (): ReturnType<typeof ValidationChain.create<typeof strings>> =>
  ValidationChain.create(strings);

export {
  str,
  isString,
  isNotEmpty,
  hasMinLength,
  hasMaxLength,
  contains,
  matches,
  isEmail,
  isURL,
  isUUID,
  isULID,
  isSlug,
  isNumeric,
  isHexadecimal,
  isBase64,
  isIPv4,
  isIPv6,
  isIPRange,
  isMAC,
  isDate,
  isDateTime,
  isTime,
  isPhoneNumber,
  isEmoji,
  isRGBA,
  isRGB,
};
