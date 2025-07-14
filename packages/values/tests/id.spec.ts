import { Any, type Result, unwrap } from '@mixor/core';
import { describe, expect, expectTypeOf, it } from 'vitest';

import * as Id from '../src/id';

// Test data for different ID types.
const validGUID = '550e8400-e29b-41d4-a716-446655440000';
const invalidGUID = 'invalid-guid';
const validCUID = 'ch72gsb320000udocl363eofy';
const invalidCUID = 'invalid-cuid';
const validCUID2 = 'tfp0qj8q8q8q8q8q8q8q8q';
const invalidCUID2 = 'invalid-cuid2';
const validULID = '01arz3ndektsv4rrffq69g5fav';
const invalidULID = 'invalid-ulid';
const validXID = '9m4e2mr0ui3e8a215n4g';
const invalidXID = 'invalid-xid';
const validKSUID = '2zsoKss5fh8cxz6RqvW5JnAsRrL';
const invalidKSUID = 'invalid-ksuid';
const validNanoID = 'lEzamK162oGwBP5UOFwsB';
const invalidNanoID = 'invalid-nanoid';
const validUUIDv4 = 'd89f8c77-90f3-4ab0-90dd-3c1bd3293870';
const invalidUUIDv4 = '123e4567-e89b-12d3-a456';
const validUUIDv6 = '1f060fb7-9274-6580-8021-a4046fa53921';
const invalidUUIDv6 = 'invalid-uuidv6';
const validUUIDv7 = '01980af5-d96e-7e94-bc27-fe883cef550e';
const invalidUUIDv7 = 'invalid-uuidv7';
const validUUID = 'd89f8c77-90f3-4ab0-90dd-3c1bd3293870';
const invalidUUID = 'invalid-uuid';

describe('id', () => {
  describe('factory function', () => {
    it('should run example id-021: Create a validator for UUID v4 and use it', () => {
      const uuidValidator = Id.id('uuidv4');
      const result = uuidValidator('d89f8c77-90f3-4ab0-90dd-3c1bd3293870');
      expect(unwrap(result)).toBe('d89f8c77-90f3-4ab0-90dd-3c1bd3293870');

      // Typechecking.
      expectTypeOf(Id.id).toBeFunction();
      expectTypeOf(uuidValidator).toEqualTypeOf<
        (value: string) => Result<string, 'INVALID_UUIDV4'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_UUIDV4'>>();
    });

    it('should run example id-022: Create a validator for GUID and use it', () => {
      const guidValidator = Id.id('guid');
      const result = guidValidator('550e8400-e29b-41d4-a716-446655440000');
      expect(unwrap(result)).toBe('550e8400-e29b-41d4-a716-446655440000');

      // Typechecking.
      expectTypeOf(Id.id).toBeFunction();
      expectTypeOf(guidValidator).toEqualTypeOf<
        (value: string) => Result<string, 'INVALID_GUID'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_GUID'>>();
    });

    it('should run example id-023: Validate an invalid value with a UUID v4 validator', () => {
      const customValidator = Id.id('uuidv4');
      const result = customValidator('invalid-uuid');
      expect(unwrap(result)).toBe('INVALID_UUIDV4');

      // Typechecking.
      expectTypeOf(Id.id).toBeFunction();
      expectTypeOf(customValidator).toEqualTypeOf<
        (value: string) => Result<string, 'INVALID_UUIDV4'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_UUIDV4'>>();
    });

    it('should run example id-024: Throw error if the type is not supported', () => {
      try {
        // @ts-expect-error - Invalid ID type.
        Id.id('notype')('test');
        throw new Error('Should have thrown');
      } catch (e: Any) {
        expect(e).toBeInstanceOf(Id.IdError);
        expect(e.key).toBe('ID_ERROR:INVALID_ID_TYPE');
        expect(e.message).toContain("ID type 'notype' is not supported");
      }
    });
  });

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

  describe('cuid2', () => {
    it('should run example id-005: Basic CUID2 validation', () => {
      const result = Id.cuid2(validCUID2);
      expect(unwrap(result)).toBe(validCUID2);

      // Typechecking.
      expectTypeOf(Id.cuid2).toEqualTypeOf<(value: string) => Result<string, 'INVALID_CUID2'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_CUID2'>>();
    });

    it('should run example id-006: Invalid CUID2 validation', () => {
      const result = Id.cuid2(invalidCUID2);
      expect(unwrap(result)).toBe('INVALID_CUID2');

      // Typechecking.
      expectTypeOf(Id.cuid2).toEqualTypeOf<(value: string) => Result<string, 'INVALID_CUID2'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_CUID2'>>();
    });
  });

  describe('ulid', () => {
    it('should run example id-007: Basic ULID validation', () => {
      const result = Id.ulid(validULID);
      expect(unwrap(result)).toBe(validULID);

      // Typechecking.
      expectTypeOf(Id.ulid).toEqualTypeOf<(value: string) => Result<string, 'INVALID_ULID'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_ULID'>>();
    });

    it('should run example id-008: Invalid ULID validation', () => {
      const result = Id.ulid(invalidULID);
      expect(unwrap(result)).toBe('INVALID_ULID');

      // Typechecking.
      expectTypeOf(Id.ulid).toEqualTypeOf<(value: string) => Result<string, 'INVALID_ULID'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_ULID'>>();
    });
  });

  describe('xid', () => {
    it('should run example id-009: Basic XID validation', () => {
      const result = Id.xid(validXID);
      expect(unwrap(result)).toBe(validXID);

      // Typechecking.
      expectTypeOf(Id.xid).toEqualTypeOf<(value: string) => Result<string, 'INVALID_XID'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_XID'>>();
    });

    it('should run example id-010: Invalid XID validation', () => {
      const result = Id.xid(invalidXID);
      expect(unwrap(result)).toBe('INVALID_XID');

      // Typechecking.
      expectTypeOf(Id.xid).toEqualTypeOf<(value: string) => Result<string, 'INVALID_XID'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_XID'>>();
    });
  });

  describe('ksuid', () => {
    it('should run example id-011: Basic KSUID validation', () => {
      const result = Id.ksuid(validKSUID);
      expect(unwrap(result)).toBe(validKSUID);

      // Typechecking.
      expectTypeOf(Id.ksuid).toEqualTypeOf<(value: string) => Result<string, 'INVALID_KSUID'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_KSUID'>>();
    });

    it('should run example id-012: Invalid KSUID validation', () => {
      const result = Id.ksuid(invalidKSUID);
      expect(unwrap(result)).toBe('INVALID_KSUID');

      // Typechecking.
      expectTypeOf(Id.ksuid).toEqualTypeOf<(value: string) => Result<string, 'INVALID_KSUID'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_KSUID'>>();
    });
  });

  describe('nanoid', () => {
    it('should run example id-013: Basic Nano ID validation', () => {
      const result = Id.nanoid(validNanoID);
      expect(unwrap(result)).toBe(validNanoID);

      // Typechecking.
      expectTypeOf(Id.nanoid).toEqualTypeOf<(value: string) => Result<string, 'INVALID_NANOID'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_NANOID'>>();
    });

    it('should run example id-014: Invalid Nano ID validation', () => {
      const result = Id.nanoid(invalidNanoID);
      expect(unwrap(result)).toBe('INVALID_NANOID');

      // Typechecking.
      expectTypeOf(Id.nanoid).toEqualTypeOf<(value: string) => Result<string, 'INVALID_NANOID'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_NANOID'>>();
    });
  });

  describe('uuidv4', () => {
    it('should run example id-015: Basic UUID v4 validation', () => {
      const result = Id.uuidv4(validUUIDv4);
      expect(unwrap(result)).toBe(validUUIDv4);

      // Typechecking.
      expectTypeOf(Id.uuidv4).toEqualTypeOf<(value: string) => Result<string, 'INVALID_UUIDV4'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_UUIDV4'>>();
    });

    it('should run example id-016: Invalid UUID v4 validation', () => {
      const result = Id.uuidv4(invalidUUIDv4);
      expect(unwrap(result)).toBe('INVALID_UUIDV4');

      // Typechecking.
      expectTypeOf(Id.uuidv4).toEqualTypeOf<(value: string) => Result<string, 'INVALID_UUIDV4'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_UUIDV4'>>();
    });
  });

  describe('uuidv6', () => {
    it('should run example id-017: Basic UUID v6 validation', () => {
      const result = Id.uuidv6(validUUIDv6);
      expect(unwrap(result)).toBe(validUUIDv6);

      // Typechecking.
      expectTypeOf(Id.uuidv6).toEqualTypeOf<(value: string) => Result<string, 'INVALID_UUIDV6'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_UUIDV6'>>();
    });

    it('should run example id-018: Invalid UUID v6 validation', () => {
      const result = Id.uuidv6(invalidUUIDv6);
      expect(unwrap(result)).toBe('INVALID_UUIDV6');

      // Typechecking.
      expectTypeOf(Id.uuidv6).toEqualTypeOf<(value: string) => Result<string, 'INVALID_UUIDV6'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_UUIDV6'>>();
    });
  });

  describe('uuidv7', () => {
    it('should run example id-019: Basic UUID v7 validation', () => {
      const result = Id.uuidv7(validUUIDv7);
      expect(unwrap(result)).toBe(validUUIDv7);

      // Typechecking.
      expectTypeOf(Id.uuidv7).toEqualTypeOf<(value: string) => Result<string, 'INVALID_UUIDV7'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_UUIDV7'>>();
    });

    it('should run example id-020: Invalid UUID v7 validation', () => {
      const result = Id.uuidv7(invalidUUIDv7);
      expect(unwrap(result)).toBe('INVALID_UUIDV7');

      // Typechecking.
      expectTypeOf(Id.uuidv7).toEqualTypeOf<(value: string) => Result<string, 'INVALID_UUIDV7'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_UUIDV7'>>();
    });
  });

  describe('uuid', () => {
    it('should run example id-025: Basic UUID validation with any version', () => {
      const result = Id.uuid(validUUID);
      expect(unwrap(result)).toBe(validUUID);

      // Typechecking.
      expectTypeOf(Id.uuid).toEqualTypeOf<(value: string) => Result<string, 'INVALID_UUID'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_UUID'>>();
    });

    it('should run example id-026: UUID v6 validation', () => {
      const result = Id.uuid(validUUIDv6);
      expect(unwrap(result)).toBe(validUUIDv6);

      // Typechecking.
      expectTypeOf(Id.uuid).toEqualTypeOf<(value: string) => Result<string, 'INVALID_UUID'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_UUID'>>();
    });

    it('should run example id-027: UUID v7 validation', () => {
      const result = Id.uuid(validUUIDv7);
      expect(unwrap(result)).toBe(validUUIDv7);

      // Typechecking.
      expectTypeOf(Id.uuid).toEqualTypeOf<(value: string) => Result<string, 'INVALID_UUID'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_UUID'>>();
    });

    it('should run example id-028: Invalid UUID validation', () => {
      const result = Id.uuid(invalidUUID);
      expect(unwrap(result)).toBe('INVALID_UUID');

      // Typechecking.
      expectTypeOf(Id.uuid).toEqualTypeOf<(value: string) => Result<string, 'INVALID_UUID'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_UUID'>>();
    });
  });
});
