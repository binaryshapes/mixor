/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Component, component, isComponent } from './component.ts';
import type { Any, Pretty, PrimitiveTypeExtended } from './generics.ts';
import { panic } from './panic.ts';
import { doc } from './utils.ts';

/**
 * The dependency injection registry.
 *
 * @internal
 */
const di = {
  providers: new Map<string, Provider<Any, Any>>(),
};

/**
 * The panic error for the container module.
 *
 * - `CannotImportAfterExport`: The imports cannot be imported after the exports have been defined.
 * - `InvalidImport`: The imports are invalid.
 *
 * @public
 */
class ContainerPanic extends panic<
  'Container',
  | 'CannotImportAfterExport'
  | 'InvalidImport'
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

type ContractInput<Key extends string = string> = Record<Key, Component<string, unknown>>;

type ContractOutput = Component<string, unknown>;

type ContractParams<I extends ContractInput> = Pretty<
  {
    [K in keyof I]: I[K]['Type'];
  }
>;

type ContractSignature<I extends ContractInput, O extends ContractOutput> = (
  input: ContractParams<I>,
) => O['Type'];

type Contract<I extends ContractInput, O extends ContractOutput> = Component<
  typeof CONTRACT_TAG,
  ContractBuilder<I, O>,
  ContractSignature<I, O>
>;

class ContractBuilder<I extends ContractInput = never, O extends ContractOutput = never> {
  public in: I | undefined;
  public out: O | undefined;

  public input<Key extends string, II extends ContractInput<Key>>(input: II) {
    this.in = input as unknown as I;
    return this as unknown as Contract<II, O>;
  }

  public output<OO extends ContractOutput>(output: OO = undefined as unknown as OO) {
    this.out = output as unknown as O;
    return component(
      CONTRACT_TAG,
      {},
      Object.values(this.in ?? {}),
      this.out,
    ) as unknown as Contract<
      I,
      OO
    >;
  }
}

const contract = <I extends ContractInput = never, O extends ContractOutput = never>() =>
  new ContractBuilder<I, O>() as unknown as Contract<I, O>;

// ***********************************************************************************************
// Port.
// ***********************************************************************************************

/**
 * The tag for the port component.
 *
 * @internal
 */
const PORT_TAG = 'Port' as const;

type PortShape = Record<string, Component<typeof CONTRACT_TAG, unknown>>;

type PortType<S extends PortShape> = { [K in keyof S]: S[K]['Type'] };

/**
 * The type of the port.
 *
 * @typeParam S - The shape of the port.
 * @returns The type of the port.
 *
 * @internal
 */
type Port<S extends PortShape> = Component<typeof PORT_TAG, S, PortType<S>>;

const port = <S extends PortShape>(port: S) => component(PORT_TAG, port) as Port<S>;

// ***********************************************************************************************
// Adapter.
// ***********************************************************************************************

/**
 * The tag for the adapter component.
 *
 * @internal
 */
const ADAPTER_TAG = 'Adapter' as const;

type Adapter<P extends Port<PortShape>> = Component<
  typeof ADAPTER_TAG,
  (() => P['Type']) & { port: P }
>;

const adapter = <P extends PortShape>(port: Port<P>, implementation: Port<P>['Type']) => {
  // const prov = provider().export(() => implementation);
  // console.log(port);
  return component(ADAPTER_TAG, () => implementation, { port }) as Adapter<
    Port<P>
  >;
};

// ***********************************************************************************************
// Provider.
// ***********************************************************************************************

type ProviderComponent = Component<typeof PROVIDER_TAG, unknown>;
type PortComponent = Component<typeof PORT_TAG, unknown>;
type ContractComponent = Component<typeof CONTRACT_TAG, unknown>;
type ContainerComponent = Component<typeof CONTAINER_TAG, unknown>;

/**
 * The tag for the provider component.
 *
 * @internal
 */
const PROVIDER_TAG = 'Provider' as const;

/**
 * The type of the imports of the provider.
 *
 * @typeParam P - The type of the provider.
 * @returns The type of the imports of the provider.
 *
 * @internal
 */
// type ProviderImports<T extends Any[]> = { [K in keyof T]: [K, T[K]['Type']] }[keyof T][];
type ProviderImports<T extends Any[]> = { [K in keyof T]: T[K]['Type'] };

/**
 * The type of the function that exports the provider.
 *
 * @typeParam E - The type of the exports of the provider.
 * @typeParam I - The imports of the provider.
 * @returns The type of the function that exports the provider.
 *
 * @internal
 */
type ProviderExports<T, I extends Any[]> = (...deps: ProviderImports<I>) => T;

/**
 * The type of the provider.
 *
 * @typeParam T - The type of the exports of the provider.
 * @typeParam Deps - The imports of the provider.
 * @returns The type of the provider.
 *
 * @internal
 */
type Provider<
  E,
  I extends ProviderComponent[] = never,
  P extends PortComponent[] = never,
> = Component<
  typeof PROVIDER_TAG,
  (() => E) & ProviderBuilder<E, I, P>,
  E
>;

/**
 * The provider builder.
 *
 * @typeParam E - The type of the exports of the provider.
 * @typeParam I - The imports of the provider.
 *
 * @internal
 */
class ProviderBuilder<
  E,
  I extends ProviderComponent[] = never,
  P extends PortComponent[] = never,
> {
  /**
   * Ports of the provider.
   */
  public _ports = [] as unknown as P;

  /**
   * The imports required by the provider.
   */
  public _imports = [] as unknown as I;

  /**
   * The exports of the provider.
   */
  public _exports: ((...deps: ProviderImports<P>) => E) | undefined = undefined;

  public ports<PP extends PortComponent[]>(...ports: PP) {
    this._ports = ports as unknown as P;
    return this as unknown as Provider<E, I, PP>;
  }

  /**
   * Imports the given providers.
   *
   * @param imports - The providers to import.
   * @returns The provider builder.
   */
  public import<II extends ProviderComponent[]>(...imports: II) {
    // Check if the exports have been defined.
    if (this._exports) {
      throw new ContainerPanic(
        'CannotImportAfterExport',
        'Cannot import providers after defining the exports',
        'Did you forget to import the providers before defining the exports?',
      );
    }

    // Validate that at least one provider is imported.
    if (imports.length === 0) {
      throw new ContainerPanic(
        'InvalidImport',
        'You should at least import one provider',
        "If you don't need to import any providers, you can skip the import step",
      );
    }

    // Validate that all imports are valid providers.
    const invalidImports = imports.filter((i) => !isProvider(i));
    if (invalidImports.length > 0) {
      throw new ContainerPanic(
        'InvalidImport',
        'Cannot import providers that are not valid',
        doc`All imports must be valid providers.

        The invalid imports are:
        ${invalidImports.map((i) => `- ${i}`).join('\n')}
        `,
      );
    }

    // Validate that all providers have defined the exports.
    const importsWithoutExports = imports.filter((i) => isProvider(i) ? !i._exports : false);
    if (importsWithoutExports.length > 0) {
      throw new ContainerPanic(
        'InvalidImport',
        'Cannot import providers that have not defined the exports',
        doc`
        Did you forget to define the exports? The imports are without exports:
        ${importsWithoutExports.map((i) => `- ${i.id}`).join('\n')}
        `,
      );
    }

    this._imports = imports as unknown as I;
    return this as unknown as Provider<E, II, P>;
  }

  /**
   * Sets the exports of the provider. Considers the imports of the provider.
   *
   * @remarks
   * Under the hood, this method creates a new component, so it will be added to the registry.
   *
   * @param exports - The function to export.
   * @returns The provider.
   */
  public export<EE>(fn: ProviderExports<EE, P>) {
    this._exports = (...deps: ProviderImports<P>) => fn(...deps) as Any;
    return component(PROVIDER_TAG, () => this._exports, { ...this, fn }) as Provider<EE, I, P>;
  }
}

/**
 * Creates a new provider builder in order to create a new provider.
 *
 * @remarks
 * Please use the builder methods `import` and `export` of {@link ProviderBuilder} in order
 * to create a new provider.
 *
 * @typeParam E - The type of the exports of the provider.
 * @typeParam I - The imports of the provider.
 * @returns A new provider builder.
 *
 * @public
 */
const provider = <E, I extends Provider<Any, Any>[] = never>() =>
  new ProviderBuilder<E, I>() as Provider<E, I>;

/**
 * Type guard function that determines whether an object is a provider.
 *
 * @param maybeProvider - The object to check.
 * @returns True if the object is a provider, false otherwise.
 *
 * @public
 */
const isProvider = (maybeProvider: Any): maybeProvider is Provider<Any, Any> =>
  isComponent(maybeProvider, PROVIDER_TAG);

// ***********************************************************************************************
// Container.
// ***********************************************************************************************

const CONTAINER_TAG = 'Container' as const;

type ContainerImports = (ProviderComponent | ContainerComponent)[];
type ContainerExports = Record<string, ProviderComponent | PrimitiveTypeExtended>;

type Container<I extends ContainerImports, E extends ContainerExports> = Component<
  typeof CONTAINER_TAG,
  ContainerBuilder<I, E> & { Ports: ContainerPorts<I> }
>;

type ContainerPorts<E extends ContainerImports> = {
  [K in keyof E]: E[K] extends ProviderComponent
    ? E[K] extends Provider<Any, Any, infer Ports> ? Ports : never
    : never;
};

class ContainerBuilder<I extends ContainerImports, E extends ContainerExports> {
  /**
   * Providers imported used by the exports of the container.
   */
  private _imports = [] as unknown as I;

  /**
   * Providers exported by the container.
   */
  private _exports = [] as unknown as E;

  /**
   * Bindings of the container.
   */
  public _bindings = new Map<Port<PortShape>, Adapter<Port<PortShape>>>();

  public import<II extends ContainerImports>(...imports: II) {
    this._imports = imports as unknown as I;
    return this as unknown as Container<II, E>;
  }

  public export<EE extends ContainerExports>(exports: EE) {
    this._exports = exports as unknown as E;
    return this as unknown as Container<I, EE>;
  }

  public ports() {
    return this._imports.map((i) => isProvider(i) ? i._ports : i).flat() as ContainerPorts<I>;
  }
}

const container = <I extends ContainerImports, E extends ContainerExports>() =>
  new ContainerBuilder<I, E>() as Container<I, E>;

export { adapter, container, contract, port, provider };
export type { Adapter, Contract, Port, Provider };
