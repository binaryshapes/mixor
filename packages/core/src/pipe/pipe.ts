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
 * Represents a pipeline operator that can transform data.
 * Each operator must implement this interface to be compatible with the pipeline system.
 *
 * @typeParam I - The type of the input value.
 * @typeParam O - The type of the output value.
 *
 * @public
 */
interface Operator<I, O> {
  type: string;
  description: string;
  fn: StepFn<I, O>;
}

/**
 * Represents a step in the pipeline with its operation and description.
 */
type PipelineStep = {
  operator: Operator<unknown, unknown>;
  description: string;
};

/**
 * Interface for the Pipe class that defines the pipeline operations.
 * This interface can be extended by operators to add new methods.
 *
 * @typeParam I - The type of the input value.
 * @typeParam O - The type of the output value.
 *
 * @public
 */
interface IPipe<I, O> {
  /**
   * Executes the pipeline synchronously with the given initial value.
   *
   * @param initialValue - The initial value to start the pipeline with.
   * @returns The final value of the pipeline.
   *
   * @throws An `Error` If any step returns a Promise.
   */
  runSync(initialValue: I): O;

  /**
   * Executes the pipeline asynchronously with the given initial value.
   *
   * @param initialValue - The initial value to start the pipeline with.
   * @returns A promise that resolves to the final value of the pipeline.
   */
  runAsync(initialValue: I): Promise<O>;

  /**
   * Returns a string representation of the pipeline.
   *
   * @returns A string showing all steps in the pipeline.
   */
  toString(): string;
}

/**
 * A class that represents a pipeline of operations.
 * The pipeline can transform values through a series of steps.
 *
 * @typeParam I - The type of the input value.
 * @typeParam O - The type of the output value.
 */
export class Pipe<I, O> implements IPipe<I, O> {
  private steps: PipelineStep[];
  private readonly description: string;

  /**
   * Creates a new pipeline with the given description and operators.
   *
   * @param description - A description of what this pipeline does.
   * @param operators - The operators to apply in sequence.
   */
  constructor(description: string, operators: Operator<unknown, unknown>[]) {
    this.description = description;
    this.steps = operators.map((op) => ({
      operator: op,
      description: op.description,
    }));
  }

  /**
   * Executes the pipeline with the given input value.
   * This method runs all operations in sequence and returns the final result.
   *
   * @param input - The input value to process.
   * @returns A promise that resolves to the final transformed value.
   *
   * @example
   * ```ts
   * const result = await pipeline.execute(5);
   * ```
   */
  public async execute(input: I): Promise<O> {
    let value: unknown = input;

    for (const step of this.steps) {
      value = await step.operator.fn(value);
    }

    return value as O;
  }

  /**
   * Returns a string representation of the pipeline.
   * This is useful for debugging and logging.
   *
   * @returns A string describing the pipeline and its steps.
   */
  public toString(): string {
    return this.steps.map((step) => step.description).join(' -> ');
  }

  /**
   * Returns a JSON representation of the pipeline.
   * This is useful for debugging and logging.
   *
   * @returns A JSON object describing the pipeline and its steps.
   */
  public toJSON(): { description: string; steps: { type: string; description: string }[] } {
    return {
      description: this.description,
      steps: this.steps.map(({ operator: { type }, description }) => ({ type, description })),
    };
  }

  /**
   * Executes the pipeline synchronously with the given initial value.
   *
   * @param initialValue - The initial value to start the pipeline with.
   * @returns The final value of the pipeline.
   *
   * @throws An `Error` If any step returns a Promise.
   *
   * @public
   */
  public runSync(initialValue: I): O {
    let currentValue: unknown = initialValue;
    for (const step of this.steps) {
      const result = step.operator.fn(currentValue);
      if (result instanceof Promise) {
        throw new Error('Cannot run pipeline synchronously: found async step');
      }
      currentValue = result;
    }
    return currentValue as O;
  }

  /**
   * Executes the pipeline asynchronously with the given initial value.
   *
   * @param initialValue - The initial value to start the pipeline with.
   * @returns A promise that resolves to the final value of the pipeline.
   *
   * @public
   */
  public async runAsync(initialValue: I): Promise<O> {
    let currentValue: unknown = initialValue;
    for (const step of this.steps) {
      currentValue = await step.operator.fn(currentValue);
    }
    return currentValue as O;
  }
}

/**
 * Creates a new pipeline with the given description and operators.
 *
 * @typeParam I - The type of the input value.
 * @typeParam O - The type of the output value.
 * @param description - A description of what this pipeline does.
 * @param operators - The operators to apply in sequence.
 * @returns A new pipeline instance.
 *
 * @example
 * ```ts
 * const pipeline = pipe('Number pipeline', [
 *   map((n: number) => n * 2),
 *   map((n: number) => n.toString()),
 * ]);
 * ```
 */
export function pipe<I, O>(description: string, operators: Operator<any, unknown>[]): Pipe<I, O> {
  return new Pipe<I, O>(description, operators);
}

export type { Operator, StepFn, IPipe };
