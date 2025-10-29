/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Component, component, isComponent } from './component.ts';
import type { Any } from './generics.ts';
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
 * The tag for the provider component.
 *
 * @internal
 */
const PROVIDER_TAG = 'Provider' as const;

type ProviderImports<P extends Provider<Any, Any>[]> = { [K in keyof P]: P[K]['Type'] };

type ProviderFunction<T, Deps extends Provider<Any, Any>[]> = (...deps: ProviderImports<Deps>) => T;

type Provider<T, Deps extends Provider<Any, Any>[]> = Component<
  typeof PROVIDER_TAG,
  (() => T) & ProviderBuilder<T, Deps>,
  T
>;

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

class ProviderBuilder<T, Deps extends Provider<Any, Any>[] = never> {
  /**
   * The imports required by the provider.
   */
  public imports = [] as unknown as Deps;

  /**
   * The exports of the provider.
   */
  public exports = undefined as unknown as T;

  /**
   * Imports the given providers.
   *
   * @param imports - The providers to import.
   * @returns The provider builder.
   */
  public import<DD extends Provider<Any, Any>[]>(...imports: DD) {
    // Check if the exports have been defined.
    if (this.exports) {
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
    const importsWithoutExports = imports.filter((i) => !i.exports);
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

    this.imports = imports as unknown as Deps;
    return this as unknown as Provider<T, DD>;
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
  public export<TT>(exportsFn: ProviderFunction<TT, Deps>) {
    this.exports = (exportsFn as Any)(...(this.imports.map((p) => p.exports)));
    return component(PROVIDER_TAG, () => this.exports, this) as unknown as Provider<TT, Deps>;
  }
}

/**
 * Creates a new provider builder in order to create a new provider.
 *
 * @remarks
 * Please use the builder methods `import` and `export` of {@link ProviderBuilder} in order
 * to create a new provider.
 *
 * @param T - The type of the exports of the provider.
 * @param Deps - The imports of the provider.
 * @returns A new provider builder.
 *
 * @public
 */
const provider = <T, Deps extends Provider<Any, Any>[] = never>() =>
  new ProviderBuilder<T, Deps>() as Provider<T, Deps>;

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

export { di, isProvider, provider };
export type { Provider };
