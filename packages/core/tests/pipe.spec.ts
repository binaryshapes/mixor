import { describe, expect, expectTypeOf, it } from 'vitest';

import { pipe } from '../src/pipe';

describe('Pipe', () => {
  it('should create a single function pipeline', () => {
    const addOne = (x: number) => x + 1;
    const pipeline = pipe(addOne);
    expect(pipeline(1)).toBe(2);

    // Typechecking.
    expectTypeOf(pipeline).toBeFunction();
    expectTypeOf(pipeline).parameter(0).toBeNumber();
    expectTypeOf(pipeline).returns.toBeNumber();
  });

  it('should create a two function pipeline', () => {
    const addOne = (x: number) => x + 1;
    const multiplyByTwo = (x: number) => x * 2;
    const pipeline = pipe(addOne, multiplyByTwo);
    expect(pipeline(1)).toBe(4);

    // Typechecking.
    expectTypeOf(pipeline).toBeFunction();
    expectTypeOf(pipeline).parameter(0).toBeNumber();
    expectTypeOf(pipeline).returns.toBeNumber();
  });

  it('should create a three function pipeline', () => {
    const addOne = (x: number) => x + 1;
    const multiplyByTwo = (x: number) => x * 2;
    const subtractThree = (x: number) => x - 3;
    const pipeline = pipe(addOne, multiplyByTwo, subtractThree);
    expect(pipeline(1)).toBe(1);

    // Typechecking.
    expectTypeOf(pipeline).toBeFunction();
    expectTypeOf(pipeline).parameter(0).toBeNumber();
    expectTypeOf(pipeline).returns.toBeNumber();
  });

  it('should handle different types in pipeline', () => {
    const toString = (x: number) => x.toString();
    const toLength = (s: string) => s.length;
    const pipeline = pipe(toString, toLength);
    expect(pipeline(123)).toBe(3);

    // Typechecking.
    expectTypeOf(pipeline).toBeFunction();
    expectTypeOf(pipeline).parameter(0).toBeNumber();
    expectTypeOf(pipeline).returns.toBeNumber();
  });

  it('should allow different types of inputs and outputs', () => {
    const currentDate = (): Date => new Date();
    const toLocaleString = (date: Date) => date.toLocaleString();
    const pipeline = pipe(currentDate, toLocaleString);
    expect(pipeline()).toBe(new Date().toLocaleString());

    // Typechecking.
    expectTypeOf(pipeline).toBeFunction();
    expectTypeOf(pipeline).parameter(0).toBeVoid();
    expectTypeOf(pipeline).returns.toBeString();
  });

  it('should handle void values', () => {
    const identity = () => undefined;
    const pipeline = pipe(identity);
    expect(pipeline()).toBe(undefined);

    // Typechecking.
    expectTypeOf(pipeline).toBeFunction();
    expectTypeOf(pipeline).parameter(0).toBeVoid();
    expectTypeOf(pipeline).returns.toBeVoid();
  });

  it('should handle multiple values', () => {
    const add = (x: number, y: number) => x + y;
    const pipeline = pipe(add);
    expect(pipeline(1, 2)).toBe(3);

    // Typechecking.
    expectTypeOf(pipeline).toBeFunction();
    expectTypeOf(pipeline).parameter(0).toBeNumber();
    expectTypeOf(pipeline).parameter(1).toBeNumber();
    expectTypeOf(pipeline).returns.toBeNumber();
  });

  it('should handle identity pipeline', () => {
    const identity = (x: number) => x;
    const pipeline = pipe(identity);
    expect(pipeline(42)).toBe(42);

    // Typechecking.
    expectTypeOf(pipeline).toBeFunction();
    expectTypeOf(pipeline).parameter(0).toBeNumber();
    expectTypeOf(pipeline).returns.toBeNumber();
  });

  it('should handle null values', () => {
    const identity = (x: unknown) => x;
    const pipeline = pipe(identity);
    expect(pipeline(null)).toBe(null);

    // Typechecking.
    expectTypeOf(pipeline).toBeFunction();
    expectTypeOf(pipeline).parameter(0).toBeUnknown();
    expectTypeOf(pipeline).returns.toBeUnknown();
  });

  it('should handle undefined values', () => {
    const identity = (x: unknown) => x;
    const pipeline = pipe(identity);
    expect(pipeline(undefined)).toBe(undefined);

    // Typechecking.
    expectTypeOf(pipeline).toBeFunction();
    expectTypeOf(pipeline).parameter(0).toBeUnknown();
    expectTypeOf(pipeline).returns.toBeUnknown();
  });
});
