import { describe, expect, expectTypeOf, it } from 'vitest';

import { hash } from '../src/hash.js';

describe('hash', () => {
  describe('Basic functionality', () => {
    it('should create a hash from a string', () => {
      const result = hash('Hello', 'World');
      expect(result).toBeTypeOf('string');
      expect(result).toHaveLength(64); // SHA-256 hex length.
    });

    it('should create a hash from multiple arguments', () => {
      const result = hash({ name: 'John', age: 30 }, 'Hello', 'World');
      expect(result).toBeTypeOf('string');
      expect(result).toHaveLength(64);
    });

    it('should create a hash from a function', () => {
      const result = hash((age: number) => (age >= 18 ? 'ok' : 'err'));
      expect(result).toBeTypeOf('string');
      expect(result).toHaveLength(64);
    });
  });

  describe('Advanced functionality', () => {
    it('should handle arrays correctly', () => {
      const result = hash([1, 2, 3], 'test');
      expect(result).toBeTypeOf('string');
      expect(result).toHaveLength(64);
    });

    it('should handle nested objects', () => {
      const result = hash({
        user: {
          name: 'John',
          details: { age: 30, city: 'NYC' },
        },
      });
      expect(result).toBeTypeOf('string');
      expect(result).toHaveLength(64);
    });

    it('should handle mixed types', () => {
      const result = hash('string', 123, true, null, undefined, [1, 2], { key: 'value' });
      expect(result).toBeTypeOf('string');
      expect(result).toHaveLength(64);
    });

    it('should produce consistent hashes for same input', () => {
      const input = ['Hello', 'World', { name: 'John' }];
      const hash1 = hash(...input);
      const hash2 = hash(...input);
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different input', () => {
      const hash1 = hash('Hello', 'World');
      const hash2 = hash('Hello', 'World!');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty arguments', () => {
      const result = hash();
      expect(result).toBeTypeOf('string');
      expect(result).toHaveLength(64);
    });

    it('should handle single empty string', () => {
      const result = hash('');
      expect(result).toBeTypeOf('string');
      expect(result).toHaveLength(64);
    });

    it('should handle empty arrays', () => {
      const result = hash([]);
      expect(result).toBeTypeOf('string');
      expect(result).toHaveLength(64);
    });

    it('should handle empty objects', () => {
      const result = hash({});
      expect(result).toBeTypeOf('string');
      expect(result).toHaveLength(64);
    });

    it('should handle null and undefined', () => {
      const result = hash(null, undefined);
      expect(result).toBeTypeOf('string');
      expect(result).toHaveLength(64);
    });

    it('should handle special characters in strings', () => {
      const result = hash('Hello\nWorld\tTest\r');
      expect(result).toBeTypeOf('string');
      expect(result).toHaveLength(64);
    });

    it('should handle unicode characters', () => {
      const result = hash('Hello 世界 🌍');
      expect(result).toBeTypeOf('string');
      expect(result).toHaveLength(64);
    });
  });

  describe('Code examples', () => {
    it('should handle basic usage example from documentation', () => {
      // Create a hash from a string.
      const stringHash = hash('Hello', 'World');
      expect(stringHash).toBeTypeOf('string');
      expect(stringHash).toHaveLength(64);
    });

    it('should handle intermediate usage example from documentation', () => {
      // Create a hash from multiple arguments.
      const objectHash = hash({ name: 'John', age: 30 }, 'Hello', 'World');
      expect(objectHash).toBeTypeOf('string');
      expect(objectHash).toHaveLength(64);
    });

    it('should handle advanced usage example from documentation', () => {
      // Create a hash a function.
      const functionHash = hash((age: number) => (age >= 18 ? 'ok' : 'err'));
      expect(functionHash).toBeTypeOf('string');
      expect(functionHash).toHaveLength(64);
    });
  });

  describe('TypeScript support', () => {
    it('should have correct function signature', () => {
      expectTypeOf(hash).toBeFunction();
      expectTypeOf(hash).parameter(0).toBeUnknown();
      expectTypeOf(hash).returns.toBeString();
    });

    it('should accept any number of arguments', () => {
      expectTypeOf(hash).toBeFunction();
      expectTypeOf(hash).parameter(0).toBeUnknown();
      expectTypeOf(hash).parameter(1).toBeUnknown();
      expectTypeOf(hash).parameter(2).toBeUnknown();
    });

    it('should return string type', () => {
      const result = hash('test');
      expectTypeOf(result).toBeString();
    });

    it('should handle various input types', () => {
      const stringResult = hash('string');
      const numberResult = hash(123);
      const booleanResult = hash(true);
      const arrayResult = hash([1, 2, 3]);
      const objectResult = hash({ key: 'value' });
      const functionResult = hash(() => 'test');

      expectTypeOf(stringResult).toBeString();
      expectTypeOf(numberResult).toBeString();
      expectTypeOf(booleanResult).toBeString();
      expectTypeOf(arrayResult).toBeString();
      expectTypeOf(objectResult).toBeString();
      expectTypeOf(functionResult).toBeString();
    });
  });
});
