/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Component, component, isComponent } from './component';
import type { Any } from './generics';
import type { Result } from './result';
import { type Schema, type SchemaErrors } from './schema';
import type { Value } from './value';

/**
 * Internal helper to extract the type of a component.
 *
 * @typeParam T - The component to extract the type from.
 *
 * @internal
 */
type ExtractType<T> =
  T extends Component<'Schema', Any> ? (T extends { Type: infer U } ? U : T) : T;

/**
 * Internal helper to infer the errors from a component.
 * It is used to infer the errors from the input and output types if they are schemas or
 * results. Otherwise, the errors are never.
 *
 * @typeParam T - The component to infer the errors from.
 *
 * @internal
 */
type InferContractErrors<T> =
  T extends Schema<infer EI>
    ? SchemaErrors<EI, 'strict'>
    : T extends Value<Any, infer EI>
      ? EI
      : T extends Result<Any, infer EI>
        ? EI
        : never;

/**
 * Contract signature type.
 *
 * @remarks
 * The contract signature is the type of the contract. It is used to define the input,
 * output, and context of the contract.
 *
 * @typeParam I - The contract input.
 * @typeParam O - The contract output.
 * @typeParam C - The contract context (optional).
 *
 * @internal
 */
type ContractSignature<I = Any, O = Any, C = Any> = {
  /**
   * The contract input defined in the contract.
   */
  input: ExtractType<I>;

  /**
   * The contract output defined in the contract.
   */
  output: ExtractType<O>;

  /**
   * The errors inferred from the input and output types.
   */
  errors: {
    input: InferContractErrors<I>;
    output: InferContractErrors<O>;
  };

  /**
   * The context defined in the contract.
   */
  context?: C;
};

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
type Contract<I = Any, O = Any, C = never> = Component<
  'Contract',
  {
    /**
     * The contract signature.
     */
    signature: ContractSignature<I, O, C>;

    /**
     * Set the contract input.
     *
     * @remarks
     * If the input is a component, it will be added as a child.
     * It is recommended use core components like `value` or `schema` to define the input.
     *
     * @typeParam IP - The input type parameter.
     * @param input - The contract input.
     * @returns The contract instance with the input set.
     */
    input: <IP>(input: IP) => Contract<IP, O, C>;

    /**
     * Set the contract output.
     *
     * @remarks
     * If the output is a component, it will be added as a child.
     * It is recommended use core components like `value`, `schema` or `result` to define
     * the output.
     *
     * @typeParam OP - The output type parameter.
     * @param output - The contract output.
     * @returns The contract instance with the output set.
     */
    output: <OP>(output: OP) => Contract<I, OP, C>;

    /**
     * Set the contract context.
     *
     * @remarks
     * The context is used to pass data to the contract. It is useful to pass data to the
     * contract from the outside.
     *
     * @typeParam SP - The context type parameter.
     * @param context - The contract context.
     * @returns The contract instance with the context set.
     */
    context: <SP>(context: SP) => Contract<I, O, SP>;
  }
>;

/**
 * Creates a contract instance that allows configuring input/output types, context, and errors.
 * A contract is a component that defines the shape of a potential function, task or job.
 * Why is useful? separate the shape of the function from the implementation.
 *
 * @returns A contract instance with fluent API for configuration.
 *
 * @public
 */
function contract() {
  const c = component('Contract', {
    signature: {
      input: undefined,
      output: undefined,
      context: undefined,
    } as ContractSignature,

    input: (i: Any) => {
      c.signature.input = i;

      // If it is a component, add the input as a child.
      if (isComponent(i)) {
        c.addChildren(i);
      }
      return c;
    },

    output: (o: Any) => {
      c.signature.output = o;

      // If it is a component, add the output as a child.
      if (isComponent(o)) {
        c.addChildren(o);
      }
      return c;
    },

    context: (c: Any) => ((c.signature.context = c), c),
  });

  return c as Contract;
}

export type { Contract };
export { contract };
