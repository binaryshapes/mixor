/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Component, component, isComponent } from './component.ts';
import { type Failure, failureAs, type GroupFailures, type InferFailure } from './failure.ts';
import { flow } from './flow.ts';
import type { Any, Promisify } from './generics.ts';
import { logger } from './logger.ts';
import { panic } from './panic.ts';
import { meta } from './registry.ts';
import { err, isResult, ok, type Result } from './result.ts';
import type { EnsureComponent } from './types.ts';

/**
 * The tag for the contract component.
 *
 * @internal
 */
const CONTRACT_TAG = 'Contract' as const;

/**
 * The tag for the contract implementation component.
 *
 * @internal
 */
const IMPLEMENTATION_TAG = 'Implementation' as const;

/**
 * The type of the input of the contract.
 * Must be a Component, not a primitive type.
 *
 * @public
 */
type ContractInput = Component<string, Any>;

/**
 * The type of the output of the contract.
 * Must be a Component, not a primitive type.
 *
 * @public
 */
type ContractOutput = Component<string, Any>;

/**
 * The default value for the async flag.
 *
 * @public
 */
const ContractDefaultAsync = true as const;

/**
 * The type of the parameters of the contract.
 *
 * @remarks
 * Extracts the input parameter type from a contract. If the contract has an input component,
 * this returns the Type of that component. Otherwise, it returns `never`.
 *
 * @typeParam C - The contract.
 * @typeParam I - The input of the contract (inferred from C).
 *
 * @public
 */
type ContractParams<
  C extends ContractBuilder<Any, Any, Any, boolean>,
  I = C extends ContractBuilder<infer I, Any, Any, boolean> ? I : never,
> = I extends undefined ? never
  : I extends Component<string, unknown> ? I['Type'] extends new (...args: Any[]) => infer II ? II
    : I extends { InstanceType: infer II } ? II
    : I['Type'] extends { InstanceType: infer II } ? II
    : I['Type']
  : never;

/**
 * The type of the return value of the contract.
 *
 * @remarks
 * Extracts the return type from a contract. If the contract has an output component,
 * this returns the Type of that component (or InstanceType if it's a class constructor).
 * If there's no output, it returns `void`.
 *
 * @typeParam C - The contract.
 * @typeParam O - The output of the contract (inferred from C).
 *
 * @public
 */
type ContractReturn<
  C extends ContractBuilder<Any, Any, Any, boolean>,
  O = C extends ContractBuilder<Any, infer O, Any, boolean> ? O : never,
> = O extends undefined ? void
  : O extends Component<string, unknown> ? O['Type'] extends new (...args: Any[]) => infer OO ? OO
    : O extends { InstanceType: infer OO } ? OO
    : O['Type'] extends { InstanceType: infer OO } ? OO
    : O['Type']
  : never;

/**
 * The type of the errors of the contract input.
 *
 * @remarks
 * Extracts error types from the contract's input component. The input component can be:
 * - A component with an `Errors` property.
 * - A ResultFunction (which has error types).
 * - A Provider (which may have error types in its exported type).
 *
 * @typeParam C - The contract.
 * @typeParam I - The input of the contract (inferred from C).
 *
 * @public
 */
type ContractInputErrors<
  C extends ContractBuilder<Any, Any, Any, boolean>,
  I = C extends ContractBuilder<infer I, Any, Any, boolean> ? I : never,
> = InferFailure<I>;

/**
 * The type of the errors of the contract output.
 *
 * @remarks
 * Extracts error types from the contract's output component. The output component can be:
 * - A component with an `Errors` property.
 * - A ResultFunction (which has error types).
 * - A Provider (which may have error types in its exported type).
 *
 * @typeParam C - The contract.
 * @typeParam O - The output of the contract (inferred from C).
 *
 * @public
 */
type ContractOutputErrors<
  C extends ContractBuilder<Any, Any, Any, boolean>,
  O = C extends ContractBuilder<Any, infer O, Any, boolean> ? O : never,
> = InferFailure<O>;

/**
 * The type of the errors of the contract.
 *
 * @remarks
 * This type combines all possible errors for a contract:
 * - Input validation errors (from the contract's input component).
 * - Output validation errors (from the contract's output component).
 * - Allowed implementation errors (from contract.errors()).
 * - Panic errors (for unexpected runtime errors).
 *
 * @typeParam C - The contract.
 * @typeParam E - The error type of the contract (inferred from the contract).
 *
 * @public
 */
type ContractErrors<
  C extends ContractBuilder<Any, Any, Any, boolean>,
  E = C extends ContractBuilder<Any, Any, infer E, boolean> ? E : never,
> = GroupFailures<
  ContractInputErrors<C>,
  ContractOutputErrors<C>,
  E extends new (...args: Any[]) => Any ? InstanceType<E> : E
>;

/**
 * The signature of the function that implements the contract.
 *
 * @remarks
 * This signature is derived from the contract and automatically handles:
 * - Input validation (via the contract's input component).
 * - Output validation (via the contract's output component).
 * - Error types (combining contract errors, input errors, output errors, and panic errors).
 * - Async/sync behavior (based on the contract's async flag).
 *
 * The signature is conditional: if the contract has no input parameters, it's a function
 * with no parameters; otherwise, it receives the contract's input parameters.
 *
 * @typeParam C - The contract to implement.
 * @typeParam Params - The input parameters type (inferred from the contract).
 *
 * @internal
 */
type ImplementationSignature<
  C extends Contract<Any, Any, Any, boolean>,
  Params extends C['Params'] = C['Params'],
  Return extends C['Return'] = C['Return'],
  Errors extends C['Errors'] = C['Errors'],
  Async extends boolean = C extends Contract<Any, Any, Any, infer A> ? A : boolean,
> = [Params] extends [never] ? () => Promisify<Result<Return, Errors & {}>, Async>
  : (input: Params) => Promisify<Result<Return, Errors & {}>, Async>;

/**
 * The type of the implementation component.
 *
 * @remarks
 * An implementation is a callable component that implements a contract. It includes:
 * - The contract it implements.
 * - The signature that wraps the implementation function with error handling.
 * - The error types derived from the contract.
 *
 * @typeParam C - The contract to implement.
 *
 * @public
 */
type Implementation<C extends Contract<Any, Any, Any, boolean>> = Component<
  typeof IMPLEMENTATION_TAG,
  & C['Implementation']
  & {
    /** Contract of the implementation. */
    contract: C;
    /** Signature of the implementation. */
    Signature: C['Implementation'];
    /** Errors of the implementation (derived from the contract). */
    Errors: C['Errors'];
    /** Input of the implementation. */
    Input: C['Input'];
    /** Output of the implementation. */
    Output: C['Output'];
  }
>;

/**
 * Helper type to construct implementation signature from builder type parameters.
 *
 * @remarks
 * This is equivalent to `ImplementationSignature<Contract<I, O, E, A>>`, but constructed
 * directly from builder parameters to avoid circular reference issues when defining
 * the `Contract` type itself.
 *
 * Both types produce the same signature:
 * - `ImplementationSignature<Contract<I, O, E, A>>` - extracts from a built Contract.
 * - `BuilderImplementationSignature<I, O, E, A>` - constructs from builder parameters.
 *
 * Use `BuilderImplementationSignature` when defining types that reference Contract
 * (to avoid circular references). Use `ImplementationSignature` when you already have
 * a Contract instance.
 *
 * @internal
 */
type BuilderImplementationSignature<
  I extends ContractInput | undefined,
  O extends ContractOutput | undefined,
  E,
  A extends boolean,
> = ImplementationSignature<
  Contract<I, O, E, A>,
  ContractParams<ContractBuilder<I, O, E, A>>,
  ContractReturn<ContractBuilder<I, O, E, A>>,
  ContractErrors<ContractBuilder<I, O, E, A>>,
  A
>;

/**
 * The type of the built contract.
 *
 * @remarks
 * This type removes the builder methods from the contract builder.
 *
 * @typeParam I - The input of the contract.
 * @typeParam O - The output of the contract.
 * @typeParam E - The errors of the contract.
 * @typeParam A - Whether the contract is async.
 *
 * @internal
 */
type ContractBuilt<
  I extends ContractInput | undefined,
  O extends ContractOutput | undefined,
  E,
  A extends boolean,
> =
  & Omit<
    ContractBuilder<I, O, E, A>,
    'build' | 'errors' | 'sync' | 'async' | 'input' | 'output' | 'builtContract' | 'implementation'
  >
  & {
    Input: I;
    Output: O;
    Errors: ContractErrors<ContractBuilder<I, O, E, A>>;
    Params: ContractParams<ContractBuilder<I, O, E, A>>;
    Return: ContractReturn<ContractBuilder<I, O, E, A>>;
    Implementation: BuilderImplementationSignature<I, O, E, A>;
  };

/**
 * Helper type to construct implementation method signature from contract type parameters.
 * This avoids circular reference issues.
 *
 * @typeParam I - The input of the contract.
 * @typeParam O - The output of the contract.
 * @typeParam E - The errors of the contract.
 * @typeParam A - Whether the contract is async.
 *
 * @internal
 */
type ContractImplementationMethod<
  I extends ContractInput | undefined,
  O extends ContractOutput | undefined,
  E,
  A extends boolean,
> = (
  implementationFn: BuilderImplementationSignature<I, O, E, A>,
) => Implementation<Contract<I, O, E, A>>;

/**
 * The type of the contract.
 *
 * @remarks
 * A contract defines the interface for implementations. It specifies:
 * - Input validation (via the input component).
 * - Output validation (via the output component).
 * - Allowed implementation errors (via the errors method).
 * - Whether the contract is asynchronous (via the async method).
 *
 * Use {@link contract} to create a new contract builder, then configure it with
 * {@link ContractBuilder.input}, {@link ContractBuilder.output}, {@link ContractBuilder.errors},
 * and {@link ContractBuilder.async}.
 *
 * @typeParam I - The input of the contract.
 * @typeParam O - The output of the contract.
 * @typeParam E - Allowed implementation errors (string union type).
 * @typeParam A - Whether the contract is asynchronous.
 *
 * @public
 */
type Contract<
  I extends ContractInput | undefined = undefined,
  O extends ContractOutput | undefined = undefined,
  E = never,
  A extends boolean = typeof ContractDefaultAsync,
> =
  & Component<
    typeof CONTRACT_TAG,
    ContractBuilt<I, O, E, A>
  >
  & {
    /**
     * Creates a new implementation component for this contract.
     *
     * @remarks
     * This method is a convenience method that creates an implementation directly from the contract.
     * It allows you to create an implementation without needing to pass the contract as a separate parameter.
     *
     * The implementation function must match the {@link ImplementationSignature} of the contract,
     * which means it must return a {@link Result} type with the contract's return type and error types.
     *
     * @param implementationFn - The implementation function that implements the contract logic.
     *   Must match the contract's {@link ImplementationSignature}.
     * @returns A new implementation component that can be called with the contract's input parameters.
     *
     * @public
     */
    implementation: ContractImplementationMethod<I, O, E, A>;
  };

/**
 * The panic class for the contract component.
 *
 * @remarks
 * Possible panic codes:
 * - `InvalidInput`: The input of the contract is not a valid component.
 * - `InvalidOutput`: The output of the contract is not a valid component.
 * - `ContractNotBuilt`: The contract is not built.
 *
 * @public
 */
class ContractPanic
  extends panic<typeof CONTRACT_TAG, 'InvalidInput' | 'InvalidOutput' | 'ContractNotBuilt'>(
    CONTRACT_TAG,
  ) {}

/**
 * The panic error for the implementation component.
 *
 * @public
 */
class ImplementationPanic
  extends panic<typeof IMPLEMENTATION_TAG, 'ImplementationPanic'>(IMPLEMENTATION_TAG) {}

/**
 * The builder class for the contract component.
 *
 * @typeParam I - The input of the contract.
 * @typeParam O - The output of the contract.
 * @typeParam E - Allowed implementation errors.
 * @typeParam A - Whether the contract is asynchronous.
 *
 * @internal
 */
class ContractBuilder<
  I extends ContractInput | undefined = undefined,
  O extends ContractOutput | undefined = undefined,
  E = never,
  A extends boolean = typeof ContractDefaultAsync,
> {
  /**
   * The input of the contract.
   */
  public in: I | undefined;

  /**
   * The output of the contract.
   */
  public out: O | undefined;

  /**
   * Whether the contract is async.
   */
  public isAsync: A = ContractDefaultAsync as unknown as A;

  /**
   * The allowed implementation errors.
   */
  public implementationErrors: E | undefined;

  /**
   * The built contract instance.
   */
  public builtContract: Contract<I, O, E, A> | undefined;

  /**
   * Sets the allowed implementation errors.
   *
   * @remarks
   * This method allows you to specify which error codes are valid for implementations
   * of this contract. These errors will be included in the contract's error type.
   *
   * @typeParam EE - The allowed implementation errors.
   * @param errors - The allowed implementation errors (as rest parameters).
   * @returns The contract builder with the allowed implementation errors set.
   */
  public errors<EE extends Failure<string, Any, Any, Any>[] = never>(
    ...errors: EE
  ): ContractBuilder<I, O, EE[number], A> {
    // TODO: Evaluate use Record instead of array of failures.
    this.implementationErrors = errors as unknown as E;
    return this as ContractBuilder<I, O, EE[number], A>;
  }

  /**
   * Sets whether the contract is synchronous.
   *
   * @remarks
   * When set to sync, the contract's return type will not be wrapped in a Promise,
   * and implementations must return Result<...>.
   *
   * @returns The contract builder with the sync flag set to true.
   *
   * @internal
   */
  public sync() {
    this.isAsync = false as unknown as A;
    return this as ContractBuilder<I, O, E, false>;
  }

  /**
   * Sets whether the contract is asynchronous.
   *
   * @remarks
   * When set to async, the contract's return type will be wrapped in a Promise,
   * and implementations must return Promise<Result<...>>.
   *
   * @returns The contract builder with the async flag set to true.
   */
  public async() {
    this.isAsync = true as unknown as A;
    return this as ContractBuilder<I, O, E, true>;
  }

  /**
   * Sets the input of the contract.
   *
   * @remarks
   * This method sets the input component for validation. The contract is not yet complete
   * after calling this method. You can continue configuring it with {@link output},
   * {@link errors}, {@link async}, and then call {@link build} to finalize it.
   *
   * @typeParam II - The input component type.
   * @param input - The input of the contract. Must be a valid Component.
   * @returns The contract builder with the input set (allows method chaining).
   */
  public input<II extends ContractInput>(input: EnsureComponent<II>): ContractBuilder<II, O, E, A> {
    // Runtime validation: ensure input is a Component.
    if (!isComponent(input)) {
      throw new ContractPanic('InvalidInput', 'Contract input must be a Component');
    }

    this.in = input as unknown as I;
    return this as unknown as ContractBuilder<II, O, E, A>;
  }

  /**
   * Sets the output of the contract.
   *
   * @remarks
   * This method sets the output component for validation. Unlike {@link input}, this method
   * does not finalize the contract. You can optionally call {@link build} to finalize
   * the contract, or continue configuring it with {@link errors} and {@link async}.
   *
   * @typeParam OO - The output component type.
   * @param output - The output of the contract. Must be a valid Component.
   * @returns The contract builder with the output set (allows method chaining).
   */
  public output<OO extends ContractOutput>(
    output: EnsureComponent<OO>,
  ): ContractBuilder<I, OO, E, A> {
    // Runtime validation: ensure output is a Component.
    if (!isComponent(output)) {
      throw new ContractPanic('InvalidOutput', 'Contract output must be a Component');
    }

    this.out = output as unknown as O;
    return this as unknown as ContractBuilder<I, OO, E, A>;
  }

  /**
   * Builds the contract component with the builder configuration.
   *
   * @remarks
   * This method finalizes the contract and creates the contract component.
   * After calling this method, the contract is complete and ready to use.
   *
   * @returns The completed contract component.
   */
  public build(): Contract<I, O, E, A> {
    const contract = component(CONTRACT_TAG, this) as unknown as Contract<I, O, E, A>;
    this.builtContract = contract;

    // Add the implementation method to the contract after build
    // Only add it if it doesn't already exist to avoid redefinition errors
    if (!('implementation' in contract)) {
      Object.defineProperty(contract, 'implementation', {
        value: (
          implementationFn: ImplementationSignature<Contract<I, O, E, A>>,
        ): Implementation<Contract<I, O, E, A>> => {
          return this.implementation(implementationFn);
        },
        writable: true,
        configurable: true,
        enumerable: false,
      });
    }

    return contract;
  }

  /**
   * Creates a new implementation component for the given contract.
   *
   * @remarks
   * This implementation automatically:
   * 1. Validates the input using the contract's input component (if defined).
   * 2. Executes the implementation function.
   * 3. Validates the output using the contract's output component (if defined).
   * 4. Catches any runtime errors and returns a failed result (no panic error is raised).
   *
   * The implementation function must match the {@link ImplementationSignature} of the contract,
   * which means it must return a {@link Result} type with the contract's return type and error types.
   *
   * Unexpected runtime errors are automatically caught and returned as `{ panic: 'PANIC_ERROR' }`.
   *
   * @param implementationFn - The implementation function that implements the contract logic.
   *   Must match the contract's {@link ImplementationSignature}.
   * @returns A new implementation component that can be called with the contract's input parameters.
   *
   * @public
   */
  public implementation(
    implementationFn: ImplementationSignature<Contract<I, O, E, A>>,
  ): Implementation<Contract<I, O, E, A>> {
    const contract = this.builtContract;

    if (!contract) {
      throw new ContractPanic(
        'ContractNotBuilt',
        'Contract must be built before creating an implementation',
      );
    }

    // We want to raise always the same panic error.
    const handlePanic = (error: Any) => {
      // If the error is already an ImplementationPanic, just re-throw it without logging again.
      // This prevents double logging when the error propagates through multiple implementation layers.
      if (error instanceof ImplementationPanic) {
        throw error;
      }

      logger.debug(
        `Something went wrong: ${error instanceof Error ? error.message : String(error)}\n`,
      );

      throw new ImplementationPanic(
        'ImplementationPanic',
        'An internal error occurred while executing the implementation.',
      )
        .origin(error);
    };

    // Process the input and output of the contract.
    const processInputOutput = (
      input: unknown,
      fn: Any,
    ): Result<unknown, Failure<string, Any, Any, Any>['Type']> =>
      fn && typeof fn === 'function' ? isResult(fn(input)) ? fn(input) : ok(input) : ok(input);

    type Params = ContractParams<ContractBuilder<I, O, E, A>>;

    const asyncFn = async (input: Params) => {
      const implementationFlow = flow<typeof input>()
        // 1. If the contract input is a function, call it.
        .map((input) => processInputOutput(input, contract.in))
        .mapErr((error) => err(failureAs(error, '$input')))
        // 2. Call the implementation.
        .map(async (input) => await implementationFn(input as Params) as Any)
        .mapErr((error) => err(failureAs(error, '$logic')))
        // 3. If the implementation returns a value, call the contract output (if exists).
        .map((input) => processInputOutput(input, contract.out))
        .mapErr((error) => err(failureAs(error, '$output')))
        .build();

      try {
        return await implementationFlow(input);
      } catch (error) {
        handlePanic(error);
      }
    };

    const syncFn = (input: Params) => {
      const implementationFlow = flow<typeof input>()
        // 1. If the contract input is a function, call it.
        .map((input) => processInputOutput(input, contract.in))
        .mapErr((error) => err(failureAs(error, '$input')))
        // 2. Call the implementation.
        .map((input) => implementationFn(input as Params) as Any)
        .mapErr((error) => err(failureAs(error, '$logic')))
        // 3. If the implementation returns a value, call the contract output (if exists).
        .map((input) => processInputOutput(input, contract.out))
        .mapErr((error) => err(failureAs(error, '$output')))
        .build();

      try {
        return implementationFlow(input);
      } catch (error) {
        handlePanic(error);
      }
    };

    const implementationComponent = component(
      IMPLEMENTATION_TAG,
      implementationFn.constructor.name === 'AsyncFunction' ? asyncFn : syncFn,
      {
        contract,
        // In order to have different implementations for the same contract, we need to store
        // the implementation function itself.
        implementationFn,
      },
    );

    // Adding the contract as a child of the implementation component.
    meta(implementationComponent).children(contract);

    // Inferring the error type of the implementation.
    return implementationComponent as Implementation<Contract<I, O, E, A>>;
  }
}

/**
 * Type guard function that determines whether an object is an implementation.
 *
 * @param maybeImplementation - The object to check.
 * @returns True if the object is an implementation, false otherwise.
 *
 * @public
 */
const isImplementation = (maybeImplementation: Any): maybeImplementation is Implementation<Any> =>
  isComponent(maybeImplementation, IMPLEMENTATION_TAG);

/**
 * Creates a new contract builder in order to create a new contract.
 *
 * @remarks
 * Use the builder methods to configure the contract:
 * - {@link ContractBuilder.input} - Set the input validation component.
 * - {@link ContractBuilder.output} - Set the output validation component.
 * - {@link ContractBuilder.errors} - Set allowed implementation error codes.
 * - {@link ContractBuilder.async} - Mark the contract as asynchronous.
 * - {@link ContractBuilder.build} - Finalize and build the contract component.
 *
 * The contract is finalized when {@link ContractBuilder.build} is called.
 *
 * @returns A new contract builder.
 *
 * @public
 */
const contract = (): ContractBuilder => new ContractBuilder();

export { contract, ImplementationPanic, isImplementation };
export type {
  Contract,
  ContractBuilder,
  ContractErrors,
  ContractInput,
  ContractOutput,
  ContractParams,
  ContractReturn,
  Implementation,
  ImplementationSignature,
};
