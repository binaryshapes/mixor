import { Pipeline } from '../src/pipeline';
import { fail, isSuccess, success } from '../src/result';

describe('Pipeline.all', () => {
  it('should collect all successful results', async () => {
    const result = await Pipeline.all<string | number | boolean, never>([
      Pipeline.from(success('hello')),
      Pipeline.from(success(42)),
      Pipeline.from(success(true)),
    ]).run();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.value).toEqual(['hello', 42, true]);
    }
  });

  it('should return first failure if any pipeline fails', async () => {
    const result = await Pipeline.all<string | number, string>([
      Pipeline.from(success('hello')),
      Pipeline.from(fail('error')),
      Pipeline.from(success(42)),
    ]).run();

    expect(isSuccess(result)).toBe(false);
    if (!isSuccess(result)) {
      expect(result.cause).toBe('error');
    }
  });

  it('should handle empty array of pipelines', async () => {
    const result = await Pipeline.all<string, never>([]).run();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.value).toEqual([]);
    }
  });

  it('should handle async pipelines', async () => {
    const result = await Pipeline.all<string, never>([
      Pipeline.from(Promise.resolve(success('hello'))),
      Pipeline.from(Promise.resolve(success('world'))),
    ]).run();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.value).toEqual(['hello', 'world']);
    }
  });

  it('should handle function pipelines', async () => {
    const result = await Pipeline.all<string, never>([
      Pipeline.fromFunction(() => success('hello')),
      Pipeline.fromFunction(() => success('world')),
    ]).run();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.value).toEqual(['hello', 'world']);
    }
  });

  it('should handle mixed pipeline types', async () => {
    const result = await Pipeline.all<string, never>([
      Pipeline.from(success('hello')),
      Pipeline.from(Promise.resolve(success('world'))),
      Pipeline.fromFunction(() => success('!')),
    ]).run();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.value).toEqual(['hello', 'world', '!']);
    }
  });
});
