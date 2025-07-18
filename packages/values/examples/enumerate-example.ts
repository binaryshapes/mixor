/* eslint-disable jsdoc/require-jsdoc */
/*
 * Example usage of the enum functionality
 * This demonstrates both styles: from string array and from native enum
 */
import { EnumerateError, enumerate } from '../src/enumerate';

// *********************************************************************************************
// Enum example with arrays.
// *********************************************************************************************

function arrayEnumExample() {
  console.log('1. Array enum example:');
  // String enum example with arrays
  const status = enumerate(['active', 'inactive', 'unverified']);

  // Good
  const s1 = status('active'); // ok('active')
  console.log(s1);

  // Bad
  // @ts-expect-error - Invalid value.
  const s2 = status('deleted'); // err('INVALID_ENUM_VALUE')
  console.log(s2);

  // Number enum example with arrays
  const priority = enumerate([1, 2, 3, 4, 5]);

  // Good
  const p1 = priority(3); // ok(3)
  console.log(p1);

  // Bad
  // @ts-expect-error - Invalid value.
  const p2 = priority(10); // err('INVALID_ENUM_VALUE')
  console.log(p2);

  // Test empty enum validation
  try {
    enumerate([]);
    console.log('This should not be reached');
  } catch (error) {
    if (error instanceof EnumerateError) {
      console.log('Panic caught:', error.message);
      console.log('Error key:', error.key);
    }
  }

  // Test duplicate values validation
  try {
    enumerate(['active', 'inactive', 'active']);
    console.log('This should not be reached');
  } catch (error) {
    if (error instanceof EnumerateError) {
      console.log('Duplicate validation caught:', error.message);
      console.log('Error key:', error.key);
    }
  }

  // Test mixed types validation
  try {
    enumerate(['active', 123]);
    console.log('This should not be reached');
  } catch (error) {
    if (error instanceof EnumerateError) {
      console.log('Mixed types validation caught:', error.message);
      console.log('Error key:', error.key);
    }
  }
}

// *********************************************************************************************
// Native TypeScript enum.
// *********************************************************************************************

function typescriptEnumExample() {
  console.log('\n2.Typescript enum example:');
  // TypeScript enum examples (string only)
  enum Status {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    PENDING = 'pending',
  }

  enum Priority {
    LOW = 1,
    MEDIUM = 2,
    HIGH = 3,
  }

  const statusEnum = enumerate(Status);

  // Good.
  const se1 = statusEnum(Status.ACTIVE); // ok('active')
  console.log(se1);

  // Bad.
  // @ts-expect-error - Invalid value.
  const se2 = statusEnum(Priority.LOW); // err('INVALID_ENUM_VALUE')
  console.log(se2);

  const priorityEnum = enumerate(Priority);

  // Good.
  const pe1 = priorityEnum(Priority.MEDIUM); // ok(2)
  console.log(pe1);

  // Bad.
  // @ts-expect-error - Invalid value.
  const pe2 = priorityEnum(Status.ACTIVE); // err('INVALID_ENUM_VALUE')
  console.log(pe2);

  enum MixedEnum {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    PENDING = 'pending',
    LOW = 1,
    MEDIUM = 2,
    HIGH = 3,
  }

  // Test empty enum validation
  try {
    enumerate({});
    console.log('This should not be reached');
  } catch (error) {
    if (error instanceof EnumerateError) {
      console.log('Panic caught:', error.message);
      console.log('Error key:', error.key);
    }
  }

  // Test duplicate values validation
  try {
    enumerate({
      ACTIVE: 'active',
      INACTIVE: 'inactive',
      DUPLICATE: 'active',
    });
    console.log('This should not be reached');
  } catch (error) {
    if (error instanceof EnumerateError) {
      console.log('Duplicate validation caught:', error.message);
      console.log('Error key:', error.key);
    }
  }

  try {
    enumerate(MixedEnum);
    console.log('This should not be reached');
  } catch (error) {
    if (error instanceof EnumerateError) {
      console.log('Mixed enum validation caught:', error.message);
      console.log('Error key:', error.key);
    }
  }
}

arrayEnumExample();
typescriptEnumExample();
