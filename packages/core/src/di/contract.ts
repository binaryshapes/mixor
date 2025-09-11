/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { isSchema } from '../schema';
import { type Component, Panic, type Registrable, component, isComponent } from '../system';
import type { Any } from '../utils';

/**
 * Type representing the contract input and output types.
 *
 * @internal
 */
type ContractIO = Component<'Schema', Registrable>;

/**
 * Contract type.
 *
 * @remarks
 * A contract is a component that defines the shape of a potential function, task or job.
 * It separates the shape of the function from the implementation.
 *
 * @typeParam I - The contract input.
 * @typeParam O - The contract output.
 * @typeParam C - The contract context (optional).
 *
 * @public
 */
type Contract<I extends ContractIO, O extends ContractIO, C = never> = Component<
  'Contract',
  ContractBuilder<I, O, C>,
  {
    (input: I extends { Type: infer U } ? U : never): O extends { Type: infer U } ? U : never;
  }
>;

/**
 * Panic error for the contract module.
 *
 * - InvalidInput: The input is not a schema.
 * - InvalidOutput: The output is not a schema.
 *
 * @internal
 */
class ContractError extends Panic<'Contract', 'InvalidInput' | 'InvalidOutput'>('Contract') {}

/**
 * Builder for the contract component.
 *
 * @remarks
 * This class is used to build the contract component.
 *
 * @typeParam I - The input type parameter.
 * @typeParam O - The output type parameter.
 * @typeParam C - The context type parameter.
 *
 * @internal
 */
class ContractBuilder<I extends ContractIO, O extends ContractIO, C = never> {
  public static name = 'Contract';

  /**
   * The contract signature.
   */
  public signature: {
    input: I | undefined;
    output: O | undefined;
    context: C | undefined;
  } = {
    input: undefined,
    output: undefined,
    context: undefined,
  };

  /**
   * Set the contract input.
   *
   * @typeParam IP - The input type parameter.
   * @param i - The contract input.
   * @returns The contract instance with the input set.
   */
  public input<IP extends ContractIO>(i: IP) {
    if (!isSchema(i)) {
      throw new ContractError('InvalidInput', 'Input must be a schema');
    }
    this.signature.input = i as unknown as I;

    // Hacky way to add the input as a child.
    return (this as unknown as Contract<IP, O, C>).addChildren(i);
  }

  /**
   * Set the contract output.
   *
   * @typeParam OP - The output type parameter.
   * @param o - The contract output.
   * @returns The contract instance with the output set.
   */
  public output<OP extends ContractIO>(o: OP) {
    if (!isSchema(o)) {
      throw new ContractError('InvalidOutput', 'Output must be a schema');
    }
    this.signature.output = o as unknown as O;

    // Hacky way to add the output as a child.
    return (this as unknown as Contract<I, OP, C>).addChildren(o);
  }

  /**
   * Set the contract context.
   *
   * @typeParam SP - The context type parameter.
   * @param c - The contract context.
   * @returns The contract instance with the context set.
   */
  public context<SP>(c: SP) {
    this.signature.context = c as unknown as C;
    return this as unknown as Contract<I, O, SP>;
  }
}

/**
 * Creates a contract instance that allows configuring input/output types, context, and errors.
 *
 * @remarks
 * A contract is a component that defines the shape of a potential function, task or job.
 * Why is useful? It separates the shape of the function from the implementation.
 *
 * @returns A contract instance with fluent API for configuration.
 *
 * @public
 */
function contract<I extends ContractIO, O extends ContractIO, C = never>() {
  const builder = new ContractBuilder<I, O, C>();

  const ct = component(
    'Contract',
    Object.setPrototypeOf(() => builder, builder),
  );

  return ct as unknown as Contract<I, O, C>;
}

/**
 * Guard function to check if the given object is a contract.
 *
 * @param maybeContract - The object to check.
 * @returns True if the object is a contract, false otherwise.
 *
 * @public
 */
const isContract = (maybeContract: Any): maybeContract is Contract<Any, Any, Any> =>
  isComponent(maybeContract, 'Contract');

export { contract, isContract };
export type { Contract };
