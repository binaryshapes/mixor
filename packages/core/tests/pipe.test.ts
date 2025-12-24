import { n } from '@nuxo/core';
import { assertEquals } from '@std/assert';

import { pipe } from '../src/pipe.ts';
import { err, ok, unwrap } from '../src/result.ts';

class SomeError extends n.failure(
  'SomeError',
  {
    'en-US': 'Some error',
    'es-ES': 'Error personalizado',
  },
) {}

Deno.test('pipe', () => {
  const result = pipe(
    (x: number) => x + 1,
    (x: number) => x * 2,
    (x: number) => x - 3,
  )(1);

  assertEquals(result, 1);
});

Deno.test('pipe result strict success', () => {
  const result = pipe(
    'strict',
    (x: number) => ok(x + 1),
    (x: number) => ok(x * 2),
    (x: number) => ok(x - 3),
  )(1);

  assertEquals(unwrap(result), 1);
});

Deno.test('pipe result strict failure', () => {
  const result = pipe(
    'strict',
    (x: number) => ok(x + 1),
    () => err(new SomeError()),
  )(1);

  assertEquals(unwrap(result), new SomeError());
});
