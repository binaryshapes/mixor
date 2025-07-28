import { describe, expect, expectTypeOf, it } from 'vitest';

import { type Criteria, type CriteriaBuilder, criteria } from '../src/criteria';

type User = {
  id: string;
  tags: string[];
  score: number;
  isActive: boolean;
  rating: number;
  createdAt: Date;
};

describe('Criteria', () => {
  describe('Basic functionality', () => {
    it('should create individual criteria', () => {
      const UserHasGreatScore = criteria<User>({
        score: { $gte: 90 },
      }).build();

      expect(UserHasGreatScore).toEqual({
        score: { $gte: 90 },
      });
    });

    it('should compose criteria with AND logic', () => {
      const composedCriteria = criteria<User>({ score: { $gte: 90 } })
        .and({ rating: { $gte: 4 } })
        .build();

      expect(composedCriteria).toEqual({
        $and: [
          { score: { $gte: 90 } },
          { rating: { $gte: 4 } },
        ],
      });
    });

    it('should compose criteria with OR logic', () => {
      const composedCriteria = criteria<User>({ score: { $gte: 90 } })
        .or({ rating: { $gte: 4 } })
        .build();

      expect(composedCriteria).toEqual({
        $or: [
          { score: { $gte: 90 } },
          { rating: { $gte: 4 } },
        ],
      });
    });

    it('should negate criteria', () => {
      const negatedCriteria = criteria<User>({ score: { $lt: 50 } })
        .not()
        .build();

      expect(negatedCriteria).toEqual({
        $not: { score: { $lt: 50 } },
      });
    });

    it('should handle empty criteria', () => {
      const emptyCriteria = criteria<User>({}).build();
      expect(emptyCriteria).toEqual({});
    });

    it('should handle multiple operations', () => {
      const complexCriteria = criteria<User>({ score: { $gte: 90 } })
        .and({ rating: { $gte: 4 } })
        .and({ isActive: true })
        .build();

      expect(complexCriteria).toEqual({
        $and: [
          { score: { $gte: 90 } },
          { rating: { $gte: 4 } },
          { isActive: true },
        ],
      });
    });

    it('should handle AND composition with existing $and criteria', () => {
      // Create a criteria that already has $and
      const existingAndCriteria = criteria<User>({ score: { $gte: 90 } })
        .and({ rating: { $gte: 4 } })
        .build();

      // Compose with another criteria that also has $and
      const additionalAndCriteria = criteria<User>({ isActive: true })
        .and({ tags: { $contains: 'vip' } })
        .build();

      const result = criteria(existingAndCriteria).and(additionalAndCriteria).build();

      expect(result).toEqual({
        $and: [
          { score: { $gte: 90 } },
          { rating: { $gte: 4 } },
          { isActive: true },
          { tags: { $contains: 'vip' } },
        ],
      });
    });

    it('should handle OR composition with existing $or criteria', () => {
      // Create a criteria that already has $or
      const existingOrCriteria = criteria<User>({ score: { $gte: 90 } })
        .or({ rating: { $gte: 4 } })
        .build();

      // Compose with another criteria that also has $or
      const additionalOrCriteria = criteria<User>({ isActive: true })
        .or({ tags: { $contains: 'vip' } })
        .build();

      const result = criteria(existingOrCriteria).or(additionalOrCriteria).build();

      expect(result).toEqual({
        $or: [
          { score: { $gte: 90 } },
          { rating: { $gte: 4 } },
          { isActive: true },
          { tags: { $contains: 'vip' } },
        ],
      });
    });

    it('should handle mixed composition with existing logical operators', () => {
      // Create a criteria with existing $and
      const existingAndCriteria = criteria<User>({ score: { $gte: 90 } })
        .and({ rating: { $gte: 4 } })
        .build();

      // Create a criteria with existing $or
      const existingOrCriteria = criteria<User>({ isActive: true })
        .or({ tags: { $contains: 'vip' } })
        .build();

      // Compose them together
      const result = criteria(existingAndCriteria).and(existingOrCriteria).build();

      expect(result).toEqual({
        $and: [
          { score: { $gte: 90 } },
          { rating: { $gte: 4 } },
          {
            $or: [
              { isActive: true },
              { tags: { $contains: 'vip' } },
            ],
          },
        ],
      });
    });
  });

  describe('Type safety', () => {
    it('should provide correct type inference for all public elements', () => {
      // Test the main criteria function
      expectTypeOf(criteria).toBeFunction();
      expectTypeOf(criteria<User>({ score: { $gte: 90 } })).toBeObject();
      expectTypeOf(criteria<User>({ score: { $gte: 90 } }).build()).toBeObject();

      // Test CriteriaBuilder interface
      const builder = criteria<User>({ score: { $gte: 90 } });
      expectTypeOf(builder.and).toBeFunction();
      expectTypeOf(builder.or).toBeFunction();
      expectTypeOf(builder.not).toBeFunction();
      expectTypeOf(builder.build).toBeFunction();

      // Test type parameters
      expectTypeOf<Criteria<User>>().toBeObject();
      expectTypeOf<CriteriaBuilder<User>>().toBeObject();
    });

    it('should validate generic type constraints', () => {
      // Test generic function with different types
      expectTypeOf(criteria<User>).toBeFunction();
      expectTypeOf(criteria<User>({ score: { $gte: 90 } })).toBeObject();

      // Test builder methods with generics
      const builder = criteria<User>({ score: { $gte: 90 } });
      expectTypeOf(builder.and({ rating: { $gte: 4 } })).toBeObject();
      expectTypeOf(builder.or({ tags: { $contains: 'vip' } })).toBeObject();
      expectTypeOf(builder.not()).toBeObject();
    });

    it('should validate field operators type safety', () => {
      // Test string operators
      expectTypeOf(criteria<User>({ tags: { $contains: 'vip' } })).toBeObject();
      expectTypeOf(criteria<User>({ tags: { $containsAny: ['premium'] } })).toBeObject();

      // Test number operators
      expectTypeOf(criteria<User>({ score: { $gte: 90, $lt: 100 } })).toBeObject();
      expectTypeOf(criteria<User>({ rating: { $eq: 5 } })).toBeObject();

      // Test boolean operators
      expectTypeOf(criteria<User>({ isActive: { $eq: true } })).toBeObject();

      // Test date operators
      expectTypeOf(criteria<User>({ createdAt: { $gt: new Date() } })).toBeObject();

      // Test array operators
      expectTypeOf(criteria<User>({ tags: { $containsAny: ['vip', 'premium'] } })).toBeObject();
    });

    it('should validate complex nested criteria types', () => {
      const complexCriteria = criteria<User>({ score: { $gte: 70 } })
        .and({ rating: { $gte: 3 } })
        .or({ tags: { $contains: 'vip' } })
        .and({ isActive: true })
        .build();

      expectTypeOf(complexCriteria).toBeObject();
    });
  });

  describe('Code examples', () => {
    it('should run example criteria-001: Creating individual criteria', () => {
      const UserHasGreatScore = criteria<User>({
        score: { $gte: 90 },
      }).build();

      const UserIsEarlyAdopter = criteria<User>({
        createdAt: { $lt: new Date('2023-03-01') },
      }).build();

      const UserIsInvestor = criteria<User>({
        tags: { $contains: 'founder' },
      }).build();

      const UserHasBadRating = criteria<User>({
        rating: { $lt: 2 },
      }).build();

      expect(UserHasGreatScore).toEqual({
        score: { $gte: 90 },
      });

      expect(UserIsEarlyAdopter).toEqual({
        createdAt: { $lt: new Date('2023-03-01') },
      });

      expect(UserIsInvestor).toEqual({
        tags: { $contains: 'founder' },
      });

      expect(UserHasBadRating).toEqual({
        rating: { $lt: 2 },
      });
    });

    it('should run example criteria-002: Composing existing criteria', () => {
      const UserHasGreatScore = criteria<User>({
        score: { $gte: 90 },
      }).build();

      const UserIsEarlyAdopter = criteria<User>({
        createdAt: { $lt: new Date('2023-03-01') },
      }).build();

      const UserIsInvestor = criteria<User>({
        tags: { $contains: 'founder' },
      }).build();

      const UserHasBadRating = criteria<User>({
        rating: { $lt: 2 },
      }).build();

      const SelectedUserForContest = criteria(UserHasGreatScore)
        .and(UserIsEarlyAdopter)
        .or(UserIsInvestor)
        .and(criteria(UserHasBadRating).not().build())
        .build();

      expect(SelectedUserForContest).toEqual({
        $and: [
          {
            $or: [
              {
                $and: [
                  {
                    score: { $gte: 90 },
                  },
                  {
                    createdAt: { $lt: new Date('2023-03-01') },
                  },
                ],
              },
              {
                tags: { $contains: 'founder' },
              },
            ],
          },
          {
            $not: {
              rating: { $lt: 2 },
            },
          },
        ],
      });
    });

    it('should run example criteria-003: Complex chaining with multiple operations', () => {
      const ComplexCriteria = criteria<User>({
        score: { $gte: 70 },
      })
        .and({ rating: { $gte: 3 } })
        .or({ tags: { $contains: 'vip' } })
        .and({ isActive: true })
        .build();

      expect(ComplexCriteria).toEqual({
        $and: [
          {
            $or: [
              {
                $and: [
                  {
                    score: { $gte: 70 },
                  },
                  {
                    rating: { $gte: 3 },
                  },
                ],
              },
              {
                tags: { $contains: 'vip' },
              },
            ],
          },
          {
            isActive: true,
          },
        ],
      });
    });

    it('should run example criteria-004: Negation example', () => {
      const NegatedCriteria = criteria<User>({
        score: { $lt: 50 },
      })
        .not()
        .build();

      expect(NegatedCriteria).toEqual({
        $not: {
          score: { $lt: 50 },
        },
      });
    });

    it('should run example criteria-005: Advanced composition with nested operations', () => {
      const AdvancedCriteria = criteria<User>({
        score: { $gte: 60 },
      })
        .and({ rating: { $gte: 4 } })
        .or({ tags: { $contains: 'premium' } })
        .and({ isActive: true })
        .not()
        .build();

      expect(AdvancedCriteria).toEqual({
        $not: {
          $and: [
            {
              $or: [
                {
                  $and: [
                    {
                      score: { $gte: 60 },
                    },
                    {
                      rating: { $gte: 4 },
                    },
                  ],
                },
                {
                  tags: { $contains: 'premium' },
                },
              ],
            },
            {
              isActive: true,
            },
          ],
        },
      });
    });
  });
});
