/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import pc from 'picocolors';
import { ulid } from 'ulid';

/**
 * Represents the execution mode of a flow.
 *
 * @internal
 */
type ExecutionMode = 'parallel' | 'sequential';

/**
 * Represents a step in the flow execution.
 * Each step has a type and a description for debugging purposes.
 *
 * @typeParam T - The type of step operations available in the flow.
 *
 * @internal
 */
type FlowStep<T extends string = string> = {
  id: string;
  type: T;
  description: string;
};

/**
 * Base type for flow nodes.
 *
 * @internal
 */
type BaseFlowNode = {
  id: string;
  name: string;
  executionMode: ExecutionMode;
  description?: string;
};

/**
 * Represents a flow node in the tree structure.
 *
 * @typeParam T - The type of step operations available in the flow.
 *
 * @internal
 */
type FlowNode<T extends string = string> = {
  type: 'pipeline';
  children: FlowTreeNode<T>[];
} & BaseFlowNode;

/**
 * Represents a step node in the tree structure.
 *
 * @typeParam T - The type of step operations available in the flow.
 *
 * @internal
 */
type StepNode<T extends string = string> = {
  type: 'step';
  stepType: T;
  children: never[];
} & BaseFlowNode;

/**
 * Union type of all possible nodes in the flow tree.
 *
 * @typeParam T - The type of step operations available in the flow.
 *
 * @internal
 */
type FlowTreeNode<T extends string = string> = FlowNode<T> | StepNode<T>;

/**
 * A class that manages the structure and documentation of flows.
 * This class is responsible for maintaining the steps and their descriptions
 * in a flow, making it easier to track and debug the flow of operations.
 *
 * @typeParam T - The type of step operations available in the flow.
 *
 * @public
 */
class Flow<T extends string = string> {
  private constructor(
    private readonly root: FlowTreeNode<T>,
    private readonly nextStepDescription?: string,
  ) {}

  /**
   * Creates a new Flow instance.
   *
   * @param name - The name of the flow.
   * @param executionMode - The execution mode of the flow.
   * @returns A new Flow instance.
   */
  public static create<T extends string = string>(
    name: string,
    executionMode: ExecutionMode = 'sequential',
  ): Flow<T> {
    const root: FlowNode<T> = {
      id: ulid(),
      name,
      type: 'pipeline',
      executionMode,
      children: [],
    };
    return new Flow<T>(root);
  }

  /**
   * Creates a new Flow instance that executes steps in parallel.
   *
   * @param name - The name of the flow.
   * @returns A new Flow instance with parallel execution.
   */
  public static parallel<T extends string = string>(name: string): Flow<T> {
    return Flow.create<T>(name, 'parallel');
  }

  /**
   * Creates a new Flow instance that executes steps sequentially.
   *
   * @param name - The name of the flow.
   * @returns A new Flow instance with sequential execution.
   */
  public static sequential<T extends string = string>(name: string): Flow<T> {
    return Flow.create<T>(name, 'sequential');
  }

  /**
   * Adds a new step to the flow.
   *
   * @param type - The type of the step.
   * @param description - The description of the step.
   * @returns A new Flow instance with the added step.
   */
  public addStep(type: T, description: string): Flow<T> {
    const step: StepNode<T> = {
      id: ulid(),
      name: description,
      type: 'step',
      executionMode: this.root.executionMode,
      description: this.nextStepDescription
        ? `[${this.nextStepDescription}] ${description}`
        : description,
      stepType: type,
      children: [],
    };

    if (this.root.type !== 'pipeline') {
      throw new Error('Cannot add step to a step node: Only flow nodes can have children');
    }

    const newRoot: FlowNode<T> = {
      ...this.root,
      children: [...this.root.children, step],
    };

    return new Flow<T>(newRoot);
  }

  /**
   * Adds multiple steps to the flow.
   *
   * @param steps - The steps to add.
   * @returns A new Flow instance with the added steps.
   */
  public addSteps(...steps: Array<{ type: T; description: string }>): Flow<T> {
    return steps.reduce<Flow<T>>((flow, step) => flow.addStep(step.type, step.description), this);
  }

  /**
   * Gets the description for the next step.
   *
   * @returns The description for the next step, if any.
   */
  public getNextStepDescription(): string | undefined {
    return this.nextStepDescription;
  }

  /**
   * Sets the description for the next step.
   *
   * @param description - The description for the next step.
   * @returns A new Flow instance with the updated next step description.
   */
  public setNextStepDescription(description: string): Flow<T> {
    return new Flow<T>(this.root, description);
  }

  /**
   * Combines multiple flows into one.
   * This is useful when combining multiple flows in parallel.
   *
   * @param flows - The flows to combine.
   * @param name - The name for the combined flow.
   * @param executionMode - The execution mode for the combined flow.
   * @returns A new Flow instance with all steps combined.
   */
  public static combine<T extends string = string>(
    flows: Flow<T>[],
    name: string,
    executionMode: ExecutionMode = 'sequential',
  ): Flow<T> {
    const root: FlowNode<T> = {
      id: ulid(),
      name,
      type: 'pipeline',
      executionMode,
      children: flows.map((flow) => flow.root),
    };

    return new Flow<T>(root);
  }

  /**
   * Returns a string representation of the flow steps.
   * This is useful for debugging and understanding the flow's structure.
   *
   * @returns A string showing all steps in the flow.
   */
  public toString(): string {
    const buildTreeString = (node: FlowTreeNode<T>, level = 0): string => {
      const indent = '   '.repeat(level);
      const isLast = level === 0;
      const prefix = isLast ? '' : '├─';

      let result = '';
      if (level === 0) {
        result += `${pc.bold(pc.green(`${node.name}`))} ${pc.yellow(`${node.executionMode}`)}\n`;
      } else {
        const nodeType =
          node.type === 'step' ? pc.yellow(`${node.stepType}`) : pc.gray(`[${node.executionMode}]`);
        result += `${indent}${prefix} ${pc.reset(node.name)} <${nodeType}>\n`;
      }

      if (node.type === 'pipeline') {
        node.children.forEach((child, index) => {
          const isLastChild = index === node.children.length - 1;
          const childResult = buildTreeString(child, level + 1);
          result += childResult.replace(/^(\s*)(┌─|├─|└─)/, (_, spaces) => {
            return spaces + (isLastChild ? '└─' : '├─');
          });
        });
      }

      return result;
    };

    return buildTreeString(this.root);
  }

  /**
   * Returns a JSON representation of the flow steps.
   * This is useful for serialization and programmatic access to the flow structure.
   *
   * @returns An array of step objects with their type and description.
   */
  public toJSON(): FlowTreeNode<T> {
    return this.root;
  }

  /**
   * Gets the current steps in the flow.
   *
   * @returns The current steps.
   */
  public getSteps(): FlowStep<T>[] {
    const extractSteps = (node: FlowTreeNode<T>): FlowStep<T>[] => {
      if (node.type === 'step') {
        return [
          {
            id: node.id,
            type: node.stepType,
            description: node.description || node.name,
          },
        ];
      }
      return node.children.flatMap(extractSteps);
    };

    return extractSteps(this.root);
  }

  /**
   * Gets the ID of the flow.
   *
   * @returns The flow ID.
   */
  public getId(): string {
    return this.root.id;
  }

  /**
   * Gets the name of the flow.
   *
   * @returns The flow name.
   */
  public getName(): string {
    return this.root.name;
  }

  /**
   * Gets the execution mode of the flow.
   *
   * @returns The execution mode.
   */
  public getExecutionMode(): ExecutionMode {
    return this.root.executionMode;
  }
}

export { Flow };
