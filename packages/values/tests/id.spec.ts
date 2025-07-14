import { type Result, unwrap } from '@mixor/core';
import { describe, expect, expectTypeOf, it } from 'vitest';

import * as Id from '../src/id';

// Test data for different ID types.
const validUUIDv4 = 'd89f8c77-90f3-4ab0-90dd-3c1bd3293870';
const invalidUUIDv4 = '123e4567-e89b-12d3-a456';
const validGUID = '550e8400-e29b-41d4-a716-446655440000';
const invalidGUID = 'invalid-guid';
const validCUID = 'ch72gsb320000udocl363eofy';
const invalidCUID = 'invalid-cuid';

describe('id', () => {
  describe('guid', () => {
    it('should run example id-001: Basic GUID validation', () => {
      const result = Id.guid(validGUID);
      expect(unwrap(result)).toBe(validGUID);

      // Typechecking.
      expectTypeOf(Id.guid).toEqualTypeOf<(value: string) => Result<string, 'INVALID_GUID'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_GUID'>>();
    });

    it('should run example id-002: Invalid GUID validation', () => {
      const result = Id.guid(invalidGUID);
      expect(unwrap(result)).toBe('INVALID_GUID');

      // Typechecking.
      expectTypeOf(Id.guid).toEqualTypeOf<(value: string) => Result<string, 'INVALID_GUID'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_GUID'>>();
    });
  });

  describe('cuid', () => {
    it('should run example id-003: Basic CUID validation', () => {
      const result = Id.cuid(validCUID);
      expect(unwrap(result)).toBe(validCUID);

      // Typechecking.
      expectTypeOf(Id.cuid).toEqualTypeOf<(value: string) => Result<string, 'INVALID_CUID'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_CUID'>>();
    });

    it('should run example id-004: Invalid CUID validation', () => {
      const result = Id.cuid(invalidCUID);
      expect(unwrap(result)).toBe('INVALID_CUID');

      // Typechecking.
      expectTypeOf(Id.cuid).toEqualTypeOf<(value: string) => Result<string, 'INVALID_CUID'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_CUID'>>();
    });
  });

  describe('uuidv4', () => {
    it('should return ok for valid UUID v4', () => {
      const result = Id.uuidv4(validUUIDv4);
      expect(unwrap(result)).toBe(validUUIDv4);

      // Typechecking.
      expectTypeOf(Id.uuidv4).toEqualTypeOf<(value: string) => Result<string, 'INVALID_UUIDV4'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_UUIDV4'>>();
    });

    it('should return err for invalid UUID v4', () => {
      const result = Id.uuidv4(invalidUUIDv4);
      expect(unwrap(result)).toBe('INVALID_UUIDV4');

      // Typechecking.
      expectTypeOf(Id.uuidv4).toEqualTypeOf<(value: string) => Result<string, 'INVALID_UUIDV4'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_UUIDV4'>>();
    });
  });
});
