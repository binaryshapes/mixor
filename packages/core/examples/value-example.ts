import { err, isErr, isOk, ok, unwrap } from '../src/result';
import { isValue, value } from '../src/value';

/**
 * value-001: Basic value validation.
 */
function valueBasicValidation() {
  console.log('\nvalue-001: Basic value validation.');
  const nameValue = value((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')));
  // nameValue: Value<string, 'EMPTY_NAME'>
  const result = nameValue('John');

  if (isOk(result)) {
    console.log('Success:', unwrap(result));
  } else {
    console.log('Error:', unwrap(result));
  }
}

/**
 * value-002: Value validation with documentation.
 */
function valueValidationWithDocumentation() {
  console.log('\nvalue-002: Value validation with documentation.');
  const ageValue = value('User age must be at least 18 years old', (age: number) =>
    age >= 18 ? ok(age) : err('INVALID_AGE'),
  );
  // ageValue: Value<number, 'INVALID_AGE'>
  const result = ageValue(21);

  if (isOk(result)) {
    console.log('Success:', unwrap(result));
  } else {
    console.log('Error:', unwrap(result));
  }
}

/**
 * value-003: Complex value validation with multiple checks.
 */
function valueComplexValidation() {
  console.log('\nvalue-003: Complex value validation with multiple checks.');
  const emailValue = value('Email address validation', (email: string) => {
    if (!email.includes('@')) return err('INVALID_EMAIL');
    if (email.length < 5) return err('EMAIL_TOO_SHORT');
    return ok(email);
  });
  // emailValue: Value<string, 'INVALID_EMAIL' | 'EMAIL_TOO_SHORT'>

  const validEmail = emailValue('user@example.com');
  const invalidEmail = emailValue('invalid');

  if (isOk(validEmail)) {
    console.log('Valid email:', unwrap(validEmail));
  } else {
    console.log('Email error:', unwrap(validEmail));
  }

  if (isErr(invalidEmail)) {
    console.log('Invalid email error:', unwrap(invalidEmail));
  }
}

/**
 * value-004: Value validation with type safety and bounds.
 */
function valueTypeSafetyAndBounds() {
  console.log('\nvalue-004: Value validation with type safety and bounds.');
  const ageValue = value('Age validation with bounds', (age: number) => {
    if (age < 0) return err('NEGATIVE_AGE');
    if (age > 150) return err('AGE_TOO_HIGH');
    return ok(age);
  });
  // ageValue: Value<number, 'NEGATIVE_AGE' | 'AGE_TOO_HIGH'>

  const result = ageValue(25);

  if (isOk(result)) {
    console.log('Valid age:', unwrap(result));
  } else {
    console.log('Age error:', unwrap(result));
  }
}

/**
 * value-005: Value validation with custom error types.
 */
function valueCustomErrorTypes() {
  console.log('\nvalue-005: Value validation with custom error types.');
  const emailValue = value('Email format validation', (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? ok(email) : err('INVALID_EMAIL_FORMAT');
  });
  // emailValue: Value<string, 'INVALID_EMAIL_FORMAT'>

  const validEmail = emailValue('user@example.com');
  const invalidEmail = emailValue('invalid-email');

  if (isOk(validEmail)) {
    console.log('Valid email format:', unwrap(validEmail));
  } else {
    console.log('Email format error:', unwrap(validEmail));
  }

  if (isErr(invalidEmail)) {
    console.log('Invalid email format error:', unwrap(invalidEmail));
  }
}

/**
 * value-006: Check if a value is a value wrapper.
 */
function valueCheckIsValueWrapper() {
  console.log('\nvalue-006: Check if a value is a value wrapper.');
  const ageValue = value((age: number) => (age >= 18 ? ok(age) : err('INVALID_AGE')));
  // ageValue: Value<number, 'INVALID_AGE'>
  const isAgeValue = isValue(ageValue);

  console.log('Is age value wrapper:', isAgeValue);
}

/**
 * value-007: Check if a regular function is not a value wrapper.
 */
function valueCheckRegularFunction() {
  console.log('\nvalue-007: Check if a regular function is not a value wrapper.');
  const regularFunction = (age: number) => (age >= 18 ? ok(age) : err('INVALID_AGE'));
  const isValueWrapper = isValue(regularFunction);

  console.log('Is regular function a value wrapper:', isValueWrapper);
}

/**
 * value-008: Check if other types are not value wrappers.
 */
function valueCheckOtherTypes() {
  console.log('\nvalue-008: Check if other types are not value wrappers.');
  const string = 'hello';
  const number = 42;
  const object = { age: 18 };

  const isStringValue = isValue(string);
  const isNumberValue = isValue(number);
  const isObjectValue = isValue(object);

  console.log('Is string a value wrapper:', isStringValue);
  console.log('Is number a value wrapper:', isNumberValue);
  console.log('Is object a value wrapper:', isObjectValue);
}

// Execute all examples
valueBasicValidation();
valueValidationWithDocumentation();
valueComplexValidation();
valueTypeSafetyAndBounds();
valueCustomErrorTypes();
valueCheckIsValueWrapper();
valueCheckRegularFunction();
valueCheckOtherTypes();
