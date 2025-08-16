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
 * Creates a rule function that checks whether a string is a valid emoji.
 *
 * @remarks
 * A valid emoji string contains only emoji characters (e.g., 🍕, 🍔, 🍟, etc.).
 * Strings that don't contain valid emojis are rejected.
 *
 * @returns A rule function that returns a Result containing the value if it is a valid
 * emoji, or an error otherwise.
 *
 * @public
 */
const emoji = () =>
  rule((value: string) => (emojiRegex.test(value) ? ok(value) : err(InvalidEmoji)));

export { emoji };
