/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Failure, type Result } from '../result';
import { isSchema, type Schema, type SchemaErrors, type SchemaValues } from '../schema';
import { type Component, component, isComponent, Panic } from '../system';
import type { Any, Promisify } from '../utils';

// FIXME: Allow void contracts (this requires a new type for the contract output).

/**
 * Type representing the contract handler function.
 *
 * @typeParam C - The contract type.
 *
 * @public
 */
type ContractHandler<C, Async extends 'async' | 'sync' = 'async'> = C extends
  Contract<infer I, infer O, infer E, infer Ctx>
  ? I extends Schema<infer II> ? O extends Schema<infer OO> ? (
        input: SchemaValues<II>,
        context: Ctx extends never | undefined ? never : Ctx,
      ) => Promisify<
        Result<
          SchemaValues<OO>,
          {
            input: SchemaErrors<II, 'strict'>;
            output: SchemaErrors<OO, 'strict'>;
            handler: E;
          }
        >,
        Async
      >
    : never
  : never
  : never;

/**
 * Type representing the contract caller function.
 *
 * @typeParam C - The contract type.
 *
 * @public
 */
type ContractCaller<C, Async extends 'async' | 'sync' = 'async'> = C extends
  Contract<infer I, infer O, infer E, Any>
  ? I extends Schema<infer II>
    ? O extends Schema<infer OO> ? (input: SchemaValues<II>) => Promisify<
        Result<
          SchemaValues<OO>,
          {
            input: SchemaErrors<II, 'strict'>;
            output: SchemaErrors<OO, 'strict'>;
            handler: E;
          }
        >,
        Async
      >
    : never
  : never
  : never;

/**
 * Type representing the contract errors.
 *
 * @remarks
 * Includes the input, output and handler errors.
 *
 * @typeParam C - The contract type.
 *
 * @public
 */
type ContractErrors<C> = C extends Contract<infer I, infer O, infer E, infer Ctx> ? {
    input: I extends Schema<infer II> ? SchemaErrors<II, 'strict'> : never;
    output: O extends Schema<infer OO> ? SchemaErrors<OO, 'strict'> : never;
    handler: E;
  }
  : never;

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
type Contract<I, O, E, C> = Component<
  'Contract',
  ContractBuilder<I, O, E, C>
>;

/**
 * Panic error for the contract module.
 *
 * - InvalidInput: The input is not a schema.
 * - InvalidOutput: The output is not a schema.
 *
 * @public
 */
class ContractError extends Panic<'Contract', 'InvalidInput' | 'InvalidOutput'>('Contract') {}

/**
 * Builder for the contract component.
 *
 * @remarks
 * Provides a fluent API for configuring the contract.
 *
 * @typeParam I - The input type parameter.
 * @typeParam O - The output type parameter.
 * @typeParam E - The errors type parameter.
 * @typeParam C - The context type parameter.
 *
 * @internal
 */
class ContractBuilder<I, O = never, E = never, C = never> {
  public static name = 'Contract';

  /**
   * The contract signature.
   */
  public signature: {
    input: I | undefined;
    output: O | undefined;
    context: C | undefined;
    errors: E | undefined;
  } = {
    input: undefined,
    output: undefined,
    context: undefined,
    errors: undefined,
  };

  /**
   * Set the contract input.
   *
   * @typeParam IP - The input type parameter.
   * @param i - The contract input.
   * @returns The contract instance with the input set.
   */
  public input<IP>(i: Schema<IP>) {
    if (!isSchema(i)) {
      throw new ContractError('InvalidInput', 'Input must be a schema');
    }
    this.signature.input = i as unknown as I;

    // Hacky way to add the input as a child.
    return (this as unknown as Contract<Schema<IP>, O, E, C>).addChildren(i);
  }

  /**
   * Set the contract output.
   *
   * @typeParam OP - The output type parameter.
   * @param o - The contract output.
   * @returns The contract instance with the output set.
   */
  public output<OP>(o: Schema<OP>) {
    if (!isSchema(o)) {
      throw new ContractError('InvalidOutput', 'Output must be a schema');
    }
    this.signature.output = o as unknown as O;

    // Hacky way to add the output as a child.
    return (this as unknown as Contract<I, Schema<OP>, E, C>).addChildren(o);
  }

  /**
   * Set the contract errors.
   *
   * @typeParam E - The errors type parameter.
   * @param e - The contract errors.
   * @returns The contract instance with the errors set.
   */
  public errors<EE extends Failure<Any> | string>(...e: EE[]) {
    this.signature.errors = e as unknown as E;
    return this as unknown as Contract<I, O, EE, C>;
  }

  /**
   * Set the contract context.
   *
   * @typeParam SP - The context type parameter.
   * @param c - The contract context.
   * @returns The contract instance with the context set.
   */
  public context<Ctx>(c: Ctx) {
    this.signature.context = c as unknown as C;
    return this as unknown as Contract<I, O, E, Ctx>;
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
const contract = <I, O = never, E = never, C = never>() =>
  component('Contract', new ContractBuilder<I, O, E, C>()) as Contract<I, O, E, C>;

/**
 * Guard function to check if the given object is a contract.
 *
 * @param maybeContract - The object to check.
 * @returns True if the object is a contract, false otherwise.
 *
 * @public
 */
const isContract = (maybeContract: Any): maybeContract is Contract<Any, Any, Any, Any> =>
  isComponent(maybeContract, 'Contract');

export { contract, isContract };
export type { Contract, ContractCaller, ContractErrors, ContractHandler };
