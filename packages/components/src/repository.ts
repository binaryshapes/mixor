/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { n } from '@nuxo/core';

import type { Criteria } from './criteria.ts';

/**
 * The tag for the repository component.
 *
 * @internal
 */
const REPOSITORY_TAG = 'Repository' as const;

/**
 * Represents the entity related to a repository.
 *
 * @internal
 */
type RepositoryEntity = { Type: n.Any; Tag: 'Schema' };

/**
 * Represents the criteria related to a repository.
 *
 * @internal
 */
type RepositoryCriteria<E extends RepositoryEntity> = Record<
  string,
  Criteria<E['Type'], n.Any[]>
>;

/**
 * Represents the data source related to a repository.
 *
 * @remarks
 * The data source is a interface that must be implemented by the data source. For instance, you
 * can create data sources for different databases (like postgres, mysql, etc.) or ORMs
 * (like Prisma, TypeORM, Drizzle, Convex, Mongoose, etc ).
 *
 * @public
 */
interface RepositoryDataSource<E extends RepositoryEntity> {
  /**
   * Matches an item from the data source.
   *
   * @remarks
   * If the item does not exist, it will return undefined.
   *
   * @param criteria - The criteria to match the item.
   * @returns The item if it matches the criteria, undefined otherwise.
   */
  match(criteria: Criteria<E['Type'], n.Any[]>): E['Type'] | undefined;

  /**
   * Matches all items from the data source.
   *
   * @remarks
   * If the items do not exist, it will return an empty array.
   */
  matchAll(criteria: Criteria<E['Type'], n.Any[]>): E['Type'][];

  /**
   * Saves an item to the data source.
   *
   * @remarks
   * If the item already exists, it will be updated (upsert).
   *
   * @param item - The item to save.
   * @returns True if the item was saved, false otherwise.
   */
  save(item: E['Type']): boolean;

  /**
   * Deletes an item from the data source.
   *
   * @remarks
   * If the item does not exist, it will return false.
   *
   * @param criteria - The criteria to delete the item.
   * @returns True if the item was deleted, false otherwise.
   */
  delete(criteria: Criteria<E['Type'], n.Any[]>): boolean;

  /**
   * Counts the number of items in the data source.
   *
   * @remarks
   * If the data source does not support counting, it will return an error.
   *
   * @returns The number of items in the data source.
   */
  count(): number;

  /**
   * Returns all items from the data source.
   *
   * @returns All items from the data source.
   */
  all(): E['Type'][];
}

/**
 * Repository component type.
 *
 * @typeParam E - The entity of the repository.
 * @typeParam C - The criteria of the repository.
 *
 * @public
 */
type Repository<E extends RepositoryEntity, C extends RepositoryCriteria<E>> = n.Component<
  typeof REPOSITORY_TAG,
  RepositoryBuilder<E, C> & RepositoryDataSource<E>
>;

/**
 * Panic error for the repository module.
 *
 * @public
 */
class RepositoryPanic
  extends n.panic<typeof REPOSITORY_TAG, 'DataSourceNotFound'>(REPOSITORY_TAG) {}

/**
 * Repository builder class that is used to build the repository.
 *
 * @internal
 */
class RepositoryBuilder<E extends RepositoryEntity, C extends RepositoryCriteria<E>> {
  /**
   * The data source to be used in the repository.
   */
  private ds: RepositoryDataSource<E> | undefined;

  /**
   * Creates a new repository builder and sets the entity, criteria and data source elements
   * to be used in the repository.
   *
   * @param entity - The entity to be used in the repository.
   * @param criteria - The criteria to be used in the repository.
   * @param ds - The data source to be used in the repository.
   */
  constructor(
    private readonly entity: E,
    private readonly criteria: C,
  ) {}

  public dataSource(ds: RepositoryDataSource<E>) {
    this.ds = ds;
    return this as unknown as Repository<E, C>;
  }

  public match<K extends keyof C>(key: K, ...params: Parameters<C[K]>) {
    if (!this.ds) {
      throw new RepositoryPanic('DataSourceNotFound', 'Data source not found');
    }

    return this.ds.match(this.criteria[key](...params) as Criteria<E['Type'], n.Any[]>);
  }

  public matchAll<K extends keyof C>(key: K, ...params: Parameters<C[K]>) {
    if (!this.ds) {
      throw new RepositoryPanic('DataSourceNotFound', 'Data source not found');
    }

    return this.ds.matchAll(this.criteria[key](...params) as Criteria<E['Type'], n.Any[]>);
  }

  public save(item: E['Type']) {
    if (!this.ds) {
      throw new RepositoryPanic('DataSourceNotFound', 'Data source not found');
    }

    return this.ds.save(item);
  }

  public delete(criteria: Criteria<E['Type'], n.Any[]>) {
    if (!this.ds) {
      throw new RepositoryPanic('DataSourceNotFound', 'Data source not found');
    }

    return this.ds.delete(criteria);
  }

  public count() {
    if (!this.ds) {
      throw new RepositoryPanic('DataSourceNotFound', 'Data source not found');
    }

    return this.ds.count();
  }

  public all() {
    if (!this.ds) {
      throw new RepositoryPanic('DataSourceNotFound', 'Data source not found');
    }

    return this.ds.all();
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
const repository = <E extends RepositoryEntity, C extends RepositoryCriteria<E>>(
  entity: E,
  criteria: C,
) => {
  const repositoryComponent = n.component(
    REPOSITORY_TAG,
    new RepositoryBuilder<E, C>(entity, criteria),
  );

  // Adding the entity and criteria as children of the repository component.
  n.meta(repositoryComponent).children(entity, ...Object.values(criteria));

  return repositoryComponent as Repository<E, C>;
};

export { repository, RepositoryBuilder };
export type { Repository, RepositoryDataSource };
