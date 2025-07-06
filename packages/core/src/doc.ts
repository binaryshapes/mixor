/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * A string tag that strips common indentation from multi-line strings (like dedent).
 * Useful for long strings such as documentation.
 *
 * @param strings - The template literal strings.
 * @param values - The interpolated values.
 * @returns The properly formatted string.
 *
 * @example
 * ```ts
 * const message = doc`
 *   Hello world!
 *   This is a multi-line string
 *   that will be properly formatted.
 * `;
 * // Output:
 * // Hello world!
 * // This is a multi-line string
 * // that will be properly formatted.
 * ```
 *
 * @public
 */
function doc(strings: TemplateStringsArray, ...values: unknown[]): string {
  // Interpolate values into the template string.
  let raw = '';
  for (let i = 0; i < strings.length; i++) {
    raw += strings[i];
    if (i < values.length) {
      raw += String(values[i]);
    }
  }

  // Split into lines.
  let lines = raw.split(/\r?\n/);

  // Remove leading and trailing empty lines.
  while (lines.length > 0 && lines[0].trim() === '') lines.shift();
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();

  // Find minimum indentation (tabs or spaces) of all non-empty lines.
  let minIndent: number | null = null;
  for (const line of lines) {
    if (line.trim() === '') continue;
    const match = line.match(/^(\s*)/);
    if (match) {
      const indent = match[1].length;
      if (minIndent === null || indent < minIndent) {
        minIndent = indent;
      }
    }
  }

  // Remove the minimum indentation from each line.
  if (minIndent && minIndent > 0) {
    lines = lines.map((line) => (line.trim() === '' ? '' : line.slice(minIndent)));
  }

  return lines.join('\n');
}

export { doc };
