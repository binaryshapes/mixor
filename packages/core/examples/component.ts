import { ComponentError, type ComponentMeta, component } from '../src/component';

/**
 * component-001: Component function example.
 */
function componentFunctionExample() {
  console.log('component-001: Component function example');
  type EmailValidatorMeta = ComponentMeta<{
    example: string;
  }>;

  const EmailValidator = (email: string) => {
    if (!email.includes('@')) {
      throw new Error('Invalid email');
    }

    return email;
  };

  const EmailValidatorComponent = component<'Rule', EmailValidatorMeta>(
    'Rule',
    EmailValidator,
  ).meta({
    scope: 'User',
    name: 'EmailValidator',
    description: 'Validates an email address',
    example: 'example@example.com',
  });

  console.log(EmailValidatorComponent.info());
}

/**
 * component-002: Component object example.
 */
function componentObjectExample() {
  console.log('component-002: Component object example');
  type UserMeta = ComponentMeta<{
    example: {
      name: string;
      age: number;
    };
  }>;

  const User = {
    name: 'John',
    age: 30,
  };

  const UserComponent = component<'Object', UserMeta>('Object', User)
    .meta({
      scope: 'User',
      name: 'User',
      description: 'A user object',
      example: {
        name: 'John',
        age: 30,
      },
    })
    .traceable();

  console.log(UserComponent.info());
}

/**
 * component-003: Error handling example.
 */
function componentErrorHandlingExample() {
  console.log('component-003: Error handling example');

  try {
    // This will throw an error because we're trying to create a component with an invalid target
    component('Rule', 42);
  } catch (error) {
    if (error instanceof ComponentError) {
      console.log('Caught ComponentError:', error.message);
      console.log('Error key:', error.key);
    }
  }
}

// Execute all examples
componentFunctionExample();
componentObjectExample();
componentErrorHandlingExample();
