import { Pipeline } from '../src/pipeline';
import { isSuccess, success } from '../src/result';

class User {
  constructor(
    public id: string,
    public name: string,
    public age: number,
  ) {}
}

describe('Pipeline bind', () => {
  describe('Basic bind operations', () => {
    it('should bind values regardless of previous pipeline result', async () => {
      const result = await Pipeline.from(success(42))
        .bind('id', () => success('30'))
        .bind('name', () => success('John'))
        .bind('age', () => success(25))
        .bind('user', ({ age, id, name }) => success(new User(id, name, age)))
        .mapSuccess((allBinds) => allBinds)
        .run();
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toEqual({
          id: '30',
          name: 'John',
          age: 25,
          user: { id: '30', name: 'John', age: 25 },
        });
      }
    });

    it('should bind values starting from a primitive string', async () => {
      const result = await Pipeline.from(success('hello'))
        .bind('message', () => success('world'))
        .bind('count', () => success(5))
        .mapSuccess((allBinds) => allBinds)
        .run();
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toEqual({ message: 'world', count: 5 });
      }
    });

    it('should bind values starting from null', async () => {
      const result = await Pipeline.from(success(null))
        .bind('status', () => success('active'))
        .bind('timestamp', () => success(Date.now()))
        .mapSuccess((allBinds) => allBinds)
        .run();
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toEqual({ status: 'active', timestamp: expect.any(Number) });
      }
    });

    it('should bind values starting from an object ignoring that object in the result', async () => {
      const result = await Pipeline.from(success({ id: '30' }))
        .bind('userId', ({ id }) => success(id))
        .mapSuccess((allBinds) => allBinds)
        .run();
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toEqual({ userId: '30' });
      }
    });
  });

  describe('Multiple bind sequences', () => {
    it('should handle multiple bind sequences separated by mapSuccess', async () => {
      const result = await Pipeline.from(success(42))
        .bind('id', () => success('30'))
        .bind('name', () => success('John'))
        .mapSuccess((allBinds) => allBinds)
        .bind('age', () => success(25))
        .bind('user', ({ age }) => success(new User('30', 'John', age)))
        .mapSuccess((allBinds) => allBinds)
        .run();
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toEqual({
          age: 25,
          user: { id: '30', name: 'John', age: 25 },
        });
      }
    });

    it('should handle nested bind operations', async () => {
      const result = await Pipeline.from(success(42))
        .bind('id', () => success('30'))
        .bind('user', ({ id }) =>
          Pipeline.from(success(id))
            .bind('name', () => success('John'))
            .bind('age', () => success(25))
            .mapSuccess((allBinds) => allBinds)
            .run(),
        )
        .mapSuccess((allBinds) => allBinds)
        .run();
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toEqual({
          id: '30',
          user: { name: 'John', age: 25 },
        });
      }
    });

    it('should handle nested bind operations using bindAll', async () => {
      const result = await Pipeline.from(success(42))
        .bind('id', () => success('30'))
        .bindAll('user', () => ({
          name: () => success('John'),
          age: () => success(25),
        }))
        .mapSuccess((allBinds) => allBinds)
        .run();
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toEqual({
          id: '30',
          user: { name: 'John', age: 25 },
        });
      }
    });

    it('should handle multiple nested bind operations using bindAll', async () => {
      const result = await Pipeline.from(success(42))
        .bind('id', () => success('30'))
        .bindAll('user', () => ({
          name: () => success('John'),
          age: () => success(25),
        }))
        .bindAll('address', () => ({
          street: () => success('123 Main St'),
          city: () => success('New York'),
        }))
        .mapSuccess((allBinds) => allBinds)
        .run();
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toEqual({
          id: '30',
          user: { name: 'John', age: 25 },
          address: { street: '123 Main St', city: 'New York' },
        });
      }
    });
  });

  describe('Complex bind scenarios', () => {
    it('should handle bind operations with async functions', async () => {
      const result = await Pipeline.from(success(42))
        .bind('id', async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return success('30');
        })
        .bind('name', async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return success('John');
        })
        .mapSuccess((allBinds) => allBinds)
        .run();
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toEqual({ id: '30', name: 'John' });
      }
    });

    it('should handle bind operations with complex transformations', async () => {
      const result = await Pipeline.from(success(42))
        .bind('id', () => success('30'))
        .bind('name', () => success('John'))
        .bind('age', () => success(25))
        .bind('fullName', ({ name }) => success(`${name} Doe`))
        .bind('isAdult', ({ age }) => success(age >= 18))
        .mapSuccess((allBinds) => allBinds)
        .run();
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toEqual({
          id: '30',
          name: 'John',
          age: 25,
          fullName: 'John Doe',
          isAdult: true,
        });
      }
    });
  });
});
