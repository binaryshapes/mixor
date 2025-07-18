/*
 * Example usage of the enum functionality
 * This demonstrates both styles: from string array and from native enum
 */
import { EnumerateError, enumerate } from '../src/enumerate';

// String enum example
const status = enumerate(['active', 'inactive', 'not-verified']);

// Good
const s1 = status('active'); // ok('active')
console.log(s1);

// Bad
// @ts-expect-error - Invalid value.
const s2 = status('deleted'); // err('INVALID_ENUM_VALUE')
console.log(s2);

// Good
const s3 = status('not-verified'); // ok('not-verified')
console.log(s3);

// Number enum example
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
