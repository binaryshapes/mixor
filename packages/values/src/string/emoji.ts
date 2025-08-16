import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `emoji` rule.
 *
 * @internal
 */
type InvalidEmoji = StringValueError<'InvalidEmojiError', 'emoji'>;

/**
 * Instance of the `InvalidEmoji` error type.
 *
 * @internal
 */
const InvalidEmoji: InvalidEmoji = {
  code: 'InvalidEmojiError',
  context: 'StringValue',
  origin: 'emoji',
  message: 'Value is not a valid emoji',
};

// Regular expression for emoji validation (from Zod source code).
// References:
// - https://thekevinscott.com/emojis-in-javascript/#writing-a-regular-expression
// - https://github.com/colinhacks/zod/blob/3782fe29920c311984004c350b9fefaf0ae4c54a/src/types.ts#L666C20-L666C75
const emojiRegex = /^(\p{Extended_Pictographic}|\p{Emoji_Component})+$/u;

/**
 * Creates a value rule function that validates string values are valid emojis.
 *
 * @remarks
 * An emoji is a string that contains only emojis. i.e. 🍕, 🍔, 🍟, etc.
 *
 * @returns A rule function that validates that the value is a valid emoji.
 * This function returns a Result type with the value if it is a valid emoji, or an error if it
 * is not.
 *
 * @public
 */
const emoji = () =>
  rule((value: string) => (emojiRegex.test(value) ? ok(value) : err(InvalidEmoji)));

export { emoji };
