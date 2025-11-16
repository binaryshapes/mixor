/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Component, component, isComponent } from './component.ts';
import type { Any, Pretty, UnionToIntersection } from './generics.ts';
import { panic } from './panic.ts';
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
 * @typeParam I - The input of the contract.
 *
 * @internal
 */
type ContractParams<I extends ContractInput | undefined> = I extends Component<string, unknown>
  ? I['Type']
  : I extends Record<string, Component<string, unknown>> ? Pretty<
      {
        [K in keyof I]: I[K] extends Component<string, unknown> ? I[K]['Type'] : never;
      }
    >
  : never;

/**
 * The type of the return value of the contract.
 *
 * @typeParam O - The output of the contract.
 *
 * @internal
 */
type ContractReturnType<O extends ContractOutput | undefined> = O extends undefined
  ? void | Promise<void>
  : O extends Component<string, unknown> ? O['Type'] | Promise<O['Type']>
  : never;

/**
 * The type of the signature of the contract.
 *
 * @typeParam I - The input of the contract.
 * @typeParam O - The output of the contract.
 *
 * @internal
 */
type ContractSignature<
  I extends ContractInput | undefined,
  O extends ContractOutput | undefined,
> = I extends undefined ? (() => ContractReturnType<O>)
  : (input: ContractParams<I>) => ContractReturnType<O>;

/**
 * The type of the contract.
 *
 * @typeParam I - The input of the contract.
 * @typeParam O - The output of the contract.
 *
 * @public
 */
type Contract<
  I extends ContractInput | undefined = undefined,
  O extends ContractOutput | undefined = undefined,
> = Component<
  typeof CONTRACT_TAG,
  ContractBuilder<I, O> & {
    Input: I extends Component<string, unknown> ? I['Type'] : never;
    Output: O extends Component<string, unknown> ? O['Type'] : never;
  },
  ContractSignature<I, O>
>;

/**
 * The builder class for the contract component.
 *
 * @typeParam I - The input of the contract.
 * @typeParam O - The output of the contract.
 *
 * @internal
 */
class ContractBuilder<
  I extends ContractInput | undefined = undefined,
  O extends ContractOutput | undefined = undefined,
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
   * Sets the input of the contract.
   *
   * @param input - The input of the contract. Must be a valid Component.
   * @returns The contract.
   */
  public input<II extends ContractInput>(input: EnsureComponent<II>) {
    // Runtime validation: ensure input is a Component.
    if (!isComponent(input)) {
      throw new ContainerPanic('InvalidInput', 'Contract input must be a Component');
    }

    this.in = input as unknown as I;
    return this as unknown as Contract<II, O>;
  }

  /**
   * Sets the output of the contract.
   *
   * @param output - The output of the contract. Must be a valid Component.
   * @returns The contract.
   */
  public output<OO extends ContractOutput>(output: EnsureComponent<OO>) {
    // Runtime validation: ensure output is a Component.
    if (!isComponent(output)) {
      throw new ContainerPanic('InvalidOutput', 'Contract output must be a Component');
    }

    this.out = output as unknown as O;
    return component(CONTRACT_TAG, this) as unknown as Contract<I, OO>;
  }
}

/**
 * Creates a new contract builder in order to create a new contract.
 *
 * @typeParam I - The input of the contract.
 * @typeParam O - The output of the contract.
 * @returns A new contract builder.
 *
 * @public
 */
const contract = <
  I extends ContractInput | undefined = undefined,
  O extends ContractOutput | undefined = undefined,
>() => new ContractBuilder<I, O>() as Contract<I, O>;

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
 * It is a record of components.
 *
 * @internal
 */
type PortShape = Record<string, Component<typeof CONTRACT_TAG, unknown>>;

/**
 * The type of the shape of the port.
 *
 * @typeParam S - The shape of the port.
 *
 * @internal
 */
type PortType<S extends PortShape> = {
  [K in keyof S]: S[K]['Type'];
};

/**
 * The type of the port.
 *
 * @typeParam S - The shape of the port.
 *
 * @public
 */
type Port<S extends PortShape> = Component<typeof PORT_TAG, S, PortType<S>>;

/**
 * Creates a new port from the given shape.
 *
 * @typeParam S - The shape of the port.
 * @param port - The shape of the port (a record of contract components).
 * @returns A new port component.
 *
 * @public
 */
const port = <S extends PortShape>(port: S) => component(PORT_TAG, {}, port) as Port<S>;

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
 * The type of the adapter.
 *
 * @typeParam P - The port of the adapter.
 *
 * @public
 */
type Adapter<P extends PortComponent> = Component<
  typeof ADAPTER_TAG,
  (() => P['Type']) & { port: P }
>;

/**
 * Creates a new adapter component for the given port.
 *
 * @typeParam P - The shape of the port.
 * @param port - The port to create an adapter for.
 * @param implementation - The implementation of the port's type.
 * @returns A new adapter component.
 *
 * @public
 */
const adapter = <P extends PortShape>(port: Port<P>, implementation: Port<P>['Type']) =>
  component(ADAPTER_TAG, () => implementation, { port }) as Adapter<Port<P>>;

/**
 * Type guard function that determines whether an object is an adapter.
 *
 * @param maybeAdapter - The object to check.
 * @returns True if the object is an adapter, false otherwise.
 *
 * @internal
 */
const isAdapter = (maybeAdapter: Any): maybeAdapter is Adapter<Port<PortShape>> =>
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
type ProviderDependencies<D extends ProviderAllowedDependencies> = {
  [K in keyof D]: D[K]['Type'];
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
  deps: ProviderDependencies<D>,
) => T;

/**
 * The type of the arguments of the signature of the function that exports the provider.
 *
 * @typeParam D - Record of the provider's dependencies.
 *
 * @internal
 */
type ProviderSignatureArgs<D extends ProviderAllowedDependencies> = {
  [K in keyof D]: D[K] extends Port<infer S> ? Adapter<Port<S>>
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
type ProviderSignature<T, D extends ProviderAllowedDependencies = never> =
  ProviderSignatureArgs<D> extends never ? () => T : ((deps: ProviderSignatureArgs<D>) => T);

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
> = Component<typeof PROVIDER_TAG, ProviderSignature<T, D> & ProviderBuilder<T, D>, T>;

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
        The invalid dependencies are:
        ${invalidDependencies.map((d) => `- ${d}`).join('\n')}
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
        Did you forget to define the exports? The providers are without exports:
        ${invalidProvidersDependencies.map((p) => `- ${p.id}`).join('\n')}
        `,
      );
    }

    // Set the dependencies of the provider.
    this.deps = dependencies as unknown as D;
    return this as unknown as Provider<T, DD>;
  }

  /**
   * Defines the object that will be exported by the provider.
   *
   * @remarks
   * Under the hood, this method creates a new component, so it will be added to the registry.
   *
   * @param fn - The function that will be used to export the object.
   * @returns The provider.
   */
  public provide<TT>(fn: ProviderFunction<TT, D>) {
    this.fn = fn as unknown as ProviderFunction<T, D>;
    const build = (deps: ProviderSignatureArgs<D>) => this.build(deps);

    // Here we create a new component with the build function signature and dependencies.
    return component(PROVIDER_TAG, build, { ...this, build }) as unknown as Provider<TT, D>;
  }

  /**
   * Builds the provider function using the given dependencies.
   *
   * @param deps - The dependencies of the provider.
   * @returns The provider object.
   */
  private build(deps: ProviderSignatureArgs<D>) {
    let depsValues: ProviderDependencies<D> = {} as ProviderDependencies<D>;

    // Only build the dependencies if they are provided.
    if (deps) {
      depsValues = Object.fromEntries(
        Object.entries(deps).map(([key, value]) => [key, isAdapter(value) ? value() : value]),
      ) as ProviderDependencies<D>;
    }

    return this.fn?.(depsValues);
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
> = UnionToIntersection<
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
    {
      [K in keyof I]: I[K] extends Provider<Any, infer D> ? ExtractPorts<K & string, D>
        : I[K] extends Container<Any> ? I[K]['Ports']
        : never;
    }[keyof I]
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
  >(port: PT, adapter: Adapter<PT>) {
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

    if (port !== adapter.port) {
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
const container = <I extends ContainerImports>() => new ContainerBuilder<I>();

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

export { adapter, container, contract, di, port, provider };
export type { Adapter, Container, Contract, Port, Provider };
