/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { AlreadyExists, NotFound, type Repository } from '@nuxo/components';
import { n } from '@nuxo/core';
import { count as drizzleCount, type SQL } from 'drizzle-orm';
import type { drizzle } from 'drizzle-orm/node-postgres';
import type { IndexColumn, PgTable } from 'drizzle-orm/pg-core';

import { DrizzleTransformer } from './drizzle-transformer.ts';
import {
  debugDrizzleError,
  DrizzlePostgresErrorCodes,
  getDrizzlePostgresErrorMessage,
} from './drizzle-utils.ts';

/**
 * Type for a function that maps field names to Drizzle column references.
 *
 * @typeParam T - The type of the entity that the criteria operates on.
 */
type ColumnMapper<T> = (field: keyof T) => SQL | unknown;

/**
 * Type for the return value of the drizzleDataSource function.
 *
 * @typeParam R - The Repository Provider type.
 */
type ReturnAdapter<R extends n.Provider<n.Any, { DataSource: n.Port<n.Any> }>> =
  R['DataSource'] extends n.Port<infer S> ? n.Adapter<
      {
        [K in keyof S]: n.Implementation<S[K]>;
      },
      S
    >
    : never;

const getTableKeys = (table: PgTable) => {
  let primaryKey: string | undefined;
  const uniqueKeys: string[] = [];

  for (const [name, col] of Object.entries(table)) {
    if ('config' in col) {
      const cfg = col.config;

      if (cfg.primaryKey) {
        primaryKey = name;
      }
      if (cfg.isUnique) {
        uniqueKeys.push(name);
      }
    }
  }

  return { primaryKey, uniqueKeys };
};

/**
 * Creates a generic Drizzle data source adapter for a repository.
 *
 * @remarks
 * This function creates a data source adapter that can be used with any repository
 * that uses Drizzle ORM. It handles all CRUD operations automatically.
 *
 * @typeParam R - The Repository Provider type.
 * @typeParam TTable - The Drizzle table type.
 * @param db - The Drizzle database connection.
 * @param table - The Drizzle table definition.
 * @param repository - The Repository Provider (e.g., UserRepository).
 * @returns A data source adapter that implements the repository's DataSource port.
 *
 * @public
 */
const DrizzlePostgresDataSource = <
  R extends n.Provider<n.Any, { DataSource: n.Port<n.Any> }>,
>(
  db: ReturnType<typeof drizzle>,
  table: PgTable,
  repository: R,
): ReturnAdapter<R> => {
  // Infer the type of the DataSource from the repository and Entity type.
  type D = R['Type'] extends Repository<infer S, infer C> ? Repository<S, C>['DataSource'] : never;
  type E = R['Type'] extends Repository<infer S, n.Any> ? S : never;
  type DbSelect = typeof table['$inferSelect'];
  type DbInsert = typeof table['$inferInsert'];

  // Extract the DataSource from the repository.
  const dataSource: D = repository.DataSource;

  // Automatic column mapper: maps field names to table columns.
  // Assumes field names match column names in the Drizzle table definition.
  const getColumn: ColumnMapper<E> = (field) => {
    const column = table[field as keyof typeof table];
    return (column as SQL) ?? null;
  };

  // Automatic dbRowToEntity: maps database fields to entity fields.
  // Simply returns the row as-is, filtering happens automatically via type system.
  const dbRowToEntity = (row: DbSelect): E => {
    return row as unknown as E;
  };

  // Automatic entityToDbRow: maps entity fields to database fields.
  // Simply returns the entity as-is, Drizzle will handle the mapping.
  const entityToDbRow = <E>(entity: E): DbInsert => {
    return entity as unknown as DbInsert;
  };

  const dataSourceAdapter = n.adapter(
    dataSource,
    {
      match: dataSource.match.implementation(async (criteria) => {
        const condition = DrizzleTransformer(criteria, getColumn);
        const result = await db.select().from(table).where(condition).limit(1);

        if (result.length === 0) {
          return n.err(new NotFound().as('$logic'));
        }

        return n.ok(dbRowToEntity(result[0]));
      }),

      matchAll: dataSource.matchAll.implementation(async (criteria) => {
        const condition = DrizzleTransformer(criteria, getColumn);
        const result = await db.select().from(table).where(condition);

        if (result.length === 0) {
          return n.err(new NotFound().as('$logic'));
        }

        return n.ok(result.map(dbRowToEntity));
      }),

      save: dataSource.save.implementation(async (item) => {
        const dbRow = entityToDbRow(item) as Record<string, unknown>;
        const { primaryKey } = getTableKeys(table);

        try {
          // Use upsert with onConflictDoUpdate for PostgreSQL/SQLite.
          // This is more efficient than SELECT + UPDATE/INSERT
          if (primaryKey) {
            const tableObj = table as unknown as Record<string, unknown>;
            const updateData: Record<string, unknown> = { ...dbRow };

            // Removing primary key from update data.
            delete updateData[primaryKey];

            // Always update updatedAt if it exists with current timestamp.
            // We want to update it to NOW, not use the excluded value.
            if ('updatedAt' in tableObj || 'updated_at' in tableObj) {
              updateData.updatedAt = new Date();
            }

            const conflictTargets = [
              ...(primaryKey ? [table[primaryKey as keyof typeof table] as IndexColumn] : []),
            ];

            // Perform upsert: insert or update on conflict.
            await db
              .insert(table)
              .values(dbRow)
              .onConflictDoUpdate({
                target: conflictTargets,
                set: updateData,
              });
          } else {
            // No primary key found, just insert (will fail if duplicate).
            await db.insert(table).values(dbRow);
          }

          return n.ok();
        } catch (error) {
          const e = getDrizzlePostgresErrorMessage(error);
          debugDrizzleError(e);

          if (e.code === DrizzlePostgresErrorCodes.UNIQUE_CONSTRAINT_ERROR_CODE) {
            return n.err(new AlreadyExists().as('$logic'));
          }

          throw error;
        }
      }),

      delete: dataSource.delete.implementation(async (criteria) => {
        const condition = DrizzleTransformer(criteria, getColumn);
        const existing = await db.select().from(table).where(condition).limit(1);

        if (existing.length === 0) {
          return n.err(new NotFound().as('$logic'));
        }

        await db.delete(table).where(condition);
        return n.ok();
      }),

      count: dataSource.count.implementation(async () => {
        const result = await db.select({ count: drizzleCount() }).from(table);
        return n.ok(result[0]?.count ?? 0);
      }),

      all: dataSource.all.implementation(async () => {
        const result = await db.select().from(table);
        return n.ok(result.map(dbRowToEntity));
      }),

      exists: dataSource.exists.implementation(async (criteria) => {
        const condition = DrizzleTransformer(criteria, getColumn);

        const result = await db
          .select({ count: drizzleCount() })
          .from(table)
          .where(condition);

        const count = result[0]?.count ?? 0;
        return n.ok(count > 0);
      }),
    },
  );

  return dataSourceAdapter as unknown as ReturnAdapter<R>;
};

export { DrizzlePostgresDataSource };
