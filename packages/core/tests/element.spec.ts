import { describe, expect, expectTypeOf, it } from 'vitest';

import { type ElementsTags, element, getElementMeta } from '../src/element';
import type { Any } from '../src/generics';

describe('Element', () => {
  describe('Basic functionality', () => {
    it('should create an element with metadata', () => {
      const userData = { name: 'John', age: 30 };
      const elementInstance = element(userData, {
        hash: 'user-123',
        tag: 'Value',
        doc: 'User information element',
      });

      expect(elementInstance).toBeDefined();
      expect(elementInstance.name).toBe('John');
      expect(elementInstance.age).toBe(30);
      expect((elementInstance as Any)['~meta']).toBeDefined();
      expect((elementInstance as Any)['~meta']._tag).toBe('Value');
      expect((elementInstance as Any)['~meta']._hash).toBe('user-123');
      expect((elementInstance as Any)['~meta']._doc).toBe('User information element');
      expect(typeof (elementInstance as Any)['~meta']._id).toBe('string');
    });

    it('should create an element without documentation', () => {
      const configData = { port: 8080, host: 'localhost' };
      const elementInstance = element(configData, {
        hash: 'config-456',
        tag: 'Schema',
      });

      expect(elementInstance).toBeDefined();
      expect(elementInstance.port).toBe(8080);
      expect(elementInstance.host).toBe('localhost');
      expect((elementInstance as Any)['~meta']).toBeDefined();
      expect((elementInstance as Any)['~meta']._tag).toBe('Schema');
      expect((elementInstance as Any)['~meta']._hash).toBe('config-456');
      expect((elementInstance as Any)['~meta']._doc).toBeUndefined();
    });

    it('should generate unique ids for each element', () => {
      const data1 = { value: 'test1' };
      const data2 = { value: 'test2' };

      const element1 = element(data1, { hash: 'hash1', tag: 'Value' });
      const element2 = element(data2, { hash: 'hash2', tag: 'Value' });

      expect((element1 as Any)['~meta']._id).not.toBe((element2 as Any)['~meta']._id);
    });

    it('should preserve original object properties', () => {
      const complexData = {
        id: '123',
        name: 'John',
        details: {
          age: 30,
          email: 'john@example.com',
        },
        tags: ['user', 'active'],
      };

      const elementInstance = element(complexData, {
        hash: 'complex-123',
        tag: 'Aggregate',
        doc: 'Complex user data',
      });

      expect(elementInstance.id).toBe('123');
      expect(elementInstance.name).toBe('John');
      expect(elementInstance.details.age).toBe(30);
      expect(elementInstance.details.email).toBe('john@example.com');
      expect(elementInstance.tags).toEqual(['user', 'active']);
    });
  });

  describe('Type safety', () => {
    it('should provide correct type inference for all public elements', () => {
      // Test element function
      expectTypeOf(element).toBeFunction();

      // Parameters of element function.
      expectTypeOf<Parameters<typeof element>[0]>().toBeUnknown();
      expectTypeOf<Parameters<typeof element>[1]>().toEqualTypeOf<{
        hash: string;
        tag: ElementsTags;
        doc?: string;
      }>();

      // Test getElementMeta function
      expectTypeOf(getElementMeta).toBeFunction();
    });

    it('should validate function signatures', () => {
      // Test element function with different tags using fresh objects
      expectTypeOf(element).toBeFunction();

      const testData1 = { value: 'test1' };
      const testData2 = { value: 'test2' };
      const testData3 = { value: 'test3' };
      const testData4 = { value: 'test4' };

      expectTypeOf(element(testData1, { hash: 'test1', tag: 'Value' })).toBeObject();
      expectTypeOf(element(testData2, { hash: 'test2', tag: 'Aggregate' })).toBeObject();
      expectTypeOf(element(testData3, { hash: 'test3', tag: 'Event' })).toBeObject();
      expectTypeOf(element(testData4, { hash: 'test4', tag: 'Schema' })).toBeObject();
    });
  });

  describe('Code examples', () => {
    it('should run example element-001: Basic element creation with required metadata', () => {
      const userData = { name: 'John', age: 30 };
      const elementInstance = element(userData, {
        hash: 'user-123',
        tag: 'Value',
        doc: 'User information element',
      });

      expect(elementInstance).toBeDefined();
      expect(elementInstance.name).toBe('John');
      expect(elementInstance.age).toBe(30);
      expect((elementInstance as Any)['~meta']._tag).toBe('Value');
      expect((elementInstance as Any)['~meta']._hash).toBe('user-123');
      expect((elementInstance as Any)['~meta']._doc).toBe('User information element');
      expect(typeof (elementInstance as Any)['~meta']._id).toBe('string');
    });

    it('should run example element-002: Element creation without documentation', () => {
      const configData = { port: 8080, host: 'localhost' };
      const elementInstance = element(configData, {
        hash: 'config-456',
        tag: 'Schema',
      });

      expect(elementInstance).toBeDefined();
      expect(elementInstance.port).toBe(8080);
      expect(elementInstance.host).toBe('localhost');
      expect((elementInstance as Any)['~meta']._tag).toBe('Schema');
      expect((elementInstance as Any)['~meta']._hash).toBe('config-456');
      expect((elementInstance as Any)['~meta']._doc).toBeUndefined();
    });

    it('should run example element-003: Retrieving element metadata', () => {
      const userData = { name: 'John', age: 30 };
      const elementInstance = element(userData, {
        hash: 'user-123',
        tag: 'Value',
        doc: 'User information',
      });
      const metadata = getElementMeta(elementInstance);

      expect(metadata).toBeDefined();
      expect(metadata._tag).toBe('Value');
      expect(metadata._hash).toBe('user-123');
      expect(metadata._doc).toBe('User information');
      expect(typeof metadata._id).toBe('string');
    });
  });
});
