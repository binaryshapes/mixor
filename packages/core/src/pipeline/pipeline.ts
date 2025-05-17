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
 * @example
 * ```ts
 * const pipeline = Pipeline.create()
 *   .from((n: number) => n * 2)
 *   .map(n => n.toString());
 * ```
 *
 * @public
 */
class Pipeline<I = unknown, O = unknown> {
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
        type: 'create',
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
  protected createNext<U>(): Pipeline<I, U> {
    const next = new Pipeline<I, U>();
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
   * const pipeline = Pipeline.create()
   *   .from((n: number) => n * 2)
   *   .map(n => n.toString());
   *
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
   * const pipeline = Pipeline.create()
   *   .map(async n => await fetchData(n));
   *
   * const result = await pipeline.runAsync(5);
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
   * @typeParam U - The type of the output value.
   * @param fn - The function or value to initialize the pipeline.
   * @param description - Optional description for this step.
   * @returns A new pipeline with the inferred type.
   *
   * @example
   * ```ts
   * const pipeline = Pipeline.create('Number pipeline')
   *   .from((n: number) => n * 2, 'Double the number')
   *   .map(n => n.toString(), 'Convert to string');
   * ```
   *
   * @public
   */
  public static create<I, U>(fn: StepFn<I, U>, description?: string): Pipeline<I, U> {
    const next = new Pipeline<I, U>(description);
    next.addStep('init', 'Initial value', fn);
    return next;
  }
}

// Type augmentation for pipeline operators.
declare module './pipeline' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars
  interface Pipeline<I, O> {
    // This interface will be augmented by each operator.
  }
}

export type { PipelineStep, PipelineMode, StepFn };

export { Pipeline };
