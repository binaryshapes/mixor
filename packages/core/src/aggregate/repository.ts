/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Component, component, Panic } from '../system';
import type { Any } from '../utils';
import type { Criteria } from './criteria';

/**
 * Represents the entity related to a repository.
 *
 * @internal
 */
type RepositoryEntity = { Type: Any; Tag: 'Schema' };

/**
 * Represents the criteria related to a repository.
 *
 * @internal
 */
type RepositoryCriteria<E extends RepositoryEntity> = Record<
  string,
  // For now, we only support functions that return a Criteria object.
  (...args: Any[]) => Criteria<E>
>;

/**
 * Represents the data source related to a repository.
 *
 * @remarks
 * The data source is a class
 *
 * @public
 */
interface RepositoryDataSource<E extends RepositoryEntity> {
  match(criteria: Criteria<E['Type']>): E['Type'] | undefined;
  matchMany(criteria: Criteria<E['Type']>): E['Type'][];
  save(item: E['Type']): void;
  update(id: string, item: Partial<E['Type']>): E['Type'] | undefined;
  delete(id: string): boolean;
}

type Repository<E extends RepositoryEntity, C extends RepositoryCriteria<E>> = Component<
  'Repository',
  RepositoryBuilder<E, C> & RepositoryDataSource<E>
>;

class RepositoryPanic
  extends Panic<'Repository', 'NoEntity' | 'NoCriteria' | 'NoTransformer' | 'NoDataSource'>(
    'Repository',
  ) {}

class RepositoryBuilder<E extends RepositoryEntity, C extends RepositoryCriteria<E>> {
  private entity: E | undefined;
  public criteria: C | undefined;
  public ds: RepositoryDataSource<E> | undefined;

  public for<EE extends RepositoryEntity>(entity: EE) {
    this.entity = entity as unknown as E;
    return this as unknown as RepositoryBuilder<EE, C>;
  }

  public with<CC extends RepositoryCriteria<E>>(criteria: CC) {
    this.criteria = criteria as unknown as C;
    return this as unknown as RepositoryBuilder<E, CC>;
  }

  public dataSource<DS extends RepositoryDataSource<E>>(dataSource: DS) {
    this.ds = dataSource as unknown as RepositoryDataSource<E>;
    return this as unknown as RepositoryBuilder<E, C>;
  }

  public build() {
    if (!this.entity) {
      throw new RepositoryPanic('NoEntity', 'No entity provided');
    }

    if (!this.criteria) {
      throw new RepositoryPanic('NoCriteria', 'No criteria provided');
    }

    if (!this.ds) {
      throw new RepositoryPanic('NoDataSource', 'No data source provided');
    }

    return component('Repository', this) as unknown as Repository<E, C>;
  }

  public match<K extends keyof C>(key: K, ...params: Parameters<C[K]>) {
    if (!this.ds) {
      throw new RepositoryPanic('NoDataSource', 'No data source provided');
    }

    if (!this.criteria) {
      throw new RepositoryPanic('NoCriteria', 'No criteria provided');
    }

    return this.ds.match(this.criteria[key](params));
  }
}

// Single repository factory function that works with actual data types
const repository = () => new RepositoryBuilder();

export { repository, RepositoryBuilder };
export type { Repository, RepositoryDataSource };
