/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

/**
 * The algorithm to use for the hash.
 *
 * @internal
 */
type HashAlgorithm = 'md5' | 'sha1' | 'sha256' | 'sha384' | 'sha512';

/**
 * The encoding to use for the hash.
 *
 * @internal
 */
type HashEncoding = 'hex' | 'base64' | 'base64url';

/**
 * Creates a regular expression for a fixed base64 string with a given length and padding.
 *
 * @param bodyLength - The length of the base64 string body.
 * @param padding - The padding characters to add to the end of the string.
 * @returns A regular expression for a fixed base64 string with a given length and padding.
 *
 * @internal
 */
function fixedBase64(bodyLength: number, padding: '' | '=' | '=='): RegExp {
  return new RegExp(`^[A-Za-z0-9+/]{${bodyLength}}${padding}$`);
}

/**
 * Creates a regular expression for a fixed base64url string with a given length.
 *
 * @param length - The length of the base64url string.
 * @returns A regular expression for a fixed base64url string with a given length.
 *
 * @internal
 */
function fixedBase64url(length: number): RegExp {
  return new RegExp(`^[A-Za-z0-9_-]{${length}}$`);
}

/**
 * A record of regular expressions for valid hashes.
 *
 * @internal
 */
const hashRegexes: Record<HashAlgorithm & HashEncoding, RegExp> = {
  // MD5 (16 bytes): base64 = 24 chars total (22 + "==")
  md5Hex: /^[0-9a-fA-F]{32}$/,
  md5Base64: fixedBase64(22, '=='),
  md5Base64url: fixedBase64url(22),

  // SHA1 (20 bytes): base64 = 28 chars total (27 + "=")
  sha1Hex: /^[0-9a-fA-F]{40}$/,
  sha1Base64: fixedBase64(27, '='),
  sha1Base64url: fixedBase64url(27),

  // SHA256 (32 bytes): base64 = 44 chars total (43 + "=")
  sha256Hex: /^[0-9a-fA-F]{64}$/,
  sha256Base64: fixedBase64(43, '='),
  sha256Base64url: fixedBase64url(43),

  // SHA384 (48 bytes): base64 = 64 chars total (no padding)
  sha384Hex: /^[0-9a-fA-F]{96}$/,
  sha384Base64: fixedBase64(64, ''),
  sha384Base64url: fixedBase64url(64),

  // SHA512 (64 bytes): base64 = 88 chars total (86 + "==")
  sha512Hex: /^[0-9a-fA-F]{128}$/,
  sha512Base64: fixedBase64(86, '=='),
  sha512Base64url: fixedBase64url(86),
};

/**
 * Capitalizes the first letter of the string.
 *
 * @param str - The string to capitalize.
 * @returns The capitalized string.
 *
 * @internal
 */
const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Invalid hash failure.
 *
 * @internal
 */
class InvalidHash extends n.failure(
  'String.InvalidHash',
  {
    'en-US': 'The string must be a valid hash.',
    'es-ES': 'El texto debe ser un hash válido.',
  },
) {}

// Apply metadata to the InvalidHash failure.
n.info(InvalidHash)
  .doc({
    title: 'InvalidHash Failure',
    body: n.doc`
    A failure that is returned when the string is not a valid hash.
    `,
  });

/**
 * A rule that checks if the string is a valid hash.
 *
 * @remarks
 * A valid hash string follows the format: `<algorithm><encoding>` where `<algorithm>` is one of
 * 'md5', 'sha1', 'sha256', 'sha384', or 'sha512' and `<encoding>` is one of 'hex', 'base64',
 * or 'base64url'. If the string is not a valid hash, the rule will return a failure Result with
 * code 'String.InvalidHash'.
 *
 * @param algorithm - The algorithm to use for the hash.
 * @param encoding - The encoding to use for the hash.
 * @returns A rule that checks if the string is a valid hash.
 *
 * @public
 */
const Hash = rule((algorithm: HashAlgorithm, encoding: HashEncoding) => {
  const format = `${algorithm}${capitalize(encoding)}` as HashAlgorithm & HashEncoding;
  return n.assert((value: string) => (hashRegexes[format] as RegExp).test(value), new InvalidHash());
});

n.info(Hash)
  .type('string')
  .params(['algorithm', 'HashAlgorithm'], ['encoding', 'HashEncoding'])
  .doc({
    title: 'Hash',
    body: n.doc`
    A rule that checks if the string is a valid hash. A valid hash string follows the format:
    <algorithm><encoding> where <algorithm> is one of 'md5', 'sha1', 'sha256', 'sha384', or 'sha512'
    and <encoding> is one of 'hex', 'base64', or 'base64url'. If the string is not a valid hash,
    the rule will return a failure Result with code 'String.InvalidHash'.
    `,
  });

export { Hash, InvalidHash };
