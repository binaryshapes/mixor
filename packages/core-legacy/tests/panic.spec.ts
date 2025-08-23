import { describe, expect, it } from 'vitest';

import { PanicError, panic } from '../src/panic';

describe('Panic', () => {
  describe('PanicError', () => {
    it('should create a panic error with correct properties', () => {
      const error = new PanicError('Test', 'InvalidState', 'Something went wrong');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PanicError);
      expect(error.name).toBe('Panic');
      expect(error.message).toBe('Something went wrong');
      expect(error.code).toBe('Test:InvalidState');
    });

    it('should have readonly key property', () => {
      const error = new PanicError('Scope', 'Tag', 'Message');
      // @ts-expect-error key should be readonly
      error.code = 'NewKey';
      // No runtime assertion, as readonly is only enforced at compile time
    });

    it('should work with different scope and tag combinations', () => {
      const error1 = new PanicError('Auth', 'InvalidToken', 'Token is invalid');
      const error2 = new PanicError('Db', 'ConnectionFailed', 'Database connection failed');

      expect(error1.code).toBe('Auth:InvalidToken');
      expect(error2.code).toBe('Db:ConnectionFailed');
    });

    it('should maintain proper inheritance chain', () => {
      const error = new PanicError('Test', 'Error', 'Test error');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PanicError);
      expect(Object.getPrototypeOf(error)).toBe(PanicError.prototype);
    });
  });

  describe('Panic factory', () => {
    it('should create a panic factory for a given scope', () => {
      const TestPanic = panic('Test');
      const error = new TestPanic('InvalidState', 'Something went wrong');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PanicError);
      expect(error.name).toBe('Panic');
      expect(error.message).toBe('Something went wrong');
      expect(error.code).toBe('Test:InvalidState');
    });

    it('should create different panic factories for different scopes', () => {
      const AuthPanic = panic('Auth');
      const DbPanic = panic('Db');

      const authError = new AuthPanic('InvalidToken', 'Token is invalid');
      const dbError = new DbPanic('ConnectionFailed', 'Database connection failed');

      expect(authError.code).toBe('Auth:InvalidToken');
      expect(dbError.code).toBe('Db:ConnectionFailed');
    });

    it('should enforce uppercase scope and tag types', () => {
      const TestPanic = panic('Test');

      // These should work with uppercase strings
      const error1 = new TestPanic('Error', 'Test error');
      const error2 = new TestPanic('InvalidState', 'Invalid state');

      expect(error1.code).toBe('Test:Error');
      expect(error2.code).toBe('Test:InvalidState');
    });

    it('should create panic errors that can be thrown', () => {
      const TestPanic = panic('Test');
      const error = new TestPanic('Throwable', 'This can be thrown');

      expect(() => {
        throw error;
      }).toThrow(TestPanic);
      expect(() => {
        throw error;
      }).toThrow('This can be thrown');
    });

    it('should maintain proper inheritance for factory-created errors', () => {
      const TestPanic = panic('Test');
      const error = new TestPanic('Error', 'Test error');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PanicError);
      expect(error).toBeInstanceOf(TestPanic);
    });
  });

  describe('Error behavior', () => {
    it('should stack trace work correctly', () => {
      const TestPanic = panic('Test');

      let error: InstanceType<typeof TestPanic>;
      try {
        throw new TestPanic('Error', 'Test error');
      } catch (e) {
        error = e as InstanceType<typeof TestPanic>;
      }

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('panic.spec.ts');
    });

    it('should be serializable', () => {
      const error = new PanicError('Test', 'Error', 'Test error');
      const serialized = JSON.stringify(error);
      const parsed = JSON.parse(serialized);

      expect(parsed.name).toBe('Panic');
      expect(parsed.message).toBe('Test error');
      expect(parsed.code).toBe('Test:Error');
    });
  });
});
