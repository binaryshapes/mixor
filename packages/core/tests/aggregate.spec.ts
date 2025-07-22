import { beforeEach, describe, expect, expectTypeOf, it } from 'vitest';

import { aggregate } from '../src/aggregate-legacy';
import { type Event, event, eventStore } from '../src/event';
import { flow } from '../src/flow';
import type { Any } from '../src/generics';
import { err, isErr, isOk, ok, unwrap } from '../src/result';
import { schema } from '../src/schema';
import { spec } from '../src/specification';
import { value } from '../src/value';

// Test data types and validators.
type UserSchema = {
  name: string;
  email: string;
  age: number;
  isActive: boolean;
  role: 'Admin' | 'User' | 'Guest';
};

type UserCreated = Event<'User.Created', { name: string; email: string }>;
type UserRenamed = Event<'User.Renamed', { name: string }>;
type UserUpdated = Event<'User.Updated', { id: string }>;

const nameValidator = (value: string) => (value.length > 0 ? ok(value) : err('EMPTY_NAME'));
const emailValidator = (value: string) => (value.includes('@') ? ok(value) : err('INVALID_EMAIL'));
const ageValidator = (value: number) => (value >= 0 ? ok(value) : err('INVALID_AGE'));

const userSchema = schema({
  name: value('User name', nameValidator),
  email: value('User email', emailValidator),
  age: value('User age', ageValidator),
  isActive: value('User active status', (value: boolean) => ok(value)),
  role: value('User role', (value: string) =>
    ['Admin', 'User', 'Guest'].includes(value)
      ? ok(value as 'Admin' | 'User' | 'Guest')
      : err('INVALID_ROLE'),
  ),
});

const userEvents = eventStore({
  'User.Created': event<UserCreated>('User created event', 'User.Created'),
  'User.Renamed': event<UserRenamed>('User renamed event', 'User.Renamed'),
  'User.Updated': event<UserUpdated>('User updated event', 'User.Updated'),
});

// Pre-instantiated aggregates for different use cases.
const UserBasic = aggregate()
  .schema(userSchema)
  .methods((state, fn) => ({
    rename: fn('Renames the user', (newName: string) => state.set('name', newName)),
  }));

const UserWithEvents = aggregate()
  .schema(userSchema)
  .events(userEvents)
  .methods((state, fn) => ({
    rename: fn('Renames the user', (newName: string) =>
      flow<string>()
        .map((name) => state.set('name', name))
        .tap(() => state.emit('User.Renamed', { name: newName }))
        .build()(newName),
    ),
    create: fn('Creates user', (data: UserSchema) =>
      flow<UserSchema>()
        .map((d) => state.set('name', d.name))
        .tap((newState: Any) =>
          state.emit('User.Created', { name: newState.name, email: data.email }),
        )
        .build()(data),
    ),
  }));

const UserWithSpecs = aggregate()
  .schema(userSchema)
  .specs({
    UserMustBeActive: spec<UserSchema>('User must be active')
      .when(() => true)
      .rule('User must be active', (user) => (user.isActive ? ok(user) : err('USER_NOT_ACTIVE')))
      .build(),
  })
  .methods((state, fn, specs) => ({
    activate: fn('Activates user', () => state.set('isActive', true), {
      after: specs.UserMustBeActive,
    }),
    deactivate: fn('Deactivates user', () => state.set('isActive', false), {
      after: specs.UserMustBeActive,
    }),
    rename: fn('Renames the user', (newName: string) => state.set('name', newName), {
      before: specs.UserMustBeActive,
    }),
  }));

const UserWithEventsAndSpecs = aggregate()
  .schema(userSchema)
  .specs({
    UserMustBeActive: spec<UserSchema>('User must be active')
      .when(() => true)
      .rule('User must be active', (user) => (user.isActive ? ok(user) : err('USER_NOT_ACTIVE')))
      .build(),
  })
  .events(userEvents)
  .methods((state, fn, specs) => ({
    rename: fn(
      'Renames the user',
      (newName: string) =>
        flow<string>()
          .map((name) => state.set('name', name))
          .tap((newState) => state.emit('User.Renamed', { name: newState.name }))
          .build()(newName),
      {
        before: specs.UserMustBeActive,
      },
    ),
    update: fn(
      'Updates user',
      (data: Partial<UserSchema>) =>
        flow<Partial<UserSchema>>()
          .map((d) => state.set('name', d.name || state.get('name')))
          .tap(() => state.emit('User.Updated', { id: 'user-1' }))
          .build()(data),
      {
        before: specs.UserMustBeActive,
      },
    ),
  }));

const UserWithMultipleSpecs = aggregate()
  .schema(userSchema)
  .specs({
    UserMustBeActive: spec<UserSchema>('User must be active')
      .when(() => true)
      .rule('User must be active', (user) => (user.isActive ? ok(user) : err('USER_NOT_ACTIVE')))
      .build(),
    AdminMustBeActive: spec<UserSchema>('Admin must be active')
      .when(() => true)
      .rule('User must be admin', (user) => (user.role === 'Admin' ? ok(user) : err('NOT_ADMIN')))
      .rule('Admin must be active', (user) => (user.isActive ? ok(user) : err('ADMIN_NOT_ACTIVE')))
      .build(),
  })
  .methods((state, fn, specs) => ({
    makeAdmin: fn('Makes user admin', () => state.set('role', 'Admin'), {
      after: specs.AdminMustBeActive,
    }),
  }));

// Test data factory.
const createUserData = (overrides: Partial<UserSchema> = {}) => ({
  name: 'John',
  email: 'john@example.com',
  age: 30,
  isActive: true,
  role: 'User' as const,
  ...overrides,
});

describe('aggregate', () => {
  beforeEach(() => {
    userEvents.pull();
  });

  describe('Basic functionality', () => {
    it('should create a basic aggregate with schema validation', () => {
      const user = UserBasic(createUserData());

      expect(isOk(user)).toBe(true);
      if (isOk(user)) {
        const result = user.value.rename('Jane');
        expect(unwrap(result)).toEqual({
          name: 'Jane',
          email: 'john@example.com',
          age: 30,
          isActive: true,
          role: 'User',
        });
      }

      // Typechecking.
      expectTypeOf(UserBasic).toBeFunction();
      expectTypeOf(aggregate).toBeFunction();
    });

    it('should handle validation errors in aggregate creation', () => {
      const user = UserBasic({
        name: '',
        email: 'invalid',
        age: -5,
        isActive: true,
        // @ts-expect-error - Invalid role.
        role: 'InvalidRole',
      });

      expect(isErr(user)).toBe(true);
      if (isErr(user)) {
        expect(unwrap(user)).toEqual({
          name: 'EMPTY_NAME',
          email: 'INVALID_EMAIL',
          age: 'INVALID_AGE',
          role: 'INVALID_ROLE',
        });
      }
    });

    it('should provide access to aggregate state', () => {
      const user = UserBasic(createUserData());

      if (isOk(user)) {
        const nameResult = user.value.name;
        const emailResult = user.value.email;

        expect(nameResult).toBe('John');
        expect(emailResult).toBe('john@example.com');
      }
    });
  });

  describe('Events functionality', () => {
    it('should handle aggregates with events', () => {
      const user = UserWithEvents(createUserData());

      if (isOk(user)) {
        const result = user.value.rename('Jane');
        expect(unwrap(result)).toEqual({
          name: 'Jane',
          email: 'john@example.com',
          age: 30,
          isActive: true,
          role: 'User',
        });

        const events = user.value.getEvents();
        expect(events).toHaveLength(1);
        expect(events[0].key).toBe('User.Renamed');
        expect(events[0].value).toEqual({ name: 'Jane' });
      }
    });

    it('should handle event pulling and clearing', () => {
      const user = UserWithEvents(createUserData());

      if (isOk(user)) {
        user.value.rename('Mike');
        user.value.rename('Alice');

        const events = user.value.getEvents();
        expect(events).toHaveLength(2);

        const pulledEvents = user.value.pullEvents();
        expect(pulledEvents).toHaveLength(2);
        expect(pulledEvents[0].key).toBe('User.Renamed');
        expect(pulledEvents[0].value).toEqual({ name: 'Mike' });
        expect(pulledEvents[1].key).toBe('User.Renamed');
        expect(pulledEvents[1].value).toEqual({ name: 'Alice' });

        // Events should be cleared after pulling.
        const remainingEvents = user.value.getEvents();
        expect(remainingEvents).toHaveLength(0);
      }
    });
  });

  describe('Specifications functionality', () => {
    it('should handle aggregates with specifications', () => {
      const user = UserWithSpecs(createUserData({ isActive: false }));

      if (isOk(user)) {
        const result = user.value.activate();
        expect(unwrap(result)).toEqual({
          name: 'John',
          email: 'john@example.com',
          age: 30,
          isActive: true,
          role: 'User',
        });
      }
    });

    it('should handle specification validation errors', () => {
      const user = UserWithSpecs(createUserData());

      if (isOk(user)) {
        const result = user.value.deactivate();
        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(unwrap(result)).toBe('USER_NOT_ACTIVE');
        }
      }
    });

    it('should handle before specifications', () => {
      const activeUser = UserWithSpecs(createUserData());
      const inactiveUser = UserWithSpecs(
        createUserData({
          name: 'Jane',
          email: 'jane@example.com',
          age: 25,
          isActive: false,
        }),
      );

      if (isOk(activeUser)) {
        const result = activeUser.value.rename('John Updated');
        expect(unwrap(result)).toEqual({
          name: 'John Updated',
          email: 'john@example.com',
          age: 30,
          isActive: true,
          role: 'User',
        });
      }

      if (isOk(inactiveUser)) {
        const result = inactiveUser.value.rename('Jane Updated');
        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(unwrap(result)).toBe('USER_NOT_ACTIVE');
        }
      }
    });
  });

  describe('Complex scenarios', () => {
    it('should handle aggregates with events and specifications', () => {
      const user = UserWithEventsAndSpecs(createUserData());

      if (isOk(user)) {
        const result = user.value.rename('Jane');
        expect(unwrap(result)).toEqual({
          name: 'Jane',
          email: 'john@example.com',
          age: 30,
          isActive: true,
          role: 'User',
        });

        const events = user.value.getEvents();
        expect(events).toHaveLength(1);
        expect(events[0].key).toBe('User.Renamed');
        expect(events[0].value).toEqual({ name: 'Jane' });
      }
    });

    it('should handle multiple specifications', () => {
      const user = UserWithMultipleSpecs(createUserData());

      if (isOk(user)) {
        const result = user.value.makeAdmin();
        expect(unwrap(result)).toEqual({
          name: 'John',
          email: 'john@example.com',
          age: 30,
          isActive: true,
          role: 'Admin',
        });
      }
    });

    it('should handle specification validation failure for admin', () => {
      const user = UserWithMultipleSpecs(createUserData({ isActive: false }));

      if (isOk(user)) {
        const result = user.value.makeAdmin();
        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(unwrap(result)).toBe('ADMIN_NOT_ACTIVE');
        }
      }
    });
  });

  describe('Schema functionality', () => {
    it('should handle schema validation errors in state set operations', () => {
      const UserWithValidation = aggregate()
        .schema({
          name: value('User name', (value: string) =>
            value.length > 0 ? ok(value) : err('EMPTY_NAME'),
          ),
          email: value('User email', (value: string) =>
            value.includes('@') ? ok(value) : err('INVALID_EMAIL'),
          ),
          age: value('User age', (value: number) => (value >= 0 ? ok(value) : err('INVALID_AGE'))),
        })
        .methods((state, fn) => ({
          updateName: fn('Updates user name', (name: string) => state.set('name', name)),
          updateEmail: fn('Updates user email', (email: string) => state.set('email', email)),
          updateAge: fn('Updates user age', (age: number) => state.set('age', age)),
        }));

      const user = UserWithValidation({ name: 'John', email: 'john@example.com', age: 30 });

      if (isOk(user)) {
        // Test validation error for empty name.
        const emptyNameResult = user.value.updateName('');
        expect(isErr(emptyNameResult)).toBe(true);
        if (isErr(emptyNameResult)) {
          expect(unwrap(emptyNameResult)).toBe('EMPTY_NAME');
        }

        // Test validation error for invalid email.
        const invalidEmailResult = user.value.updateEmail('invalid-email');
        expect(isErr(invalidEmailResult)).toBe(true);
        if (isErr(invalidEmailResult)) {
          expect(unwrap(invalidEmailResult)).toBe('INVALID_EMAIL');
        }

        // Test validation error for negative age.
        const negativeAgeResult = user.value.updateAge(-5);
        expect(isErr(negativeAgeResult)).toBe(true);
        if (isErr(negativeAgeResult)) {
          expect(unwrap(negativeAgeResult)).toBe('INVALID_AGE');
        }

        // Test successful validation.
        const validNameResult = user.value.updateName('Jane');
        expect(unwrap(validNameResult)).toEqual({
          name: 'Jane',
          email: 'john@example.com',
          age: 30,
        });
      }
    });

    it('should handle specification validation in state manager', () => {
      const UserMustBeActive = spec<UserSchema>('User must be active')
        .when(() => true)
        .rule('User must be active', (user) => (user.isActive ? ok(user) : err('USER_NOT_ACTIVE')))
        .build();

      const UserWithSpecValidation = aggregate()
        .schema(userSchema)
        .specs({ UserMustBeActive })
        .methods((state, fn, specs) => ({
          validateState: fn('Validates current state', () => {
            return ok(state.getState());
          }),
          deactivateAndValidate: fn('Deactivates and validates', () => {
            state.set('isActive', false);
            return ok(state.getState());
          }),
          deactivateWithValidation: fn(
            'Deactivates with validation',
            () => {
              state.set('isActive', false);
              // This should trigger validation error because of after specification.
              return ok(state.getState());
            },
            {
              after: specs.UserMustBeActive,
            },
          ),
        }));

      const user = UserWithSpecValidation(createUserData());

      if (isOk(user)) {
        // Test successful validation.
        const validResult = user.value.validateState();
        expect(unwrap(validResult)).toEqual({
          name: 'John',
          email: 'john@example.com',
          age: 30,
          isActive: true,
          role: 'User',
        });

        // Test that deactivation without validation succeeds.
        const deactivateResult = user.value.deactivateAndValidate();
        expect(unwrap(deactivateResult)).toEqual({
          name: 'John',
          email: 'john@example.com',
          age: 30,
          isActive: false,
          role: 'User',
        });

        // Test validation failure with after specification.
        const invalidResult = user.value.deactivateWithValidation();
        expect(isErr(invalidResult)).toBe(true);
        if (isErr(invalidResult)) {
          expect(unwrap(invalidResult)).toBe('USER_NOT_ACTIVE');
        }
      }
    });

    it('should handle error propagation in createFnFunction', () => {
      const UserWithErrorHandling = aggregate()
        .schema(userSchema)
        .methods((state, fn) => ({
          failingOperation: fn('Failing operation', () => err('OPERATION_FAILED')),
          successfulOperation: fn('Successful operation', () => ok(state.getState())),
        }));

      const user = UserWithErrorHandling(createUserData());

      if (isOk(user)) {
        // Test error propagation from method execution.
        const errorResult = user.value.failingOperation();
        expect(isErr(errorResult)).toBe(true);
        if (isErr(errorResult)) {
          expect(unwrap(errorResult)).toBe('OPERATION_FAILED');
        }

        // Test successful operation.
        const successResult = user.value.successfulOperation();
        expect(unwrap(successResult)).toEqual({
          name: 'John',
          email: 'john@example.com',
          age: 30,
          isActive: true,
          role: 'User',
        });
      }
    });

    it('should handle state manager get operations', () => {
      const UserWithStateAccess = aggregate()
        .schema(userSchema)
        .methods((state, fn) => ({
          getCurrentName: fn('Gets current name', () => ok(state.get('name'))),
          getCurrentEmail: fn('Gets current email', () => ok(state.get('email'))),
          getCurrentAge: fn('Gets current age', () => ok(state.get('age'))),
          getCurrentState: fn('Gets current state', () => ok(state.getState())),
        }));

      const user = UserWithStateAccess(createUserData());

      if (isOk(user)) {
        // Test individual field access.
        const nameResult = user.value.getCurrentName();
        expect(unwrap(nameResult)).toBe('John');

        const emailResult = user.value.getCurrentEmail();
        expect(unwrap(emailResult)).toBe('john@example.com');

        const ageResult = user.value.getCurrentAge();
        expect(unwrap(ageResult)).toBe(30);

        // Test full state access.
        const stateResult = user.value.getCurrentState();
        expect(unwrap(stateResult)).toEqual({
          name: 'John',
          email: 'john@example.com',
          age: 30,
          isActive: true,
          role: 'User',
        });
      }
    });

    it('should handle state manager without event store', () => {
      const UserWithoutEvents = aggregate()
        .schema(userSchema)
        .methods((state, fn) => ({
          updateName: fn('Updates name', (name: string) => state.set('name', name)),
          getState: fn('Gets state', () => ok(state.getState())),
        }));

      const user = UserWithoutEvents(createUserData());

      if (isOk(user)) {
        // Test that getEvents and pullEvents are not available.
        expect(user.value.getEvents).toBeUndefined();
        expect(user.value.pullEvents).toBeUndefined();

        // Test state operations work correctly.
        const result = user.value.updateName('Jane');
        expect(unwrap(result)).toEqual({
          name: 'Jane',
          email: 'john@example.com',
          age: 30,
          isActive: true,
          role: 'User',
        });

        const stateResult = user.value.getState();
        expect(unwrap(stateResult)).toEqual({
          name: 'Jane',
          email: 'john@example.com',
          age: 30,
          isActive: true,
          role: 'User',
        });
      }
    });

    it('should handle state manager without specifications', () => {
      const UserWithoutSpecs = aggregate()
        .schema(userSchema)
        .methods((state, fn) => ({
          updateName: fn('Updates name', (name: string) => state.set('name', name)),
          validateState: fn('Validates state', () => {
            // This should not have validateSpecs method.
            return ok(state.getState());
          }),
        }));

      const user = UserWithoutSpecs(createUserData());

      if (isOk(user)) {
        // Test state operations work correctly.
        const result = user.value.updateName('Jane');
        expect(unwrap(result)).toEqual({
          name: 'Jane',
          email: 'john@example.com',
          age: 30,
          isActive: true,
          role: 'User',
        });
      }
    });

    it('should handle complex schema validation scenarios', () => {
      const ComplexUserSchema = {
        name: value('User name', (value: string) =>
          value.length > 0 ? ok(value) : err('EMPTY_NAME'),
        ),
        email: value('User email', (value: string) =>
          value.includes('@') ? ok(value) : err('INVALID_EMAIL'),
        ),
        age: value('User age', (value: number) =>
          value >= 0 && value <= 150 ? ok(value) : err('INVALID_AGE'),
        ),
        role: value('User role', (value: string) =>
          ['Admin', 'User', 'Guest'].includes(value)
            ? ok(value as 'Admin' | 'User' | 'Guest')
            : err('INVALID_ROLE'),
        ),
        metadata: value('User metadata', (value: Record<string, unknown>) =>
          typeof value === 'object' ? ok(value) : err('INVALID_METADATA'),
        ),
      };

      const ComplexUser = aggregate()
        .schema(ComplexUserSchema)
        .methods((state, fn) => ({
          updateName: fn('Updates name', (name: string) => state.set('name', name)),
          updateEmail: fn('Updates email', (email: string) => state.set('email', email)),
          updateAge: fn('Updates age', (age: number) => state.set('age', age)),
          updateRole: fn('Updates role', (role: 'Admin' | 'User' | 'Guest') =>
            state.set('role', role),
          ),
          updateMetadata: fn('Updates metadata', (metadata: Record<string, unknown>) =>
            state.set('metadata', metadata),
          ),
        }));

      const user = ComplexUser({
        name: 'John',
        email: 'john@example.com',
        age: 30,
        role: 'User',
        metadata: { department: 'Engineering' },
      });

      if (isOk(user)) {
        // Test multiple validation errors.
        const invalidNameResult = user.value.updateName('');
        expect(isErr(invalidNameResult)).toBe(true);
        if (isErr(invalidNameResult)) {
          expect(unwrap(invalidNameResult)).toBe('EMPTY_NAME');
        }

        const invalidEmailResult = user.value.updateEmail('invalid');
        expect(isErr(invalidEmailResult)).toBe(true);
        if (isErr(invalidEmailResult)) {
          expect(unwrap(invalidEmailResult)).toBe('INVALID_EMAIL');
        }

        const invalidAgeResult = user.value.updateAge(200);
        expect(isErr(invalidAgeResult)).toBe(true);
        if (isErr(invalidAgeResult)) {
          expect(unwrap(invalidAgeResult)).toBe('INVALID_AGE');
        }

        const invalidRoleResult = user.value.updateRole('InvalidRole' as Any);
        expect(isErr(invalidRoleResult)).toBe(true);
        if (isErr(invalidRoleResult)) {
          expect(unwrap(invalidRoleResult)).toBe('INVALID_ROLE');
        }

        // Test successful updates.
        const validNameResult = user.value.updateName('Jane');
        expect(unwrap(validNameResult)).toEqual({
          name: 'Jane',
          email: 'john@example.com',
          age: 30,
          role: 'User',
          metadata: { department: 'Engineering' },
        });

        const validRoleResult = user.value.updateRole('Admin');
        expect(unwrap(validRoleResult)).toEqual({
          name: 'Jane',
          email: 'john@example.com',
          age: 30,
          role: 'Admin',
          metadata: { department: 'Engineering' },
        });
      }
    });

    it('should handle validateSpecs method through specification validation', () => {
      const UserMustBeActive = spec<UserSchema>('User must be active')
        .when(() => true)
        .rule('User must be active', (user) => (user.isActive ? ok(user) : err('USER_NOT_ACTIVE')))
        .build();

      const UserMustHaveValidEmail = spec<UserSchema>('User must have valid email')
        .when(() => true)
        .rule('User must have valid email', (user) =>
          user.email.includes('@') ? ok(user) : err('INVALID_EMAIL_FORMAT'),
        )
        .build();

      const UserWithSpecValidation = aggregate()
        .schema(userSchema)
        .specs({ UserMustBeActive, UserMustHaveValidEmail })
        .methods((state, fn, specs) => ({
          updateAndValidate: fn(
            'Updates and validates',
            (data: Partial<UserSchema>) => {
              if (data.name) {
                const res = state.set('name', data.name);
                if (isErr(res)) return res;
              }
              if (data.email) {
                const res = state.set('email', data.email);
                if (isErr(res)) return res;
              }
              if (data.isActive !== undefined) {
                const res = state.set('isActive', data.isActive);
                if (isErr(res)) return res;
              }
              return ok(state.getState());
            },
            {
              after: specs.UserMustBeActive,
            },
          ),
          validateAfterUpdate: fn(
            'Validates after update',
            (data: Partial<UserSchema>) => {
              if (data.name) {
                const res = state.set('name', data.name);
                if (isErr(res)) return res;
              }
              if (data.email) {
                const res = state.set('email', data.email);
                if (isErr(res)) return res;
              }
              if (data.isActive !== undefined) {
                const res = state.set('isActive', data.isActive);
                if (isErr(res)) return res;
              }
              return ok(state.getState());
            },
            {
              after: specs.UserMustHaveValidEmail,
            },
          ),
        }));

      const user = UserWithSpecValidation(createUserData());

      if (isOk(user)) {
        const invalidUpdateResult = user.value.updateAndValidate({
          name: 'Jane',
          email: 'jane@example.com',
          isActive: false,
        });
        expect(isErr(invalidUpdateResult)).toBe(true);
        if (isErr(invalidUpdateResult)) {
          expect(unwrap(invalidUpdateResult)).toBe('USER_NOT_ACTIVE');
        }

        const invalidSchemaResult = user.value.validateAfterUpdate({
          name: 'Jane',
          email: 'invalid-email',
          isActive: true,
        });
        expect(isErr(invalidSchemaResult)).toBe(true);
        if (isErr(invalidSchemaResult)) {
          expect(unwrap(invalidSchemaResult)).toBe('INVALID_EMAIL');
        }

        const validResult = user.value.updateAndValidate({
          name: 'Jane',
          email: 'jane@example.com',
          isActive: true,
        });
        expect(unwrap(validResult)).toEqual({
          name: 'Jane',
          email: 'jane@example.com',
          age: 30,
          isActive: true,
          role: 'User',
        });
      }
    });

    it('should validate all specs when checkSpecs option is enabled', () => {
      const UserMustBeActive = spec<UserSchema>('User must be active')
        .when(() => true)
        .rule('User must be active', (user) => (user.isActive ? ok(user) : err('USER_NOT_ACTIVE')))
        .build();

      const UserMustHaveValidEmail = spec<UserSchema>('User must have valid email')
        .when(() => true)
        .rule('User must have valid email', (user) =>
          user.email.includes('@') ? ok(user) : err('INVALID_EMAIL_FORMAT'),
        )
        .build();

      const UserWithSpecValidation = aggregate()
        .schema(userSchema)
        .specs({ UserMustBeActive, UserMustHaveValidEmail })
        .methods((state, fn) => ({
          updateName: fn('Updates name', (name: string) => state.set('name', name)),
        }));

      // Test: Valid state passes all specs.
      const validUser = UserWithSpecValidation(createUserData(), { checkSpecs: true });
      expect(isOk(validUser)).toBe(true);

      // Test: Invalid state fails specs.
      const invalidUser = UserWithSpecValidation(
        { ...createUserData(), isActive: false, email: 'valid@email.com' },
        { checkSpecs: true },
      );
      expect(isErr(invalidUser)).toBe(true);
      if (isErr(invalidUser)) {
        expect(unwrap(invalidUser)).toBe('USER_NOT_ACTIVE'); // First spec that fails.
      }

      // Test: Without checkSpecs, invalid state still creates instance.
      const invalidUserWithoutCheck = UserWithSpecValidation({
        ...createUserData(),
        isActive: false,
      });
      expect(isOk(invalidUserWithoutCheck)).toBe(true);
    });
  });

  describe('Type safety', () => {
    it('should provide correct type inference for aggregate methods', () => {
      const user = UserBasic(createUserData());

      if (isOk(user)) {
        // Typechecking.
        expectTypeOf(user.value.rename).toBeFunction();
        expectTypeOf(user.value.name).toBeString();
        expectTypeOf(user.value.email).toBeString();
        expectTypeOf(user.value.age).toBeNumber();
        expectTypeOf(user.value.isActive).toBeBoolean();
        expectTypeOf(user.value.role).toEqualTypeOf<'Admin' | 'User' | 'Guest'>();
      }
    });

    it('should handle type safety with events', () => {
      const user = UserWithEvents(createUserData());

      if (isOk(user)) {
        // Typechecking.
        expectTypeOf(user.value.getEvents).toBeFunction();
        expectTypeOf(user.value.pullEvents).toBeFunction();
        expectTypeOf(user.value.rename).toBeFunction();
      }
    });

    it('should handle type safety with specifications', () => {
      const user = UserWithSpecs(createUserData({ isActive: false }));

      if (isOk(user)) {
        // Typechecking.
        expectTypeOf(user.value.activate).toBeFunction();
        expectTypeOf(user.value.name).toBeString();
        expectTypeOf(user.value.email).toBeString();
      }
    });
  });

  describe('Code examples', () => {
    it('should run example aggregate-001: Basic aggregate with schema validation', () => {
      // aggregate-001: Basic aggregate with schema validation.
      const User = aggregate()
        .schema({
          name: value('User name', (value: string) => ok(value)),
          email: value('User email', (value: string) => ok(value)),
        })
        .methods((state, fn) => ({
          rename: fn('Renames the user', (newName: string) => state.set('name', newName)),
        }));

      const user = User({ name: 'John', email: 'john@example.com' });
      if (isOk(user)) {
        const result = user.value.rename('Jane');
        expect(unwrap(result)).toEqual({ name: 'Jane', email: 'john@example.com' });
      }

      // Typechecking.
      expectTypeOf(User).toBeFunction();
      expectTypeOf(aggregate).toBeFunction();
    });

    it('should run example aggregate-002: Aggregate with events and specifications', () => {
      // aggregate-002: Aggregate with events and specifications.
      const userEvents = eventStore({
        'User.Renamed': event<UserRenamed>('User renamed event', 'User.Renamed'),
      });

      const UserMustBeActive = spec<UserSchema>('User must be active')
        .when(() => true)
        .rule('User must be active', (user) => (user.isActive ? ok(user) : err('USER_NOT_ACTIVE')))
        .build();

      const User = aggregate()
        .schema(userSchema)
        .specs({ UserMustBeActive })
        .events(userEvents)
        .methods((state, fn, specs) => ({
          rename: fn(
            'Renames the user',
            (newName: string) =>
              flow<string>()
                .map((name) => state.set('name', name))
                .tap((newState) => state.emit('User.Renamed', { name: newState.name }))
                .build()(newName),
            {
              before: specs.UserMustBeActive,
            },
          ),
        }));

      const user = User(createUserData());
      if (isOk(user)) {
        const result = user.value.rename('Jane');
        expect(unwrap(result)).toEqual({
          name: 'Jane',
          email: 'john@example.com',
          age: 30,
          isActive: true,
          role: 'User',
        });

        const events = user.value.getEvents();
        expect(events).toHaveLength(1);
        expect(events[0].key).toBe('User.Renamed');
        expect(events[0].value).toEqual({ name: 'Jane' });
      }
    });

    it('should run example aggregate-003: Complex aggregate with multiple specifications', () => {
      // aggregate-003: Complex aggregate with multiple specifications.
      const AdminMustBeActive = spec<UserSchema>('Admin must be active')
        .when(() => true)
        .rule('User must be admin', (user) => (user.role === 'Admin' ? ok(user) : err('NOT_ADMIN')))
        .rule('Admin must be active', (user) =>
          user.isActive ? ok(user) : err('ADMIN_NOT_ACTIVE'),
        )
        .build();

      const User = aggregate()
        .schema(userSchema)
        .specs({ AdminMustBeActive })
        .events(userEvents)
        .methods((state, fn, specs) => ({
          makeAdmin: fn('Makes user admin', () => state.set('role', 'Admin'), {
            after: specs.AdminMustBeActive,
          }),
        }));

      const user = User(createUserData());
      if (isOk(user)) {
        const result = user.value.makeAdmin();
        expect(unwrap(result)).toEqual({
          name: 'John',
          email: 'john@example.com',
          age: 30,
          isActive: true,
          role: 'Admin',
        });
      }
    });

    it('should run example aggregate-004: Schema definition with field validation', () => {
      // aggregate-004: Schema definition with field validation.
      const User = aggregate()
        .schema({
          name: value('User name', (value: string) =>
            value.length > 0 ? ok(value) : err('EMPTY_NAME'),
          ),
          email: value('User email', (value: string) =>
            value.includes('@') ? ok(value) : err('INVALID_EMAIL'),
          ),
          age: value('User age', (value: number) => (value >= 18 ? ok(value) : err('INVALID_AGE'))),
        })
        .methods((state, fn) => ({
          updateName: fn('Updates user name', (name: string) => state.set('name', name)),
        }));

      const user = User({ name: 'John', email: 'john@example.com', age: 30 });
      if (isOk(user)) {
        const result = user.value.updateName('Jane');
        expect(unwrap(result)).toEqual({ name: 'Jane', email: 'john@example.com', age: 30 });
      }
    });

    it('should run example aggregate-005: Specifications for business rules', () => {
      // aggregate-005: Specifications for business rules.
      const UserMustBeActive = spec<UserSchema>('User must be active')
        .when(() => true)
        .rule('User must be active', (user) => (user.isActive ? ok(user) : err('USER_NOT_ACTIVE')))
        .build();

      const User = aggregate()
        .schema(userSchema)
        .specs({ UserMustBeActive })
        .methods((state, fn, specs) => ({
          activate: fn('Activates user', () => state.set('isActive', true), {
            after: specs.UserMustBeActive,
          }),
        }));

      const user = User(createUserData({ isActive: false }));
      if (isOk(user)) {
        const result = user.value.activate();
        expect(unwrap(result)).toEqual({
          name: 'John',
          email: 'john@example.com',
          age: 30,
          isActive: true,
          role: 'User',
        });
      }
    });

    it('should run example aggregate-006: Events with specifications', () => {
      // aggregate-006: Events with specifications.
      const userEvents = eventStore({
        'User.Created': event<UserCreated>('User created', 'User.Created'),
        'User.Updated': event<UserUpdated>('User updated', 'User.Updated'),
      });

      const UserMustBeActive = spec<UserSchema>('User must be active')
        .when(() => true)
        .rule('User must be active', (user) => (user.isActive ? ok(user) : err('USER_NOT_ACTIVE')))
        .build();

      const User = aggregate()
        .schema(userSchema)
        .specs({ UserMustBeActive })
        .events(userEvents)
        .methods((state, fn, specs) => ({
          update: fn(
            'Updates user',
            (data: Partial<UserSchema>) =>
              flow<Partial<UserSchema>>()
                .map((d) => state.set('name', d.name || state.get('name')))
                .tap(() => state.emit('User.Updated', { id: 'user-1' }))
                .build()(data),
            {
              before: specs.UserMustBeActive,
            },
          ),
        }));

      const user = User(createUserData());
      if (isOk(user)) {
        const result = user.value.update({ name: 'Jane' });
        expect(unwrap(result)).toEqual({
          name: 'Jane',
          email: 'john@example.com',
          age: 30,
          isActive: true,
          role: 'User',
        });

        const events = user.value.getEvents();
        expect(events).toHaveLength(1);
        expect(events[0].key).toBe('User.Updated');
        expect(events[0].value).toEqual({ id: 'user-1' });
      }
    });

    it('should run example aggregate-007: Complete aggregate with all features', () => {
      // aggregate-007: Complete aggregate with all features.
      const UserMustBeActive = spec<UserSchema>('User must be active')
        .when(() => true)
        .rule('User must be active', (user) => (user.isActive ? ok(user) : err('USER_NOT_ACTIVE')))
        .build();

      const User = aggregate()
        .schema(userSchema)
        .specs({ UserMustBeActive })
        .events(userEvents)
        .methods((state, fn, specs) => ({
          rename: fn(
            'Renames user',
            (newName: string) =>
              flow<string>()
                .map((name) => state.set('name', name))
                .tap((newState) => state.emit('User.Renamed', { name: newState.name }))
                .build()(newName),
            {
              before: specs.UserMustBeActive,
            },
          ),
          activate: fn(
            'Activates user',
            flow<void>()
              .map(() => state.set('isActive', true))
              .build(),
            {
              after: specs.UserMustBeActive,
            },
          ),
        }));

      const user = User(createUserData({ isActive: false }));
      if (isOk(user)) {
        const activated = user.value.activate();
        if (isOk(activated)) {
          expect(unwrap(activated)).toEqual({
            name: 'John',
            email: 'john@example.com',
            age: 30,
            isActive: true,
            role: 'User',
          });
        } else {
          expect(unwrap(activated)).toBe('USER_NOT_ACTIVE');
        }
      }
    });

    it('should run example aggregate-008: Aggregate with specifications but no events', () => {
      // aggregate-008: Aggregate with specifications but no events.
      const UserMustBeActive = spec<UserSchema>('User must be active')
        .when(() => true)
        .rule('User must be active', (user) => (user.isActive ? ok(user) : err('USER_NOT_ACTIVE')))
        .build();

      const User = aggregate()
        .schema(userSchema)
        .specs({ UserMustBeActive })
        .methods((state, fn, specs) => ({
          activate: fn('Activates user', () => state.set('isActive', true), {
            after: specs.UserMustBeActive,
          }),
        }));

      const user = User(createUserData({ isActive: false }));
      if (isOk(user)) {
        const result = user.value.activate();
        expect(unwrap(result)).toEqual({
          name: 'John',
          email: 'john@example.com',
          age: 30,
          isActive: true,
          role: 'User',
        });
      }
    });

    it('should run example aggregate-009: Events without specifications', () => {
      // aggregate-009: Events without specifications.
      const userEvents = eventStore({
        'User.Created': event<UserCreated>('User created', 'User.Created'),
      });

      const User = aggregate()
        .schema(userSchema)
        .events(userEvents)
        .methods((state, fn) => ({
          create: fn('Creates user', (data: UserSchema) =>
            flow<UserSchema>()
              .map((d) => state.set('name', d.name))
              .tap((newState: Any) =>
                state.emit('User.Created', { name: newState.name, email: data.email }),
              )
              .build()(data),
          ),
        }));

      const user = User(createUserData());
      if (isOk(user)) {
        const result = user.value.create({
          name: 'Jane',
          email: 'jane@example.com',
          age: 25,
          isActive: true,
          role: 'User',
        });
        expect(unwrap(result)).toEqual({
          name: 'Jane',
          email: 'john@example.com',
          age: 30,
          isActive: true,
          role: 'User',
        });

        const events = user.value.getEvents();
        expect(events).toHaveLength(1);
        expect(events[0].key).toBe('User.Created');
        expect(events[0].value).toEqual({ name: 'Jane', email: 'jane@example.com' });
      }
    });

    it('should run example aggregate-010: Simple aggregate with events', () => {
      // aggregate-010: Simple aggregate with events.
      const User = aggregate()
        .schema(userSchema)
        .events(userEvents)
        .methods((state, fn) => ({
          rename: fn('Renames the user', (newName: string) =>
            flow<string>()
              .map((name) => state.set('name', name))
              .tap(() => state.emit('User.Renamed', { name: newName }))
              .build()(newName),
          ),
        }));

      const user = User(createUserData());
      if (isOk(user)) {
        const result = user.value.rename('Jane');
        expect(unwrap(result)).toEqual({
          name: 'Jane',
          email: 'john@example.com',
          age: 30,
          isActive: true,
          role: 'User',
        });

        const events = user.value.getEvents();
        expect(events).toHaveLength(1);
        expect(events[0].key).toBe('User.Renamed');
        expect(events[0].value).toEqual({ name: 'Jane' });
      }
    });

    it('should run example aggregate-011: Simple aggregate without events or specifications', () => {
      // aggregate-011: Simple aggregate without events or specifications.
      const User = aggregate()
        .schema(userSchema)
        .methods((state, fn) => ({
          rename: fn('Renames the user', (newName: string) => state.set('name', newName)),
        }));

      const user = User(createUserData());
      if (isOk(user)) {
        const result = user.value.rename('Jane');
        if (isOk(result)) {
          expect(unwrap(result)).toEqual({
            name: 'Jane',
            email: 'john@example.com',
            age: 30,
            isActive: true,
            role: 'User',
          });
        } else {
          expect(unwrap(result)).toBe('error message');
        }
      }
    });
  });
});
