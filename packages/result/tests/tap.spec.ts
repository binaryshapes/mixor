import { Pipeline } from '../src/pipeline';
import { failure, isFail, isSuccess, success } from '../src/result';

describe('Pipeline tap', () => {
  it('should execute tap on success value', async () => {
    const mockFn = jest.fn();
    const result = await Pipeline.fromFunction(() => success(42))
      .tap((value) => {
        mockFn(value);
      })
      .run();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.value).toBe(42);
    }
    expect(mockFn).toHaveBeenCalledWith(42);
  });

  it('should not execute tap on failure value', async () => {
    const mockFn = jest.fn();
    const result = await Pipeline.fromFunction(() => failure('error'))
      .tap((value) => {
        mockFn(value);
      })
      .run();

    expect(isFail(result)).toBe(true);
    if (isFail(result)) {
      expect(result.cause).toBe('error');
    }
    expect(mockFn).not.toHaveBeenCalled();
  });

  it('should handle async tap function', async () => {
    const mockFn = jest.fn();
    const result = await Pipeline.fromFunction(() => success(42))
      .tap(async (value) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        mockFn(value);
      })
      .run();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.value).toBe(42);
    }
    expect(mockFn).toHaveBeenCalledWith(42);
  });

  it('should fail pipeline if tap throws error', async () => {
    const error = new Error('tap error');
    const result = await Pipeline.fromFunction(() => success(42))
      .tap(() => {
        throw error;
      })
      .run();

    expect(isFail(result)).toBe(true);
    if (isFail(result)) {
      expect(result.cause).toBe(error);
    }
  });

  it('should fail pipeline if async tap throws error', async () => {
    const error = new Error('async tap error');
    const result = await Pipeline.fromFunction(() => success(42))
      .tap(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        throw error;
      })
      .run();

    expect(isFail(result)).toBe(true);
    if (isFail(result)) {
      expect(result.cause).toBe(error);
    }
  });

  it('should maintain error type when tap fails', async () => {
    const error = 'custom error';
    const result = await Pipeline.fromFunction<number, string>(() => success(42))
      .tap(() => {
        throw error;
      })
      .run();

    expect(isFail(result)).toBe(true);
    if (isFail(result)) {
      expect(result.cause).toBe(error);
    }
  });

  it('should chain multiple taps', async () => {
    const mockFn1 = jest.fn();
    const mockFn2 = jest.fn();
    const result = await Pipeline.fromFunction(() => success(42))
      .tap((value) => {
        mockFn1(value);
      })
      .tap((value) => {
        mockFn2(value);
      })
      .run();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.value).toBe(42);
    }
    expect(mockFn1).toHaveBeenCalledWith(42);
    expect(mockFn2).toHaveBeenCalledWith(42);
  });

  it('should stop pipeline if any tap fails', async () => {
    const mockFn = jest.fn();
    const error = new Error('first tap error');
    const result = await Pipeline.fromFunction(() => success(42))
      .tap(() => {
        throw error;
      })
      .tap(() => {
        mockFn();
      })
      .run();

    expect(isFail(result)).toBe(true);
    if (isFail(result)) {
      expect(result.cause).toBe(error);
    }
    expect(mockFn).not.toHaveBeenCalled();
  });

  it('should handle complex objects in tap', async () => {
    type User = { name: string; age: number };
    const user: User = { name: 'John', age: 30 };
    const mockFn = jest.fn();

    const result = await Pipeline.fromFunction(() => success(user))
      .tap((value) => {
        mockFn(value);
      })
      .run();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.value).toEqual(user);
    }
    expect(mockFn).toHaveBeenCalledWith(user);
  });
});
