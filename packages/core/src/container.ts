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
import type {
  Any,
  FilterEmptyObjects,
  Pretty,
  Promisify,
  UnionToIntersection,
} from './generics.ts';
import { logger } from './logger.ts';
import { panic } from './panic.ts';
import { meta } from './registry.ts';
import { err, isResult, ok, type Result } from './result.ts';
import type { EnsureComponent } from './types.ts';
import { doc } from './utils.ts';

/**
 * The dependency injection registry.
 *
 * @internal
 */
const di = {
  /**
   * The map of resolved providers.
   */
  providers: new Map<ProviderComponent, Any>(),
  /**
   * The map of resolved containers.
   */
  containers: new Map<ContainerBuilder<Any>, Map<ProviderComponent, Any>>(),
};

// Generics for the container module.
type ProviderComponent = Component<typeof PROVIDER_TAG, unknown>;
type PortComponent = Component<typeof PORT_TAG, unknown>;
type ContainerComponent = Component<typeof CONTAINER_TAG, unknown>;
type AdapterComponent = Component<typeof ADAPTER_TAG, unknown>;

/**
 * The panic error for the container module.
 *
 * - `CannotImportAfterExport`: The imports cannot be imported after the exports have been defined.
 * - `InvalidImport`: The imports are invalid.
 * - `InvalidPort`: The port is invalid.
 * - `InvalidAdapter`: The adapter is invalid.
 * - `InvalidBinding`: A adapter cannot be bound to a different port.
 * - `ContainerNotBuilt`: A container that is being imported has not been built.
 * - `InvalidProvider`: The provider is invalid when getting it from the container.
 * - `InvalidInput`: The input of the contract is not a valid component.
 * - `InvalidOutput`: The output of the contract is not a valid component.
 * - `AlreadyAnImplementation`: Attempting to wrap an existing implementation.
 *
 * @public
 */
class ContainerPanic extends panic<
  'Container',
  | 'CannotImportAfterExport'
  | 'InvalidImport'
  | 'InvalidPort'
  | 'InvalidAdapter'
  | 'InvalidBinding'
  | 'ContainerNotBuilt'
  | 'InvalidProvider'
  | 'CircularDependency'
  | 'InvalidInput'
  | 'InvalidOutput'
  | 'AlreadyAnImplementation'
>('Container') {}

// ***********************************************************************************************
// Contract.
// ***********************************************************************************************

/**
 * The tag for the contract component.
 *
 * @internal
 */
const CONTRACT_TAG = 'Contract' as const;

/**
 * The type of the input of the contract.
 * Must be a Component, not a primitive type.
 *
 * @internal
 */
type ContractInput = Component<string, Any>;

/**
 * The type of the output of the contract.
 * Must be a Component, not a primitive type.
 *
 * @internal
 */
type ContractOutput = Component<string, Any>;

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
 * @internal
 */
type ContractParams<
  C extends Contract<Any, Any, Any, boolean>,
  I = C extends Contract<infer I, Any, Any, boolean> ? I : never,
> = I extends Component<string, unknown> ? I['Type'] extends new (...args: Any[]) => infer II ? II
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
 * @internal
 */
type ContractReturn<
  C extends Contract<Any, Any, Any, boolean>,
  O = C extends Contract<Any, infer O, Any, boolean> ? O : never,
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
 * - A component with an `Errors` property
 * - A ResultFunction (which has error types)
 * - A Provider (which may have error types in its exported type)
 *
 * @typeParam C - The contract.
 * @typeParam I - The input of the contract (inferred from C).
 *
 * @internal
 */
type ContractInputErrors<
  C extends Contract<Any, Any, Any, boolean>,
  I = C extends Contract<infer I, Any, Any, boolean> ? I : never,
> = InferFailure<I>;

/**
 * The type of the errors of the contract output.
 *
 * @remarks
 * Extracts error types from the contract's output component. The output component can be:
 * - A component with an `Errors` property
 * - A ResultFunction (which has error types)
 * - A Provider (which may have error types in its exported type)
 *
 * @typeParam C - The contract.
 * @typeParam O - The output of the contract (inferred from C).
 *
 * @internal
 */
type ContractOutputErrors<
  C extends Contract<Any, Any, Any, boolean>,
  O = C extends Contract<Any, infer O, Any, boolean> ? O : never,
> = InferFailure<O>;

/**
 * The type of the errors of the contract.
 *
 * @remarks
 * This type combines all possible errors for a contract:
 * - Input validation errors (from the contract's input component)
 * - Output validation errors (from the contract's output component)
 * - Allowed implementation errors (from contract.errors())
 * - Panic errors (for unexpected runtime errors)
 *
 * @typeParam C - The contract.
 * @typeParam E - The error type of the contract (inferred from the contract).
 *
 * @internal
 */
type ContractErrors<
  C extends Contract<Any, Any, Any, boolean>,
  E = C extends Contract<Any, Any, infer E, boolean> ? E : never,
> = GroupFailures<
  ContractInputErrors<C>,
  ContractOutputErrors<C>,
  E extends new (...args: Any[]) => Any ? InstanceType<E> : E
>;

/**
 * The type of the contract.
 *
 * @remarks
 * A contract defines the interface for implementations. It specifies:
 * - Input validation (via the input component)
 * - Output validation (via the output component)
 * - Allowed implementation errors (via the errors method)
 * - Whether the contract is asynchronous (via the async method)
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
  A extends boolean = false,
> = Component<
  typeof CONTRACT_TAG,
  ContractBuilder<I, O, E, A>
>;

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
  A extends boolean = false,
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
  public isAsync: A = false as unknown as A;

  /**
   * The allowed implementation errors.
   */
  public implementationErrors: E | undefined;

  /**
   * Sets the allowed implementation errors.
   *
   * @remarks
   * This method allows you to specify which error codes are valid for implementations
   * of this contract. These errors will be included in the contract's error type.
   *
   * @typeParam L - The error code type.
   * @typeParam EE - The error type.
   * @param errors - The allowed implementation error codes (as rest parameters).
   * @returns The contract builder with the allowed implementation errors set.
   */
  public errors<Code extends string, EE extends string[] | Failure<Code, Any, Any, Any>[] = never>(
    ...errors: EE
  ): Contract<I, O, EE[number] & {}, A> {
    // TODO: Evaluate use Record instead of array of failures.
    this.implementationErrors = errors as unknown as E;
    return this as unknown as Contract<I, O, EE[number] & {}, A>;
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
    return this as unknown as Contract<I, O, E, true>;
  }

  /**
   * Sets the input of the contract.
   *
   * @remarks
   * This method sets the input component for validation. The contract is not yet complete
   * after calling this method. You can continue configuring it with {@link output},
   * {@link errors}, {@link async}, and then call {@link build} to finalize it.
   *
   * @param input - The input of the contract. Must be a valid Component.
   * @returns The contract builder with the input set (allows method chaining).
   */
  public input<II extends ContractInput>(input: EnsureComponent<II>) {
    // Runtime validation: ensure input is a Component.
    if (!isComponent(input)) {
      throw new ContainerPanic('InvalidInput', 'Contract input must be a Component');
    }

    this.in = input as unknown as I;
    return this as unknown as Contract<II, O, E, A>;
  }

  /**
   * Sets the output of the contract.
   *
   * @remarks
   * This method sets the output component for validation. Unlike {@link input}, this method
   * does not finalize the contract. You can optionally call {@link build} to finalize
   * the contract, or continue configuring it with {@link errors} and {@link async}.
   *
   * @param output - The output of the contract. Must be a valid Component.
   * @returns The contract builder with the output set (allows method chaining).
   */
  public output<OO extends ContractOutput>(output: EnsureComponent<OO>) {
    // Runtime validation: ensure output is a Component.
    if (!isComponent(output)) {
      throw new ContainerPanic('InvalidOutput', 'Contract output must be a Component');
    }

    this.out = output as unknown as O;
    return this as unknown as Contract<I, OO, E, A>;
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
  public build() {
    return component(CONTRACT_TAG, this) as unknown as Contract<I, O, E, A>;
  }
}

/**
 * Creates a new contract builder in order to create a new contract.
 *
 * @remarks
 * Use the builder methods to configure the contract:
 * - {@link ContractBuilder.input} - Set the input validation component
 * - {@link ContractBuilder.output} - Set the output validation component
 * - {@link ContractBuilder.errors} - Set allowed implementation error codes
 * - {@link ContractBuilder.async} - Mark the contract as asynchronous
 * - {@link ContractBuilder.build} - Finalize and build the contract component
 *
 * The contract is finalized when {@link ContractBuilder.build} is called.
 *
 * @typeParam I - The input of the contract.
 * @typeParam O - The output of the contract.
 * @returns A new contract builder (typed as Contract for convenience).
 *
 * @public
 */
const contract = <
  I extends ContractInput | undefined = undefined,
  O extends ContractOutput | undefined = undefined,
>() => new ContractBuilder<I, O>() as unknown as Contract<I, O>;

// ***********************************************************************************************
// Implementation.
// ***********************************************************************************************

/**
 * The tag for the implementation component.
 *
 * @internal
 */
const IMPLEMENTATION_TAG = 'Implementation' as const;

/**
 * The signature of the function that implements the contract.
 *
 * @remarks
 * This signature is derived from the contract and automatically handles:
 * - Input validation (via the contract's input component)
 * - Output validation (via the contract's output component)
 * - Error types (combining contract errors, input errors, output errors, and panic errors)
 * - Async/sync behavior (based on the contract's async flag)
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
  Params extends ContractParams<C> = ContractParams<C>,
  Return extends ContractReturn<C> = ContractReturn<C>,
  Errors extends ContractErrors<C> = ContractErrors<C> & {},
  Async extends boolean = C extends Contract<Any, Any, Any, infer A> ? A : never,
> = [Params] extends [never] ? () => Promisify<Result<Return, Errors>, Async>
  : (input: Params) => Promisify<Result<Return, Errors>, Async>;

/**
 * The panic error for the implementation component.
 *
 * @public
 */
class ImplementationPanic
  extends panic<typeof IMPLEMENTATION_TAG, 'ImplementationPanic'>(IMPLEMENTATION_TAG) {}

/**
 * The type of the implementation.
 *
 * @remarks
 * An implementation is a callable component that implements a contract. It includes:
 * - The contract it implements
 * - The signature that wraps the implementation function with error handling
 * - The error types derived from the contract
 *
 * The error types are automatically inferred from the contract and include:
 * - Input validation errors
 * - Output validation errors
 * - Allowed implementation errors (from contract.errors())
 * - Panic errors (for unexpected runtime errors)
 *
 * @typeParam C - The contract to create an implementation for.
 *
 * @public
 */
type Implementation<
  C extends Contract<Any, Any, Any, boolean>,
> = Component<
  typeof IMPLEMENTATION_TAG,
  ImplementationSignature<C> & {
    /** Contract of the implementation. */
    contract: C;
    /** Signature of the implementation. */
    Signature: ImplementationSignature<C>;
    /** Errors of the implementation (derived from the contract). */
    Errors: ContractErrors<C>;
    /** Input of the implementation. */
    Input: ContractParams<C>;
    /** Output of the implementation. */
    Output: ContractReturn<C>;
  }
>;

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
 * @typeParam C - The contract to create an implementation for.
 * @param contract - The contract to create an implementation for.
 * @param implementationFn - The implementation function that implements the contract logic.
 *   Must match the contract's {@link ImplementationSignature}.
 * @returns A new implementation component that can be called with the contract's input parameters.
 *
 * @public
 */
const implementation = <C extends Contract<Any, Any, Any, boolean>>(
  contract: C,
  implementationFn: ImplementationSignature<C>,
): Implementation<C> => {
  if (isImplementation(implementationFn)) {
    throw new ContainerPanic(
      'AlreadyAnImplementation',
      'Attempting to wrap an existing implementation',
      `Check if is necessary to wrap the implementation again: ${implementationFn.id}`,
    );
  }

  // We don't want to raise runtime errors, so we just log the error and return a failed result.
  const handlePanic = (error: Any) => {
    logger.debug(`Original error: ${error instanceof Error ? error.message : String(error)}`);
    return err(
      {
        $panic: new ImplementationPanic(
          'ImplementationPanic',
          'An internal error occurred while executing the implementation.',
          `The original error is: ${error instanceof Error ? error.message : String(error)}`,
        ),
      } as Any,
    );
  };

  // Process the input and output of the contract.
  const processInputOutput = (input: unknown, fn: (input: unknown) => Result<unknown, unknown>) =>
    typeof fn === 'function' ? isResult(fn(input)) ? fn(input) : ok(input) : ok(input);

  const asyncFn = async (input: ContractParams<C>) => {
    const implementationFlow = flow<typeof input>()
      // 1. If the contract input is a function, call it.
      .map((input) => processInputOutput(input, contract.in))
      .mapErr((error) => err(failureAs(error, '$input') as Any))
      // 2. Call the implementation.
      .map(async (input) => await implementationFn(input as ContractParams<C>) as Any)
      .mapErr((error) => err(failureAs(error, '$logic') as Any))
      // 3. If the implementation returns a value, call the contract output (if exists).
      .map((input) => processInputOutput(input, contract.out))
      .mapErr((error) => err(failureAs(error, '$output') as Any))
      .build();

    try {
      return await implementationFlow(input);
    } catch (error) {
      return handlePanic(error);
    }
  };

  const syncFn = (input: ContractParams<C>) => {
    const implementationFlow = flow<typeof input>()
      // 1. If the contract input is a function, call it.
      .map((input) => processInputOutput(input, contract.in))
      .mapErr((error) => err(failureAs(error, '$input') as Any))
      // 2. Call the implementation.
      .map((input) => implementationFn(input as ContractParams<C>) as Any)
      .mapErr((error) => err(failureAs(error, '$logic') as Any))
      // 3. If the implementation returns a value, call the contract output (if exists).
      .map((input) => processInputOutput(input, contract.out))
      .mapErr((error) => err(failureAs(error, '$output') as Any))
      .build();

    try {
      return implementationFlow(input);
    } catch (error) {
      return handlePanic(error);
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
  return implementationComponent as Implementation<C>;
};

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

// ***********************************************************************************************
// Port.
// ***********************************************************************************************

/**
 * The tag for the port component.
 *
 * @internal
 */
const PORT_TAG = 'Port' as const;

/**
 * The shape of the port.
 * It is a record of contracts.
 *
 * @internal
 */
type PortShape = Record<string, Contract<Any, Any, Any, boolean>>;

/**
 * The signature of the port.
 *
 * @typeParam S - The shape of the port.
 *
 * @internal
 */
type PortSignature<S extends PortShape> = {
  [K in keyof S]: Implementation<S[K]>['Signature'];
};

/**
 * The type of the port.
 *
 * @typeParam S - The shape of the port.
 *
 * @public
 */
type Port<S extends PortShape> = Component<
  typeof PORT_TAG,
  PortSignature<S> & S
>;

/**
 * Creates a new port from the given shape.
 *
 * @typeParam S - The shape of the port.
 * @param port - The shape of the port (a record of contract components).
 * @returns A new port component.
 *
 * @public
 */
const port = <S extends PortShape>(port: S): Port<S> => component(PORT_TAG, port) as Port<S>;

/**
 * Type guard function that determines whether an object is a port.
 *
 * @param maybePort - The object to check.
 * @returns True if the object is a port, false otherwise.
 *
 * @internal
 */
const isPort = (maybePort: Any): maybePort is Port<PortShape> => isComponent(maybePort, PORT_TAG);

// ***********************************************************************************************
// Adapter.
// ***********************************************************************************************

/**
 * The tag for the adapter component.
 *
 * @internal
 */
const ADAPTER_TAG = 'Adapter' as const;

/**
 * The type of the implementation of the port.
 *
 * @typeParam S - The shape of the port.
 *
 * @internal
 */
type AdapterImplementation<S extends PortShape> = {
  [K in keyof S]: Implementation<S[K]>;
};

/**
 * The type of the adapter.
 *
 * @typeParam S - The shape of the port.
 *
 * @public
 */
type Adapter<A extends AdapterImplementation<S>, S extends PortShape> = Component<
  typeof ADAPTER_TAG,
  (() => A) & { port: Port<S> },
  A
>;

/**
 * Creates a new adapter component for the given port.
 *
 * @remarks
 * An adapter provides concrete implementations for all contracts in a port.
 * Each function in the adapter must be an {@link Implementation} component
 * that implements the corresponding contract in the port.
 *
 * @typeParam S - The shape of the port.
 * @typeParam A - The adapter implementation (record of implementations).
 * @param port - The port to create an adapter for.
 * @param adapterFn - The adapter implementation. Each key must correspond to a contract
 *   in the port, and each value must be an implementation of that contract.
 * @returns A new adapter component.
 * @throws {ContainerPanic} If any adapter function is not a valid implementation.
 *
 * @public
 */
const adapter = <S extends PortShape, A extends AdapterImplementation<S>>(
  port: Port<S>,
  adapterFn: A,
) => {
  // Each adapter function must be an implementation.
  for (const [key, fn] of Object.entries(adapterFn) as [keyof S, Any][]) {
    if (!isImplementation(fn)) {
      throw new ContainerPanic(
        'InvalidAdapter',
        'Adapter function must be an implementation',
        `The adapter function for the key ${String(key)} must be an implementation`,
      );
    }
  }

  const adapterComponent = component(ADAPTER_TAG, () => adapterFn, { port });
  meta(adapterComponent).children(port);
  return adapterComponent as Adapter<A, S>;
};

/**
 * Type guard function that determines whether an object is an adapter.
 *
 * @param maybeAdapter - The object to check.
 * @returns True if the object is an adapter, false otherwise.
 *
 * @internal
 */
const isAdapter = (maybeAdapter: Any): maybeAdapter is Adapter<Any, PortShape> =>
  isComponent(maybeAdapter, ADAPTER_TAG);

// ***********************************************************************************************
// Provider.
// ***********************************************************************************************

/**
 * The tag for the provider component.
 *
 * @internal
 */
const PROVIDER_TAG = 'Provider' as const;

/**
 * Describes the allowed types of dependencies for a provider.
 * A provider can depend on ports or other providers.
 *
 * @internal
 */
type ProviderAllowedDependencies = Record<string, PortComponent | ProviderComponent>;

/**
 * The type of the dependencies of the provider.
 *
 * @typeParam D - Record of the provider's dependencies.
 *
 * @internal
 */
type ProviderDependencies<
  D extends ProviderAllowedDependencies,
  GetType extends boolean = false,
> = [D] extends [never] ? Record<PropertyKey, never> : {
  [K in keyof D]: GetType extends true ? D[K]['Type'] : D[K];
};

/**
 * The type of the function that returns the exported object of the provider.
 *
 * @typeParam T - The type of the exported object of the provider.
 * @typeParam D - Record of the provider's dependencies.
 *
 * @internal
 */
type ProviderFunction<T, D extends ProviderAllowedDependencies> = (
  deps: ProviderDependencies<D, true>,
) => T;

/**
 * The type of the arguments of the signature of the function that exports the provider.
 *
 * @typeParam D - Record of the provider's dependencies.
 *
 * @internal
 */
type ProviderSignatureArgs<D extends ProviderAllowedDependencies> = {
  [K in keyof D]: D[K] extends Port<infer S> ? Adapter<Any, S>
    : D[K]['Type'];
};

/**
 * Defines the signature of the function that exports the provider.
 *
 * @typeParam T - The type of the exported object of the provider.
 * @typeParam D - Record of the allowed dependencies of the provider.
 *
 * @internal
 */
type ProviderSignature<T, D extends ProviderAllowedDependencies> = ProviderSignatureArgs<D> extends
  never ? () => T : ((deps: ProviderSignatureArgs<D>) => T);

/**
 * The type of the provider.
 *
 * @typeParam T - The type of the exported object of the provider.
 * @typeParam D - Record of the provider's dependencies.
 *
 * @public
 */
type Provider<
  T,
  D extends ProviderAllowedDependencies = never,
> = Component<
  typeof PROVIDER_TAG,
  & ProviderSignature<T, D>
  & ProviderBuilder<T, D>
  // Expose the dependencies of the provider as properties of the provider component.
  & ProviderDependencies<D>,
  T
>;

/**
 * The provider builder.
 *
 * @typeParam T - The type of the exported object of the provider.
 * @typeParam D - Record of the provider's dependencies.
 *
 * @internal
 */
class ProviderBuilder<T, D extends ProviderAllowedDependencies = never> {
  /**
   * Dependencies of the provider.
   */
  public deps = {} as unknown as D;

  /**
   * Function that exports the provider's object.
   */
  public fn: ProviderFunction<T, D> | undefined = undefined;

  /**
   * Sets the dependencies of the provider.
   *
   * @param dependencies - The dependencies to use (providers or ports).
   * @returns The provider builder.
   */
  public use<DD extends ProviderAllowedDependencies>(dependencies: DD) {
    // Check if the exports have been defined.
    if (this.fn) {
      throw new ContainerPanic(
        'CannotImportAfterExport',
        'Cannot import dependencies after defining the exports',
        "Did you forget define the dependencies before defining the provider's exports?",
      );
    }

    // Validate that at least one dependency is defined.
    if (Object.keys(dependencies).length === 0) {
      throw new ContainerPanic(
        'InvalidImport',
        'You should at least define one dependency',
        "If you don't need to define any dependencies, you can skip the import step",
      );
    }

    // Validate that all dependencies are valid providers or ports.
    const invalidDependencies = Object
      .values(dependencies)
      .filter((d) => !isProvider(d))
      .filter((d) => !isPort(d));

    // If there are invalid dependencies, throw an error.
    if (invalidDependencies.length > 0) {
      throw new ContainerPanic(
        'InvalidImport',
        'Cannot define dependencies that are not valid',
        doc`
        All dependencies must be valid providers or ports.
        The invalid dependencies are: ${
          invalidDependencies.map((d, i) => `${i + 1}. ${JSON.stringify(d)}`).join(', ')
        }
        `,
      );
    }

    // Validate that all providers have defined the provides function.
    const invalidProvidersDependencies = Object.values(dependencies).filter((i) =>
      isProvider(i) ? !i.fn : false
    );

    if (invalidProvidersDependencies.length > 0) {
      throw new ContainerPanic(
        'InvalidImport',
        'Cannot define a provider without exports',
        doc`
        Did you forget to define the exports?
        The providers without exports are: ${
          invalidProvidersDependencies.map((p, i) => `${i + 1}. ${p.id}`).join(', ')
        }
        `,
      );
    }

    // Set the dependencies of the provider.
    this.deps = dependencies as unknown as D;

    // We need to assign the dependencies to the provider builder to make them
    // available as properties of the provider component.
    Object.assign(this, { ...this.deps });

    return this as Provider<T, DD>;
  }

  /**
   * Defines the object that will be exported by the provider.
   *
   * @remarks
   * Under the hood, this method creates a new component, so it will be added to the registry.
   *
   * @param fn - The function that will be used to export the object.
   * @param uniqueness - Optional uniqueness parameters to ensure the provider is unique.
   *
   * @returns The provider.
   */
  public provide<TT>(fn: ProviderFunction<TT, D>, uniqueness?: Any) {
    this.fn = fn as unknown as ProviderFunction<T, D>;
    const buildFn = (deps: ProviderSignatureArgs<D>) => {
      let depsValues: ProviderDependencies<D> = {} as ProviderDependencies<D>;

      // Only build the dependencies if they are provided.
      if (deps) {
        depsValues = Object.fromEntries(
          Object.entries(deps).map(([key, dep]) => [key, isAdapter(dep) ? dep() : dep]),
        ) as ProviderDependencies<D>;
      }

      return fn(depsValues);
    };

    // Here we create a new component with the build function signature and dependencies.
    return component(PROVIDER_TAG, Object.assign(buildFn, { ...uniqueness }), {
      ...this,
      ...uniqueness,
    }) as Provider<TT, D>;
  }
}

/**
 * Creates a new provider builder in order to create a new provider.
 *
 * @remarks
 * Please use the builder methods `use` and `provide` of {@link ProviderBuilder} in order
 * to create a new provider.
 *
 * @typeParam T - The type of the exported object of the provider.
 * @typeParam D - The dependencies of the provider.
 * @returns A new provider builder.
 *
 * @public
 */
const provider = <T, D extends ProviderAllowedDependencies = never>() =>
  new ProviderBuilder<T, D>() as Provider<T, D>;

/**
 * Type guard function that determines whether an object is a provider.
 *
 * @param maybeProvider - The object to check.
 * @returns True if the object is a provider, false otherwise.
 *
 * @internal
 */
const isProvider = (maybeProvider: Any): maybeProvider is Provider<Any, Any> =>
  isComponent(maybeProvider, PROVIDER_TAG);

// ***********************************************************************************************
// Container.
// ***********************************************************************************************

/**
 * The tag for the container component.
 *
 * @internal
 */
const CONTAINER_TAG = 'Container' as const;

/**
 * The type of the imports of the container.
 *
 * @internal
 */
type ContainerImports = Record<string, ProviderComponent | ContainerComponent>;

/**
 * Recursively extracts all ports from a provider's dependencies (including nested providers).
 *
 * @typeParam Path - The current path prefix for the concatenated keys (e.g., "UserService").
 * @typeParam I - The imports of the container.
 *
 * @internal
 */
type ExtractPorts<
  Path extends string,
  I extends ProviderAllowedDependencies,
> = [I] extends [never] ? Record<PropertyKey, never>
  : keyof I extends never ? Record<PropertyKey, never>
  : UnionToIntersection<
    {
      [IK in keyof I]: I[IK] extends PortComponent ? {
          [Key in `${Path}.${IK & string}`]: I[IK];
        }
        : I[IK] extends Provider<Any, infer II> ? ExtractPorts<`${Path}.${IK & string}`, II>
        : never;
    }[keyof I]
  >;

/**
 * Extracts all ports from all providers in the container imports with concatenated keys.
 * Processes nested providers recursively.
 *
 * @typeParam I - The imports of the container.
 *
 * @internal
 */
type ContainerPorts<I extends ContainerImports> = Pretty<
  UnionToIntersection<
    FilterEmptyObjects<
      {
        [K in keyof I]: I[K] extends Provider<Any, infer D> ? ExtractPorts<K & string, D>
          : I[K] extends Container<Any> ? I[K]['Ports']
          : never;
      }[keyof I]
    >
  >
>;

/**
 * Recursively extracts all providers from a container's imports (including nested containers).
 *
 * @typeParam I - The imports of the container.
 *
 * @internal
 */
type ContainerProviders<I extends ContainerImports> = Pretty<
  UnionToIntersection<
    {
      [IK in keyof I]: I[IK] extends ProviderComponent ? {
          [Key in IK & string]: I[IK];
        }
        : I[IK] extends Container<infer II> ? ContainerProviders<II>
        : never;
    }[keyof I]
  >
>;

/**
 * The type of the container.
 *
 * @typeParam I - The imports of the container.
 *
 * @public
 */
type Container<I extends ContainerImports> = Component<
  typeof CONTAINER_TAG,
  ContainerBuilder<I> & { Ports: ContainerPorts<I>; Providers: ContainerProviders<I> }
>;

/**
 * The builder class for the container.
 *
 * @typeParam I - The imports of the container.
 *
 * @internal
 */
class ContainerBuilder<I extends ContainerImports> {
  /**
   * Providers and containers imported and used by the container.
   */
  private imports = [] as unknown as I;

  /**
   * Bindings of the container.
   */
  private bindings = new Map<PortComponent, AdapterComponent>();

  /**
   * Sets the imports of the container.
   *
   * @param imports - The imports of the container.
   * @returns The container.
   */
  public import<II extends ContainerImports>(imports: II) {
    this.imports = imports as unknown as I;
    return this as unknown as Container<II>;
  }

  /**
   * Binds an adapter to a port.
   *
   * @param port - The port to bind the adapter to.
   * @param adapter - The adapter to bind to the port.
   * @returns The container.
   */
  public bind<
    P extends ContainerPorts<I>[keyof ContainerPorts<I>],
    PT extends P extends Port<infer TP> ? Port<TP> : never,
    AT extends PT extends Port<infer S> ? Adapter<Any, S> : never,
  >(port: PT, adapter: AT) {
    if (!isPort(port)) {
      throw new ContainerPanic(
        'InvalidPort',
        'Cannot bind a non-port',
        'The port must be a valid port',
      );
    }

    if (!isAdapter(adapter)) {
      throw new ContainerPanic(
        'InvalidAdapter',
        'Cannot bind a non-adapter',
        'The adapter must be a valid adapter',
      );
    }

    if (port.id !== adapter.port.id) {
      throw new ContainerPanic(
        'InvalidBinding',
        'Cannot bind an adapter to a different port',
        'The adapter must be bound to the same port',
      );
    }

    this.bindings.set(port, adapter);
    return this as unknown as Container<I>;
  }

  /**
   * Builds the container and adds it to the registry.
   *
   * @remarks
   * Under the hood, this method will resolve the dependencies of the providers and containers
   * and add them to the providers and containers global maps, so they can be used later.
   *
   * @returns The container.
   */
  public build() {
    const providers = new Map<ProviderComponent, Any>();
    for (const [, item] of Object.entries(this.imports)) {
      if (isProvider(item)) {
        const resolutions = this.resolve(item.deps);
        providers.set(item, item(resolutions));
      } else if (isContainer(item)) {
        const container = di.containers.get(item);
        // If the container is not found, we need raise an error.
        if (!container) {
          throw new ContainerPanic(
            'ContainerNotBuilt',
            'Cannot import a container that has not been built',
            doc`
            The container must be built before it can be imported.
            Maybe you forgot to call the build method?
            The container is: ${item.id}
            `,
          );
        }
      }
    }

    // Adding to the global providers map.
    for (const [key, item] of providers.entries()) {
      di.providers.set(key, item);
    }

    // Here we create a new component with the container builder and the imports.
    const container = component(CONTAINER_TAG, this) as unknown as Container<I>;

    // The registration must be a component wrapper of the container builder.
    di.containers.set(container, providers);

    return container;
  }

  /**
   * Gets an exported provider of the container by name.
   *
   * @param name - The name of the provider.
   * @returns The provider resolved object ready to be used.
   */
  public get<
    K extends keyof ContainerProviders<I>,
    P extends ContainerProviders<I>[K] extends ProviderComponent ? ContainerProviders<I>[K] : never,
  >(name: K): P['Type'];

  /**
   * Gets an exported provider of the container by provider component.
   *
   * @param provider - The provider component.
   * @returns The provider resolved object ready to be used.
   */
  public get<
    P extends ContainerProviders<I>[keyof ContainerProviders<I>],
    PT extends ProviderComponent = P extends Provider<infer TP> ? Provider<TP> : never,
  >(provider: PT): PT['Type'];

  /**
   * Gets an exported provider of the container by name or provider component.
   *
   * @param nameOrProvider - The name of the provider or the provider component.
   * @returns The provider resolved object ready to be used.
   */
  public get(nameOrProvider: string | ProviderComponent) {
    if (isProvider(nameOrProvider)) {
      return this.getByProvider(nameOrProvider);
    } else if (typeof nameOrProvider === 'string') {
      return this.getByName(nameOrProvider as keyof ContainerProviders<I>);
    }
  }

  /**
   * Resolves the dependencies for a given record of dependencies.
   *
   * @param deps - The record of dependencies to resolve.
   * @param resolving - Set of providers currently being resolved (for cycle detection).
   * @returns The resolved dependencies.
   */
  private resolve(deps: Record<string, Any>, resolving: Set<ProviderComponent> = new Set()) {
    const resolved = {} as Record<string, Any>;

    for (const [key, item] of Object.entries(deps)) {
      // If the value is a port, we need to get the binding from the _bindings map.
      if (isPort(item)) {
        const binding = this.bindings.get(item);
        if (!binding) {
          throw new ContainerPanic(
            'InvalidBinding',
            'Port has no binding',
            doc`
            The port "${key}" requires a binding but none was provided.
            Did you forget to call bind() for this port?
            `,
          );
        }
        resolved[key] = binding;
      } // If the value is a provider, we need to resolve the dependencies.
      else if (isProvider(item)) {
        // Check for circular dependencies.
        if (resolving.has(item)) {
          throw new ContainerPanic(
            'CircularDependency',
            'Circular dependency detected',
            doc`
            A circular dependency was detected when resolving provider "${key}".
            The provider is already being resolved in the current dependency chain.
            `,
          );
        }

        // If the provider has already been resolved, we use that resolution.
        if (di.providers.has(item)) {
          logger.debug(`Using cached provider: ${key}`);
          resolved[key] = di.providers.get(item);
        } else {
          resolving.add(item);
          try {
            const resolutions = this.resolve(item.deps, resolving);
            const providerValue = item(resolutions);
            di.providers.set(item, providerValue);
            resolved[key] = providerValue;
          } finally {
            resolving.delete(item);
          }
        }
      }
    }

    return resolved;
  }

  /**
   * Gets the providers of the container.
   *
   * @returns The providers of the container.
   */
  public providers(): ContainerProviders<I> {
    return Object.entries(this.imports)
      .reduce((acc, [key, item]) => {
        if (isProvider(item)) {
          acc[key] = item;
        } else if (isContainer(item)) {
          Object.assign(acc, item.providers());
        } else {
          throw new ContainerPanic(
            'InvalidImport',
            'Cannot import a non-provider or container',
            'The import must be a valid provider or container',
          );
        }
        return acc;
      }, {} as Record<string, unknown>) as unknown as ContainerProviders<I>;
  }

  /**
   * Gets an exported provider of the container by name.
   *
   * @param name - The name of the provider.
   * @returns The provider resolved object ready to be used.
   */
  private getByName<
    K extends keyof ContainerProviders<I>,
    P extends ContainerProviders<I>[K] extends ProviderComponent ? ContainerProviders<I>[K] : never,
  >(name: K) {
    const providers = this.providers();
    return this.get(providers[name] as unknown as Provider<Any, Any>) as unknown as P['Type'];
  }

  /**
   * Gets an exported provider of the container by provider component.
   *
   * @param provider - The provider component.
   * @returns The provider resolved object ready to be used.
   */
  private getByProvider<
    P extends ContainerProviders<I>[keyof ContainerProviders<I>],
    PT extends ProviderComponent = P extends Provider<infer TP> ? Provider<TP> : never,
  >(provider: PT) {
    if (!isProvider(provider)) {
      throw new ContainerPanic(
        'InvalidProvider',
        'Cannot get a non-provider',
        'The provider must be a valid provider',
      );
    }

    const containerResolutions = di.containers.get(this);

    if (!containerResolutions) {
      throw new ContainerPanic(
        'ContainerNotBuilt',
        'Cannot get a provider from a container that has not been built',
        'The container must be built before it can be used',
      );
    }

    return di.providers.get(provider) as PT['Type'];
  }
}

/**
 * Creates a new container builder in order to create a new container.
 *
 * @typeParam I - The imports of the container.
 * @returns A new container builder.
 *
 * @public
 */
const container = <I extends ContainerImports>(): Container<I> =>
  new ContainerBuilder<I>() as Container<I>;

/**
 * Type guard function that determines whether an object is a container.
 *
 * @param maybeContainer - The object to check.
 * @returns True if the object is a container, false otherwise.
 *
 * @internal
 */
const isContainer = (maybeContainer: Any): maybeContainer is Container<Any> =>
  isComponent(maybeContainer, CONTAINER_TAG);

export {
  adapter,
  container,
  contract,
  di,
  implementation,
  isImplementation,
  isProvider,
  port,
  provider,
};
export type { Adapter, Container, Contract, Implementation, Port, Provider };
