/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { n } from '@nuxo/core';

import type { Task, TaskContract, TaskDependencies } from './task.ts';

/**
 * The tag for the workflow component.
 *
 * @internal
 */
const WORKFLOW_TAG = 'Workflow' as const;

/**
 * The result of a workflow task execution.
 *
 * @remarks
 * This type extracts detailed information about a task's execution within a workflow.
 * It includes metadata such as execution time, attempts, and success status, which
 * are useful for monitoring, debugging, and tracing workflow executions.
 *
 * @typeParam T - The task provider type from which to extract execution details.
 *
 * @internal
 */
type WorkflowDetail<T> = T extends n.Provider<Task<infer C, infer D>, infer D> ? {
    /**
     * The name of the task in the workflow context.
     */
    name: string;
    /**
     * The description of the task in the workflow context.
     */
    description: string;
    /**
     * The input that was passed to the task.
     */
    input: Task<C, D>['Input'];
    /**
     * The output produced by the task (or error if the task failed).
     */
    output: Task<C, D>['Output'];
    /**
     * The duration of the task execution in milliseconds.
     */
    duration: number;
    /**
     * The number of retry attempts made during task execution.
     */
    attempts: number;
    /**
     * Whether the task execution was successful.
     */
    success: boolean;
  }
  : never;

/**
 * The trace of the workflow execution.
 *
 * @remarks
 * A trace is a record that maps each task name to its execution details.
 * This provides a complete audit trail of the workflow execution, including
 * the input, output, duration, attempts, and success status for each task.
 *
 * @typeParam T - The record of tasks in the workflow.
 *
 * @internal
 */
type WorkflowTrace<T extends WorkflowTasks> = {
  [K in keyof T]: WorkflowDetail<T[K]>;
};

/**
 * The type of the workflow tasks record.
 *
 * @remarks
 * A workflow tasks record maps task identifiers (composed of name and description)
 * to task providers. Each task provider must be a valid Provider that exports a Task component.
 *
 * @internal
 */
type WorkflowTasks = Record<string, n.Any>;

/**
 * The input type of the workflow.
 *
 * @remarks
 * The workflow input is derived from the first task in the workflow sequence.
 * This is the type that must be provided when executing the workflow.
 *
 * @typeParam T - The record of tasks in the workflow.
 *
 * @internal
 */
type WorkflowInput<T extends WorkflowTasks> = n.FirstElement<T> extends
  n.Provider<Task<infer C, infer D>, infer D> ? Task<C, D>['Input']
  : never;

/**
 * The output type of the workflow.
 *
 * @remarks
 * The workflow output is derived from the last task in the workflow sequence.
 * This represents the final result produced by the workflow after all tasks
 * have been executed successfully.
 *
 * @typeParam T - The record of tasks in the workflow.
 *
 * @internal
 */
type WorkflowOutput<T extends WorkflowTasks> = n.LastElement<T> extends
  n.Provider<Task<infer C, infer D>, infer D> ? Task<C, D>['Output']
  : never;

/**
 * The error type of the workflow.
 *
 * @remarks
 * This type merges all possible error types from all tasks in the workflow.
 * If any task fails during execution, the workflow will return one of these
 * error types. The error type is a union of all task error types, allowing
 * for comprehensive error handling.
 *
 * @typeParam T - The record of tasks in the workflow.
 *
 * @internal
 */
type WorkflowErrors<T extends WorkflowTasks> = n.MergeUnion<
  {
    [K in keyof T]: T[K] extends n.Provider<Task<infer C, infer D>, infer D> ? Task<C, D>['Errors']
      : never;
  }[keyof T]
>;

/**
 * The signature of the workflow execution function.
 *
 * @remarks
 * The workflow signature defines how a workflow is executed. It takes the workflow
 * input and returns a Promise that resolves to a Result containing:
 * - The final output of the workflow (from the last task)
 * - A trace of all task executions (for monitoring and debugging)
 *
 * If any task fails, the Result will contain an error from the WorkflowErrors type.
 *
 * @typeParam T - The record of tasks in the workflow.
 *
 * @internal
 */
type WorkflowSignature<T extends WorkflowTasks> = (
  input: WorkflowInput<T>,
) => Promise<n.Result<WorkflowOutput<T>, WorkflowErrors<T>>>;

/**
 * The workflow component type.
 *
 * @remarks
 * A workflow is a component that orchestrates the sequential execution of multiple tasks.
 * It combines a callable execution function with builder methods for configuring tasks.
 *
 * The workflow executes tasks in the order they were added, where the output of one task
 * becomes the input of the next. If any task fails, the workflow stops and returns the error.
 *
 * Use {@link workflow} to create a new workflow builder, then use {@link WorkflowBuilder.addTask}
 * to add tasks, and {@link WorkflowBuilder.build} to finalize the workflow.
 *
 * @typeParam T - The record of tasks in the workflow.
 *
 * @public
 */
type Workflow<T extends WorkflowTasks = never> = n.Component<
  typeof WORKFLOW_TAG,
  WorkflowSignature<T> & WorkflowBuilder<T> & {
    /** Workflow input type. */
    Input: WorkflowInput<T>;
    /** Workflow output type. */
    Output: WorkflowOutput<T>;
    /** Workflow errors type. */
    Errors: WorkflowErrors<T>;
  }
>;

/**
 * Panic error for the workflow module.
 *
 * @remarks
 * These errors are raised when the workflow is misconfigured:
 * - `NoTasksAdded`: Raised when attempting to build a workflow without any tasks.
 * - `InvalidTasks`: Raised when one or more tasks are not valid providers.
 *
 * @public
 */
class WorkflowPanic
  extends n.panic<typeof WORKFLOW_TAG, 'NoTasksAdded' | 'InvalidTasks'>(WORKFLOW_TAG) {}

/**
 * The workflow builder class.
 *
 * @remarks
 * Provides a fluent API for building workflows by adding tasks sequentially.
 * The builder maintains the tasks registry and provides methods to add tasks
 * and build the final workflow component.
 *
 * Tasks are executed in the order they are added, and the output of each task
 * becomes the input for the next task in the sequence.
 *
 * @typeParam T - The record of tasks added to the workflow.
 *
 * @internal
 */
class WorkflowBuilder<T extends WorkflowTasks = never> {
  /**
   * The tasks registered in the workflow.
   *
   * @remarks
   * This record maps task identifiers (composed of name and description) to task providers.
   * Tasks are stored with keys in the format `${name}.${description}`.
   */
  public readonly tasks: T = {} as T;

  /**
   * Adds a task to the workflow.
   *
   * @remarks
   * This method adds a new task to the workflow sequence. Tasks are executed in the
   * order they are added, and the output of each task becomes the input of the next.
   *
   * Each task must be a valid Provider that exports a Task component. The task is
   * identified by its name and description, which are used for tracing and debugging.
   *
   * @typeParam C - The contract type of the task.
   * @typeParam D - The dependencies type of the task.
   * @typeParam K - The name of the task (string literal type).
   * @typeParam TT - The task provider type.
   * @param def - The task definition containing the name, description, and task provider.
   * @returns A new workflow builder with the task added, allowing method chaining.
   */
  public addTask<
    C extends TaskContract,
    D extends TaskDependencies,
    K extends string,
  >(
    def: {
      name: K;
      description: string;
      task: n.Provider<Task<C, D>, D>;
    },
  ) {
    type Task = typeof def.task;
    type TTT = n.Pretty<[T] extends [never] ? Record<K, Task> : T & Record<K, Task>>;
    this.tasks[`${def.name}.${def.description}` as keyof T] = def.task as unknown as T[keyof T];
    return this as unknown as Workflow<TTT>;
  }

  /**
   * Builds the workflow component.
   *
   * @remarks
   * This method finalizes the workflow by:
   * 1. Validating that at least one task has been added.
   * 2. Validating that all tasks are valid providers.
   * 3. Creating a workflow component that can be executed.
   * 4. Wrapping it in a provider for dependency injection.
   *
   * After calling this method, the workflow is ready to be executed. The workflow
   * component can be called as a function with the workflow input to start execution.
   *
   * @returns A provider that exports the workflow component.
   * @throws {WorkflowPanic} If no tasks were added or if any task is invalid.
   */
  public build(): n.Provider<Workflow<T>, T> {
    if (Object.keys(this.tasks).length === 0) {
      throw new WorkflowPanic(
        'NoTasksAdded',
        'No tasks added to the workflow',
        'Add tasks to the workflow using the addTask method',
      );
    }

    // Validate that all tasks are valid providers.
    const allAreProviders = Object.values(this.tasks).every(n.isProvider);
    if (!allAreProviders) {
      throw new WorkflowPanic(
        'InvalidTasks',
        'Invalid tasks added to the workflow',
        'Add valid tasks to the workflow using the addTask method',
      );
    }

    return n.provider()
      .use(this.tasks)
      .provide((deps) => n.component(WORKFLOW_TAG, workflowFn(deps), this)) as n.Provider<
        Workflow<T>,
        T
      >;
  }
}
/**
 * Creates the workflow execution function.
 *
 * @remarks
 * This method creates the execution function that will run all tasks sequentially.
 * The execution function:
 * - Takes the workflow input (for the first task)
 * - Executes each task in sequence
 * - Passes the output of each task as input to the next
 * - Tracks execution metadata (duration, attempts, success status)
 * - Stops and returns an error if any task fails
 * - Returns the final output and execution trace if all tasks succeed
 *
 * @typeParam T - The record of tasks in the workflow.
 * @param tasksProviders - The resolved task providers to execute.
 * @returns A function that executes the workflow with the given input.
 */
const workflowFn = <T extends WorkflowTasks>(tasksProviders: T): WorkflowSignature<T> => {
  return async (input: WorkflowInput<T>) => {
    const taskEntries = Object.entries(tasksProviders) as [string, n.Any][];
    const results = {} as WorkflowOutput<T>;
    let currentInput: n.Any = input;

    // Execute tasks sequentially.
    for (const [key, task] of taskEntries) {
      const [name, description] = key.split('.');
      const startTime = performance.now();
      const result = await task(currentInput);
      const endTime = performance.now();
      const duration = Number((endTime - startTime).toFixed(2));

      // Get attempts from task if available.
      const attempts = 'attempts' in task && typeof task.attempts === 'number' ? task.attempts : 0;
      const isSuccess = n.isOk(result);

      // Store the result
      (results as n.Any)[name] = {
        name,
        description,
        input: currentInput,
        output: isSuccess ? result.value : result.error,
        duration,
        attempts,
        success: isSuccess,
      };

      // If the task failed, return the error
      if (n.isErr(result)) {
        return result as n.Result<WorkflowOutput<T>, WorkflowErrors<T>>;
      }

      // Use the output as input for the next task
      currentInput = result.value;
    }

    return n.ok(currentInput);
  };
};

/**
 * Creates a new workflow builder.
 *
 * @remarks
 * Use this function to create a new workflow builder. The builder provides a fluent
 * API for configuring and executing workflows:
 *
 * 1. Use {@link WorkflowBuilder.addTask} to add tasks to the workflow sequence
 * 2. Use {@link WorkflowBuilder.build} to finalize the workflow and create a provider
 * 3. Call the workflow as a function with the input to execute it
 *
 * Tasks are executed sequentially in the order they are added. The output of each
 * task becomes the input of the next task. If any task fails, the workflow stops
 * and returns the error.
 *
 * The workflow execution returns a Result containing:
 * - The final output (from the last task)
 * - A trace of all task executions (for monitoring and debugging)
 *
 * @returns A new workflow builder that can be configured with tasks.
 *
 * @public
 */
const workflow = (): Workflow => new WorkflowBuilder() as Workflow;

export { workflow };
export type { Workflow };
