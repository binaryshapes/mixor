import { builder, err, ok } from '@daikit/core';

const isString = (value: string) => {
  if (typeof value !== 'string') {
    return err('NOT_STRING');
  }
  return ok(value);
};

const minLength = (length: number) => (value: string) => {
  if (value.length < length) {
    return err('TOO_SHORT');
  }
  return ok(value);
};

const maxLength = (length: number) => (value: string) => {
  if (value.length > length) {
    return err('TOO_LONG');
  }
  return ok(value);
};

const matches = (pattern: RegExp) => (value: string) => {
  if (!pattern.test(value)) {
    return err('DOES_NOT_MATCH');
  }
  return ok(value);
};

function minMaxLength(min: number, max: number) {
  return (value: string) => {
    if (value.length < min || value.length > max) {
      return err('LENGTH_OUT_OF_RANGE');
    }
    return ok(value);
  };
}

function incompatible() {
  return (value: number) => {
    return err('NO_COMPATIBLE');
  };
}

const stringMethods = {
  isString,
  minLength,
  maxLength,
  matches,
  minMaxLength,
  // incompatible, // This method is not compatible with the other methods should be thrown a Error type.
};

function exampleBuilder() {
  const string = builder(stringMethods, ['minMaxLength']);

  const validator = string
    .isString()
    .minLength(3)
    .maxLength(10)
    .minMaxLength(5, 10)
    .minMaxLength(1, 10)
    .matches(/^[a-z]+$/)
    .build();

  const result1 = validator('hello'); // Ok
  const result2 = validator('hi'); // Err: TOO_SHORT
  const result3 = validator('very long string'); // Err: TOO_LONG

  console.log('Result 1:', result1);
  console.log('Result 2:', result2);
  console.log('Result 3:', result3);
}

function codeExample() {
  // Result<string, 'NOT_STRING' | 'TOO_SHORT' | 'TOO_LONG'>
  const stringBuilder = builder({
    isString: (a: unknown) => (typeof a === 'string' ? ok(a) : err('NOT_STRING')),
    minLength: (length: number) => (a: string) => (a.length >= length ? ok(a) : err('TOO_SHORT')),
    maxLength: (length: number) => (a: string) => (a.length <= length ? ok(a) : err('TOO_LONG')),
  });

  // String Rules
  const stringRules = stringBuilder.isString().minLength(3).maxLength(10).build();

  const r1 = stringRules('hello'); // Ok
  const r2 = stringRules('hi'); // Err: TOO_SHORT
  const r3 = stringRules('very long string'); // Err: TOO_LONG
  // @ts-expect-error - This should be an error.
  const r4 = stringRules(123); // Err: NOT_STRING

  console.log('Result 1:', r1);
  console.log('Result 2:', r2);
  console.log('Result 3:', r3);
  console.log('Result 4:', r4);
}

codeExample();
