import { Pipeline } from '../src/pipeline';
import { isSuccess, success } from '../src/result';

describe('Pipeline bindAll', () => {
  describe('Basic bindAll operations', () => {
    it('should bind multiple values at once', async () => {
      const result = await Pipeline.from(success(42))
        .bindAll('user', () => ({
          name: () => success('John'),
          age: () => success(25),
          email: () => success('john@example.com'),
        }))
        .mapSuccess((allBinds) => allBinds)
        .run();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.isValue).toEqual({
          user: {
            name: 'John',
            age: 25,
            email: 'john@example.com',
          },
        });
      }
    });

    it('should bind values with different types', async () => {
      const result = await Pipeline.from(success(42))
        .bindAll('data', () => ({
          string: () => success('text'),
          number: () => success(123),
          boolean: () => success(true),
          array: () => success([1, 2, 3]),
          object: () => success({ key: 'value' }),
        }))
        .mapSuccess((allBinds) => allBinds)
        .run();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.isValue).toEqual({
          data: {
            string: 'text',
            number: 123,
            boolean: true,
            array: [1, 2, 3],
            object: { key: 'value' },
          },
        });
      }
    });

    it('should bind values starting from null', async () => {
      const result = await Pipeline.from(success(null))
        .bindAll('config', () => ({
          host: () => success('localhost'),
          port: () => success(8080),
          debug: () => success(true),
        }))
        .mapSuccess((allBinds) => allBinds)
        .run();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.isValue).toEqual({
          config: {
            host: 'localhost',
            port: 8080,
            debug: true,
          },
        });
      }
    });
  });

  describe('bindAll with dependencies', () => {
    it('should bind values using previous bind values', async () => {
      const result = await Pipeline.from(success(42))
        .bind('id', () => success('30'))
        .bindAll('user', ({ id }) => ({
          name: () => success('John'),
          age: () => success(25),
          userId: () => success(id),
        }))
        .mapSuccess((allBinds) => allBinds)
        .run();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.isValue).toEqual({
          id: '30',
          user: {
            name: 'John',
            age: 25,
            userId: '30',
          },
        });
      }
    });

    it('should bind values using nested bindAll results', async () => {
      const result = await Pipeline.from(success(42))
        .bindAll('user', () => ({
          name: () => success('John'),
          age: () => success(25),
        }))
        .bindAll('profile', ({ user }) => ({
          fullName: () => success(`${user.name} Doe`),
          isAdult: () => success(user.age >= 18),
        }))
        .mapSuccess((allBinds) => allBinds)
        .run();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.isValue).toEqual({
          user: {
            name: 'John',
            age: 25,
          },
          profile: {
            fullName: 'John Doe',
            isAdult: true,
          },
        });
      }
    });
  });

  describe('bindAll with async operations', () => {
    it('should handle async bindings', async () => {
      const result = await Pipeline.from(success(42))
        .bindAll('user', () => ({
          name: async () => {
            await new Promise((resolve) => setTimeout(resolve, 100));
            return success('John');
          },
          age: async () => {
            await new Promise((resolve) => setTimeout(resolve, 50));
            return success(25);
          },
        }))
        .mapSuccess((allBinds) => allBinds)
        .run();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.isValue).toEqual({
          user: {
            name: 'John',
            age: 25,
          },
        });
      }
    });

    it('should execute async bindings in parallel', async () => {
      const startTime = Date.now();
      const result = await Pipeline.from(success(42))
        .bindAll('data', () => ({
          a: async () => {
            await new Promise((resolve) => setTimeout(resolve, 100));
            return success('A');
          },
          b: async () => {
            await new Promise((resolve) => setTimeout(resolve, 100));
            return success('B');
          },
          c: async () => {
            await new Promise((resolve) => setTimeout(resolve, 100));
            return success('C');
          },
        }))
        .mapSuccess((allBinds) => allBinds)
        .run();

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.isValue).toEqual({
          data: {
            a: 'A',
            b: 'B',
            c: 'C',
          },
        });
        // The total duration should be around 100ms (not 300ms) because bindings run in parallel
        expect(duration).toBeLessThan(150);
      }
    });
  });

  describe('bindAll with complex scenarios', () => {
    it('should handle multiple bindAll operations in sequence', async () => {
      const result = await Pipeline.from(success(42))
        .bindAll('user', () => ({
          name: () => success('John'),
          age: () => success(25),
        }))
        .bindAll('address', () => ({
          street: () => success('123 Main St'),
          city: () => success('New York'),
        }))
        .bindAll('preferences', ({ user }) => ({
          theme: () => success('dark'),
          notifications: () => success(true),
          ageGroup: () => success(user.age >= 18 ? 'adult' : 'minor'),
        }))
        .mapSuccess((allBinds) => allBinds)
        .run();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.isValue).toEqual({
          user: {
            name: 'John',
            age: 25,
          },
          address: {
            street: '123 Main St',
            city: 'New York',
          },
          preferences: {
            theme: 'dark',
            notifications: true,
            ageGroup: 'adult',
          },
        });
      }
    });

    it('should handle bindAll with conditional bindings', async () => {
      const result = await Pipeline.from(success(42))
        .bind('age', () => success(25))
        .bindAll('user', ({ age }) => ({
          name: () => success('John'),
          age: () => success(age),
          status: () => success(age >= 18 ? 'adult' : 'minor'),
          permissions: () => success(age >= 18 ? ['read', 'write'] : ['read']),
        }))
        .mapSuccess((allBinds) => allBinds)
        .run();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.isValue).toEqual({
          age: 25,
          user: {
            name: 'John',
            age: 25,
            status: 'adult',
            permissions: ['read', 'write'],
          },
        });
      }
    });
  });
});
