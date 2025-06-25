import { describe, expect, it } from 'vitest';

import { Panic, PanicError } from '../src/panic';

describe('Panic', () => {
  describe('PanicError', () => {
    it('should create a panic error with correct properties', () => {
      const error = new PanicError('TEST', 'INVALID_STATE', 'Something went wrong');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PanicError);
      expect(error.name).toBe('Panic');
      expect(error.message).toBe('Something went wrong');
      expect(error.key).toBe('TEST:INVALID_STATE');
    });

    it('should have readonly key property', () => {
      const error = new PanicError('SCOPE', 'TAG', 'Message');
      // @ts-expect-error key should be readonly
      error.key = 'NEW:KEY';
      // No runtime assertion, as readonly is only enforced at compile time
    });

    it('should work with different scope and tag combinations', () => {
      const error1 = new PanicError('AUTH', 'INVALID_TOKEN', 'Token is invalid');
      const error2 = new PanicError('DB', 'CONNECTION_FAILED', 'Database connection failed');

      expect(error1.key).toBe('AUTH:INVALID_TOKEN');
      expect(error2.key).toBe('DB:CONNECTION_FAILED');
    });

    it('should maintain proper inheritance chain', () => {
      const error = new PanicError('TEST', 'ERROR', 'Test error');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PanicError);
      expect(Object.getPrototypeOf(error)).toBe(PanicError.prototype);
    });
  });

  describe('Panic factory', () => {
    it('should create a panic factory for a given scope', () => {
      const TestPanic = Panic('TEST');
      const error = new TestPanic('INVALID_STATE', 'Something went wrong');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PanicError);
      expect(error.name).toBe('Panic');
      expect(error.message).toBe('Something went wrong');
      expect(error.key).toBe('TEST:INVALID_STATE');
    });

    it('should create different panic factories for different scopes', () => {
      const AuthPanic = Panic('AUTH');
      const DbPanic = Panic('DB');

      const authError = new AuthPanic('INVALID_TOKEN', 'Token is invalid');
      const dbError = new DbPanic('CONNECTION_FAILED', 'Database connection failed');

      expect(authError.key).toBe('AUTH:INVALID_TOKEN');
      expect(dbError.key).toBe('DB:CONNECTION_FAILED');
    });

    it('should enforce uppercase scope and tag types', () => {
      const TestPanic = Panic('TEST');

      // These should work with uppercase strings
      const error1 = new TestPanic('ERROR', 'Test error');
      const error2 = new TestPanic('INVALID_STATE', 'Invalid state');

      expect(error1.key).toBe('TEST:ERROR');
      expect(error2.key).toBe('TEST:INVALID_STATE');
    });

    it('should create panic errors that can be thrown', () => {
      const TestPanic = Panic('TEST');
      const error = new TestPanic('THROWABLE', 'This can be thrown');

      expect(() => {
        throw error;
      }).toThrow(TestPanic);
      expect(() => {
        throw error;
      }).toThrow('This can be thrown');
    });

    it('should maintain proper inheritance for factory-created errors', () => {
      const TestPanic = Panic('TEST');
      const error = new TestPanic('ERROR', 'Test error');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PanicError);
      expect(error).toBeInstanceOf(TestPanic);
    });
  });

  describe('Error behavior', () => {
    it('should stack trace work correctly', () => {
      const TestPanic = Panic('TEST');

      let error: InstanceType<typeof TestPanic>;
      try {
        throw new TestPanic('ERROR', 'Test error');
      } catch (e) {
        error = e as InstanceType<typeof TestPanic>;
      }

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('panic.spec.ts');
    });

    it('should be serializable', () => {
      const error = new PanicError('TEST', 'ERROR', 'Test error');
      const serialized = JSON.stringify(error);
      const parsed = JSON.parse(serialized);

      expect(parsed.name).toBe('Panic');
      expect(parsed.message).toBe('Test error');
      expect(parsed.key).toBe('TEST:ERROR');
    });
  });
});
