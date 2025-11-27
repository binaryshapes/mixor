/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { n } from '@nuxo/core';

import type { Schema, SchemaValues, Value } from '@nuxo/components';
import { criteria, rule, value } from '@nuxo/components';
import type { Criteria } from './criteria.ts';

/**
 * The tag for the repository component.
 *
 * @internal
 */
const REPOSITORY_TAG = 'Repository' as const;

/**
 * Represents the criteria related to a repository.
 *
 * @internal
 */
type RepositoryCriteria<S extends SchemaValues, E extends Schema<S> = Schema<S>> = Record<
  string,
  Criteria<E['Type'], n.Any[]>
>;

/**
 * Creates a data source port for the repository.
 *
 * @remarks
 * The data source port is a record of contracts that are used to match, match all, save,
 * delete, count and all items from the repository.
 *
 * @param entity - The entity of the repository.
 * @returns The data source port.
 *
 * @internal
 */
const createDataSource = <S extends SchemaValues>(entity: Schema<S>) => {
  // Dummy criteria to match the entity.
  const c = criteria((() => ({})) as n.Any) as Criteria<Schema<S>['Type']>;

  // Dummy rule to check if the value is a number.
  const IsNumber = rule(() =>
    n.assert((value: number) => typeof value === 'number', 'INVALID_NUMBER' as never)
  );

  // Dummy rule to check if the value is a boolean.
  const IsBoolean = rule(() =>
    n.assert((value: boolean) => typeof value === 'boolean', 'INVALID_BOOLEAN' as never)
  );

  type EntityArray<T> = n.Component<'EntityArray', T[]>;

  // Internal dummy array schema component.
  const arraySchema = <S extends SchemaValues>(schema: Schema<S>) => {
    return n.component('EntityArray', {}, schema) as EntityArray<Schema<S>['Type']>;
  };

  return n.port({
    /**
     * Matches an item from the data source.
     *
     * @remarks
     * If the item does not exist, it will return a failure Result with code 'NOT_FOUND'.
     *
     * @param criteria - The criteria to match the item.
     * @returns The item if it matches the criteria, undefined otherwise.
     */
    match: n.contract()
      .input(c)
      .output(entity)
      .errors('NOT_FOUND')
      .async()
      .build(),

    /**
     * Matches all items from the data source.
     *
     * @remarks
     * If the items do not exist, it will return a failure Result with code 'NOT_FOUND'.
     */
    matchAll: n.contract()
      .input(c)
      .output(arraySchema(entity))
      .errors('NOT_FOUND')
      .async()
      .build(),

    /**
     * Saves an item to the data source.
     *
     * @remarks
     * If the item already exists, it will be updated (upsert).
     *
     * @param item - The item to save.
     */
    save: n.contract()
      .input(entity)
      .async()
      .build(),

    /**
     * Deletes an item from the data source.
     *
     * @remarks
     * If the item does not exist, it will return a failure Result with code 'NOT_FOUND'.
     *
     * @param criteria - The criteria to delete the item.
     */
    delete: n.contract()
      .input(c)
      .errors('NOT_FOUND')
      .async()
      .build(),

    /**
     * Counts the number of items in the data source.
     *
     * @returns The number of items in the data source.
     */
    count: n.contract()
      .output(value(IsNumber()) as Value<number, never, true>)
      .async()
      .build(),

    /**
     * Returns all items from the data source.
     *
     * @returns Number of items in the data source.
     */
    all: n.contract()
      .output(arraySchema(entity))
      .async()
      .build(),

    /**
     * Checks if an item exists in the data source.
     *
     * @param criteria - The criteria to check if the item exists.
     * @returns True if the item exists, false otherwise.
     */
    exists: n.contract()
      .input(c)
      .output(value(IsBoolean()) as Value<boolean, never, true>)
      .async()
      .build(),
  });
};

/**
 * Repository component type.
 *
 * @typeParam E - The entity of the repository.
 * @typeParam C - The criteria of the repository.
 *
 * @public
 */
type Repository<
  S extends SchemaValues,
  C extends RepositoryCriteria<S>,
> = n.Component<
  typeof REPOSITORY_TAG,
  RepositoryBuilder<S, C>
>;

/**
 * Repository builder class that is used to build the repository.
 *
 * @internal
 */
class RepositoryBuilder<
  S extends SchemaValues,
  C extends RepositoryCriteria<S>,
> {
  /**
   * The data source to be used in the repository.
   */
  private ds: ReturnType<typeof createDataSource<S>>['Type'];

  /**
   * Creates a new repository builder and sets the entity, criteria and data source elements
   * to be used in the repository.
   *
   * @param entity - The entity to be used in the repository.
   * @param criteria - The criteria to be used in the repository.
   * @param ds - The data source to be used in the repository.
   */
  constructor(
    private readonly entity: Schema<S>,
    private readonly criteria: C,
    ds: ReturnType<typeof createDataSource<S>>['Type'],
  ) {
    this.ds = ds;
  }

  /**
   * Matches an item from the repository using the given criteria.
   *
   * @remarks
   * If the item does not exist, it will return a failure Result with code 'NOT_FOUND'.
   */
  public async match<K extends keyof C>(key: K, ...params: Parameters<C[K]>) {
    return await this.ds.match(this.criteria[key](...params));
  }

  /**
   * Matches all items from the repository using the given criteria.
   *
   * @remarks
   * If the items do not exist, it will return a failure Result with code 'NOT_FOUND'.
   */
  public async matchAll<K extends keyof C>(key: K, ...params: Parameters<C[K]>) {
    return await this.ds.matchAll(this.criteria[key](...params));
  }

  /**
   * Saves an item to the repository.
   *
   * @remarks
   * If the item already exists, it will be updated (upsert).
   */
  public async save(item: Schema<S>['Type']) {
    return await this.ds.save(item);
  }

  /**
   * Deletes an item from the repository.
   *
   * @remarks
   * If the item does not exist, it will return a failure Result with code 'NOT_FOUND'.
   *
   * @param criteria - The criteria to delete the item.
   */
  public async delete<K extends keyof C>(key: K, ...params: Parameters<C[K]>) {
    return await this.ds.delete(this.criteria[key](...params));
  }

  /**
   * Counts the number of items in the repository.
   *
   * @returns The number of items in the repository.
   */
  public async count() {
    return await this.ds.count();
  }

  /**
   * Returns all items from the repository.
   *
   * @returns All items from the repository.
   */
  public async all() {
    return await this.ds.all();
  }

  /**
   * Checks if an item exists in the repository.
   *
   * @param criteria - The criteria to check if the item exists.
   * @returns True if the item exists, false otherwise.
   */
  public async exists<K extends keyof C>(key: K, ...params: Parameters<C[K]>) {
    return await this.ds.exists(this.criteria[key](...params));
  }
}

/**
 * Creates a new repository builder and sets the entity, criteria and data source elements
 * to be used in the repository.
 *
 * @remarks
 * The repository builder is a {@link Component} that allows you to create a data access layer for
 * a specific entity. It is agnostic of the data source and the criteria, so you can use it with
 * different data sources and criteria.
 *
 * @returns A new repository builder.
 *
 * @public
 */
const repository = <
  S extends SchemaValues,
  C extends RepositoryCriteria<S>,
>(
  entity: Schema<S>,
  criteria: C,
): n.Provider<Repository<S, C>, { DataSource: ReturnType<typeof createDataSource<S>> }> => {
  // Data source type used in the repository.
  type DS = ReturnType<typeof createDataSource<S>>['Type'];

  // Data source to be used in the repository.
  const ds = createDataSource(entity);

  // Builds the repository using the data source adapter.
  const createRepository = (ds: DS) => {
    const repo = n.component(
      REPOSITORY_TAG,
      new RepositoryBuilder<S, C>(entity, criteria, ds),
    );

    n.meta(repo).children(entity, ...Object.values(criteria));

    return repo as Repository<S, C>;
  };

  // Builds the repository provider using the data source adapter.
  return n.provider()
    .use({ DataSource: ds })
    .provide(({ DataSource }) => createRepository(DataSource));
};

export { createDataSource, repository, RepositoryBuilder };
export type { Repository };
