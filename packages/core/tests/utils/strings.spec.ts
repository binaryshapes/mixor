import { describe, expect, it } from 'vitest';

import { toCamelCase, toPascalCase } from '../../src/utils';

describe('String Utils', () => {
  describe('toCamelCase', () => {
    it('should convert snake_case to camelCase', () => {
      expect(toCamelCase('hello_world')).toBe('helloWorld');
      expect(toCamelCase('my_variable_name')).toBe('myVariableName');
      expect(toCamelCase('first_second_third')).toBe('firstSecondThird');
    });

    it('should handle single word input', () => {
      expect(toCamelCase('hello')).toBe('hello');
      expect(toCamelCase('world')).toBe('world');
    });

    it('should handle empty string', () => {
      expect(toCamelCase('')).toBe('');
    });

    it('should remove non-alphanumeric characters', () => {
      expect(toCamelCase('hello-world')).toBe('helloworld');
      expect(toCamelCase('hello.world')).toBe('helloworld');
      expect(toCamelCase('hello@world')).toBe('helloworld');
    });

    it('should handle mixed case input', () => {
      expect(toCamelCase('Hello_World')).toBe('helloWorld');
      expect(toCamelCase('HELLO_WORLD')).toBe('helloWorld');
    });
  });

  describe('toPascalCase', () => {
    it('should convert snake_case to PascalCase', () => {
      expect(toPascalCase('hello_world')).toBe('HelloWorld');
      expect(toPascalCase('my_variable_name')).toBe('MyVariableName');
      expect(toPascalCase('first_second_third')).toBe('FirstSecondThird');
    });

    it('should handle single word input', () => {
      expect(toPascalCase('hello')).toBe('Hello');
      expect(toPascalCase('world')).toBe('World');
    });

    it('should handle empty string', () => {
      expect(toPascalCase('')).toBe('');
    });

    it('should remove non-alphanumeric characters', () => {
      expect(toPascalCase('hello-world')).toBe('Helloworld');
      expect(toPascalCase('hello.world')).toBe('Helloworld');
      expect(toPascalCase('hello@world')).toBe('Helloworld');
    });

    it('should handle mixed case input', () => {
      expect(toPascalCase('hello_world')).toBe('HelloWorld');
      expect(toPascalCase('HELLO_WORLD')).toBe('HelloWorld');
    });
  });
});
