/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Represents a function that can be executed in a pipeline step.
 * This type can be either synchronous or asynchronous.
 *
 * @typeParam I - The type of the input value.
 * @typeParam O - The type of the output value.
 *
 * @public
 */
type StepFn<I, O> = (value: I) => O | Promise<O>;

/**
 * Represents the type of a pipeline step.
 * This type is used to track the operations in the pipeline.
 *
 * @typeParam I - The type of the input value.
 * @typeParam O - The type of the output value.
 *
 * @public
 */
type PipelineStep<I = unknown, O = unknown> = {
  type: string;
  description: string;
  fn?: StepFn<I, O>;
};

/**
 * Represents the execution mode of a pipeline.
 * This type is inferred based on the functions added to the pipeline.
 *
 * @public
 */
type PipelineMode = { type: 'sync'; value: unknown } | { type: 'async'; value: Promise<unknown> };

/**
 * A class that provides a fluent API for building and executing pipelines.
 * The Pipeline class allows for chaining operations in a type-safe way.
 * Each pipeline maintains a list of steps that will be executed when run.
 *
 * @typeParam I - The type of the input value that flows through the pipeline.
 * @typeParam O - The type of the output value that flows through the pipeline.
 * @typeParam E - The type of the error that can occur in the pipeline.
 *
 * @example
 * ```ts
 * const pipeline = Pipeline.create<number, string>('Number processing pipeline');
 * ```
 *
 * @public
 */
class Pipeline<I, O = I, E = unknown> {
  private readonly steps: PipelineStep[] = [];

  /**
   * Creates a new Pipeline instance.
   * This constructor is private to force the use of the static create method.
   *
   * @param description - Optional description for this pipeline.
   * @internal
   */
  private constructor(description?: string) {
    if (description) {
      this.steps.push({
        type: 'init',
        description,
      });
    }
  }

  /**
   * Creates a new pipeline with the same steps as this one.
   * This is used internally by operators to maintain step history.
   *
   * @typeParam U - The type of the new pipeline output.
   * @returns A new pipeline with the same steps.
   *
   * @internal
   */
  protected createNext<U>(): Pipeline<I, U, E> {
    const next = new Pipeline<I, U, E>();
    this.steps.forEach((step) => {
      next.addStep(step.type, step.description, step.fn);
    });
    return next;
  }

  /**
   * Gets the current steps in the pipeline.
   *
   * @returns The array of pipeline steps.
   *
   * @internal
   */
  protected getSteps(): PipelineStep[] {
    return this.steps;
  }

  /**
   * Adds a new step to the pipeline.
   *
   * @typeParam I - The type of the input value.
   * @typeParam O - The type of the output value.
   * @param type - The type of the step.
   * @param description - The description of the step.
   * @param fn - Optional function to execute in this step.
   * @param stepDescription - Optional description to override the default step description.
   *
   * @internal
   */
  protected addStep<I, O>(
    type: string,
    description: string,
    fn?: StepFn<I, O>,
    stepDescription?: string,
  ): void {
    this.steps.push({
      type,
      description: stepDescription ?? description,
      fn: fn as StepFn<unknown, unknown>,
    });
  }

  /**
   * Executes the pipeline synchronously with the given initial value.
   * This method will throw an error if any step returns a Promise.
   *
   * @param initialValue - The initial value to start the pipeline with.
   * @returns The final value of the pipeline.
   *
   * @throws An `Error` If any step returns a Promise.
   *
   * @example
   * ```ts
   * const pipeline = Pipeline.create<number, string>('Number pipeline')
   *   .from((n: number) => n * 2)
   *   .map(n => n.toString());
   *
   * // Sync execution
   * const result = pipeline.runSync(5); // "10"
   * ```
   *
   * @public
   */
  public runSync(initialValue: I): O {
    let currentValue: unknown = initialValue;
    for (const step of this.steps) {
      if (step.fn) {
        const result = step.fn(currentValue);
        if (result instanceof Promise) {
          throw new Error('Cannot run pipeline synchronously: found async step');
        }
        currentValue = result;
      }
    }
    return currentValue as O;
  }

  /**
   * Executes the pipeline asynchronously with the given initial value.
   * This method will always use await, even if all steps are synchronous.
   *
   * @param initialValue - The initial value to start the pipeline with.
   * @returns A promise that resolves to the final value of the pipeline.
   *
   * @example
   * ```ts
   * const pipeline = Pipeline.create<number, string>('Async pipeline')
   *   .map(async n => await fetchData(n));
   *
   * const asyncResult = await pipeline.runAsync(5); // Promise<string>
   * ```
   *
   * @public
   */
  public async runAsync(initialValue: I): Promise<O> {
    let currentValue: unknown = initialValue;
    for (const step of this.steps) {
      if (step.fn) {
        currentValue = await step.fn(currentValue);
      }
    }
    return currentValue as O;
  }

  /**
   * Returns a string representation of the pipeline.
   * This is useful for debugging and understanding the pipeline's structure.
   *
   * @returns A string showing all steps in the pipeline.
   *
   * @public
   */
  public toString(): string {
    return this.steps
      .map((step, index) => `${index + 1}. ${step.type}: ${step.description}`)
      .join('\n');
  }

  /**
   * Returns a JSON representation of the pipeline steps.
   * This is useful for serialization and programmatic access to the pipeline structure.
   *
   * @returns An array of step objects with their type and description.
   *
   * @public
   */
  public toJSON(): PipelineStep[] {
    return this.steps;
  }

  /**
   * Initializes the pipeline with a function or value.
   * This method infers the initial type from the provided function or value.
   *
   * @typeParam I - The type of the input value.
   * @typeParam O - The type of the output value.
   * @typeParam E - The type of the error.
   * @param fn - The function or value to initialize the pipeline.
   * @param description - Optional description for this step.
   * @returns A new pipeline with the inferred type.
   *
   * @example
   * ```ts
   * const pipeline = Pipeline.create<number, number>('Number pipeline')
   *   .from((n: number) => n * 2, 'Double the number')
   *   .map(n => n.toString(), 'Convert to string');
   * ```
   *
   * @public
   */
  public from<U>(fn: (value: I) => U | Promise<U>, description?: string): Pipeline<I, U, E> {
    const next = new Pipeline<I, U, E>(description);
    next.addStep('from', 'Initial value', fn);
    return next;
  }

  /**
   * Static method to create a new pipeline.
   * This is a more fluent way to create pipelines.
   *
   * @typeParam I - The type of the input value.
   * @typeParam O - The type of the output value.
   * @param description - Optional description for this pipeline.
   * @returns A new pipeline instance.
   *
   * @example
   * ```ts
   * const pipeline = Pipeline.create<number, string>('Number pipeline')
   *   .from((n: number) => n * 2, 'Double the number')
   *   .map(n => n.toString(), 'Convert to string');
   * ```
   *
   * @public
   */
  public static create<I, O = I>(description?: string): Pipeline<I, O, unknown> {
    return new Pipeline<I, O, unknown>(description);
  }
}

// Type augmentation for pipeline operators
declare module './pipeline' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars
  interface Pipeline<I, O, E> {
    // This interface will be augmented by each operator
  }
}

export type { PipelineStep, PipelineMode, StepFn };

export { Pipeline };
