/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Criteria } from '@nuxo/components';
import { n } from '@nuxo/core';
import {
  and,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  like,
  lt,
  lte,
  ne,
  not,
  notInArray,
  or,
  type SQL,
} from 'drizzle-orm';

/**
 * Type for a function that maps field names to Drizzle column references.
 *
 * @typeParam T - The type of the entity that the criteria operates on.
 */
type ColumnMapper<T> = (field: keyof T) => SQL | unknown;

/**
 * Transforms a criteria object into a Drizzle SQL condition.
 *
 * @typeParam T - The type of the entity that the criteria operates on.
 * @param criteria - The criteria object to transform.
 * @param getColumn - A function that maps field names to Drizzle column references.
 * @returns A Drizzle SQL condition that can be used in `.where()` clauses.
 *
 * @public
 */
const DrizzleTransformer = <T>(
  criteria: Criteria<T>['Type'],
  getColumn: ColumnMapper<T>,
): SQL | undefined => {
  const evaluateCriteria = (criteriaValue: n.Any): SQL | undefined => {
    // Handle nested criteria objects (with value property)
    if (criteriaValue.value !== undefined) {
      return evaluateCriteria(criteriaValue.value);
    }

    // Handle logical operators
    if (criteriaValue.$and) {
      const conditions = criteriaValue.$and
        .map((c: n.Any) => evaluateCriteria(c))
        .filter((c: SQL | undefined): c is SQL => c !== undefined);
      return conditions.length > 0 ? and(...conditions) : undefined;
    }

    if (criteriaValue.$or) {
      const conditions = criteriaValue.$or
        .map((c: n.Any) => evaluateCriteria(c))
        .filter((c: SQL | undefined): c is SQL => c !== undefined);
      return conditions.length > 0 ? or(...conditions) : undefined;
    }

    if (criteriaValue.$not) {
      const condition = evaluateCriteria(criteriaValue.$not);
      return condition ? not(condition) : undefined;
    }

    // Handle field criteria
    const fieldConditions: SQL[] = [];

    for (const [field, condition] of Object.entries(criteriaValue)) {
      if (field.startsWith('$')) continue; // Skip logical operators

      const column = getColumn(field as keyof T);

      if (typeof condition === 'object' && condition !== null) {
        // Handle operators like $gt, $contains, etc.
        for (const [operator, value] of Object.entries(condition)) {
          switch (operator) {
            case '$eq':
              fieldConditions.push(eq(column as SQL, value));
              break;
            case '$ne':
              fieldConditions.push(ne(column as SQL, value));
              break;
            case '$gt':
              fieldConditions.push(gt(column as SQL, value));
              break;
            case '$gte':
              fieldConditions.push(gte(column as SQL, value));
              break;
            case '$lt':
              fieldConditions.push(lt(column as SQL, value));
              break;
            case '$lte':
              fieldConditions.push(lte(column as SQL, value));
              break;
            case '$contains':
              // SQL LIKE with %value%
              fieldConditions.push(ilike(column as SQL, `%${value}%`));
              break;
            case '$startsWith':
              // SQL LIKE with value%
              fieldConditions.push(ilike(column as SQL, `${value}%`));
              break;
            case '$endsWith':
              // SQL LIKE with %value
              fieldConditions.push(ilike(column as SQL, `%${value}`));
              break;
            case '$like':
              // Direct SQL LIKE pattern
              fieldConditions.push(like(column as SQL, value));
              break;
            case '$in':
              if (Array.isArray(value) && value.length > 0) {
                fieldConditions.push(inArray(column as SQL, value));
              }
              break;
            case '$nin':
              if (Array.isArray(value) && value.length > 0) {
                fieldConditions.push(notInArray(column as SQL, value));
              }
              break;
            default:
              // Unknown operator, skip
              n.logger.warn(`Unknown operator: ${operator}`);
              break;
          }
        }
      } else {
        // Direct value comparison (defaults to equality)
        fieldConditions.push(eq(column as SQL, condition));
      }
    }

    // Combine all field conditions with AND
    if (fieldConditions.length === 0) {
      return undefined;
    } else if (fieldConditions.length === 1) {
      return fieldConditions[0];
    } else {
      return and(...fieldConditions);
    }
  };

  return evaluateCriteria(criteria.value);
};

export { DrizzleTransformer };
