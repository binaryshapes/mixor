/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Criteria } from '@nuxo/components';
import type { n } from '@nuxo/core';

/**
 * Transforms a criteria object into a function that can be used to filter an array of entities.
 *
 * @typeParam T - The type of the entity that the criteria operates on.
 * @param criteria - The criteria object to transform.
 * @returns A function that can be used to filter an entity.
 */
const InMemoryTransformer = <T>(criteria: Criteria<T>['Type']) => {
  const evaluateCriteria = (criteriaValue: n.Any, entity: T): boolean => {
    // Handle nested criteria objects (with value property)
    if (criteriaValue.value !== undefined) {
      return evaluateCriteria(criteriaValue.value, entity);
    }

    // Handle logical operators
    if (criteriaValue.$and) {
      return criteriaValue.$and.every((c: T) => evaluateCriteria(c, entity));
    }

    if (criteriaValue.$or) {
      return criteriaValue.$or.some((c: T) => evaluateCriteria(c, entity));
    }

    if (criteriaValue.$not) {
      return !evaluateCriteria(criteriaValue.$not, entity);
    }

    // Handle field criteria
    for (const [field, condition] of Object.entries(criteriaValue)) {
      if (field.startsWith('$')) continue; // Skip logical operators

      const userValue = entity[field as keyof typeof entity];

      if (typeof condition === 'object' && condition !== null) {
        // Handle operators like $gt, $contains, etc.
        for (const [operator, value] of Object.entries(condition)) {
          switch (operator) {
            case '$eq':
              if (userValue !== value) return false;
              break;
            case '$ne':
              if (userValue === value) return false;
              break;
            case '$gt':
              if (typeof userValue === 'number' && userValue <= value) return false;
              break;
            case '$gte':
              if (typeof userValue === 'number' && userValue < value) return false;
              break;
            case '$lt':
              if (typeof userValue === 'number' && userValue >= value) return false;
              break;
            case '$lte':
              if (typeof userValue === 'number' && userValue > value) return false;
              break;
            case '$contains':
              if (typeof userValue === 'string' && !userValue.includes(value)) return false;
              break;
            case '$startsWith':
              if (typeof userValue === 'string' && !userValue.startsWith(value)) return false;
              break;
            case '$endsWith':
              if (typeof userValue === 'string' && !userValue.endsWith(value)) return false;
              break;
            case '$in':
              if (Array.isArray(value) && !value.includes(userValue)) return false;
              break;
            case '$nin':
              if (Array.isArray(value) && value.includes(userValue)) return false;
              break;
            default:
              return false;
          }
        }
      } else {
        // Direct value comparison
        if (userValue !== condition) return false;
      }
    }

    return true;
  };

  return (entity: T) => evaluateCriteria(criteria.value, entity);
};

export { InMemoryTransformer };
