import { describe, expect, expectTypeOf, it, vi } from 'vitest';

import { flow, map, mapBoth, mapErr } from '../src/flow';
import { type Result, err, isOk, ok } from '../src/result';

const unwrap = <T>(result: Result<T, unknown>) => (isOk(result) ? result.value : result.error);

describe('Flow', () => {
  describe('Basic functionality', () => {
    it('should create a flow with ok result', () => {
      const f = (x: number) => ok(x + 1);
      const fl = flow(f);
      const r = fl(1);
      expect(unwrap(r)).toEqual(2);

      // Typechecking.
      expectTypeOf(f).toBeFunction();
      expectTypeOf(f).parameter(0).toBeNumber();
      expectTypeOf(f).returns.toEqualTypeOf<Result<number, never>>();
    });

    it('should create a flow with err result', () => {
      const returnError = () => err('Error');
      const fl = flow(returnError);
      const r = fl();
      expect(unwrap(r)).toEqual('Error');

      // Typechecking.
      expectTypeOf(fl).toBeFunction();
      expectTypeOf(fl).parameter(0).toBeVoid();
      expectTypeOf(fl).returns.toEqualTypeOf<Result<never, 'Error'>>();
    });

    it('should create a flow with multiple parameters', () => {
      const addOne = (x: number, y: number) => ok(x + y);
      const fl = flow(addOne);
      const r = fl(1, 2);
      expect(unwrap(r)).toEqual(3);

      // Typechecking.
      expectTypeOf(fl).toBeFunction();
      expectTypeOf(fl).parameter(0).toBeNumber();
      expectTypeOf(fl).parameter(1).toBeNumber();
      expectTypeOf(fl).returns.toEqualTypeOf<Result<number, never>>();
    });

    it('should create a void flow', () => {
      const addOne = () => ok(1);
      const fl = flow(addOne);
      const r = fl();
      expect(unwrap(r)).toEqual(1);

      // Typechecking.
      expectTypeOf(fl).toBeFunction();
      expectTypeOf(fl).parameter(0).toBeVoid();
      expectTypeOf(fl).returns.toEqualTypeOf<Result<number, never>>();
    });

    it('should create a flow with a function that returns a tuple', () => {
      const addOne = (x: number) => ok([x + 1, x + 2, x + 3]);
      const fl = flow(addOne);
      const r = fl(1);
      expect(unwrap(r)).toEqual([2, 3, 4]);

      // Typechecking.
      expectTypeOf(fl).toBeFunction();
      expectTypeOf(fl).parameter(0).toBeNumber();
      expectTypeOf(fl).returns.toEqualTypeOf<Result<number[], never>>();
    });

    it('should create a flow with a function that returns a object', () => {
      const addOne = (x: number) => ok({ value: x + 1 });
      const fl = flow(addOne);
      const r = fl(1);
      expect(unwrap(r)).toEqual({ value: 2 });

      // Typechecking.
      expectTypeOf(fl).toBeFunction();
      expectTypeOf(fl).parameter(0).toBeNumber();
      expectTypeOf(fl).returns.toEqualTypeOf<Result<{ value: number }, never>>();
    });

    it('should create a flow with a function that returns a object with a function', () => {
      const addOne = (x: number) => ok({ value: x + 1, addTwo: () => ok(x + 2) });
      const fl = flow(addOne);
      const r = fl(1);
      expect(unwrap(r)).toEqual({ value: 2, addTwo: expect.any(Function) });

      // Typechecking.
      expectTypeOf(fl).toBeFunction();
      expectTypeOf(fl).parameter(0).toBeNumber();
      expectTypeOf(fl).returns.toEqualTypeOf<
        Result<{ value: number; addTwo: () => Result<number, never> }, never>
      >();
    });
  });

  describe('map', () => {
    it('should map over the value', () => {
      const f = flow(
        (x: number) => ok(x),
        map((x) => ok(x + 1)),
      );
      const r = f(1);
      expect(unwrap(r)).toEqual(2);

      // Typechecking.
      expectTypeOf(r).toEqualTypeOf<Result<number, never>>();
      expectTypeOf(f).toBeFunction();
      expectTypeOf(f).parameter(0).toBeNumber();
      expectTypeOf(f).returns.toEqualTypeOf<Result<number, never>>();
    });

    it('should support multiple maps', () => {
      const f = flow(
        (x: number) => ok(x),
        map((x) => ok(x + 1)),
        map((x) => ok(x + 2)),
      );

      const r = f(1);
      expect(unwrap(r)).toEqual(4);

      // Typechecking.
      expectTypeOf(r).toEqualTypeOf<Result<number, never>>();
      expectTypeOf(f).toBeFunction();
      expectTypeOf(f).parameter(0).toBeNumber();
      expectTypeOf(f).returns.toEqualTypeOf<Result<number, never>>();
    });

    it('should support multiple maps with different types', () => {
      const f = flow(
        (x: number) => ok(x),
        map((x) => ok(x + 1)),
        map((x) => ok(x.toString())),
      );

      const r = f(1);
      expect(unwrap(r)).toEqual('2');

      // Typechecking.
      expectTypeOf(r).toEqualTypeOf<Result<string, never>>();
      expectTypeOf(f).toBeFunction();
      expectTypeOf(f).parameter(0).toBeNumber();
      expectTypeOf(f).returns.toEqualTypeOf<Result<string, never>>();
    });

    it('should ommit the map if the result is an error', () => {
      const someMap = (x: never) => ok(x + 1);
      const f = flow(() => err('THIS_IS_AN_ERROR'), map(someMap));

      // someMap is never called because the result is an error.
      const fSpy = vi.fn(someMap);
      expect(fSpy).not.toHaveBeenCalled();
      const r = f();
      expect(unwrap(r)).toEqual('THIS_IS_AN_ERROR');

      // Typechecking.
      expectTypeOf(r).toEqualTypeOf<Result<number, 'THIS_IS_AN_ERROR'>>();
      expectTypeOf(f).toBeFunction();
      expectTypeOf(f).parameter(0).toBeVoid();
      expectTypeOf(f).returns.toEqualTypeOf<Result<number, 'THIS_IS_AN_ERROR'>>();
    });
  });

  describe('mapErr', () => {
    it('should map over the error', () => {
      const f = flow(
        () => err('ORIGINAL_ERROR'),
        mapErr((error) => (error === 'ORIGINAL_ERROR' ? err('REPLACED_ERROR') : err(error))),
      );
      const r = f();
      expect(unwrap(r)).toEqual('REPLACED_ERROR');

      // Typechecking.
      expectTypeOf(r).toEqualTypeOf<Result<never, 'REPLACED_ERROR'>>();
      expectTypeOf(f).toBeFunction();
      expectTypeOf(f).parameter(0).toBeVoid();
      expectTypeOf(f).returns.toEqualTypeOf<Result<never, 'REPLACED_ERROR'>>();
    });

    it('should map multiple errors and replace them', () => {
      const f = flow(
        (x: number) =>
          x > 0 ? err('POSITIVE_NUMBER') : x === 0 ? err('ZERO_NUMBER') : err('NEGATIVE_NUMBER'),
        mapErr((error) => {
          switch (error) {
            case 'POSITIVE_NUMBER':
              return err('REPLACED_POSITIVE_NUMBER');
            case 'NEGATIVE_NUMBER':
              return err('REPLACED_NEGATIVE_NUMBER');
            default:
              return err(error); // ZERO_NUMBER is not replaced.
          }
        }),
      );

      const rp = f(1);
      expect(unwrap(rp)).toEqual('REPLACED_POSITIVE_NUMBER');

      const rn = f(-1);
      expect(unwrap(rn)).toEqual('REPLACED_NEGATIVE_NUMBER');

      const rz = f(0);
      expect(unwrap(rz)).toEqual('ZERO_NUMBER');

      // Typechecking.
      expectTypeOf(rp).toEqualTypeOf<
        Result<never, 'REPLACED_NEGATIVE_NUMBER' | 'REPLACED_POSITIVE_NUMBER' | 'ZERO_NUMBER'>
      >();
      expectTypeOf(rn).toEqualTypeOf<
        Result<never, 'REPLACED_NEGATIVE_NUMBER' | 'REPLACED_POSITIVE_NUMBER' | 'ZERO_NUMBER'>
      >();
      expectTypeOf(rz).toEqualTypeOf<
        Result<never, 'REPLACED_NEGATIVE_NUMBER' | 'REPLACED_POSITIVE_NUMBER' | 'ZERO_NUMBER'>
      >();
      expectTypeOf(f).toBeFunction();
      expectTypeOf(f).parameter(0).toBeNumber();
      expectTypeOf(f).returns.toEqualTypeOf<
        Result<never, 'REPLACED_NEGATIVE_NUMBER' | 'REPLACED_POSITIVE_NUMBER' | 'ZERO_NUMBER'>
      >();
    });

    it('should ommit the mapErr if the result is ok', () => {
      const someMapErr = () => err('NOT_MAPPED_ERROR');
      const f = flow((x: number) => ok(x + 1), mapErr(someMapErr));

      // someMapErr is never called because the result is ok.
      const someMapErrSpy = vi.fn(someMapErr);
      expect(someMapErrSpy).not.toHaveBeenCalled();

      const r = f(1);
      expect(unwrap(r)).toEqual(2);

      // Typechecking.
      expectTypeOf(f).toBeFunction();
      expectTypeOf(f).parameter(0).toBeNumber();
      expectTypeOf(f).returns.toEqualTypeOf<Result<number, 'NOT_MAPPED_ERROR'>>();
    });
  });

  describe('mapBoth', () => {
    it('should map over onOk', () => {
      const f = flow(
        (x: number) => ok(x),
        mapBoth({ onOk: (x) => ok(x + 1), onErr: (error) => err(error) }),
      );

      const r = f(1);
      expect(unwrap(r)).toEqual(2);

      // Typechecking.
      expectTypeOf(r).toEqualTypeOf<Result<number, never>>();
      expectTypeOf(f).toBeFunction();
      expectTypeOf(f).parameter(0).toBeNumber();
      expectTypeOf(f).returns.toEqualTypeOf<Result<number, never>>();
    });

    it('should map over onErr', () => {
      const f = flow(
        () => err('ORIGINAL_ERROR'),
        mapBoth({ onOk: (x) => ok(x + 1), onErr: (error) => err(error) }),
      );

      const r = f();
      expect(unwrap(r)).toEqual('ORIGINAL_ERROR');

      // Typechecking.
      expectTypeOf(r).toEqualTypeOf<Result<number, 'ORIGINAL_ERROR'>>();
    });

    it('should map and replace previous values and errors', () => {
      const f1 = flow((x: number) => (x === 0 ? err('ERROR_1') : ok(x)));
      const f2 = flow(f1, mapBoth({ onOk: (v) => ok(v.toString()), onErr: () => err('ERROR_2') }));

      const r1 = f1(1);
      expect(unwrap(r1)).toEqual(1);

      const r2 = f2(1);
      expect(unwrap(r2)).toEqual('1');

      // Typechecking.
      expectTypeOf(r1).toEqualTypeOf<Result<number, 'ERROR_1'>>();
      expectTypeOf(r2).toEqualTypeOf<Result<string, 'ERROR_2'>>();
      expectTypeOf(f1).toBeFunction();
      expectTypeOf(f1).parameter(0).toBeNumber();
      expectTypeOf(f1).returns.toEqualTypeOf<Result<number, 'ERROR_1'>>();
      expectTypeOf(f2).toBeFunction();
      expectTypeOf(f2).parameter(0).toBeNumber();
      expectTypeOf(f2).returns.toEqualTypeOf<Result<string, 'ERROR_2'>>();
    });
  });
});
