import { Pipeline } from './pipeline';

/**
 * Represents a function that can transform a value.
 * This type can be either synchronous or asynchronous.
 *
 * @typeParam I - The type of the input value.
 * @typeParam O - The type of the output value.
 *
 * @public
 */
type TransformFn<I, O> = (value: I) => O | Promise<O>;

declare module './pipeline' {
  interface Pipeline<I, O, E> {
    /**
     * Transforms the value flowing through the pipeline using the provided function.
     * The function can be either synchronous or asynchronous.
     *
     * @typeParam U - The type of the transformed value.
     * @param fn - The function to transform the value.
     * @param description - Optional custom description for this transformation step.
     * @returns A new pipeline with the transformed value type.
     *
     * @example
     * ```ts
     * const pipeline = Pipeline.create<number, number>('Number pipeline')
     *   .map(n => n * 2, 'Double the number') // Sync function with custom description
     *   .map(async n => await fetchData(n)); // Async function with default description
     * ```
     *
     * @public
     */
    map<U>(fn: TransformFn<O, U>, description?: string): Pipeline<I, U, E>;
  }
}

Pipeline.prototype.map = function <I, O, E, U>(
  this: Pipeline<I, O, E>,
  fn: TransformFn<O, U>,
  description?: string,
): Pipeline<I, U, E> {
  const next = this.createNext<U>();
  next.addStep('map', 'Transform value', fn, description);
  return next;
};

export type { TransformFn };
