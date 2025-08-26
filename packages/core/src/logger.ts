/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The mode of the logger.
 *
 * @internal
 */
type LogMode = 'error' | 'warning' | 'success' | 'print';

/**
 * Colors for the console.
 *
 * @internal
 */
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

/**
 * The presets of the logger that are used to print the message.
 *
 * @internal
 */
const pressets: Record<LogMode, { icon: string; prefix: string; color: keyof typeof colors }> = {
  error: {
    icon: '🔴',
    prefix: 'ERROR',
    color: 'red',
  },
  warning: {
    icon: '🟡',
    prefix: 'WARNING',
    color: 'yellow',
  },
  success: {
    icon: '🟢',
    prefix: 'SUCCESS',
    color: 'green',
  },
  print: {
    icon: '',
    prefix: '',
    color: 'white',
  },
};

/**
 * Print a message to the console.
 *
 * @param message - The message to print.
 * @param mode - The mode of the message.
 *
 * @returns void
 *
 * @internal
 */
const print = <T extends LogMode>(message: string, mode: T) => console.log(format(message, mode));

/**
 * Format a message with a config.
 *
 * @param message - The message to format.
 * @param mode - The config of the message.
 *
 * @returns The formatted message.
 *
 * @public
 */
const format = (message: string, mode: LogMode) => {
  const preset = pressets[mode];
  return `${colors[preset.color]}${preset.icon} ${preset.prefix + ':'} ${message}\x1b[0m`;
};

/**
 * Format a message with a color.
 *
 * @param message - The message to format.
 * @param color - The color of the message.
 *
 * @returns The formatted message.
 *
 * @public
 */
const formatColor = (message: string, color: keyof typeof colors) =>
  `${colors[color]}${message}\x1b[0m`;

/**
 * Assert a condition.
 *
 * @param condition - The condition to assert.
 * @param message - The message to print if the condition is false.
 *
 * @public
 */
const assert = (condition: boolean, message: string) => {
  if (!condition) {
    print(message, 'warning');
  }
};

/**
 * Print an error message to the console.
 *
 * @param message - The message to print.
 *
 * @returns void
 *
 * @public
 */
const error = (message: string) => print(message, 'error');

/**
 * Print a warning message to the console.
 *
 * @param message - The message to print.
 *
 * @returns void
 *
 * @public
 */
const warn = (message: string) => print(message, 'warning');

/**
 * Print a message to the console.
 *
 * @param message - The message to print.
 *
 * @returns void
 *
 * @public
 */
const log = (message: string) => print(message, 'print');

/**
 * Logger namespace with all the logger methods.
 *
 * @public
 */
const Logger = {
  assert,
  error,
  format,
  formatColor,
  log,
  print,
  warn,
};

export { assert, error, format, formatColor, log, print, warn };
export default Logger;
