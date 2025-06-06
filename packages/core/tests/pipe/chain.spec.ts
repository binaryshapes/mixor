import { describe, expect, expectTypeOf, it } from 'vitest';

import { chain } from '../../src/pipe/chain';
import type { Prettify } from '../../src/utils';

describe('Chain', () => {
  it('should chain string transformations', () => {
    const trim = (value: string) => value.trim();
    const toUpperCase = (value: string) => value.toUpperCase();
    const addExclamation = (value: string) => `${value}!`;

    const stringChain = chain('string-chain', trim, toUpperCase, addExclamation);
    const stringPipe = stringChain.build();
    const result = stringPipe('  hello world  ');

    // Runtime checks.
    expect(stringChain.steps().name).toEqual('string-chain');
    expect(stringChain.steps().steps).toHaveLength(3);
    expect(result).toBe('HELLO WORLD!');

    // Typechecks.
    expectTypeOf(stringPipe).toBeFunction();
    expectTypeOf(stringPipe).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(stringPipe).returns.toEqualTypeOf<string>();
  });

  it('should chain string transformations with async functions', async () => {
    const trim = async (value: string) => value.trim();
    const toUpperCase = async (value: string) => value.toUpperCase();
    const addExclamation = async (value: string) => `${value}!`;

    const stringChain = chain('string-chain', trim, toUpperCase, addExclamation);
    const stringPipe = stringChain.build();
    const result = await stringPipe('  hello world  ');

    // Runtime checks.
    expect(stringChain.steps().name).toEqual('string-chain');
    expect(stringChain.steps().steps).toHaveLength(3);
    expect(result).toBe('HELLO WORLD!');

    // Typechecks.
    expectTypeOf(stringPipe).toBeFunction();
    expectTypeOf(stringPipe).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(stringPipe).returns.toEqualTypeOf<Promise<string>>();
  });

  it('should chain different types through a chain', () => {
    const stringToNumber = (value: string) => Number(value);
    const numberToString = (value: number) => String(value);
    const stringChain = chain('string-chain', stringToNumber, numberToString);
    const stringPipe = stringChain.build();
    const result = stringPipe('123');

    // Runtime tests.
    expect(stringChain.steps().name).toEqual('string-chain');
    expect(stringChain.steps().steps).toHaveLength(2);
    expect(result).toBe('123');

    // Typechecks.
    expectTypeOf(stringPipe).toBeFunction();
    expectTypeOf(stringPipe).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(stringPipe).returns.toEqualTypeOf<string>();
  });

  it('should chain object transformations', () => {
    type User = {
      name: string;
      age: number;
    };

    const validateName = (user: User) => {
      if (user.name.length < 2) throw new Error('Name too short');
      return user;
    };

    const validateAge = (user: User) => {
      if (user.age < 18) throw new Error('Too young');
      return user;
    };

    const formatUser = (user: User) => ({
      ...user,
      name: user.name.toUpperCase(),
      isAdult: user.age >= 18,
    });

    const userChain = chain('user-chain', validateName, validateAge, formatUser);
    const userPipe = userChain.build();
    const validUser = { name: 'John', age: 25 };
    const result = userPipe(validUser);

    // Runtime checks.
    expect(userChain.steps().name).toEqual('user-chain');
    expect(userChain.steps().steps).toHaveLength(3);
    expect(result).toEqual({
      name: 'JOHN',
      age: 25,
      isAdult: true,
    });
    expect(() => userPipe({ name: 'J', age: 25 })).toThrow('Name too short');
    expect(() => userPipe({ name: 'John', age: 16 })).toThrow('Too young');

    // Typechecks.
    expectTypeOf(userPipe).toBeFunction();
    expectTypeOf(userPipe).parameter(0).toEqualTypeOf<User>();
    expectTypeOf(userPipe).returns.toEqualTypeOf<Prettify<User & { isAdult: boolean }>>();
  });
});
