import { Pipeline } from '../src/pipeline';
import { isSuccess, success } from '../src/result';

describe('Pipeline if', () => {
  describe('Basic if operations', () => {
    it('should execute the then branch when condition is true', async () => {
      const result = await Pipeline.from(success(42))
        .if({
          predicate: (value: number) => value > 40,
          onTrue: (value: number) => success(value * 2),
          onFalse: (value: number) => success(value / 2),
        })
        .run();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toBe(84);
      }
    });

    it('should execute the else branch when condition is false', async () => {
      const result = await Pipeline.from(success(42))
        .if({
          predicate: (value: number) => value < 40,
          onTrue: (value: number) => success(value * 2),
          onFalse: (value: number) => success(value / 2),
        })
        .run();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toBe(21);
      }
    });

    it('should handle async conditions', async () => {
      const result = await Pipeline.from(success(42))
        .if({
          predicate: async (value: number) => {
            await new Promise((resolve) => setTimeout(resolve, 100));
            return value > 40;
          },
          onTrue: (value: number) => success(value * 2),
          onFalse: (value: number) => success(value / 2),
        })
        .run();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toBe(84);
      }
    });
  });

  describe('if with bind operations', () => {
    it('should bind different values based on condition', async () => {
      const result = await Pipeline.from(success(42))
        .bind('value', (value: number) => success(value))
        .if({
          predicate: ({ value }: { value: number }) => value > 40,
          onTrue: ({ value }: { value: number }) => success({ status: 'high', result: value * 2 }),
          onFalse: ({ value }: { value: number }) => success({ status: 'low', result: value / 2 }),
        })
        .run();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toEqual({
          status: 'high',
          result: 84,
        });
      }
    });

    it('should handle nested if conditions', async () => {
      const result = await Pipeline.from(success(42))
        .if({
          predicate: (value: number) => value > 40,
          onTrue: (value: number) =>
            Pipeline.from(success(value))
              .if({
                predicate: (v: number) => v > 80,
                onTrue: (v: number) => success({ status: 'very high', value: v }),
                onFalse: (v: number) => success({ status: 'high', value: v }),
              })
              .run(),
          onFalse: (value: number) => success({ status: 'low', value: value / 2 }),
        })
        .run();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toEqual({
          status: 'high',
          value: 42,
        });
      }
    });
  });

  describe('if with complex scenarios', () => {
    it('should handle multiple conditions with bindAll', async () => {
      const result = await Pipeline.from(success(42))
        .bind('age', () => success(25))
        .if({
          predicate: ({ age }: { age: number }) => age >= 18,
          onTrue: ({ age }: { age: number }) =>
            Pipeline.from(success(age))
              .bindAll('user', () => ({
                name: () => success('John'),
                status: () => success('adult'),
                permissions: () => success(['read', 'write']),
              }))
              .run(),
          onFalse: ({ age }: { age: number }) =>
            Pipeline.from(success(age))
              .bindAll('user', () => ({
                name: () => success('John'),
                status: () => success('minor'),
                permissions: () => success(['read']),
              }))
              .run(),
        })
        .run();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toEqual({
          user: {
            name: 'John',
            status: 'adult',
            permissions: ['read', 'write'],
          },
        });
      }
    });

    it('should handle async operations in both branches', async () => {
      const result = await Pipeline.from(success(42))
        .if({
          predicate: (value: number) => value > 40,
          onTrue: async (value: number) => {
            await new Promise((resolve) => setTimeout(resolve, 100));
            return success(value * 2);
          },
          onFalse: async (value: number) => {
            await new Promise((resolve) => setTimeout(resolve, 100));
            return success(value / 2);
          },
        })
        .run();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toBe(84);
      }
    });
  });

  describe('if with error handling', () => {
    it('should propagate errors from the condition', async () => {
      const result = await Pipeline.from(success(42))
        .if({
          predicate: () => {
            throw new Error('Condition error');
          },
          onTrue: (value: number) => success(value * 2),
          onFalse: (value: number) => success(value / 2),
        })
        .mapFailure((error: unknown) => error as Error)
        .run();

      expect(isSuccess(result)).toBe(false);
      if (!isSuccess(result)) {
        expect(result.cause).toBeInstanceOf(Error);
        expect(result.cause.message).toBe('Condition error');
      }
    });

    it('should propagate errors from the branches', async () => {
      const result = await Pipeline.from(success(42))
        .if({
          predicate: (value: number) => value > 40,
          onTrue: () => {
            throw new Error('Branch error');
          },
          onFalse: (value: number) => success(value / 2),
        })
        .mapFailure((error: unknown) => error as Error)
        .run();

      expect(isSuccess(result)).toBe(false);
      if (!isSuccess(result)) {
        expect(result.cause).toBeInstanceOf(Error);
        expect(result.cause.message).toBe('Branch error');
      }
    });
  });

  describe('if with complex predicates', () => {
    it('should handle predicates with multiple conditions', async () => {
      const result = await Pipeline.from(success({ age: 25, role: 'admin' }))
        .if({
          predicate: (value) => value.age >= 18 && value.role === 'admin',
          onTrue: () => success('full access'),
          onFalse: () => success('restricted access'),
        })
        .run();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toBe('full access');
      }
    });

    it('should handle predicates with async operations', async () => {
      const checkRole = async (role: string): Promise<boolean> => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return role === 'admin';
      };

      const result = await Pipeline.from(success({ role: 'admin' }))
        .if({
          predicate: async (value) => await checkRole(value.role),
          onTrue: () => success('is admin'),
          onFalse: () => success('not admin'),
        })
        .run();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toBe('is admin');
      }
    });
  });

  describe('if with complex transformations', () => {
    it('should handle complex object transformations', async () => {
      type User = { id: string; name: string; age: number };
      type UserView = { displayName: string; isAdult: boolean };

      const result = await Pipeline.from(success<User>({ id: '1', name: 'John', age: 25 }))
        .if({
          predicate: (user) => user.age >= 18,
          onTrue: (user) =>
            success<UserView>({
              displayName: user.name.toUpperCase(),
              isAdult: true,
            }),
          onFalse: (user) =>
            success<UserView>({
              displayName: user.name.toLowerCase(),
              isAdult: false,
            }),
        })
        .run();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toEqual({
          displayName: 'JOHN',
          isAdult: true,
        });
      }
    });

    it('should handle array transformations', async () => {
      const result = await Pipeline.from(success([1, 2, 3, 4, 5]))
        .if({
          predicate: (numbers) => numbers.every((n) => n > 0),
          onTrue: (numbers) => success(numbers.map((n) => n * 2)),
          onFalse: (numbers) => success(numbers.filter((n) => n > 0)),
        })
        .run();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toEqual([2, 4, 6, 8, 10]);
      }
    });
  });

  describe('if with chained operations', () => {
    it('should handle multiple if operations in sequence', async () => {
      const result = await Pipeline.from(success(42))
        .if({
          predicate: (value) => value > 0,
          onTrue: (value) => success(value * 2),
          onFalse: () => success(0),
        })
        .if({
          predicate: (value) => value > 50,
          onTrue: (value) => success(`high: ${value}`),
          onFalse: (value) => success(`low: ${value}`),
        })
        .run();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toBe('high: 84');
      }
    });

    it('should handle if after map operations', async () => {
      const result = await Pipeline.from(success('42'))
        .map((value) => parseInt(value))
        .if({
          predicate: (value) => !isNaN(value),
          onTrue: (value) => success(value * 2),
          onFalse: () => success(0),
        })
        .run();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toBe(84);
      }
    });
  });

  describe('if with edge cases', () => {
    it('should handle null and undefined values', async () => {
      const result = await Pipeline.from(success(null))
        .if({
          predicate: (value) => value === null,
          onTrue: () => success('is null'),
          onFalse: () => success('not null'),
        })
        .run();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toBe('is null');
      }
    });

    it('should handle empty arrays and objects', async () => {
      const result = await Pipeline.from(success([]))
        .if({
          predicate: (arr) => arr.length === 0,
          onTrue: () => success('empty'),
          onFalse: () => success('not empty'),
        })
        .run();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toBe('empty');
      }
    });

    it('should handle falsy values in predicates', async () => {
      const result = await Pipeline.from(success(0))
        .if({
          predicate: (value) => Boolean(value),
          onTrue: () => success('truthy'),
          onFalse: () => success('falsy'),
        })
        .run();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toBe('falsy');
      }
    });
  });

  describe('if with type narrowing', () => {
    type Shape =
      | { type: 'circle'; radius: number }
      | { type: 'square'; side: number }
      | { type: 'rectangle'; width: number; height: number };

    it('should narrow types in predicates', async () => {
      const shape: Shape = { type: 'circle', radius: 5 };

      const result = await Pipeline.from(success(shape))
        .if({
          predicate: (s): s is { type: 'circle'; radius: number } => s.type === 'circle',
          onTrue: (s) => success(s.radius * Math.PI * 2), // TypeScript knows s is a circle
          onFalse: () => success(0),
        })
        .run();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toBe(10 * Math.PI);
      }
    });

    it('should handle discriminated unions', async () => {
      const shape: Shape = { type: 'rectangle', width: 4, height: 6 };

      const result = await Pipeline.from(success(shape))
        .if({
          predicate: (s) => s.type === 'rectangle',
          onTrue: (s) => success(s.width * s.height), // TypeScript knows s is a rectangle
          onFalse: () => success(0),
        })
        .run();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toBe(24);
      }
    });
  });

  describe('if with async error handling', () => {
    it('should handle rejected promises in predicates', async () => {
      const result = await Pipeline.from(success(42))
        .if({
          predicate: async () => {
            await Promise.reject(new Error('Async predicate error'));
            return true;
          },
          onTrue: () => success('true'),
          onFalse: () => success('false'),
        })
        .mapFailure((error: unknown) => error as Error)
        .run();

      expect(isSuccess(result)).toBe(false);
      if (!isSuccess(result)) {
        expect(result.cause).toBeInstanceOf(Error);
        expect(result.cause.message).toBe('Async predicate error');
      }
    });

    it('should handle rejected promises in branches', async () => {
      const result = await Pipeline.from(success(42))
        .if({
          predicate: () => true,
          onTrue: async () => {
            await Promise.reject(new Error('Async branch error'));
            return success('true');
          },
          onFalse: () => success('false'),
        })
        .mapFailure((error: unknown) => error as Error)
        .run();

      expect(isSuccess(result)).toBe(false);
      if (!isSuccess(result)) {
        expect(result.cause).toBeInstanceOf(Error);
        expect(result.cause.message).toBe('Async branch error');
      }
    });
  });
});
