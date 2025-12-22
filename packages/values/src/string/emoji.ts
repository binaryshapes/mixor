/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for emoji validation (from Zod source code).
// References:
// - https://thekevinscott.com/emojis-in-javascript/#writing-a-regular-expression
// - https://github.com/colinhacks/zod/blob/3782fe29920c311984004c350b9fefaf0ae4c54a/src/types.ts#L666C20-L666C75
const emojiRegex = /^(\p{Extended_Pictographic}|\p{Emoji_Component})+$/u;

/**
 * Invalid emoji failure.
 *
 * @internal
 */
class InvalidEmoji extends n.failure(
  'String.InvalidEmoji',
  {
    'en-US': 'The string must be a valid emoji.',
    'es-ES': 'El texto debe ser un emoji válido.',
  },
) {}

// Apply metadata to the InvalidEmoji failure.
n.info(InvalidEmoji)
  .doc({
    title: 'InvalidEmoji Failure',
    body: n.doc`
    A failure that is returned when the string is not a valid emoji.
    `,
  });

/**
 * A rule that checks if the string is a valid emoji.
 *
 * @remarks
 * A valid emoji string contains only emoji characters (e.g., 🍕, 🍔, 🍟, etc.).
 * Strings that don't contain valid emojis are rejected. If the string is not a valid emoji,
 * the rule will return an error Result with code 'String.InvalidEmoji'.
 *
 * @public
 */
const Emoji = rule(() => n.assert((value: string) => emojiRegex.test(value), new InvalidEmoji()));

n.info(Emoji)
  .type('string')
  .doc({
    title: 'Emoji',
    body: n.doc`
    A rule that checks if the string is a valid emoji. A valid emoji string contains only
    emoji characters (e.g., 🍕, 🍔, 🍟, etc.). Strings that don't contain valid emojis are
    rejected. If the string is not a valid emoji, the rule will return a failure Result with
    code 'String.InvalidEmoji'.
    `,
  });

export { Emoji, InvalidEmoji };
