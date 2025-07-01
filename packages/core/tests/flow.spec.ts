import { describe, expect, expectTypeOf, it, vi } from 'vitest';

import { type Flow, flow } from '../src/flow';
import { type Result, err, ok, unwrap } from '../src/result';

describe('Flow', () => {
  describe('Basic functionality', () => {
    it('should create a flow with ok result', () => {
      const f = (x: number) => ok(x + 1);
      const fl = flow<number>().map(f);

      const fn = fl.build();
      const r = fn(1);
      expect(unwrap(r)).toEqual(2);

      // Typechecking.
      expectTypeOf(fl).toBeObject();
      expectTypeOf(fl).toEqualTypeOf<Flow<number, number, never, 'sync'>>();
      expectTypeOf(fn).toBeFunction();
      expectTypeOf(fn).parameter(0).toBeNumber();
      expectTypeOf(fn).returns.toEqualTypeOf<Result<number, never>>();
      expectTypeOf(r).toEqualTypeOf<Result<number, never>>();
    });

    it('should create a flow with err result', () => {
      const f = () => err('ERROR');
      const fl = flow<void>().map(f);

      const fn = fl.build();
      const r = fn();
      expect(unwrap(r)).toEqual('ERROR');

      // Typechecking.
      expectTypeOf(fl).toBeObject();
      expectTypeOf(fl).toEqualTypeOf<Flow<void, never, 'ERROR', 'sync'>>();
      expectTypeOf(fn).toBeFunction();
      expectTypeOf(fn).parameter(0).toBeVoid();
      expectTypeOf(fn).returns.toEqualTypeOf<Result<never, 'ERROR'>>();
      expectTypeOf(r).toEqualTypeOf<Result<never, 'ERROR'>>();
    });

    it('should create a empty flow', () => {
      const fn = flow<void>().build();
      const r = fn();
      expect(unwrap(r)).toEqual(undefined);

      // Typechecking.
      expectTypeOf(fn).toBeFunction();
      expectTypeOf(fn).parameter(0).toBeVoid();
      expectTypeOf(fn).returns.toEqualTypeOf<Result<void, never>>();
      expectTypeOf(r).toEqualTypeOf<Result<void, never>>();
    });

    it('should create an async flow', async () => {
      const f = async (x: number) => ok(x + 1);
      const fl = flow<number>().map(f);

      const fn = fl.build();
      const r = await fn(1);
      expect(unwrap(r)).toEqual(2);

      // Typechecking.
      expectTypeOf(fl).toBeObject();
      expectTypeOf(fl).toEqualTypeOf<Flow<number, number, never, 'async'>>();
      expectTypeOf(fn).toBeFunction();
      expectTypeOf(fn).parameter(0).toBeNumber();
      expectTypeOf(fn).returns.toEqualTypeOf<Promise<Result<number, never>>>();
      expectTypeOf(r).toEqualTypeOf<Result<number, never>>();
    });

    it('should create a flow with multiple steps', () => {
      const f1 = (x: number) => ok(x + 1);
      const f2 = (x: number) => ok(x + 2);
      const fl = flow<number>().map(f1).map(f2);

      const fn = fl.build();
      const r = fn(1);
      expect(unwrap(r)).toEqual(4);

      // Typechecking.
      expectTypeOf(fl).toBeObject();
      expectTypeOf(fl).toEqualTypeOf<Flow<number, number, never, 'sync'>>();
      expectTypeOf(fn).toBeFunction();
      expectTypeOf(fn).parameter(0).toBeNumber();
      expectTypeOf(fn).returns.toEqualTypeOf<Result<number, never>>();
      expectTypeOf(r).toEqualTypeOf<Result<number, never>>();
    });

    it('should create a flow with multiple sync and async steps', async () => {
      const f1 = (x: number) => ok(x + 1);
      const f2 = async (x: number) => ok(x + 2);
      const f3 = (x: number) => ok(x + 3);
      const fl = flow<number>().map(f1).map(f2).map(f3);

      const fn = fl.build();
      const r = await fn(1);
      expect(unwrap(r)).toEqual(7);

      // Typechecking.
      expectTypeOf(fl).toBeObject();
      expectTypeOf(fl).toEqualTypeOf<Flow<number, number, never, 'async'>>();
      expectTypeOf(fn).toBeFunction();
      expectTypeOf(fn).parameter(0).toBeNumber();
      expectTypeOf(fn).returns.toEqualTypeOf<Promise<Result<number, never>>>();
      expectTypeOf(r).toEqualTypeOf<Result<number, never>>();
    });

    it('should accumulate errors in sync flow', () => {
      // Sync.
      const f1 = () => err('ERROR');
      const f2 = () => err('ERROR2');
      const f3 = () => err('ERROR3');
      const fl = flow<void>().map(f1).map(f2).map(f3);

      const fn = fl.build();
      const r = fn();
      expect(unwrap(r)).toEqual('ERROR');

      // Typechecking.
      expectTypeOf(fl).toBeObject();
      expectTypeOf(fl).toEqualTypeOf<Flow<void, never, 'ERROR' | 'ERROR2' | 'ERROR3', 'sync'>>();
      expectTypeOf(fn).toBeFunction();
      expectTypeOf(fn).parameter(0).toBeVoid();
      expectTypeOf(fn).returns.toEqualTypeOf<Result<never, 'ERROR' | 'ERROR2' | 'ERROR3'>>();
      expectTypeOf(r).toEqualTypeOf<Result<never, 'ERROR' | 'ERROR2' | 'ERROR3'>>();
    });

    it('should accumulate errors in async flow', async () => {
      const f1 = async () => err('ERROR');
      const f2 = async () => err('ERROR2');
      const f3 = async () => err('ERROR3');
      const fl = flow<void>().map(f1).map(f2).map(f3);

      const fn = fl.build();
      const r = await fn();
      expect(unwrap(r)).toEqual('ERROR');

      // Typechecking.
      expectTypeOf(fl).toBeObject();
      expectTypeOf(fl).toEqualTypeOf<Flow<void, never, 'ERROR' | 'ERROR2' | 'ERROR3', 'async'>>();
      expectTypeOf(fn).toBeFunction();
      expectTypeOf(fn).parameter(0).toBeVoid();
      expectTypeOf(fn).returns.toEqualTypeOf<
        Promise<Result<never, 'ERROR' | 'ERROR2' | 'ERROR3'>>
      >();
      expectTypeOf(r).toEqualTypeOf<Result<never, 'ERROR' | 'ERROR2' | 'ERROR3'>>();
    });

    it('should have all steps in the flow with correct types', () => {
      const f1 = () => ok('SUCCESS');
      const f2 = () => ok('SUCCESS2');
      const f3 = async () => ok('SUCCESS3');
      const f4 = () => err('ERROR');
      const f5 = async () => err('ERROR2');
      const fl = flow<void>().map(f1).map(f2).map(f3).map(f4).map(f5);

      const steps = fl.steps();

      expect(steps).toHaveLength(5);
      expect(steps[0].kind).toEqual('sync');
      expect(steps[1].kind).toEqual('sync');
      expect(steps[2].kind).toEqual('async');
      expect(steps[3].kind).toEqual('sync');
      expect(steps[4].kind).toEqual('async');
    });
  });

  describe('Mapping', () => {
    it('should not map an error in a map if the result is an error in sync flow', () => {
      const f1 = () => err('ERROR');
      const f2 = vi.fn(() => ok('SUCCESS'));
      const f3 = vi.fn(() => ok('SUCCESS2'));
      const fl = flow<void>().map(f1).map(f2).map(f3);

      const fn = fl.build();
      const r = fn();
      expect(unwrap(r)).toEqual('ERROR');

      // The map is not called because the result is an error.
      expect(f2).not.toHaveBeenCalled();
      expect(f3).not.toHaveBeenCalled();

      // Typechecking.
      expectTypeOf(fl).toBeObject();
      expectTypeOf(fl).toEqualTypeOf<Flow<void, string, 'ERROR', 'sync'>>();
      expectTypeOf(fn).toBeFunction();
      expectTypeOf(fn).parameter(0).toBeVoid();
      expectTypeOf(fn).returns.toEqualTypeOf<Result<string, 'ERROR'>>();
      expectTypeOf(r).toEqualTypeOf<Result<string, 'ERROR'>>();
    });

    it('should not map an error in a map if the result is an error in async flow', async () => {
      const f1 = async () => err('ERROR');
      const f2 = vi.fn(() => ok('SUCCESS'));
      const f3 = vi.fn(() => ok('SUCCESS2'));
      const fl = flow<void>().map(f1).map(f2).map(f3);

      const fn = fl.build();
      const r = await fn();
      expect(unwrap(r)).toEqual('ERROR');

      // The map is not called because the result is an error.
      expect(f2).not.toHaveBeenCalled();
      expect(f3).not.toHaveBeenCalled();

      // Typechecking.
      expectTypeOf(fl).toBeObject();
      expectTypeOf(fl).toEqualTypeOf<Flow<void, string, 'ERROR', 'async'>>();
      expectTypeOf(fn).toBeFunction();
      expectTypeOf(fn).parameter(0).toBeVoid();
      expectTypeOf(fn).returns.toEqualTypeOf<Promise<Result<string, 'ERROR'>>>();
      expectTypeOf(r).toEqualTypeOf<Result<string, 'ERROR'>>();
    });

    it('should map an error and replace it with another error in sync flow', () => {
      const f1 = () => err('ERROR');
      const f2 = (e: 'ERROR') => err(`REPLACED_${e}`);
      const fl = flow<void>().map(f1).mapErr(f2);

      const fn = fl.build();
      const r = fn();
      expect(unwrap(r)).toEqual('REPLACED_ERROR');

      // Typechecking.
      expectTypeOf(fl).toBeObject();
      expectTypeOf(fl).toEqualTypeOf<Flow<void, never, 'REPLACED_ERROR', 'sync'>>();
      expectTypeOf(fn).toBeFunction();
      expectTypeOf(fn).parameter(0).toBeVoid();
      expectTypeOf(fn).returns.toEqualTypeOf<Result<never, 'REPLACED_ERROR'>>();
      expectTypeOf(r).toEqualTypeOf<Result<never, 'REPLACED_ERROR'>>();
    });

    it('should map an error and replace it with another error in async flow', async () => {
      const f1 = async () => err('ERROR');
      const f2 = async (e: 'ERROR') => err(`REPLACED_${e}`);
      const fl = flow<void>().map(f1).mapErr(f2);

      const fn = fl.build();
      const r = await fn();
      expect(unwrap(r)).toEqual('REPLACED_ERROR');

      // Typechecking.
      expectTypeOf(fl).toBeObject();
      expectTypeOf(fl).toEqualTypeOf<Flow<void, never, 'REPLACED_ERROR', 'async'>>();
      expectTypeOf(fn).toBeFunction();
      expectTypeOf(fn).parameter(0).toBeVoid();
      expectTypeOf(fn).returns.toEqualTypeOf<Promise<Result<never, 'REPLACED_ERROR'>>>();
      expectTypeOf(r).toEqualTypeOf<Result<never, 'REPLACED_ERROR'>>();
    });

    it('should map multiple errors and replace them in sync flow', () => {
      const f1 = () => err('ERROR_1');
      const f2 = () => err('ERROR_2');
      const f3 = () => err('ERROR_3');
      const f4 = (e: 'ERROR_1' | 'ERROR_2' | 'ERROR_3') => err(`REPLACED_${e}`);
      const fl = flow<void>().map(f1).map(f2).map(f3).mapErr(f4);

      const fn = fl.build();
      const r = fn();
      expect(unwrap(r)).toEqual('REPLACED_ERROR_1');

      // Typechecking.
      expectTypeOf(fl).toBeObject();
      expectTypeOf(fl).toEqualTypeOf<
        Flow<void, never, 'REPLACED_ERROR_1' | 'REPLACED_ERROR_2' | 'REPLACED_ERROR_3', 'sync'>
      >();
      expectTypeOf(fn).toBeFunction();
      expectTypeOf(fn).parameter(0).toBeVoid();
      expectTypeOf(fn).returns.toEqualTypeOf<
        Result<never, 'REPLACED_ERROR_1' | 'REPLACED_ERROR_2' | 'REPLACED_ERROR_3'>
      >();
      expectTypeOf(r).toEqualTypeOf<
        Result<never, 'REPLACED_ERROR_1' | 'REPLACED_ERROR_2' | 'REPLACED_ERROR_3'>
      >();
    });

    it('should map multiple errors and replace them in async flow', async () => {
      const f1 = async () => err('ERROR_1');
      const f2 = async () => err('ERROR_2');
      const f3 = async () => err('ERROR_3');
      const f4 = async (e: 'ERROR_1' | 'ERROR_2' | 'ERROR_3') => err(`REPLACED_${e}`);
      const fl = flow<void>().map(f1).map(f2).map(f3).mapErr(f4);

      const fn = fl.build();
      const r = await fn();
      expect(unwrap(r)).toEqual('REPLACED_ERROR_1');

      // Typechecking.
      expectTypeOf(fl).toBeObject();
      expectTypeOf(fl).toEqualTypeOf<
        Flow<void, never, 'REPLACED_ERROR_1' | 'REPLACED_ERROR_2' | 'REPLACED_ERROR_3', 'async'>
      >();
      expectTypeOf(fn).toBeFunction();
      expectTypeOf(fn).parameter(0).toBeVoid();
      expectTypeOf(fn).returns.toEqualTypeOf<
        Promise<Result<never, 'REPLACED_ERROR_1' | 'REPLACED_ERROR_2' | 'REPLACED_ERROR_3'>>
      >();
      expectTypeOf(r).toEqualTypeOf<
        Result<never, 'REPLACED_ERROR_1' | 'REPLACED_ERROR_2' | 'REPLACED_ERROR_3'>
      >();
    });

    it('should not call mapErr when the flow has a success result in sync flow', () => {
      const f1 = (x: number) => ok(x + 1);
      const f2 = vi.fn(() => err('ERROR'));
      const fl = flow<number>().map(f1).mapErr(f2);

      const fn = fl.build();
      const r = fn(1);
      expect(unwrap(r)).toEqual(2);

      // The mapErr is not called because the result is a success.
      expect(f2).not.toHaveBeenCalled();

      // Typechecking.
      expectTypeOf(fl).toBeObject();
      expectTypeOf(fl).toEqualTypeOf<Flow<number, number, 'ERROR', 'sync'>>();
      expectTypeOf(fn).toBeFunction();
      expectTypeOf(fn).parameter(0).toBeNumber();
      expectTypeOf(fn).returns.toEqualTypeOf<Result<number, 'ERROR'>>();
      expectTypeOf(r).toEqualTypeOf<Result<number, 'ERROR'>>();
    });

    it('should not call mapErr when the flow has a success result in async flow', async () => {
      const f1 = async (x: number) => ok(x + 1);
      const f2 = vi.fn(async () => err('ERROR'));
      const fl = flow<number>().map(f1).mapErr(f2);

      const fn = fl.build();
      const r = await fn(1);
      expect(unwrap(r)).toEqual(2);

      // The mapErr is not called because the result is a success.
      expect(f2).not.toHaveBeenCalled();

      // Typechecking.
      expectTypeOf(fl).toBeObject();
      expectTypeOf(fl).toEqualTypeOf<Flow<number, number, 'ERROR', 'async'>>();
      expectTypeOf(fn).toBeFunction();
      expectTypeOf(fn).parameter(0).toBeNumber();
      expectTypeOf(fn).returns.toEqualTypeOf<Promise<Result<number, 'ERROR'>>>();
      expectTypeOf(r).toEqualTypeOf<Result<number, 'ERROR'>>();
    });

    it('should map both success and error in sync flow', () => {
      const f1 = (v: number) => (v > 0 ? ok(v) : err('MUST_BE_POSITIVE'));
      const onOk = vi.fn((v: number) => ok(v));
      const onErr = vi.fn((e: 'MUST_BE_POSITIVE') => err(`REPLACED_${e}`));

      const fl = flow<number>().map(f1).mapBoth({
        onOk,
        onErr,
      });

      const fn = fl.build();

      const sr = fn(1);
      expect(unwrap(sr)).toEqual(1);
      expect(onOk).toHaveBeenCalledWith(1);

      const er = fn(-1);
      expect(unwrap(er)).toEqual('REPLACED_MUST_BE_POSITIVE');
      expect(onErr).toHaveBeenCalledWith('MUST_BE_POSITIVE');

      // Typechecking.
      expectTypeOf(fl).toBeObject();
      expectTypeOf(fl).toEqualTypeOf<Flow<number, number, 'REPLACED_MUST_BE_POSITIVE', 'sync'>>();
      expectTypeOf(fn).toBeFunction();
      expectTypeOf(fn).parameter(0).toBeNumber();
      expectTypeOf(fn).returns.toEqualTypeOf<Result<number, 'REPLACED_MUST_BE_POSITIVE'>>();
      expectTypeOf(sr).toEqualTypeOf<Result<number, 'REPLACED_MUST_BE_POSITIVE'>>();
      expectTypeOf(er).toEqualTypeOf<Result<number, 'REPLACED_MUST_BE_POSITIVE'>>();
    });

    it('should map both success and error in async flow', async () => {
      const f1 = async (v: number) => (v > 0 ? ok(v) : err('MUST_BE_POSITIVE'));
      const onOk = vi.fn(async (v: number) => ok(v));
      const onErr = vi.fn(async (e: 'MUST_BE_POSITIVE') => err(`REPLACED_${e}`));

      const fl = flow<number>().map(f1).mapBoth({
        onOk,
        onErr,
      });

      const fn = fl.build();

      const sr = await fn(1);
      expect(unwrap(sr)).toEqual(1);
      expect(onOk).toHaveBeenCalledWith(1);

      const er = await fn(-1);
      expect(unwrap(er)).toEqual('REPLACED_MUST_BE_POSITIVE');
      expect(onErr).toHaveBeenCalledWith('MUST_BE_POSITIVE');

      // Typechecking.
      expectTypeOf(fl).toBeObject();
      expectTypeOf(fl).toEqualTypeOf<Flow<number, number, 'REPLACED_MUST_BE_POSITIVE', 'async'>>();
      expectTypeOf(fn).toBeFunction();
      expectTypeOf(fn).parameter(0).toBeNumber();
      expectTypeOf(fn).returns.toEqualTypeOf<
        Promise<Result<number, 'REPLACED_MUST_BE_POSITIVE'>>
      >();
      expectTypeOf(sr).toEqualTypeOf<Result<number, 'REPLACED_MUST_BE_POSITIVE'>>();
      expectTypeOf(er).toEqualTypeOf<Result<number, 'REPLACED_MUST_BE_POSITIVE'>>();
    });
  });

  describe('Tapping', () => {
    it('should tap a success value in sync flow', () => {
      const f1 = () => ok('SUCCESS');
      const f2 = vi.fn((x: string) => console.log(`TAPPED: ${x}`));
      const fl = flow<void>().map(f1).tap(f2);

      const fn = fl.build();
      const r = fn();
      expect(unwrap(r)).toEqual('SUCCESS');

      // The tap is called with the result.
      expect(f2).toHaveBeenCalledWith('SUCCESS');

      // Typechecking.
      expectTypeOf(fl).toBeObject();
      expectTypeOf(fl).toEqualTypeOf<Flow<void, string, never, 'sync'>>();
      expectTypeOf(fn).toBeFunction();
      expectTypeOf(fn).parameter(0).toBeVoid();
      expectTypeOf(fn).returns.toEqualTypeOf<Result<string, never>>();
      expectTypeOf(r).toEqualTypeOf<Result<string, never>>();
    });

    it('should tap a success value in async flow', async () => {
      const f1 = async () => ok('SUCCESS');
      const f2 = vi.fn(async (x: string) => console.log(`TAPPED: ${x}`));
      const fl = flow<void>().map(f1).tap(f2);

      const fn = fl.build();
      const r = await fn();
      expect(unwrap(r)).toEqual('SUCCESS');

      // The tap is called with the success result value.
      expect(f2).toHaveBeenCalledWith('SUCCESS');

      // Typechecking.
      expectTypeOf(fl).toBeObject();
      expectTypeOf(fl).toEqualTypeOf<Flow<void, string, never, 'async'>>();
      expectTypeOf(fn).toBeFunction();
      expectTypeOf(fn).parameter(0).toBeVoid();
      expectTypeOf(fn).returns.toEqualTypeOf<Promise<Result<string, never>>>();
      expectTypeOf(r).toEqualTypeOf<Result<string, never>>();
    });

    it('should not tap a error value in sync flow', () => {
      const f1 = () => err('ERROR');
      const f2 = vi.fn((x: string) => console.log(`TAPPED: ${x}`));
      const fl = flow<void>().map(f1).tap(f2);

      const fn = fl.build();
      const r = fn();
      expect(unwrap(r)).toEqual('ERROR');

      // The tap is not called because the result is an error.
      expect(f2).not.toHaveBeenCalled();

      // Typechecking.
      expectTypeOf(fl).toBeObject();
      expectTypeOf(fl).toEqualTypeOf<Flow<void, never, 'ERROR', 'sync'>>();
      expectTypeOf(fn).toBeFunction();
      expectTypeOf(fn).parameter(0).toBeVoid();
      expectTypeOf(fn).returns.toEqualTypeOf<Result<never, 'ERROR'>>();
      expectTypeOf(r).toEqualTypeOf<Result<never, 'ERROR'>>();
    });

    it('should not tap a error value in async flow', async () => {
      const f1 = async () => err('ERROR');
      const f2 = vi.fn(async (x: string) => console.log(`TAPPED: ${x}`));
      const fl = flow<void>().map(f1).tap(f2);

      const fn = fl.build();
      const r = await fn();
      expect(unwrap(r)).toEqual('ERROR');

      // The tap is not called because the result is an error.
      expect(f2).not.toHaveBeenCalled();

      // Typechecking.
      expectTypeOf(fl).toBeObject();
      expectTypeOf(fl).toEqualTypeOf<Flow<void, never, 'ERROR', 'async'>>();
      expectTypeOf(fn).toBeFunction();
      expectTypeOf(fn).parameter(0).toBeVoid();
      expectTypeOf(fn).returns.toEqualTypeOf<Promise<Result<never, 'ERROR'>>>();
      expectTypeOf(r).toEqualTypeOf<Result<never, 'ERROR'>>();
    });
  });
});
