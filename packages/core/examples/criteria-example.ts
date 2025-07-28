import { criteria } from '../src/criteria';

type User = {
  id: string;
  tags: string[];
  score: number;
  isActive: boolean;
  rating: number;
  createdAt: Date;
};

/**
 * criteria-001: Creating individual criteria.
 */
function criteriaIndividualCreation() {
  console.log('\ncriteria-001: Creating individual criteria.');

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

  console.log('UserHasGreatScore:', JSON.stringify(UserHasGreatScore, null, 2));
  console.log('UserIsEarlyAdopter:', JSON.stringify(UserIsEarlyAdopter, null, 2));
  console.log('UserIsInvestor:', JSON.stringify(UserIsInvestor, null, 2));
  console.log('UserHasBadRating:', JSON.stringify(UserHasBadRating, null, 2));
}

/**
 * criteria-002: Composing existing criteria.
 */
function criteriaComposition() {
  console.log('\ncriteria-002: Composing existing criteria.');

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

  console.log('SelectedUserForContest:', JSON.stringify(SelectedUserForContest, null, 2));
}

/**
 * criteria-003: Complex chaining with multiple operations.
 */
function criteriaComplexChaining() {
  console.log('\ncriteria-003: Complex chaining with multiple operations.');

  const ComplexCriteria = criteria<User>({
    score: { $gte: 70 },
  })
    .and({ rating: { $gte: 3 } })
    .or({ tags: { $contains: 'vip' } })
    .and({ isActive: true })
    .build();

  console.log('ComplexCriteria:', JSON.stringify(ComplexCriteria, null, 2));
}

/**
 * criteria-004: Negation example.
 */
function criteriaNegation() {
  console.log('\ncriteria-004: Negation example.');

  const NegatedCriteria = criteria<User>({
    score: { $lt: 50 },
  })
    .not()
    .build();

  console.log('NegatedCriteria:', JSON.stringify(NegatedCriteria, null, 2));
}

/**
 * criteria-005: Advanced composition with nested operations.
 */
function criteriaAdvancedComposition() {
  console.log('\ncriteria-005: Advanced composition with nested operations.');

  const AdvancedCriteria = criteria<User>({
    score: { $gte: 60 },
  })
    .and({ rating: { $gte: 4 } })
    .or({ tags: { $contains: 'premium' } })
    .and({ isActive: true })
    .not()
    .build();

  console.log('AdvancedCriteria:', JSON.stringify(AdvancedCriteria, null, 2));
}

// Execute all examples
criteriaIndividualCreation();
criteriaComposition();
criteriaComplexChaining();
criteriaNegation();
criteriaAdvancedComposition();
