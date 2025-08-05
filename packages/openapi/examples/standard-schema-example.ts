/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { err, ok, rule, schema, value } from '@mixor/core';

import { hasIssues, hasValue, toStandardSchema } from '../src/standard-schema';

/**
 * standard-schema-001: Basic schema conversion.
 */
function standardSchemaBasicUsage() {
  console.log('\nstandard-schema-001: Basic schema conversion.');

  const UserSchema = schema({
    name: value(rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')))),
    age: value(rule((age: number) => (age >= 0 ? ok(age) : err('INVALID_AGE')))),
  });

  const standardUserSchema = toStandardSchema(UserSchema);
  const result = standardUserSchema['~standard'].validate({ name: 'John', age: 30 });

  console.log('Result:', result);
  console.log('Result type:', typeof result);
  console.log('Has value:', 'value' in result);
  console.log('Has issues:', 'issues' in result);
}

/**
 * standard-schema-002: Error handling with Standard Schema.
 */
function standardSchemaErrorHandling() {
  console.log('\nstandard-schema-002: Error handling with Standard Schema.');

  const UserSchema = schema({
    name: value(rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')))),
    age: value(rule((age: number) => (age >= 0 ? ok(age) : err('INVALID_AGE')))),
  });

  const standardUserSchema = toStandardSchema(UserSchema);
  const result = standardUserSchema['~standard'].validate({ name: '', age: -5 });

  console.log('Result:', result);
  console.log('Result type:', typeof result);
  console.log('Has value:', hasValue(result));
  console.log('Has issues:', hasIssues(result));

  if (hasIssues(result)) {
    console.log('Number of issues:', result.issues.length);
    result.issues.forEach((issue, index) => {
      console.log(`Issue ${index + 1}:`, issue);
    });
  }
}

/**
 * standard-schema-003: Complex schema with multiple field errors.
 */
function standardSchemaComplexErrors() {
  console.log('\nstandard-schema-003: Complex schema with multiple field errors.');

  const UserSchema = schema({
    name: value(rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')))),
    email: value(rule((email: string) => (email.includes('@') ? ok(email) : err('INVALID_EMAIL')))),
    age: value(rule((age: number) => (age >= 0 ? ok(age) : err('INVALID_AGE')))),
    password: value(
      rule((password: string) => (password.length >= 8 ? ok(password) : err('PASSWORD_TOO_SHORT'))),
    ),
  });

  const standardUserSchema = toStandardSchema(UserSchema);
  const result = standardUserSchema['~standard'].validate({
    name: '',
    email: 'invalid-email',
    age: -5,
    password: '123',
  });

  console.log('Result:', result);

  if (hasIssues(result)) {
    console.log('Number of issues:', result.issues.length);
    result.issues.forEach((issue, index) => {
      console.log(`Issue ${index + 1}:`, {
        message: issue.message,
        path: issue.path,
      });
    });
  }
}

/**
 * standard-schema-004: Standard Schema metadata.
 */
function standardSchemaMetadata() {
  console.log('\nstandard-schema-004: Standard Schema metadata.');

  const UserSchema = schema({
    name: value(rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')))),
    age: value(rule((age: number) => (age >= 0 ? ok(age) : err('INVALID_AGE')))),
  });

  const standardUserSchema = toStandardSchema(UserSchema);
  const standardProps = standardUserSchema['~standard'];

  console.log('Standard Schema Properties:');
  console.log('Version:', standardProps.version);
  console.log('Vendor:', standardProps.vendor);
  console.log('Has validate function:', typeof standardProps.validate === 'function');
  console.log('Has types:', !!standardProps.types);

  if (standardProps.types) {
    console.log('Input type:', typeof standardProps.types.input);
    console.log('Output type:', typeof standardProps.types.output);
  }
}

// Execute all examples
standardSchemaBasicUsage();
standardSchemaErrorHandling();
standardSchemaComplexErrors();
standardSchemaMetadata();
