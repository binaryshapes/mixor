/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { blue, cyan, gray, green, magenta, red, white, yellow } from '@std/fmt/colors';
import { getCallSites } from 'node:util';

/**
 * The mode of the logger.
 *
 * @internal
 */
type LogMode = 'error' | 'warning' | 'success' | 'debug' | 'hint' | 'assert';

/**
 * Colors for the console.
 *
 * @internal
 */
const colors = {
  red,
  green,
  yellow,
  blue,
  magenta,
  cyan,
  white,
  gray,
};

/**
 * The preset of the logger that is used to print the message.
 *
 * @internal
 */
type LoggerPreset = {
  icon?: string;
  prefix?: string;
  color: keyof typeof colors;
};

/**
 * The presets of the logger that are used to print the message.
 *
 * @internal
 */
const presets: Record<LogMode, LoggerPreset> = {
  error: {
    color: 'red',
  },
  warning: {
    color: 'yellow',
  },
  success: {
    color: 'green',
  },
  debug: {
    color: 'yellow',
  },
  hint: {
    color: 'gray',
  },
  assert: {
    color: 'yellow',
    prefix: 'Assertion failed',
  },
};

/**
 * Print a message to the console.
 *
 * @param message - The message to print.
 * @param mode - The mode of the message.
 *
 * @internal
 */
const print = <T extends LogMode>(message: string, mode: T): void =>
  ['assert', 'debug'].includes(mode)
    ? console.debug(format(message, mode))
    : mode === 'error'
    ? console.error(format(message, mode))
    : mode === 'warning'
    ? console.warn(format(message, mode))
    : console.log(format(message, mode));

/**
 * Format a message with a preset.
 *
 * @param message - The message to format.
 * @param mode - The preset of the message.
 * @returns The formatted message.
 *
 * @public
 */
const format = (message: string, mode: LogMode): string => {
  const preset = presets[mode];
  const color = colors[preset.color];
  const icon = preset.icon ? preset.icon + ' ' : '';
  const prefix = preset.prefix ? preset.prefix + ': ' : '';
  return color(icon + prefix + message);
};

/**
 * Format a message with the given color.
 *
 * @param message - The message to format.
 * @param color - The color to use for the message.
 * @returns The message with the given color.
 *
 * @public
 */
const color = (message: string, color: keyof typeof colors): string => colors[color](message);

/**
 * Assert a condition and print a warning message if the condition is false.
 *
 * @remarks
 * This function is used to assert a condition and print an assertion failed message if
 * the condition is false. The failed message includes the file name and line number where the
 * assertion failed.
 *
 * @param condition - The condition to assert.
 * @param message - The message to print if the condition is false.
 *
 * @public
 */
const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    const callSite = getCallSites()[1];
    const fileName = callSite.scriptName.split('/').pop();
    print(`(${fileName}:${callSite.lineNumber}) - ${message}`, 'assert');
  }
};

/**
 * Print an error message to the console.
 *
 * @param message - The message to print.
 *
 * @public
 */
const error = (message: string): void => print(message, 'error');

/**
 * Print a warning message to the console.
 *
 * @param message - The message to print.
 *
 * @public
 */
const warn = (message: string): void => print(message, 'warning');

/**
 * Print a success message to the console.
 *
 * @param message - The message to print.
 *
 * @public
 */
const success = (message: string): void => print(message, 'success');

/**
 * Print a message to the console.
 *
 * @param message - The message to print.
 * @returns void
 *
 * @public
 */
const debug = (message: string): void => print(message, 'debug');

/**
 * Print a hint message to the console.
 *
 * @param message - The message to print.
 *
 * @public
 */
const hint = (message: string): void => print(message, 'hint');

/**
 * Logger namespace with all the logger methods.
 *
 * @remarks
 * This is a namespace object that contains all the logger methods.
 *
 * @public
 */
const logger = { assert, success, error, format, color, warn, debug, hint };

export { logger };
