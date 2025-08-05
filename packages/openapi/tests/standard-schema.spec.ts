/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { describe, expect, expectTypeOf, it } from 'vitest';

import { err, ok, rule, schema, value } from '@mixor/core';

import { hasIssues, hasValue, toStandardSchema } from '../src/standard-schema';

describe('toStandardSchema', () => {
  describe('Type safety', () => {
    it('should provide correct type inference for all public elements', () => {
      // Test the main function
      expectTypeOf(toStandardSchema).toBeFunction();

      // Test with a sample schema
      const UserSchema = schema({
        name: value(rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')))),
        age: value(rule((age: number) => (age >= 0 ? ok(age) : err('INVALID_AGE')))),
      });

      const standardSchema = toStandardSchema(UserSchema);

      // Test the returned Standard Schema structure
      expectTypeOf(standardSchema).toHaveProperty('~standard');
      expectTypeOf(standardSchema['~standard']).toHaveProperty('version');
      expectTypeOf(standardSchema['~standard']).toHaveProperty('vendor');
      expectTypeOf(standardSchema['~standard']).toHaveProperty('validate');
      expectTypeOf(standardSchema['~standard']).toHaveProperty('types');

      // Test the validate function
      expectTypeOf(standardSchema['~standard'].validate).toBeFunction();
    });

    it('should validate type constraints and generics', () => {
      // Test generic function with different schema types
      const StringSchema = schema({
        field: value(rule((value: string) => (value.length > 0 ? ok(value) : err('EMPTY')))),
      });

      const NumberSchema = schema({
        field: value(rule((value: number) => (value >= 0 ? ok(value) : err('NEGATIVE')))),
      });

      const standardStringSchema = toStandardSchema(StringSchema);
      const standardNumberSchema = toStandardSchema(NumberSchema);

      expectTypeOf(standardStringSchema).toHaveProperty('~standard');
      expectTypeOf(standardNumberSchema).toHaveProperty('~standard');
    });

    it('should validate Result types correctly', () => {
      // Test that the validate function returns the correct Result type
      const UserSchema = schema({
        name: value(rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')))),
        age: value(rule((age: number) => (age >= 0 ? ok(age) : err('INVALID_AGE')))),
      });

      const standardSchema = toStandardSchema(UserSchema);
      const result = standardSchema['~standard'].validate({ name: 'John', age: 30 });

      // Test that result is defined
      expect(result).toBeDefined();
    });
  });

  describe('Basic functionality', () => {
    it('should convert Mixor schema to Standard Schema format', () => {
      const UserSchema = schema({
        name: value(rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')))),
        age: value(rule((age: number) => (age >= 0 ? ok(age) : err('INVALID_AGE')))),
      });

      const standardSchema = toStandardSchema(UserSchema);

      // Test Standard Schema properties
      expect(standardSchema['~standard'].version).toBe(1);
      expect(standardSchema['~standard'].vendor).toBe('mixor');
      expect(typeof standardSchema['~standard'].validate).toBe('function');
      expect(standardSchema['~standard'].types).toBeDefined();
    });

    it('should handle string errors correctly', () => {
      const SimpleSchema = schema({
        field: value(
          rule((value: string) => (value === 'valid' ? ok(value) : err('INVALID_VALUE'))),
        ),
      });

      const standardSchema = toStandardSchema(SimpleSchema);
      const result = standardSchema['~standard'].validate({ field: 'invalid' });

      expect(hasIssues(result)).toBe(true);
      if (hasIssues(result)) {
        expect(result.issues).toHaveLength(1);
        expect(result.issues[0]).toEqual({
          message: 'INVALID_VALUE',
          path: ['field'],
        });
      }
    });

    it('should handle array errors correctly', () => {
      const SchemaWithArrayErrors = schema({
        field: value(
          rule((value: string) => {
            const errors = [];
            if (value.length === 0) errors.push('EMPTY');
            if (value.length < 3) errors.push('TOO_SHORT');
            return errors.length === 0 ? ok(value) : err(errors);
          }),
        ),
      });

      const standardSchema = toStandardSchema(SchemaWithArrayErrors);
      const result = standardSchema['~standard'].validate({ field: 'ab' });

      expect(hasIssues(result)).toBe(true);
      if (hasIssues(result)) {
        expect(result.issues).toHaveLength(1);
        expect(result.issues).toEqual([
          { message: 'TOO_SHORT', path: ['field'] },
        ]);
      }
    });

    it('should handle multiple array errors correctly', () => {
      const SchemaWithArrayErrors = schema({
        field: value(
          rule((value: string) => {
            const errors = [];
            if (value.length === 0) errors.push('EMPTY');
            if (value.length < 3) errors.push('TOO_SHORT');
            return errors.length === 0 ? ok(value) : err(errors);
          }),
        ),
      });

      const standardSchema = toStandardSchema(SchemaWithArrayErrors);
      const result = standardSchema['~standard'].validate({ field: '' });

      expect(hasIssues(result)).toBe(true);
      if (hasIssues(result)) {
        expect(result.issues).toHaveLength(2);
        expect(result.issues).toEqual([
          { message: 'EMPTY', path: ['field'] },
          { message: 'TOO_SHORT', path: ['field'] },
        ]);
      }
    });
  });

  describe('Code examples', () => {
    it('should run example standard-schema-001: Basic schema conversion', () => {
      const UserSchema = schema({
        name: value(rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')))),
        age: value(rule((age: number) => (age >= 0 ? ok(age) : err('INVALID_AGE')))),
      });

      const standardUserSchema = toStandardSchema(UserSchema);
      const result = standardUserSchema['~standard'].validate({ name: 'John', age: 30 });

      expect(hasValue(result)).toBe(true);
      expect(hasIssues(result)).toBe(false);
      if (hasValue(result)) {
        expect(result.value).toEqual({ name: 'John', age: 30 });
      }
    });

    it('should run example standard-schema-002: Error handling with Standard Schema', () => {
      const UserSchema = schema({
        name: value(rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')))),
        age: value(rule((age: number) => (age >= 0 ? ok(age) : err('INVALID_AGE')))),
      });

      const standardUserSchema = toStandardSchema(UserSchema);
      const result = standardUserSchema['~standard'].validate({ name: '', age: -5 });

      expect(hasIssues(result)).toBe(true);
      expect(hasValue(result)).toBe(false);
      if (hasIssues(result)) {
        expect(result.issues).toHaveLength(2);
        expect(result.issues).toEqual([
          { message: 'EMPTY_NAME', path: ['name'] },
          { message: 'INVALID_AGE', path: ['age'] },
        ]);
      }
    });

    it('should run example standard-schema-003: Complex schema with multiple field errors', () => {
      const UserSchema = schema({
        name: value(rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')))),
        email: value(
          rule((email: string) => (email.includes('@') ? ok(email) : err('INVALID_EMAIL'))),
        ),
        age: value(rule((age: number) => (age >= 0 ? ok(age) : err('INVALID_AGE')))),
        password: value(
          rule((password: string) =>
            password.length >= 8 ? ok(password) : err('PASSWORD_TOO_SHORT'),
          ),
        ),
      });

      const standardUserSchema = toStandardSchema(UserSchema);
      const result = standardUserSchema['~standard'].validate({
        name: '',
        email: 'invalid-email',
        age: -5,
        password: '123',
      });

      expect(hasIssues(result)).toBe(true);
      if (hasIssues(result)) {
        expect(result.issues).toHaveLength(4);
        expect(result.issues).toEqual([
          { message: 'EMPTY_NAME', path: ['name'] },
          { message: 'INVALID_EMAIL', path: ['email'] },
          { message: 'INVALID_AGE', path: ['age'] },
          { message: 'PASSWORD_TOO_SHORT', path: ['password'] },
        ]);
      }
    });

    it('should run example standard-schema-004: Standard Schema metadata', () => {
      const UserSchema = schema({
        name: value(rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')))),
        age: value(rule((age: number) => (age >= 0 ? ok(age) : err('INVALID_AGE')))),
      });

      const standardUserSchema = toStandardSchema(UserSchema);
      const standardProps = standardUserSchema['~standard'];

      expect(standardProps.version).toBe(1);
      expect(standardProps.vendor).toBe('mixor');
      expect(typeof standardProps.validate).toBe('function');
      expect(standardProps.types).toBeDefined();
      expect(standardProps.types?.input).toBeDefined();
      expect(standardProps.types?.output).toBeDefined();
    });
  });
});
