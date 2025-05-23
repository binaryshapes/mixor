import { describe, expectTypeOf, it } from 'vitest';

import type { Any, DeepAwaited, HasPromise } from '../../src/utils';

describe('Generics Utils', () => {
  describe('Any type', () => {
    it('should handle any type', () => {
      type Test1 = Any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expectTypeOf<any>({} as Test1);
    });
  });

  describe('DeepAwaited type', () => {
    describe('Simple promise cases', () => {
      it('should handle simple promise', () => {
        type Test1 = Promise<string>;
        expectTypeOf<string>({} as DeepAwaited<Test1>);
      });

      it('should handle nested promise', () => {
        type Test2 = Promise<Promise<string>>;
        expectTypeOf<string>({} as DeepAwaited<Test2>);
      });
    });

    describe('Object cases', () => {
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
    });

    describe('Array cases', () => {
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
    });

    describe('Tuple cases', () => {
      it('should handle tuple with promises', () => {
        type Test7 = readonly [string, Promise<number>, Promise<string>];
        expectTypeOf<readonly [string, number, string]>({} as DeepAwaited<Test7>);
      });
    });

    describe('Complex nested structures', () => {
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
    });

    describe('Non-promise types', () => {
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
  });

  describe('HasPromise type', () => {
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
});
