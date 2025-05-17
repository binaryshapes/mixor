/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { Pipeline, type StepFn } from './pipeline';

declare module './pipeline' {
  interface Pipeline<I, O> {
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
     * const pipeline = Pipeline.create((n: number) => n * 2, 'Double the number')
     *   .map(n => n + 1, 'Add one')
     *   .map(async n => await fetchData(n));
     * ```
     *
     * @public
     */
    map<U>(fn: StepFn<O, U>, description?: string): Pipeline<I, U>;
  }
}

// Map function implementation.
Pipeline.prototype.map = function map<I, O, U>(
  this: Pipeline<I, O>,
  fn: StepFn<O, U>,
  description?: string,
) {
  const next = this.createNext<U>();
  next.addStep('map', 'Transform value', fn, description);
  return next;
};
