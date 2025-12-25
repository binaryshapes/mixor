/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Adapter, isAdapter } from './adapter.ts';
import { type Component, component, isComponent } from './component.ts';
import type { Any } from './generics.ts';
import { panic } from './panic.ts';
import { isPort, type Port, type PortShape } from './port.ts';
import { doc } from './utils.ts';

type PortComponent = Port<PortShape>;
type ProviderComponent = Component<typeof PROVIDER_TAG, unknown>;

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
 * @public
 */
type ProviderAllowedDependencies = Record<string, PortComponent | ProviderComponent>;

/**
 * The type of the dependencies of the provider.
 *
 * @typeParam D - Record of the provider's dependencies.
 * @typeParam GetType - Whether to get the Type property of dependencies.
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
 * The panic error for the provider component.
 *
 * @remarks
 * Possible panic codes:
 * - `CannotImportAfterExport`: Cannot import dependencies after defining the exports.
 * - `InvalidImport`: The dependencies are not valid.
 * - `InvalidProvider`: The provider is not valid.
 *
 * @public
 */
class ProviderPanic extends panic<
  typeof PROVIDER_TAG,
  'CannotImportAfterExport' | 'InvalidImport' | 'InvalidProvider'
>(PROVIDER_TAG) {}

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
   * @remarks
   * This method sets the dependencies that the provider will use. The dependencies
   * must be valid providers or ports. You cannot set dependencies after defining
   * the provider's exports.
   *
   * @typeParam DD - The type of the dependencies.
   * @param dependencies - The dependencies to use (providers or ports).
   * @returns The provider builder with the dependencies set.
   * @throws {ProviderPanic} If dependencies are set after exports are defined, if no dependencies
   * are provided, if dependencies are invalid, or if providers don't have exports defined.
   */
  public use<DD extends ProviderAllowedDependencies>(dependencies: DD) {
    // Check if the exports have been defined.
    if (this.fn) {
      throw new ProviderPanic(
        'CannotImportAfterExport',
        'Cannot import dependencies after defining the exports',
        "Did you forget define the dependencies before defining the provider's exports?",
      );
    }

    // Validate that at least one dependency is defined.
    if (Object.keys(dependencies).length === 0) {
      throw new ProviderPanic(
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
      throw new ProviderPanic(
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
      throw new ProviderPanic(
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
   * @typeParam TT - The type of the exported object of the provider.
   * @param fn - The function that will be used to export the object.
   * @param uniqueness - Optional uniqueness parameters to ensure the provider is unique.
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
 * @public
 */
const isProvider = (maybeProvider: Any): maybeProvider is Provider<Any, Any> =>
  isComponent(maybeProvider, PROVIDER_TAG);

export { isProvider, provider, ProviderPanic };
export type { Provider, ProviderAllowedDependencies };
