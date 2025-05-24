import { describe, expectTypeOf, it } from 'vitest';

import { bind, map, tap } from '../../src/pipe/operators';

describe('Pipe Operators Types', () => {
  // *********************************************************************************************
  // Map Operator Type Tests.
  // *********************************************************************************************

  describe('Map', () => {
    it('should infer correct types for simple transformations', () => {
      const double = map((n: number) => n * 2);
      expectTypeOf(double).toBeFunction();
      expectTypeOf(double).parameter(0).toBeNumber();
      expectTypeOf(double).returns.toBeNumber();
    });

    it('should infer correct types for type transformations', () => {
      const toString = map((n: number) => n.toString());
      expectTypeOf(toString).toBeFunction();
      expectTypeOf(toString).parameter(0).toBeNumber();
      expectTypeOf(toString).returns.toBeString();
    });

    it('should infer correct types for async transformations', () => {
      const asyncDouble = map(async (n: number) => n * 2);
      expectTypeOf(asyncDouble).toBeFunction();
      expectTypeOf(asyncDouble).parameter(0).toBeNumber();
      expectTypeOf(asyncDouble).returns.toEqualTypeOf<Promise<number>>();
    });

    it('should infer correct types for object transformations', () => {
      const transformUser = map((user: { name: string; age: number }) => ({
        fullName: user.name,
        isAdult: user.age >= 18,
      }));
      expectTypeOf(transformUser).toBeFunction();
      expectTypeOf(transformUser).parameter(0).toEqualTypeOf<{ name: string; age: number }>();
      expectTypeOf(transformUser).returns.toEqualTypeOf<{ fullName: string; isAdult: boolean }>();
    });
  });

  // *********************************************************************************************
  // Bind Operator Type Tests.
  // *********************************************************************************************

  describe('Bind', () => {
    it('should infer correct types for simple bindings', () => {
      const addAge = bind('age', () => 25);
      expectTypeOf(addAge).toBeFunction();
      expectTypeOf(addAge).parameter(0).toEqualTypeOf<unknown>();
      expectTypeOf(addAge).returns.toEqualTypeOf<{ age: number }>();
    });

    it('should infer correct types for async bindings', () => {
      const addAge = bind('age', async () => 25);
      expectTypeOf(addAge).toBeFunction();
      expectTypeOf(addAge).parameter(0).toEqualTypeOf<unknown>();
      expectTypeOf(addAge).returns.toEqualTypeOf<{ age: Promise<number> }>();
    });

    it('should preserve existing type information', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const addAge = bind('age', (user: { name: string }) => 25);
      expectTypeOf(addAge).toBeFunction();
      expectTypeOf(addAge).parameter(0).toEqualTypeOf<{ name: string }>();
      expectTypeOf(addAge).returns.toEqualTypeOf<{ name: string; age: number }>();
    });

    it('should handle complex object types', () => {
      type User = {
        name: string;
        birthdate: Date;
      };
      type UserWithAge = {
        name: string;
        birthdate: Date;
        age: number;
      };

      const addAge = bind(
        'age',
        (user: User) => new Date().getFullYear() - user.birthdate.getFullYear(),
      );
      expectTypeOf(addAge).toBeFunction();
      expectTypeOf(addAge).parameter(0).toEqualTypeOf<User>();
      expectTypeOf(addAge).returns.toEqualTypeOf<UserWithAge>();
    });
  });

  // *********************************************************************************************
  // Tap Operator Type Tests.
  // *********************************************************************************************

  describe('Tap', () => {
    it('should preserve input type for simple values', () => {
      const logNumber = tap<number>((n: number) => console.log(n));
      expectTypeOf(logNumber).toBeFunction();
      expectTypeOf(logNumber).parameter(0).toBeNumber();
      expectTypeOf(logNumber).returns.toBeNumber();
    });

    it('should preserve input type for objects', () => {
      type User = { name: string; age: number };
      const logUser = tap<User>((user: User) => console.log(user));
      expectTypeOf(logUser).toBeFunction();
      expectTypeOf(logUser).parameter(0).toEqualTypeOf<{ name: string; age: number }>();
      expectTypeOf(logUser).returns.toEqualTypeOf<{ name: string; age: number }>();
    });

    it('should handle async side effects', () => {
      const asyncLog = tap<number>(async (n: number) => console.log(n));
      expectTypeOf(asyncLog).toBeFunction();
      expectTypeOf(asyncLog).parameter(0).toBeNumber();
      expectTypeOf(asyncLog).returns.toBeNumber();
    });

    it('should preserve complex types', () => {
      type ComplexType = {
        id: number;
        data: {
          name: string;
          values: number[];
        };
      };
      const logComplex = tap<ComplexType>((obj: ComplexType) => console.log(obj));
      expectTypeOf(logComplex).toBeFunction();
      expectTypeOf(logComplex).parameter(0).toEqualTypeOf<ComplexType>();
      expectTypeOf(logComplex).returns.toEqualTypeOf<ComplexType>();
    });
  });
});
