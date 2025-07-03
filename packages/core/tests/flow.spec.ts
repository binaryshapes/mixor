import { describe, expect, expectTypeOf, it, vi } from 'vitest';

import { type Flow, flow } from '../src/flow';
import { err, ok, unwrap } from '../src/result';

// import { fixtures } from './flow.fixture';

// const { success, error } = fixtures;

// *********************************************************************************************
// Test helpers.
// *********************************************************************************************

type GetFlowType<I, O, E, A extends 'sync' | 'async'> = {
  fl: Flow<I, O, E, A>;
  fn: ReturnType<Flow<I, O, E, A>['build']>;
  r: Awaited<ReturnType<ReturnType<Flow<I, O, E, A>['build']>>>;
};

const success = {
  initNumber: (n: number) => ok(n),
  asyncInitNumber: async (n: number) => ok(n),
  voidOk1: () => ok('SUCCESS_1'),
  voidOk2: () => ok('SUCCESS_2'),
  voidOk3: () => ok('SUCCESS_3'),
  asyncVoidOk1: async () => ok('SUCCESS_1'),
  asyncVoidOk2: async () => ok('SUCCESS_2'),
  asyncVoidOk3: async () => ok('SUCCESS_3'),

  increment1: (v: number) => ok(v + 1),
  increment2: (v: number) => ok(v + 1),
  increment3: (v: number) => ok(v + 1),
  asyncIncrement1: async (v: number) => ok(v + 1),
  asyncIncrement2: async (v: number) => ok(v + 1),
  asyncIncrement3: async (v: number) => ok(v + 1),
};

const error = {
  voidErr1: () => err('ERROR_1'),
  voidErr2: () => err('ERROR_2'),
  voidErr3: () => err('ERROR_3'),
  asyncVoidErr1: async () => err('ERROR_1'),
  asyncVoidErr2: async () => err('ERROR_2'),
  asyncVoidErr3: async () => err('ERROR_3'),

  errReplacer1: <E extends string>(e: E) => err(`REPLACED_${e}`),
  asyncErrReplacer1: async <E extends string>(e: E) => err(`REPLACED_${e}`),
};

describe('Flow', () => {
  describe('Basic functionality', () => {
    it('should create a void flow with ok result', () => {
      const fl = flow<void>().map(success.voidOk1);
      const fn = fl.build();
      const r = fn();
      expect(unwrap(r)).toEqual('SUCCESS_1');

      // Typechecking.
      type ExpectedFlowType = GetFlowType<void, string, never, 'sync'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should create a void flow with err result', () => {
      const fl = flow<void>().map(error.voidErr1);

      const fn = fl.build();
      const r = fn();
      expect(unwrap(r)).toEqual('ERROR_1');

      // Typechecking.
      type ExpectedFlowType = GetFlowType<void, never, 'ERROR_1', 'sync'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should create a empty flow', () => {
      const fl = flow<void>();
      const fn = fl.build();
      const r = fn();
      expect(unwrap(r)).toEqual(undefined);

      // Typechecking.
      type ExpectedFlowType = GetFlowType<void, void, never, 'sync'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should create an async void flow with ok result', async () => {
      const fl = flow<void>().map(success.asyncVoidOk1);
      const fn = fl.build();
      const r = await fn();
      expect(unwrap(r)).toEqual('SUCCESS_1');

      // Typechecking.
      type ExpectedFlowType = GetFlowType<void, string, never, 'async'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should create a sync flow with multiple steps', () => {
      const fl = flow<number>()
        .map(success.increment1)
        .map(success.increment2)
        .map(success.increment3);

      const fn = fl.build();
      const r = fn(0);
      expect(unwrap(r)).toEqual(3);

      // Typechecking.
      type ExpectedFlowType = GetFlowType<number, number, never, 'sync'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should create a flow with multiple sync and async steps', async () => {
      const fl = flow<number>()
        .map(success.asyncIncrement1)
        .map(success.asyncIncrement2)
        .map(success.asyncIncrement3);

      const fn = fl.build();
      const r = await fn(0);
      expect(unwrap(r)).toEqual(3);

      // Typechecking.
      type ExpectedFlowType = GetFlowType<number, number, never, 'async'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should accumulate errors in sync flow', () => {
      // Sync.
      const fl = flow<void>().map(error.voidErr1).map(error.voidErr2).map(error.voidErr3);

      const fn = fl.build();
      const r = fn();
      expect(unwrap(r)).toEqual('ERROR_1');

      // Typechecking.
      type ExpectedFlowType = GetFlowType<void, never, 'ERROR_1' | 'ERROR_2' | 'ERROR_3', 'sync'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should accumulate errors in async flow', async () => {
      const fl = flow<void>()
        .map(error.asyncVoidErr1)
        .map(error.asyncVoidErr2)
        .map(error.asyncVoidErr3);

      const fn = fl.build();
      const r = await fn();
      expect(unwrap(r)).toEqual('ERROR_1');

      // Typechecking.
      type ExpectedFlowType = GetFlowType<void, never, 'ERROR_1' | 'ERROR_2' | 'ERROR_3', 'async'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should have all steps in the flow with correct types', () => {
      const fl = flow<void>()
        .map(success.voidOk1)
        .map(success.voidOk2)
        .map(success.asyncVoidOk1)
        .map(success.asyncVoidOk2)
        .map(success.voidOk3)
        .map(success.asyncVoidOk3);

      const steps = fl.steps();

      expect(steps).toHaveLength(6);
      expect(steps[0].kind).toEqual('sync');
      expect(steps[1].kind).toEqual('sync');
      expect(steps[2].kind).toEqual('async');
      expect(steps[3].kind).toEqual('async');
      expect(steps[4].kind).toEqual('sync');
      expect(steps[5].kind).toEqual('async');
    });
  });

  describe('Mapping', () => {
    it('should not map an error in a map if the result is an error in sync flow', () => {
      const f1 = error.voidErr1;
      const f2 = vi.fn(success.voidOk1);
      const f3 = vi.fn(success.voidOk2);
      const fl = flow<void>().map(f1).map(f2).map(f3);

      const fn = fl.build();
      const r = fn();
      expect(unwrap(r)).toEqual('ERROR_1');

      // The map is not called because the result is an error.
      expect(f2).not.toHaveBeenCalled();
      expect(f3).not.toHaveBeenCalled();

      // Typechecking.
      type ExpectedFlowType = GetFlowType<void, string, 'ERROR_1', 'sync'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should not map an error in a map if the result is an error in async flow', async () => {
      const f1 = error.asyncVoidErr1;
      const f2 = vi.fn(success.asyncVoidOk1);
      const f3 = vi.fn(success.asyncVoidOk2);
      const fl = flow<void>().map(f1).map(f2).map(f3);

      const fn = fl.build();
      const r = await fn();
      expect(unwrap(r)).toEqual('ERROR_1');

      // The map is not called because the result is an error.
      expect(f2).not.toHaveBeenCalled();
      expect(f3).not.toHaveBeenCalled();

      // Typechecking.
      type ExpectedFlowType = GetFlowType<void, string, 'ERROR_1', 'async'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should map an error and replace it with another error in sync flow', () => {
      const f1 = error.voidErr1;
      const f2 = error.errReplacer1;
      const fl = flow<void>().map(f1).mapErr(f2);

      const fn = fl.build();
      const r = fn();
      expect(unwrap(r)).toEqual('REPLACED_ERROR_1');

      // Typechecking.
      type ExpectedFlowType = GetFlowType<void, never, 'REPLACED_ERROR_1', 'sync'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should map an error and replace it with another error in async flow', async () => {
      const f1 = error.asyncVoidErr1;
      const f2 = error.asyncErrReplacer1;
      const fl = flow<void>().map(f1).mapErr(f2);

      const fn = fl.build();
      const r = await fn();
      expect(unwrap(r)).toEqual('REPLACED_ERROR_1');

      // Typechecking.
      type ExpectedFlowType = GetFlowType<void, never, 'REPLACED_ERROR_1', 'async'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should map multiple errors and replace them in sync flow', () => {
      const f1 = error.voidErr1;
      const f2 = error.voidErr2;
      const f3 = error.voidErr3;
      const f4 = error.errReplacer1;
      const fl = flow<void>().map(f1).map(f2).map(f3).mapErr(f4);

      const fn = fl.build();
      const r = fn();
      expect(unwrap(r)).toEqual('REPLACED_ERROR_1');

      // Typechecking.
      type ExpectedFlowType = GetFlowType<
        void,
        never,
        'REPLACED_ERROR_1' | 'REPLACED_ERROR_2' | 'REPLACED_ERROR_3',
        'sync'
      >;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should map multiple errors and replace them in async flow', async () => {
      const f1 = error.asyncVoidErr1;
      const f2 = error.asyncVoidErr2;
      const f3 = error.asyncVoidErr3;
      const f4 = error.asyncErrReplacer1;
      const fl = flow<void>().map(f1).map(f2).map(f3).mapErr(f4);

      const fn = fl.build();
      const r = await fn();
      expect(unwrap(r)).toEqual('REPLACED_ERROR_1');

      // Typechecking.
      type ExpectedFlowType = GetFlowType<
        void,
        never,
        'REPLACED_ERROR_1' | 'REPLACED_ERROR_2' | 'REPLACED_ERROR_3',
        'async'
      >;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should not call mapErr when the flow has a success result in sync flow', () => {
      const f1 = success.increment1;
      const f2 = vi.fn(error.voidErr1);
      const fl = flow<number>().map(f1).mapErr(f2);

      const fn = fl.build();
      const r = fn(1);
      expect(unwrap(r)).toEqual(2);

      // The mapErr is not called because the result is a success.
      expect(f2).not.toHaveBeenCalled();

      // Typechecking.
      type ExpectedFlowType = GetFlowType<number, number, 'ERROR_1', 'sync'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should not call mapErr when the flow has a success result in async flow', async () => {
      const f1 = success.asyncIncrement1;
      const f2 = vi.fn(error.asyncVoidErr1);
      const fl = flow<number>().map(f1).mapErr(f2);

      const fn = fl.build();
      const r = await fn(1);
      expect(unwrap(r)).toEqual(2);

      // The mapErr is not called because the result is a success.
      expect(f2).not.toHaveBeenCalled();

      // Typechecking.
      type ExpectedFlowType = GetFlowType<number, number, 'ERROR_1', 'async'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should map both success and error in sync flow', () => {
      const f1 = (v: number) => (v > 0 ? ok(v) : err('MUST_BE_POSITIVE'));
      const onOk = vi.fn(success.increment1);
      const onErr = vi.fn<typeof error.errReplacer1<'MUST_BE_POSITIVE'>>(error.errReplacer1);

      const fl = flow<number>().map(f1).mapBoth({
        onOk,
        onErr,
      });

      const fn = fl.build();

      // Success case.
      const sr = fn(1);
      expect(unwrap(sr)).toEqual(2);
      expect(onOk).toHaveBeenCalledWith(1);

      // Error case.
      const er = fn(-1);
      expect(unwrap(er)).toEqual('REPLACED_MUST_BE_POSITIVE');
      expect(onErr).toHaveBeenCalledWith('MUST_BE_POSITIVE');

      // Typechecking.
      type ExpectedFlowType = GetFlowType<number, number, 'REPLACED_MUST_BE_POSITIVE', 'sync'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(sr).toEqualTypeOf<ExpectedFlowType['r']>();
      expectTypeOf(er).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should map both success and error in async flow', async () => {
      const f1 = async (v: number) => (v > 0 ? ok(v) : err('MUST_BE_POSITIVE'));
      const onOk = vi.fn(success.asyncIncrement1);
      const onErr = vi.fn<typeof error.asyncErrReplacer1<'MUST_BE_POSITIVE'>>(
        error.asyncErrReplacer1,
      );

      const fl = flow<number>().map(f1).mapBoth({
        onOk,
        onErr,
      });

      const fn = fl.build();

      // Success case.
      const sr = await fn(1);
      expect(unwrap(sr)).toEqual(2);
      expect(onOk).toHaveBeenCalledWith(1);

      // Error case.
      const er = await fn(-1);
      expect(unwrap(er)).toEqual('REPLACED_MUST_BE_POSITIVE');
      expect(onErr).toHaveBeenCalledWith('MUST_BE_POSITIVE');

      // Typechecking.
      type ExpectedFlowType = GetFlowType<number, number, 'REPLACED_MUST_BE_POSITIVE', 'async'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(sr).toEqualTypeOf<ExpectedFlowType['r']>();
      expectTypeOf(er).toEqualTypeOf<ExpectedFlowType['r']>();
    });
  });

  describe('Tap', () => {
    it('should tap a success value in sync flow', () => {
      const f1 = success.voidOk1;
      const f2 = vi.fn((x: string) => console.log(`TAPPED: ${x}`));
      const fl = flow<void>().map(f1).tap(f2);

      const fn = fl.build();
      const r = fn();
      expect(unwrap(r)).toEqual('SUCCESS_1');

      // The tap is called with the result.
      expect(f2).toHaveBeenCalledWith('SUCCESS_1');

      // Typechecking.
      type ExpectedFlowType = GetFlowType<void, string, never, 'sync'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should tap a success value in async flow', async () => {
      const f1 = success.asyncVoidOk1;
      const f2 = vi.fn(async (x: string) => console.log(`TAPPED: ${x}`));
      const fl = flow<void>().map(f1).tap(f2);

      const fn = fl.build();
      const r = await fn();
      expect(unwrap(r)).toEqual('SUCCESS_1');

      // The tap is called with the success result value.
      expect(f2).toHaveBeenCalledWith('SUCCESS_1');

      // Typechecking.
      type ExpectedFlowType = GetFlowType<void, string, never, 'async'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should not tap a error value in sync flow', () => {
      const f1 = error.voidErr1;
      const f2 = vi.fn((x: string) => console.log(`TAPPED: ${x}`));
      const fl = flow<void>().map(f1).tap(f2);

      const fn = fl.build();
      const r = fn();
      expect(unwrap(r)).toEqual('ERROR_1');

      // The tap is not called because the result is an error.
      expect(f2).not.toHaveBeenCalled();

      // Typechecking.
      type ExpectedFlowType = GetFlowType<void, never, 'ERROR_1', 'sync'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should not tap a error value in async flow', async () => {
      const f1 = error.asyncVoidErr1;
      const f2 = vi.fn(async (x: string) => console.log(`TAPPED: ${x}`));
      const fl = flow<void>().map(f1).tap(f2);

      const fn = fl.build();
      const r = await fn();
      expect(unwrap(r)).toEqual('ERROR_1');

      // The tap is not called because the result is an error.
      expect(f2).not.toHaveBeenCalled();

      // Typechecking.
      type ExpectedFlowType = GetFlowType<void, never, 'ERROR_1', 'async'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });
  });

  describe('IfThen', () => {
    it('should execute ifThen when predicate is true in sync flow', () => {
      const ifFn = vi.fn((v: number) => v > 0);
      const thenFn = vi.fn(success.increment1);
      const fl = flow<number>().map(success.initNumber).ifThen({
        if: ifFn,
        then: thenFn,
      });

      const fn = fl.build();
      const r = fn(1);
      expect(unwrap(r)).toEqual(2);

      // The ifFn is called with the result.
      expect(ifFn).toHaveBeenCalledWith(1);
      expect(thenFn).toHaveBeenCalledWith(1);

      // Typechecking.
      type ExpectedFlowType = GetFlowType<number, number, never, 'sync'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should not execute ifThen when predicate is false in sync flow', () => {
      const ifFn = vi.fn((v: number) => v > 0);
      const thenFn = vi.fn(success.increment1);
      const fl = flow<number>().map(success.initNumber).ifThen({
        if: ifFn,
        then: thenFn,
      });

      const fn = fl.build();
      const r = fn(-1);
      expect(unwrap(r)).toEqual(-1);

      // The ifFn is called with the result.
      expect(ifFn).toHaveBeenCalledWith(-1);
      expect(thenFn).not.toHaveBeenCalled();

      // Typechecking.
      type ExpectedFlowType = GetFlowType<number, number, never, 'sync'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should execute ifThen when predicate is true in async flow', async () => {
      const ifFn = vi.fn((v: number) => v > 0);
      const thenFn = vi.fn(success.asyncIncrement1);
      const fl = flow<number>().map(success.asyncInitNumber).ifThen({
        if: ifFn,
        then: thenFn,
      });

      const fn = fl.build();
      const r = await fn(1);
      expect(unwrap(r)).toEqual(2);

      // The thenFn is called with the result.
      expect(ifFn).toHaveBeenCalledWith(1);
      expect(thenFn).toHaveBeenCalledWith(1);

      // Typechecking.
      type ExpectedFlowType = GetFlowType<number, number, never, 'async'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should not execute ifThen when predicate is false in async flow', async () => {
      const ifFn = vi.fn((v: number) => v > 0);
      const thenFn = vi.fn(success.asyncIncrement1);
      const fl = flow<number>().map(success.asyncInitNumber).ifThen({
        if: ifFn,
        then: thenFn,
      });

      const fn = fl.build();
      const r = await fn(-1);
      expect(unwrap(r)).toEqual(-1);

      // The ifFn is called with the result.
      expect(ifFn).toHaveBeenCalledWith(-1);
      expect(thenFn).not.toHaveBeenCalled();

      // Typechecking.
      type ExpectedFlowType = GetFlowType<number, number, never, 'async'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should be able to return an error in then branch in ifThen', () => {
      const ifFn = vi.fn((v: number) => v > 0);
      const thenFn = vi.fn(error.voidErr1);
      const fl = flow<number>().map(success.initNumber).ifThen({
        if: ifFn,
        then: thenFn,
      });

      const fn = fl.build();
      const r = fn(5);
      expect(unwrap(r)).toEqual('ERROR_1');

      // The ifFn is called with the result.
      expect(ifFn).toHaveBeenCalledWith(5);
      expect(thenFn).toHaveBeenCalled();

      // Typechecking.
      type ExpectedFlowType = GetFlowType<number, number, 'ERROR_1', 'sync'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should not execute then branch in ifThen when flow result is an error', () => {
      const ifFn = vi.fn(() => true);
      const thenFn = vi.fn(error.voidErr1);
      const fl = flow<void>().map(error.voidErr1).ifThen({
        if: ifFn,
        then: thenFn,
      });

      const fn = fl.build();
      const r = fn();
      expect(unwrap(r)).toEqual('ERROR_1');

      // The ifThen should not be called because the flow result is an error.
      expect(ifFn).not.toHaveBeenCalled();
      expect(thenFn).not.toHaveBeenCalled();

      // Typechecking.
      type ExpectedFlowType = GetFlowType<void, never, 'ERROR_1', 'sync'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });
  });

  describe('IfThenElse', () => {
    it('should execute then branch in ifThenElse when predicate is true in sync flow', () => {
      const ifFn = vi.fn((v: number) => v > 0);
      const thenFn = vi.fn(() => ok('POSITIVE' as const));
      const elseFn = vi.fn(() => ok('NEGATIVE' as const));
      const fl = flow<number>().map(success.initNumber).ifThenElse({
        if: ifFn,
        then: thenFn,
        else: elseFn,
      });

      const fn = fl.build();
      const r = fn(5);
      expect(unwrap(r)).toEqual('POSITIVE');

      // The thenFn is called with the result.
      expect(ifFn).toHaveBeenCalledWith(5);
      expect(thenFn).toHaveBeenCalledWith(5);
      expect(elseFn).not.toHaveBeenCalled();

      // Typechecking.
      type ExpectedFlowType = GetFlowType<number, 'POSITIVE' | 'NEGATIVE', never, 'sync'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should execute then branch in ifThenElse when predicate is true in async flow', async () => {
      const ifFn = vi.fn((v: number) => v > 0);
      const thenFn = vi.fn(async () => ok('POSITIVE' as const));
      const elseFn = vi.fn(async () => ok('NEGATIVE' as const));
      const fl = flow<number>().map(success.asyncInitNumber).ifThenElse({
        if: ifFn,
        then: thenFn,
        else: elseFn,
      });

      const fn = fl.build();
      const r = await fn(5);
      expect(unwrap(r)).toEqual('POSITIVE');

      // The thenFn is called with the result.
      expect(ifFn).toHaveBeenCalledWith(5);
      expect(thenFn).toHaveBeenCalledWith(5);
      expect(elseFn).not.toHaveBeenCalled();

      // Typechecking.
      type ExpectedFlowType = GetFlowType<number, 'POSITIVE' | 'NEGATIVE', never, 'async'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should execute else branch in ifThenElse when predicate is false in sync flow', () => {
      const ifFn = vi.fn((v: number) => v > 0);
      const thenFn = vi.fn(() => ok('POSITIVE' as const));
      const elseFn = vi.fn(() => ok('NEGATIVE' as const));
      const fl = flow<number>().map(success.initNumber).ifThenElse({
        if: ifFn,
        then: thenFn,
        else: elseFn,
      });

      const fn = fl.build();
      const r = fn(-5);
      expect(unwrap(r)).toEqual('NEGATIVE');

      // The ifFn is called with the result.
      expect(ifFn).toHaveBeenCalledWith(-5);
      expect(thenFn).not.toHaveBeenCalled();
      expect(elseFn).toHaveBeenCalled();

      // Typechecking.
      type ExpectedFlowType = GetFlowType<number, 'POSITIVE' | 'NEGATIVE', never, 'sync'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should execute else branch in ifThenElse when predicate is false in async flow', async () => {
      const ifFn = vi.fn((v: number) => v > 0);
      const thenFn = vi.fn(async () => ok('POSITIVE' as const));
      const elseFn = vi.fn(async () => ok('NEGATIVE' as const));
      const fl = flow<number>().map(success.asyncInitNumber).ifThenElse({
        if: ifFn,
        then: thenFn,
        else: elseFn,
      });

      const fn = fl.build();
      const r = await fn(-5);
      expect(unwrap(r)).toEqual('NEGATIVE');

      // The ifFn is called with the result.
      expect(ifFn).toHaveBeenCalledWith(-5);
      expect(thenFn).not.toHaveBeenCalled();
      expect(elseFn).toHaveBeenCalled();

      // Typechecking.
      type ExpectedFlowType = GetFlowType<number, 'POSITIVE' | 'NEGATIVE', never, 'async'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should handle ifThenElse if both branches return an error in sync flow', () => {
      const ifFn = vi.fn((v: number) => v > 0);
      const thenFn = vi.fn(() => err('VALUE_TOO_HIGH'));
      const elseFn = vi.fn(() => err('VALUE_TOO_LOW'));
      const fl = flow<number>().map(success.initNumber).ifThenElse({
        if: ifFn,
        then: thenFn,
        else: elseFn,
      });

      const fn = fl.build();
      const r = fn(5);
      expect(unwrap(r)).toEqual('VALUE_TOO_HIGH');

      // The ifFn is called with the result.
      expect(ifFn).toHaveBeenCalledWith(5);
      expect(thenFn).toHaveBeenCalled();
      expect(elseFn).not.toHaveBeenCalled();

      // Typechecking.
      type ExpectedFlowType = GetFlowType<
        number,
        never,
        'VALUE_TOO_HIGH' | 'VALUE_TOO_LOW',
        'sync'
      >;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should handle ifThenElse if both branches return an error in async flow', async () => {
      const ifFn = vi.fn((v: number) => v > 0);
      const thenFn = vi.fn(() => err('VALUE_TOO_HIGH'));
      const elseFn = vi.fn(() => err('VALUE_TOO_LOW'));
      const fl = flow<number>().map(success.asyncInitNumber).ifThenElse({
        if: ifFn,
        then: thenFn,
        else: elseFn,
      });

      const fn = fl.build();
      const r = await fn(5);
      expect(unwrap(r)).toEqual('VALUE_TOO_HIGH');

      // The ifFn is called with the result.
      expect(ifFn).toHaveBeenCalledWith(5);
      expect(thenFn).toHaveBeenCalled();
      expect(elseFn).not.toHaveBeenCalled();

      // Typechecking.
      type ExpectedFlowType = GetFlowType<
        number,
        never,
        'VALUE_TOO_HIGH' | 'VALUE_TOO_LOW',
        'async'
      >;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });
  });

  describe('bind', () => {
    it('should bind a new property to an object input in synchronous flow', () => {
      const fl = flow<{ name: string }>().bind('dummy', success.voidOk1);

      const fn = fl.build();
      const r = fn({ name: 'John' });
      expect(unwrap(r)).toEqual({ name: 'John', dummy: 'SUCCESS_1' });

      // Typechecking.
      type ExpectedFlowType = GetFlowType<
        { name: string },
        { name: string; dummy: string },
        never,
        'sync'
      >;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should bind a new property to an object input in asynchronous flow', async () => {
      const fl = flow<{ name: string }>().bind('dummy', success.asyncVoidOk1);

      const fn = fl.build();
      const r = await fn({ name: 'John' });
      expect(unwrap(r)).toEqual({ name: 'John', dummy: 'SUCCESS_1' });

      // Typechecking.
      type ExpectedFlowType = GetFlowType<
        { name: string },
        { name: string; dummy: string },
        never,
        'async'
      >;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should propagate error when bind function returns an error in synchronous flow', () => {
      const fl = flow<{ name: string }>().bind('dummy', error.voidErr1);
      const fn = fl.build();
      const r = fn({ name: 'John' });
      expect(unwrap(r)).toEqual('ERROR_1');

      // Typechecking.
      type ExpectedFlowType = GetFlowType<{ name: string }, never, 'ERROR_1', 'sync'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should propagate error when bind function returns an error in asynchronous flow', async () => {
      const fl = flow<{ name: string }>().bind('dummy', error.asyncVoidErr1);

      const fn = fl.build();
      const r = await fn({ name: 'John' });
      expect(unwrap(r)).toEqual('ERROR_1');

      // Typechecking.
      type ExpectedFlowType = GetFlowType<{ name: string }, never, 'ERROR_1', 'async'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should skip bind operation when previous step results in error in synchronous flow', () => {
      const bindFn = vi.fn(success.voidOk1);
      const fl = flow<{ name: string }>().map(error.voidErr1).bind('dummy', bindFn);

      const fn = fl.build();
      const r = fn({ name: 'John' });
      expect(unwrap(r)).toEqual('ERROR_1');

      // The bind function should not be called because the flow result is an error.
      expect(bindFn).not.toHaveBeenCalled();

      // Typechecking.
      type ExpectedFlowType = GetFlowType<{ name: string }, never, 'ERROR_1', 'sync'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should skip bind operation when previous step results in error in asynchronous flow', async () => {
      const bindFn = vi.fn(success.asyncVoidOk1);
      const fl = flow<{ name: string }>().map(error.asyncVoidErr1).bind('dummy', bindFn);

      const fn = fl.build();
      const r = await fn({ name: 'John' });
      expect(unwrap(r)).toEqual('ERROR_1');

      // The bind function should not be called because the flow result is an error.
      expect(bindFn).not.toHaveBeenCalled();

      // Typechecking.
      type ExpectedFlowType = GetFlowType<{ name: string }, never, 'ERROR_1', 'async'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should bind multiple properties sequentially to an object in synchronous flow', () => {
      const fl = flow<{ name: string }>()
        .bind('age', () => ok(25))
        .bind('city', () => ok('New York'))
        .bind('country', () => ok('USA'));

      const fn = fl.build();
      const r = fn({ name: 'John' });
      expect(unwrap(r)).toEqual({
        name: 'John',
        age: 25,
        city: 'New York',
        country: 'USA',
      });
    });

    it('should bind multiple properties sequentially to an object in asynchronous flow', async () => {
      const fl = flow<{ name: string }>()
        .bind('age', async () => ok(25))
        .bind('city', async () => ok('New York'))
        .bind('country', async () => ok('USA'));

      const fn = fl.build();
      const r = await fn({ name: 'John' });
      expect(unwrap(r)).toEqual({
        name: 'John',
        age: 25,
        city: 'New York',
        country: 'USA',
      });
    });

    it('should create object with bound property when input is void in synchronous flow', () => {
      const fl = flow<void>().bind('dummy', success.voidOk1);
      const fn = fl.build();
      const r = fn();
      expect(unwrap(r)).toEqual({ dummy: 'SUCCESS_1' });

      // Typechecking.
      type ExpectedFlowType = GetFlowType<void, { dummy: string }, never, 'sync'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should create object with bound property when input is void in asynchronous flow', async () => {
      const fl = flow<void>().bind('dummy', success.asyncVoidOk1);
      const fn = fl.build();
      const r = await fn();
      expect(unwrap(r)).toEqual({ dummy: 'SUCCESS_1' });

      // Typechecking.
      type ExpectedFlowType = GetFlowType<void, { dummy: string }, never, 'async'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should create object with bound property when input is primitive in synchronous flow', () => {
      const fl = flow<number>().bind('dummy', success.voidOk1);
      const fn = fl.build();
      const r = fn(5);
      expect(unwrap(r)).toEqual({ dummy: 'SUCCESS_1' });

      // Typechecking.
      type ExpectedFlowType = GetFlowType<number, { dummy: string }, never, 'sync'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should create object with bound property when input is primitive in asynchronous flow', async () => {
      const fl = flow<number>().bind('dummy', success.asyncVoidOk1);
      const fn = fl.build();
      const r = await fn(5);
      expect(unwrap(r)).toEqual({ dummy: 'SUCCESS_1' });

      // Typechecking.
      type ExpectedFlowType = GetFlowType<number, { dummy: string }, never, 'async'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should create object with bound property when input is array in synchronous flow', () => {
      const fl = flow<number[]>().bind('dummy', success.voidOk1);
      const fn = fl.build();
      const r = fn([1, 2, 3]);
      expect(unwrap(r)).toEqual({ dummy: 'SUCCESS_1' });

      // Typechecking.
      type ExpectedFlowType = GetFlowType<number[], { dummy: string }, never, 'sync'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should create object with bound property when input is array in asynchronous flow', async () => {
      const fl = flow<number[]>().bind('dummy', success.asyncVoidOk1);
      const fn = fl.build();
      const r = await fn([1, 2, 3]);
      expect(unwrap(r)).toEqual({ dummy: 'SUCCESS_1' });

      // Typechecking.
      type ExpectedFlowType = GetFlowType<number[], { dummy: string }, never, 'async'>;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });

    it('should bind properties using both synchronous and asynchronous functions in mixed flow', async () => {
      const fl = flow<void>()
        .bind('dummy_sync', success.voidOk1)
        .bind('dummy_async', success.asyncVoidOk1);
      const fn = fl.build();
      const r = await fn();

      expect(unwrap(r)).toEqual({ dummy_sync: 'SUCCESS_1', dummy_async: 'SUCCESS_1' });

      // Typechecking.
      type ExpectedFlowType = GetFlowType<
        void,
        { dummy_sync: string; dummy_async: string },
        never,
        'async'
      >;
      expectTypeOf(fl).toEqualTypeOf<ExpectedFlowType['fl']>();
      expectTypeOf(fn).toEqualTypeOf<ExpectedFlowType['fn']>();
      expectTypeOf(r).toEqualTypeOf<ExpectedFlowType['r']>();
    });
  });
});
