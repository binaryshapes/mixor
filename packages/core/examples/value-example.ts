import { err, isOk, ok } from '../src/result';
import { traceInfo, tracer } from '../src/trace';
import { rule, value } from '../src/value';

tracer.on('perf', (event) => {
  console.log('NEW PERFORMANCE EVENT -----> ', event);
});

/**
 * value-001: Basic rule creation for string validation.
 */
function valueBasicRuleExample() {
  console.log('\nvalue-001: Basic rule creation for string validation.');

  const EmailNotEmpty = rule((email: string) =>
    email.length > 0 ? ok(email) : err('EMPTY_EMAIL'),
  );

  const result = EmailNotEmpty('test@example.com');
  console.log('Result:', result);
  console.log('Result type:', typeof result);
}

/**
 * value-002: Rule with custom error handling.
 */
function valueRuleErrorHandlingExample() {
  console.log('\nvalue-002: Rule with custom error handling.');

  const EmailShouldBeCorporate = rule((email: string) =>
    email.includes('@company.com') ? ok(email) : err('NOT_CORPORATE'),
  );

  const result = EmailShouldBeCorporate('user@company.com');
  console.log('Result:', result);
  console.log('Result type:', typeof result);
}

/**
 * value-003: Basic value validation with multiple rules.
 */
function valueBasicValidationExample() {
  console.log('\nvalue-003: Basic value validation with multiple rules.');

  const EmailNotEmpty = rule((email: string) =>
    email.length > 0 ? ok(email) : err('EMPTY_EMAIL'),
  );
  const EmailShouldBeCorporate = rule((email: string) =>
    email.includes('@company.com') ? ok(email) : err('NOT_CORPORATE'),
  );

  const UserEmail = value(EmailNotEmpty, EmailShouldBeCorporate);
  const result = UserEmail('john@company.com');
  console.log('Result:', result);
  console.log('Result type:', typeof result);
}

/**
 * value-004: Value validation with error handling.
 */
function valueErrorHandlingExample() {
  console.log('\nvalue-004: Value validation with error handling.');

  const EmailNotEmpty = rule((email: string) =>
    email.length > 0 ? ok(email) : err('EMPTY_EMAIL'),
  );
  const EmailShouldBeCorporate = rule((email: string) =>
    email.includes('@company.com') ? ok(email) : err('NOT_CORPORATE'),
  );

  const UserEmail = value(EmailNotEmpty, EmailShouldBeCorporate);
  const result = UserEmail('');

  if (isOk(result)) {
    console.log('Valid email:', result.value);
  } else {
    console.log('Error:', result.error);
  }
}

/**
 * value-005: Rule with metadata for better tracing.
 */
function valueRuleWithMetadataExample() {
  console.log('\nvalue-005: Rule with metadata for better tracing.');

  const EmailNotEmpty = rule((email: string) =>
    email.length > 0 ? ok(email) : err('EMPTY_EMAIL'),
  ).meta({
    name: 'EmailNotEmpty',
    description: 'Validates that email is not empty',
    scope: 'UserValidation',
  });

  const result = EmailNotEmpty('test@example.com');
  console.log('Result:', result);
  console.log('Result type:', typeof result);

  // Show trace info
  const info = traceInfo(EmailNotEmpty);
  console.log('Rule metadata:', info.meta);
}

/**
 * value-006: Value validator with metadata for tracing.
 */
function valueValidatorWithMetadataExample() {
  console.log('\nvalue-006: Value validator with metadata for tracing.');

  const EmailNotEmpty = rule((email: string) =>
    email.length > 0 ? ok(email) : err('EMPTY_EMAIL'),
  ).meta({
    name: 'EmailNotEmpty',
    description: 'Validates that email is not empty',
    scope: 'UserValidation',
  });

  const EmailShouldBeCorporate = rule((email: string) =>
    email.includes('@company.com') ? ok(email) : err('NOT_CORPORATE'),
  ).meta({
    name: 'EmailShouldBeCorporate',
    description: 'Validates that email is corporate',
    scope: 'UserValidation',
  });

  const UserEmail = value(EmailNotEmpty, EmailShouldBeCorporate).meta({
    name: 'UserEmail',
    description: 'Complete email validation for users',
    scope: 'UserValidation',
    example: 'john@company.com',
  });

  const result = UserEmail('john@company.com');
  console.log('Result:', result);
  console.log('Result type:', typeof result);

  // Show trace info for the value validator
  const info = traceInfo(UserEmail);
  console.log('Value validator metadata:', info.meta);
}

// Run individual examples
valueBasicRuleExample();
valueRuleErrorHandlingExample();
valueBasicValidationExample();
valueErrorHandlingExample();
valueRuleWithMetadataExample();
valueValidatorWithMetadataExample();
