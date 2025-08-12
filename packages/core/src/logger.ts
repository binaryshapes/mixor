/*
 * This file is part of the Mixor project.
 *
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
type LoggMode = 'error' | 'warning' | 'success' | 'print';

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
 * The configs of the logger that are used to print the message.
 *
 * @internal
 */
const configs: Record<LoggMode, { icon: string; prefix: string; color: keyof typeof colors }> = {
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
 * Format a message with a config.
 *
 * @param message - The message to format.
 * @param config - The config of the message.
 *
 * @returns The formatted message.
 *
 * @internal
 */
const format = (message: string, config: LoggMode) =>
  `${colors[configs[config].color]}${configs[config].icon} ${configs[config].prefix}: ${message}\x1b[0m`;

/**
 * Print a message to the console.
 *
 * @param message - The message to print.
 * @param config - The config of the message.
 *
 * @returns void
 *
 * @internal
 */
const print = <T extends LoggMode>(message: string, config: T) =>
  console.log(format(message, config));

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

export { assert, error, print };
