import { describe, expect, expectTypeOf, it } from 'vitest';

import { aggregate } from '../src/aggregate';
import { type Result, err, isErr, isOk, ok } from '../src/result';
import { schema } from '../src/schema';
import { rule, value } from '../src/value';

const userSchema = schema({
  id: value(rule((id: string) => (id.length > 0 ? ok(id) : err('INVALID_ID')))),
  name: value(
    rule((name: string) => (name.length > 0 ? ok(name) : err('INVALID_NAME'))),
    rule((name: string) => (name.length < 16 ? ok(name) : err('INVALID_NAME_LENGTH'))),
  ),
  email: value(rule((email: string) => (email.includes('@') ? ok(email) : err('INVALID_EMAIL')))),
});

const User = aggregate({
  schema: userSchema,
  methods: ({ self, fn }) => ({
    updateName: fn((name: string) => self.set('name', name)),
    updateEmail: fn((email: string) => self.set('email', email)),
  }),
});

describe('aggregate', () => {
  describe('Basic functionality', () => {
    it('should create an aggregate with schema validation', () => {
      const userResult = User({ id: '1', name: 'John', email: 'john@example.com' });

      expect(isOk(userResult)).toBe(true);
      if (isOk(userResult)) {
        const user = userResult.value;
        expect(user.getState()).toEqual({ id: '1', name: 'John', email: 'john@example.com' });
        expect(user.id).toBe('1');
        expect(user.name).toBe('John');
        expect(user.email).toBe('john@example.com');
      }
    });

    it('should handle validation errors when creating aggregate', () => {
      const userResult = User({ id: '', name: '', email: 'invalid' });

      expect(isErr(userResult)).toBe(true);
    });

    it('should allow updating aggregate state through methods', () => {
      const userResult = User({ id: '1', name: 'John', email: 'john@example.com' });

      if (isOk(userResult)) {
        const user = userResult.value;
        const updateResult = user.updateName('Jane');

        expect(isOk(updateResult)).toBe(true);
        if (isOk(updateResult)) {
          expect(user.getState().name).toBe('Jane');
        }
      }
    });

    it('should handle validation errors in set method', () => {
      const userResult = User({ id: '1', name: 'John', email: 'john@example.com' });

      if (isOk(userResult)) {
        const user = userResult.value;
        const updateResult = user.updateName('');

        expect(isErr(updateResult)).toBe(true);
        if (isErr(updateResult)) {
          expect(updateResult.error).toEqual(['INVALID_NAME']);
        }
      }
    });
  });

  describe('Error handling', () => {
    it('should handle invalid configuration', () => {
      expect(() => {
        // @ts-expect-error - Test invalid configuration
        aggregate(null);
      }).toThrow();
    });

    it('should handle methods without config.methods', () => {
      // @ts-expect-error - Test invalid configuration
      const User = aggregate({ schema: userSchema });

      const userResult = User({ id: '1', name: 'John', email: 'john@example.com' });

      expect(isOk(userResult)).toBe(true);
      if (isOk(userResult)) {
        const user = userResult.value;
        expect(user.getState()).toEqual({ id: '1', name: 'John', email: 'john@example.com' });
      }
    });
  });

  describe('Type safety', () => {
    it('should provide correct type inference for all public elements', () => {
      // Test aggregate function
      expectTypeOf(aggregate).toBeFunction();
    });

    it('should validate aggregate function signature', () => {
      const User = aggregate({
        schema: userSchema,
        methods: ({ self, fn }) => ({
          updateName: fn((name: string) => self.set('name', name)),
        }),
      });

      expectTypeOf(User).toBeFunction();
    });

    it('should validate aggregate instance types', () => {
      const userResult = User({ id: '1', name: 'John', email: 'john@example.com' });

      if (isOk(userResult)) {
        const user = userResult.value;
        expectTypeOf(user.getState).toBeFunction();
        expectTypeOf(user.updateName).toBeFunction();
        expectTypeOf(user.updateEmail).toBeFunction();
        expectTypeOf(user.id).toBeString();
        expectTypeOf(user.name).toBeString();
      }
    });

    it('should validate correct error types in all mode', () => {
      const userResult = User({ id: '1', name: 'John', email: 'john@example.com' }, 'all');

      if (isOk(userResult)) {
        const user = userResult.value;
        const updateResult = user.updateName('test');

        // In 'all' mode, the error type should be an array of the union of all possible errors
        expectTypeOf(updateResult).toEqualTypeOf<
          Result<
            { id: string; name: string; email: string },
            // Should be an array of errors.
            ('INVALID_NAME' | 'INVALID_NAME_LENGTH')[]
          >
        >();
      }
    });

    it('should validate correct error types in strict mode', () => {
      const userResult = User({ id: '1', name: 'John', email: 'john@example.com' }, 'strict');

      if (isOk(userResult)) {
        const user = userResult.value;
        const updateResult = user.updateName('test');

        expectTypeOf(updateResult).toEqualTypeOf<
          Result<
            { id: string; name: string; email: string },
            // Should not be an array of errors.
            'INVALID_NAME' | 'INVALID_NAME_LENGTH'
          >
        >();
      }
    });
  });
});
