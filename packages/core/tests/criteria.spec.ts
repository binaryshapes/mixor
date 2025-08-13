import { describe, expect, it } from 'vitest';

import { CriteriaError, criteria } from '../src/criteria';

type User = {
  id: string;
  tags: ['founder', 'investor'];
  score: number;
  isActive: boolean;
  rating: number;
  createdAt: Date;
};

// Basic criteria.
const UserHasGreatScore = criteria<User>({
  score: { $gte: 90 },
}).meta({
  name: 'UserHasGreatScore',
  description: 'User has a great score',
  scope: 'User',
});

// Basic criteria.
const UserIsEarlyAdopter = criteria<User>({
  createdAt: { $lt: new Date('2023-03-01') },
}).meta({
  name: 'UserIsEarlyAdopter',
  description: 'User is an early adopter',
  scope: 'User',
});

// Basic criteria.
const UserIsInvestor = criteria<User>({
  tags: { $contains: 'founder' },
}).meta({
  name: 'UserIsInvestor',
  description: 'User is an investor',
  scope: 'User',
});

// Basic criteria.
const UserHasBadRating = criteria<User>({
  rating: { $lt: 2 },
}).meta({
  name: 'UserHasBadRating',
  description: 'User has a bad rating',
  scope: 'User',
});

// Composed criteria.
const UserTargetCampaign = criteria<User>({
  $or: [UserIsEarlyAdopter, UserIsInvestor],
}).meta({
  name: 'UserTargetCampaign',
  description: 'User target campaign',
  scope: 'User',
});

// Composed criteria.
const SelectedUserForContest = criteria<User>({
  $and: [
    UserHasGreatScore,
    UserTargetCampaign,
    { $not: UserHasBadRating },
  ],
}).meta({
  name: 'SelectedUserForContest',
  description: 'Selected user for contest logic improved',
  scope: 'User',
});

describe('Criteria', () => {
  describe('Public API', () => {
    it('should create a criteria object with correct metadata', () => {
      expect(UserHasGreatScore.info().meta?.scope).toBe('User');
      expect(UserHasGreatScore.info().meta?.name).toBe('UserHasGreatScore');
      expect(UserHasGreatScore.info().meta?.description).toBe('User has a great score');

      expect(UserIsEarlyAdopter.value).toEqual({
        createdAt: { $lt: new Date('2023-03-01') },
      });

      expect(UserIsInvestor.value).toEqual({
        tags: { $contains: 'founder' },
      });

      expect(UserHasBadRating.value).toEqual({
        rating: { $lt: 2 },
      });

      expect(UserTargetCampaign.value).toEqual({
        $or: [UserIsEarlyAdopter.value, UserIsInvestor.value],
      });
    });

    it('should create a composed criteria from other criterias', () => {
      // Simple composed criteria.
      expect(UserTargetCampaign.value).toEqual({
        $or: [UserIsEarlyAdopter.value, UserIsInvestor.value],
      });

      // Complex composed criteria.
      expect(SelectedUserForContest.value).toEqual({
        $and: [
          UserHasGreatScore.value,
          UserTargetCampaign.value,
          { $not: UserHasBadRating.value },
        ],
      });
    });

    it('should auto-generate the children nodes for the criteria', () => {
      // Simple composed criteria.
      const info = UserTargetCampaign.info();
      expect(info.id).toBeDefined();
      expect(info.tag).toBe('Criteria');
      expect(info.category).toBe('object');
      expect(info.traceable).toBe(false);
      expect(info.injectable).toBe(true);
      expect(info.meta).toBeDefined();
      expect(info.subType).toBe(null);
      expect(info.childrenIds.length).toBe(2);
      expect(info.childrenIds[0]).toBeDefined();
      expect(info.childrenIds[0]).toBe(UserIsEarlyAdopter.info().id);
      expect(info.childrenIds[1]).toBe(UserIsInvestor.info().id);

      // Complex composed criteria.
      const info2 = SelectedUserForContest.info();
      expect(info2.id).toBeDefined();
      expect(info2.tag).toBe('Criteria');
      expect(info2.category).toBe('object');
      expect(info2.traceable).toBe(false);
      expect(info2.injectable).toBe(true);
      expect(info2.meta).toBeDefined();
      expect(info2.subType).toBe(null);
      expect(info2.childrenIds.length).toBe(3);
      expect(info2.childrenIds[0]).toBeDefined();
      expect(info2.childrenIds[0]).toBe(UserHasGreatScore.info().id);
      expect(info2.childrenIds[1]).toBe(UserTargetCampaign.info().id);
      expect(info2.childrenIds[2]).toBe(UserHasBadRating.info().id);
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should throw an error if the criteria definition is not valid', () => {
      // @ts-expect-error - A primitive value is not a valid criteria definition.
      expect(() => criteria<User>('hello')).toThrow(CriteriaError);

      // @ts-expect-error - An empty object is not a valid criteria definition.
      expect(() => criteria<User>({})).toThrow(CriteriaError);

      // @ts-expect-error - An array is not a valid criteria definition.
      expect(() => criteria<User>([])).toThrow(CriteriaError);

      // @ts-expect-error - Null is not a valid criteria definition.
      expect(() => criteria<User>(null)).toThrow(CriteriaError);

      // @ts-expect-error - Undefined is not a valid criteria definition.
      expect(() => criteria<User>(undefined)).toThrow(CriteriaError);
    });
  });
});
