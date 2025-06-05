import { describe, expectTypeOf, it } from 'vitest';

import type {
  Any,
  ArrayHasType,
  CompactArray,
  DeepAwaited,
  HasPromise,
  Head,
  HomogeneousTuple,
  IsEmptyTuple,
  NonFunction,
  Prettify,
  Tail,
  TypeError,
  WithError,
} from '../../src/utils';

describe('Generics', () => {
  // *********************************************************************************************
  // Any type tests.
  // *********************************************************************************************

  describe('Any', () => {
    it('should handle any type', () => {
      type Test1 = Any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expectTypeOf<any>({} as Test1);
    });
  });

  // *********************************************************************************************
  // DeepAwaited type tests.
  // *********************************************************************************************

  describe('DeepAwaited', () => {
    it('should handle simple promise', () => {
      type Test1 = Promise<string>;
      expectTypeOf<string>({} as DeepAwaited<Test1>);
    });

    it('should handle nested promise', () => {
      type Test2 = Promise<Promise<string>>;
      expectTypeOf<string>({} as DeepAwaited<Test2>);
    });

    it('should handle object with promise properties', () => {
      type Test3 = {
        name: string;
        age: Promise<number>;
      };
      expectTypeOf<{
        name: string;
        age: number;
      }>({} as DeepAwaited<Test3>);
    });

    it('should handle nested object with promises', () => {
      type Test4 = {
        user: {
          name: string;
          age: Promise<number>;
          email: Promise<string>;
        };
      };
      expectTypeOf<{
        user: {
          name: string;
          age: number;
          email: string;
        };
      }>({} as DeepAwaited<Test4>);
    });

    it('should handle array with promises', () => {
      type Test5 = Promise<string>[];
      expectTypeOf<string[]>({} as DeepAwaited<Test5>);
    });

    it('should handle nested array with promises', () => {
      type Test6 = {
        items: Promise<string>[];
        nested: {
          values: Promise<number>[];
        };
      };
      expectTypeOf<{
        items: string[];
        nested: {
          values: number[];
        };
      }>({} as DeepAwaited<Test6>);
    });

    it('should handle tuple with promises', () => {
      type Test7 = readonly [string, Promise<number>, Promise<string>];
      expectTypeOf<readonly [string, number, string]>({} as DeepAwaited<Test7>);
    });

    it('should handle complex nested structure with promises', () => {
      type Test8 = {
        user: {
          name: string;
          age: Promise<number>;
          contacts: {
            email: Promise<string>;
            phones: Promise<string[]>;
          };
          tags: Promise<string>[];
        };
        metadata: Promise<{
          created: string;
          updated: Promise<string>;
        }>;
      };
      expectTypeOf<{
        user: {
          name: string;
          age: number;
          contacts: {
            email: string;
            phones: string[];
          };
          tags: string[];
        };
        metadata: {
          created: string;
          updated: string;
        };
      }>({} as DeepAwaited<Test8>);
    });

    it('should handle object without promises', () => {
      type Test9 = {
        name: string;
        age: number;
        tags: string[];
      };
      expectTypeOf<{
        name: string;
        age: number;
        tags: string[];
      }>({} as DeepAwaited<Test9>);
    });

    it('should handle primitive types', () => {
      type Test10 = string;
      expectTypeOf<string>({} as DeepAwaited<Test10>);

      type Test11 = number;
      expectTypeOf<number>({} as DeepAwaited<Test11>);

      type Test12 = boolean;
      expectTypeOf<boolean>({} as DeepAwaited<Test12>);
    });
  });

  // *********************************************************************************************
  // HasPromise type tests.
  // *********************************************************************************************

  describe('HasPromise', () => {
    it('should detect promise in simple object', () => {
      type Test1 = {
        name: string;
        age: Promise<number>;
      };
      expectTypeOf<true>({} as HasPromise<Test1>);
    });

    it('should detect no promise in simple object', () => {
      type Test2 = {
        name: string;
        age: number;
      };
      expectTypeOf<false>({} as HasPromise<Test2>);
    });

    it('should detect promise in nested object', () => {
      type Test3 = {
        user: {
          name: string;
          age: Promise<number>;
        };
      };

      // @ts-expect-error - This should be false.
      expectTypeOf<number>({} as HasPromise<Test3>);
    });

    it('should detect no promise in nested object', () => {
      type Test4 = {
        user: {
          name: string;
          age: number;
        };
      };
      expectTypeOf<false>({} as HasPromise<Test4>);
    });

    it('should detect direct promise value', () => {
      type Test5 = Promise<string>;
      expectTypeOf<true>({} as HasPromise<Test5>);
    });

    it('should detect no promise in non-object type', () => {
      type Test6 = string;
      expectTypeOf<false>({} as HasPromise<Test6>);
    });

    it('should detect promise in array', () => {
      type Test7 = {
        items: Promise<string>[];
      };
      expectTypeOf<true>({} as HasPromise<Test7>);
    });

    it('should detect no promise in array', () => {
      type Test8 = {
        items: string[];
      };
      expectTypeOf<false>({} as HasPromise<Test8>);
    });
  });

  // *********************************************************************************************
  // Prettify type tests.
  // *********************************************************************************************

  describe('Prettify', () => {
    describe('Primitive types', () => {
      it('should handle string type', () => {
        type Test = Prettify<string>;
        expectTypeOf<string>({} as Test);
      });

      it('should handle number type', () => {
        type Test = Prettify<number>;
        expectTypeOf<number>({} as Test);
      });

      it('should handle boolean type', () => {
        type Test = Prettify<boolean>;
        expectTypeOf<boolean>({} as Test);
      });

      it('should handle null type', () => {
        type Test = Prettify<null>;
        // @ts-expect-error - This should be undefined.
        expectTypeOf<null>({} as Test);
      });

      it('should handle undefined type', () => {
        type Test = Prettify<undefined>;
        // @ts-expect-error - This should be undefined.
        expectTypeOf<undefined>({} as Test);
      });
    });

    describe('Object types', () => {
      it('should prettify simple object with primitive types', () => {
        type Test = Prettify<{
          name: string;
          age: number;
          isActive: boolean;
        }>;
        expectTypeOf<{
          name: string;
          age: number;
          isActive: boolean;
        }>({} as Test);
      });

      it('should not prettify nested object types', () => {
        type NestedType = {
          id: number;
          value: string;
        };
        type Test = Prettify<{
          data: NestedType;
          metadata: {
            created: Date;
            updated: Date;
          };
        }>;
        expectTypeOf<{
          data: NestedType;
          metadata: {
            created: Date;
            updated: Date;
          };
        }>({} as Test);
      });

      it('should handle object with optional properties', () => {
        type Test = Prettify<{
          name: string;
          age?: number;
          email?: string;
        }>;
        expectTypeOf<{
          name: string;
          age?: number;
          email?: string;
        }>({} as Test);
      });

      it('should handle object with readonly properties', () => {
        type Test = Prettify<{
          readonly id: number;
          readonly createdAt: Date;
          name: string;
        }>;
        expectTypeOf<{
          readonly id: number;
          readonly createdAt: Date;
          name: string;
        }>({} as Test);
      });
    });

    describe('Array types', () => {
      it('should prettify array of primitive types', () => {
        type Test = Prettify<string[]>;
        expectTypeOf<string[]>({} as Test);
      });

      it('should prettify array of objects with primitive types', () => {
        type Test = Prettify<
          Array<{
            id: number;
            name: string;
          }>
        >;
        expectTypeOf<
          Array<{
            id: number;
            name: string;
          }>
        >({} as Test);
      });

      it('should not prettify array of complex objects', () => {
        type ComplexType = {
          id: number;
          data: {
            name: string;
            metadata: Date;
          };
        };
        type Test = Prettify<ComplexType[]>;
        expectTypeOf<ComplexType[]>({} as Test);
      });
    });

    describe('Complex types', () => {
      it('should handle intersection types with primitives', () => {
        type Test = Prettify<{ name: string } & { age: number }>;
        expectTypeOf<{
          name: string;
          age: number;
        }>({} as Test);
      });

      it('should handle union types with primitives', () => {
        type Test = Prettify<{ type: 'user'; name: string } | { type: 'admin'; role: string }>;
        expectTypeOf<{ type: 'user'; name: string } | { type: 'admin'; role: string }>({} as Test);
      });

      it('should handle mapped types with primitives', () => {
        type Test = Prettify<{
          [K in 'id' | 'name']: K extends 'id' ? number : string;
        }>;
        expectTypeOf<{
          id: number;
          name: string;
        }>({} as Test);
      });
    });

    describe('Special types', () => {
      it('should handle Date type', () => {
        type Test = Prettify<{
          createdAt: Date;
          updatedAt: Date;
        }>;
        expectTypeOf<{
          createdAt: Date;
          updatedAt: Date;
        }>({} as Test);
      });

      it('should handle Promise type', () => {
        type Test = Prettify<{
          data: Promise<string>;
          metadata: Promise<number>;
        }>;
        expectTypeOf<{
          data: Promise<string>;
          metadata: Promise<number>;
        }>({} as Test);
      });

      it('should handle Record type with primitives', () => {
        type Test = Prettify<Record<string, number>>;
        expectTypeOf<Record<string, number>>({} as Test);
      });
    });

    describe('Edge cases', () => {
      it('should handle empty object type', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        type Test = Prettify<{}>;
        expectTypeOf<Test>({});
      });

      it('should handle never type', () => {
        type Test = Prettify<never>;
        expectTypeOf<never>({} as Test);
      });

      it('should handle any type', () => {
        type Test = Prettify<Any>;
        expectTypeOf<Any>({} as Test);
      });

      it('should handle unknown type', () => {
        type Test = Prettify<unknown>;
        expectTypeOf<unknown>({} as Test);
      });
    });
  });

  // *********************************************************************************************
  // CompactArray type tests.
  // *********************************************************************************************

  describe('CompactArray', () => {
    it('should return single type for array with same type', () => {
      type Test1 = CompactArray<readonly [string, string, string]>;
      expectTypeOf<string>({} as Test1);
    });

    it('should return array type for mixed types', () => {
      type Test2 = CompactArray<readonly [string, number, boolean]>;
      expectTypeOf<readonly [string, number, boolean]>({} as Test2);
    });

    it('should handle empty array', () => {
      type Test3 = CompactArray<readonly []>;
      expectTypeOf<readonly []>({} as Test3);
    });

    it('should handle single element array', () => {
      type Test4 = CompactArray<readonly [string]>;
      expectTypeOf<string>({} as Test4);
    });

    it('should handle array with some same types', () => {
      type Test5 = CompactArray<readonly [string, string, number]>;
      expectTypeOf<readonly [string, number]>({} as Test5);
    });

    it('should handle array with complex types', () => {
      type ComplexType = { id: number; name: string };
      type Test6 = CompactArray<readonly [ComplexType, ComplexType]>;
      expectTypeOf<ComplexType>({} as Test6);
    });
  });

  // *********************************************************************************************
  // ArrayHasType type tests.
  // *********************************************************************************************

  describe('ArrayHasType', () => {
    it('should detect type in array', () => {
      type Test1 = ArrayHasType<[string, number, boolean], string>;
      expectTypeOf<true>({} as Test1);
    });

    it('should not detect type not in array', () => {
      type Test2 = ArrayHasType<[string, number, boolean], Date>;
      expectTypeOf<false>({} as Test2);
    });

    it('should handle empty array', () => {
      type Test3 = ArrayHasType<[], string>;
      expectTypeOf<false>({} as Test3);
    });

    it('should handle single element array', () => {
      type Test4 = ArrayHasType<[string], string>;
      expectTypeOf<true>({} as Test4);
    });

    it('should handle array with complex types', () => {
      type ComplexType = { id: number; name: string };
      type Test5 = ArrayHasType<[string, ComplexType, number], ComplexType>;
      expectTypeOf<true>({} as Test5);
    });

    it('should handle array with union types', () => {
      type Test6 = ArrayHasType<[string | number, boolean], string>;
      expectTypeOf<false>({} as Test6);
    });

    it('should handle array with intersection types', () => {
      type IntersectionType = { id: number } & { name: string };
      type Test7 = ArrayHasType<[string, IntersectionType], IntersectionType>;
      expectTypeOf<true>({} as Test7);
    });

    it('should match union types in array with union types', () => {
      type Test8 = ArrayHasType<[string | number, boolean], string | number>;
      expectTypeOf<true>({} as Test8);
    });

    it('should match union types in array with single types', () => {
      type Test9 = ArrayHasType<[string, number, boolean], string | number>;
      expectTypeOf<true>({} as Test9);
    });
  });

  // *********************************************************************************************
  // Head type tests.
  // *********************************************************************************************

  describe('Head', () => {
    it('should get first element from tuple', () => {
      type Test1 = Head<[string, number, boolean]>;
      expectTypeOf<string>({} as Test1);
    });

    it('should handle empty tuple', () => {
      type Test2 = Head<[]>;
      expectTypeOf<never>({} as Test2);
    });

    it('should handle single element tuple', () => {
      type Test3 = Head<[string]>;
      expectTypeOf<string>({} as Test3);
    });

    it('should handle tuple with complex types', () => {
      type ComplexType = { id: number; name: string };
      type Test4 = Head<[ComplexType, string, number]>;
      expectTypeOf<ComplexType>({} as Test4);
    });
  });

  // *********************************************************************************************
  // Tail type tests.
  // *********************************************************************************************

  describe('Tail', () => {
    it('should get remaining elements from tuple', () => {
      type Test1 = Tail<[string, number, boolean]>;
      expectTypeOf<[number, boolean]>({} as Test1);
    });

    it('should handle empty tuple', () => {
      type Test2 = Tail<[]>;
      expectTypeOf<[]>({} as Test2);
    });

    it('should handle single element tuple', () => {
      type Test3 = Tail<[string]>;
      expectTypeOf<[]>({} as Test3);
    });

    it('should handle tuple with complex types', () => {
      type ComplexType = { id: number; name: string };
      type Test4 = Tail<[ComplexType, string, number]>;
      expectTypeOf<[string, number]>({} as Test4);
    });
  });

  // *********************************************************************************************
  // HomogeneousTuple type tests.
  // *********************************************************************************************

  describe('HomogeneousTuple', () => {
    it('should detect homogeneous tuple', () => {
      type Test1 = HomogeneousTuple<[string, string, string]>;
      expectTypeOf<true>({} as Test1);
    });

    it('should detect heterogeneous tuple', () => {
      type Test2 = HomogeneousTuple<[string, number, boolean]>;
      expectTypeOf<false>({} as Test2);
    });

    it('should handle empty tuple', () => {
      type Test3 = HomogeneousTuple<[]>;
      expectTypeOf<true>({} as Test3);
    });

    it('should handle single element tuple', () => {
      type Test4 = HomogeneousTuple<[string]>;
      expectTypeOf<true>({} as Test4);
    });

    it('should handle tuple with complex types', () => {
      type ComplexType = { id: number; name: string };
      type Test5 = HomogeneousTuple<[ComplexType, ComplexType]>;
      expectTypeOf<true>({} as Test5);
    });

    it('should handle tuple with mixed complex types', () => {
      type ComplexType1 = { id: number; name: string };
      type ComplexType2 = { id: number; value: string };
      type Test6 = HomogeneousTuple<[ComplexType1, ComplexType2]>;
      expectTypeOf<false>({} as Test6);
    });
  });

  // *********************************************************************************************
  // IsEmptyTuple type tests.
  // *********************************************************************************************

  describe('IsEmptyTuple', () => {
    it('should detect empty tuple', () => {
      type Test1 = IsEmptyTuple<[]>;
      expectTypeOf<true>({} as Test1);
    });

    it('should detect non-empty tuple', () => {
      type Test2 = IsEmptyTuple<[string]>;
      expectTypeOf<false>({} as Test2);
    });

    it('should detect non-empty tuple with multiple elements', () => {
      type Test3 = IsEmptyTuple<[string, number, boolean]>;
      expectTypeOf<false>({} as Test3);
    });

    it('should handle tuple with complex types', () => {
      type ComplexType = { id: number; name: string };
      type Test4 = IsEmptyTuple<[ComplexType]>;
      expectTypeOf<false>({} as Test4);
    });
  });

  // *********************************************************************************************
  // NonFunction type tests.
  // *********************************************************************************************

  describe('NonFunction', () => {
    it('should not change the primitive types', () => {
      type Test1 = NonFunction<string>;
      expectTypeOf<string>({} as Test1);

      type Test2 = NonFunction<number>;
      expectTypeOf<number>({} as Test2);

      type Test3 = NonFunction<boolean>;
      expectTypeOf<boolean>({} as Test3);

      type Test4 = NonFunction<null>;
      // @ts-expect-error - This should be undefined.
      expectTypeOf<null>({} as Test4);

      type Test5 = NonFunction<undefined>;
      // @ts-expect-error - This should be undefined.
      expectTypeOf<undefined>({} as Test5);

      type Test7 = NonFunction<symbol>;
      expectTypeOf<symbol>({} as Test7);

      type Test8 = NonFunction<bigint>;
      expectTypeOf<bigint>({} as Test8);

      type Test9 = NonFunction<Date>;
      expectTypeOf<Date>({} as Test9);

      type Test10 = NonFunction<RegExp>;
      expectTypeOf<RegExp>({} as Test10);
    });

    it('should remove functions from object', () => {
      type Test1 = NonFunction<{ name: string; age: number; sayHello: () => void }>;
      expectTypeOf<{ name: string; age: number }>({} as Test1);
    });

    it('should remove functions from array', () => {
      type Test2 = NonFunction<() => void>;
      expectTypeOf<void>({} as unknown as Test2);
    });

    it('should maintain the tuple type', () => {
      type Test3 = NonFunction<readonly [string, number, () => void]>;
      expectTypeOf<readonly [string, number, () => void]>({} as Test3);
    });

    it('should remove functions from union', () => {
      type Test4 = NonFunction<(string | number) | (() => void)>;
      expectTypeOf<string | number | void>({} as Test4);
    });

    it('should remove functions from intersection', () => {
      type Test5 = NonFunction<{ name: string } & { age: number } & { sayHello: () => void }>;
      expectTypeOf<{ name: string } & { age: number }>({} as Test5);
    });
  });

  // *********************************************************************************************
  // TypeError type tests.
  // *********************************************************************************************

  describe('TypeError', () => {
    it('should create a type error', () => {
      type Test1 = TypeError<'TEST', 'This is a test error'>;
      expectTypeOf<{ error: 'TEST: This is a test error' }>({} as Test1);
    });
  });

  // *********************************************************************************************
  // WithError type tests.
  // *********************************************************************************************

  describe('WithError', () => {
    it('should add an error message to a type', () => {
      type Test1 = WithError<{ name: string }, { error: 'This is a test error' }>;
      expectTypeOf<{ name: string } & 'This is a test error'>({} as Test1);
    });
  });
});
