import { describe, expectTypeOf, it } from 'vitest';

import { type PipeValue, bind, map, tap } from '../../src/pipe';

describe('Pipe Operators Types', () => {
  // *********************************************************************************************
  // Map Operator Type Tests.
  // *********************************************************************************************

  describe('Map', () => {
    it('should infer correct types for simple transformations', () => {
      const double = map((n: number) => n * 2);
      expectTypeOf(double).toBeFunction();
      expectTypeOf(double).parameter(0).toBeNumber();
      expectTypeOf(double).returns.toMatchObjectType<PipeValue<number, 'map'>>();
    });

    it('should infer correct types for type transformations', () => {
      const toString = map((n: number) => n.toString());
      expectTypeOf(toString).toBeFunction();
      expectTypeOf(toString).parameter(0).toBeNumber();
      expectTypeOf(toString).returns.toMatchObjectType<PipeValue<string, 'map'>>();
    });

    it('should infer correct types for async transformations', () => {
      const asyncDouble = map(async (n: number) => n * 2);
      expectTypeOf(asyncDouble).toBeFunction();
      expectTypeOf(asyncDouble).parameter(0).toBeNumber();
      expectTypeOf(asyncDouble).returns.toMatchObjectType<PipeValue<Promise<number>, 'map'>>();
    });

    it('should infer correct types for object transformations', () => {
      const transformUser = map((user: { name: string; age: number }) => ({
        fullName: user.name,
        isAdult: user.age >= 18,
      }));
      expectTypeOf(transformUser).toBeFunction();
      expectTypeOf(transformUser).parameter(0).toEqualTypeOf<{ name: string; age: number }>();
      expectTypeOf(transformUser).returns.toMatchObjectType<
        PipeValue<{ fullName: string; isAdult: boolean }, 'map'>
      >();
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
      expectTypeOf(addAge).returns.toMatchObjectType<PipeValue<{ age: number }, 'bind'>>();
    });

    it('should infer correct types for async bindings', () => {
      const addAge = bind('age', async () => 25);
      expectTypeOf(addAge).toBeFunction();
      expectTypeOf(addAge).parameter(0).toEqualTypeOf<unknown>();
      expectTypeOf(addAge).returns.toMatchObjectType<PipeValue<{ age: Promise<number> }, 'bind'>>();
    });

    it('should preserve existing type information', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const addAge = bind('age', (user: { name: string }) => 25);
      expectTypeOf(addAge).toBeFunction();
      expectTypeOf(addAge).parameter(0).toEqualTypeOf<{ name: string }>();
      expectTypeOf(addAge).returns.toMatchObjectType<
        PipeValue<{ name: string; age: number }, 'bind'>
      >();
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
      expectTypeOf(addAge).returns.toMatchObjectType<PipeValue<UserWithAge, 'bind'>>();
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
      expectTypeOf(logNumber).returns.toMatchObjectType<PipeValue<number, 'tap'>>();
    });

    it('should preserve input type for objects', () => {
      type User = { name: string; age: number };
      const logUser = tap<User>((user: User) => console.log(user));
      expectTypeOf(logUser).toBeFunction();
      expectTypeOf(logUser).parameter(0).toEqualTypeOf<{ name: string; age: number }>();
      expectTypeOf(logUser).returns.toMatchObjectType<PipeValue<User, 'tap'>>();
    });

    it('should handle async side effects', () => {
      const asyncLog = tap<number>(async (n: number) => console.log(n));
      expectTypeOf(asyncLog).toBeFunction();
      expectTypeOf(asyncLog).parameter(0).toBeNumber();
      expectTypeOf(asyncLog).returns.toMatchObjectType<PipeValue<number, 'tap'>>();
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
      expectTypeOf(logComplex).returns.toMatchObjectType<PipeValue<ComplexType, 'tap'>>();
    });
  });
});
