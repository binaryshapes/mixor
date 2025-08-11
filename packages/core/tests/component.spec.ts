import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  type ComponentCategory,
  ComponentError,
  type ComponentInjectable,
  type ComponentMeta,
  type ComponentNonInjectable,
  type ComponentSubType,
  component,
  isComponent,
} from '../src/component';

describe('Component', () => {
  // Shared test utilities.
  const createTestHelpers = () => ({
    createEmailValidator: () => (email: string) => {
      if (!email.includes('@')) {
        throw new Error('Invalid email');
      }
      return email;
    },
    createUserObject: () => ({
      name: 'John',
      age: 30,
    }),
    createTestMeta: () => ({
      scope: 'Test',
      name: 'TestComponent',
      description: 'A test component',
    }),
  });

  describe('Basic functionality', () => {
    const helpers = createTestHelpers();

    it('should create function components correctly', () => {
      const EmailValidator = helpers.createEmailValidator();
      const EmailValidatorComponent = component('Rule', EmailValidator);

      expect(EmailValidatorComponent).toBeDefined();
      expect(typeof EmailValidatorComponent).toBe('function');
      expect(EmailValidatorComponent.info).toBeDefined();
      expect(EmailValidatorComponent.meta).toBeDefined();
      expect(EmailValidatorComponent.traceable).toBeDefined();
      expect(EmailValidatorComponent.subType).toBeDefined();
    });

    it('should create object components correctly', () => {
      const User = helpers.createUserObject();
      const UserComponent = component('Object', User);

      expect(UserComponent).toBeDefined();
      expect(typeof UserComponent).toBe('object');
      expect(UserComponent.info).toBeDefined();
      expect(UserComponent.meta).toBeDefined();
      expect(UserComponent.traceable).toBeDefined();
      expect(UserComponent.subType).toBeDefined();
    });

    it('should set metadata correctly', () => {
      const EmailValidator = helpers.createEmailValidator();
      const meta = helpers.createTestMeta();

      const EmailValidatorComponent = component('Rule', EmailValidator).meta(meta);

      const info = EmailValidatorComponent.info();
      expect(info.meta).toEqual(meta);
    });

    it('should make components traceable', () => {
      const EmailValidator = helpers.createEmailValidator();
      const EmailValidatorComponent = component('Rule', EmailValidator).traceable();

      const info = EmailValidatorComponent.info();
      expect(info.traceable).toBe(true);
    });

    it('should set subType for non-injectable components', () => {
      const EmailValidator = helpers.createEmailValidator();
      const EmailValidatorComponent = component('Rule', EmailValidator).subType('string');

      const info = EmailValidatorComponent.info();
      expect(info.subType).toBe('string');
    });

    it('should set parent for components', () => {
      const ParentComponent = component('Object', helpers.createUserObject());
      const ChildComponent = component('Rule', helpers.createEmailValidator()).parent(
        ParentComponent,
      );

      const childInfo = ChildComponent.info();
      const parentInfo = ParentComponent.info();
      expect(childInfo.parentId).toBe(parentInfo.id);
    });

    it('should determine correct category for functions', () => {
      const EmailValidator = helpers.createEmailValidator();
      const Component = component('Rule', EmailValidator);

      const info = Component.info();
      expect(info.category).toBe('function');
    });

    it('should determine correct category for objects', () => {
      const User = helpers.createUserObject();
      const Component = component('Object', User);

      const info = Component.info();
      expect(info.category).toBe('object');
    });

    it('should handle injectable component types correctly', () => {
      const TestService = () => ({});
      const Component = component('Service', TestService);

      const info = Component.info();
      expect(info.injectable).toBe(true);
      expect(Component.injectable).toBeDefined();
      // @ts-expect-error - subType is not defined for injectable components.
      expect(Component.subType).toBeUndefined();
    });

    it('should handle non-injectable component types correctly', () => {
      const EmailValidator = helpers.createEmailValidator();
      const Component = component('Rule', EmailValidator);

      const info = Component.info();
      expect(info.injectable).toBe(false);
      // @ts-expect-error - injectable is not defined for non-injectable components.
      expect(Component.injectable).toBeUndefined();
      expect(Component.subType).toBeDefined();
    });

    it('should throw error for invalid targets', () => {
      const invalidTargets = [42, 'string', null, undefined, true, 3.14];

      invalidTargets.forEach((target) => {
        expect(() => component('Rule', target)).toThrow(ComponentError);
      });
    });

    it('should handle method chaining correctly', () => {
      const EmailValidator = helpers.createEmailValidator();
      const Component = component('Rule', EmailValidator)
        .meta(helpers.createTestMeta())
        .traceable()
        .subType('string');

      const info = Component.info();
      expect(info.meta).toEqual(helpers.createTestMeta());
      expect(info.traceable).toBe(true);
      expect(info.subType).toBe('string');
    });

    it('should isComponent guard work correctly to identify components', () => {
      const EmailValidator = helpers.createEmailValidator();
      const NonComponent = {};
      const Component = component('Rule', EmailValidator);

      expect(isComponent(Component)).toBe(true);

      // Correct tag.
      expect(isComponent(Component, 'Rule')).toBe(true);

      // False for wrong tag.
      expect(isComponent(Component, 'Value')).toBe(false);

      // False for non-component.
      expect(isComponent(NonComponent)).toBe(false);

      // False for non-component with tag.
      expect(isComponent(NonComponent, 'Rule')).toBe(false);
    });
  });

  describe('Type safety', () => {
    it('should provide correct type inference for all public elements', () => {
      // Test component function
      expectTypeOf(component).toBeFunction();
      expect(component('Rule', () => 'test')).toBeDefined();

      // Test ComponentError
      expect(typeof ComponentError).toBe('function');
      expect(new ComponentError('INVALID_TARGET', 'Test')).toBeDefined();

      // Test ComponentMeta type
      expectTypeOf<ComponentMeta>().toEqualTypeOf<{
        readonly name: string;
        readonly description: string;
        readonly scope: string;
      }>();

      // Test ComponentMeta with extensions
      expectTypeOf<ComponentMeta<{ custom: string }>>().toEqualTypeOf<{
        readonly name: string;
        readonly description: string;
        readonly scope: string;
        readonly custom: string;
      }>();
    });

    it('should validate generic type constraints', () => {
      // Test component with specific tag types
      expectTypeOf(component<'Rule'>).toBeFunction();
      expectTypeOf(component<'Object'>).toBeFunction();
      expectTypeOf(component<'Service'>).toBeFunction();

      // Test component with metadata extensions
      type CustomMeta = ComponentMeta<{ example: string }>;
      expectTypeOf(component<'Rule', CustomMeta>).toBeFunction();
    });

    it('should validate component interface methods', () => {
      const TestComponent = component('Rule', () => 'test');

      // Test base methods
      expectTypeOf(TestComponent.meta).toBeFunction();
      expectTypeOf(TestComponent.parent).toBeFunction();
      expectTypeOf(TestComponent.traceable).toBeFunction();
      expectTypeOf(TestComponent.info).toBeFunction();

      // Test non-injectable specific methods
      expectTypeOf(TestComponent.subType).toBeFunction();
      // @ts-expect-error - injectable is not defined for non-injectable components.
      expectTypeOf(TestComponent.injectable).toBeUndefined();
    });

    it('should validate injectable component methods', () => {
      const TestComponent = component('Service', () => ({}));

      // Test injectable specific methods
      expectTypeOf(TestComponent.injectable).toBeFunction();
      // @ts-expect-error - subType is not defined for injectable components.
      expectTypeOf(TestComponent.subType).toBeUndefined();
    });

    it('should validate component data structure', () => {
      const TestComponent = component('Rule', () => 'test');
      const info = TestComponent.info();

      expectTypeOf(info.id).toBeString();
      expectTypeOf(info.parentId).toEqualTypeOf<string | null>();
      expectTypeOf(info.tag).toEqualTypeOf<'Rule'>();
      expectTypeOf(info.category).toEqualTypeOf<'function' | 'object'>();
      expectTypeOf(info.subType).toEqualTypeOf<string | null>();
      expectTypeOf(info.traceable).toBeBoolean();
      expectTypeOf(info.injectable).toBeBoolean();
      expectTypeOf(info.meta).toEqualTypeOf<ComponentMeta | null>();
    });

    it('should validate component tag types', () => {
      // Test non-injectable component types
      expectTypeOf<ComponentNonInjectable>().toEqualTypeOf<
        | 'Rule'
        | 'Object'
        | 'Builder'
        | 'Criteria'
        | 'Value'
        | 'Event'
        | 'Specification'
        | 'Aggregate'
        | 'Schema'
        | 'Command'
        | 'Query'
      >();

      // Test injectable component types
      expectTypeOf<ComponentInjectable>().toEqualTypeOf<
        'Port' | 'Adapter' | 'Service' | 'Container'
      >();
    });

    it('should validate component sub-type constraints', () => {
      expectTypeOf<ComponentSubType>().toEqualTypeOf<
        'string' | 'number' | 'boolean' | 'bigint' | 'symbol' | 'date' | 'url' | 'array'
      >();
    });

    it('should validate component category constraints', () => {
      expectTypeOf<ComponentCategory>().toEqualTypeOf<'function' | 'object'>();
    });
  });

  describe('Code examples', () => {
    it('should run example component-001: Component function example', () => {
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

      const info = EmailValidatorComponent.info();
      expect(info.tag).toBe('Rule');
      expect(info.category).toBe('function');
      expect(info.meta).toEqual({
        scope: 'User',
        name: 'EmailValidator',
        description: 'Validates an email address',
        example: 'example@example.com',
      });
      expect(info.traceable).toBe(false);
      expect(info.injectable).toBe(false);
    });

    it('should run example component-002: Component object example', () => {
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

      const info = UserComponent.info();
      expect(info.tag).toBe('Object');
      expect(info.category).toBe('object');
      expect(info.meta).toEqual({
        scope: 'User',
        name: 'User',
        description: 'A user object',
        example: {
          name: 'John',
          age: 30,
        },
      });
      expect(info.traceable).toBe(true);
      expect(info.injectable).toBe(false);
    });

    it('should run example component-003: Error handling example', () => {
      try {
        // This will throw an error because we're trying to create a component with an invalid target
        component('Rule', 42);
        expect.fail('Should have thrown an error');
      } catch (error) {
        if (error instanceof ComponentError) {
          expect(error.message).toBe('Target is not a function or an object.');
          expect(error.key).toBe('COMPONENT:INVALID_TARGET');
        } else {
          expect.fail('Should have thrown ComponentError');
        }
      }
    });
  });

  describe('Error handling', () => {
    it('should throw ComponentError for invalid targets', () => {
      const invalidTargets = [42, 'string', null, undefined, true, 3.14];

      invalidTargets.forEach((target) => {
        expect(() => component('Rule', target)).toThrow(ComponentError);
      });
    });

    it('should throw ComponentError with correct error keys', () => {
      try {
        component('Rule', 42);
        expect.fail('Should have thrown an error');
      } catch (error) {
        if (error instanceof ComponentError) {
          expect(error.key).toBe('COMPONENT:INVALID_TARGET');
          expect(error.message).toBe('Target is not a function or an object.');
        } else {
          expect.fail('Should have thrown ComponentError');
        }
      }
    });

    it('should handle ComponentError instanceof correctly', () => {
      const error = new ComponentError('INVALID_TARGET', 'Test message');
      expect(error).toBeInstanceOf(ComponentError);
      expect(error).toBeInstanceOf(Error);
      expect(error.key).toBe('COMPONENT:INVALID_TARGET');
    });
  });

  describe('Component registry', () => {
    const helpers = createTestHelpers();

    it('should generate deterministic IDs for identical components', () => {
      const EmailValidator1 = helpers.createEmailValidator();
      const EmailValidator2 = helpers.createEmailValidator();

      const Component1 = component('Rule', EmailValidator1);
      const Component2 = component('Rule', EmailValidator2);

      const info1 = Component1.info();
      const info2 = Component2.info();

      expect(info1.id).toBe(info2.id);
      expect(info1.id).toMatch(/^rule:/);
      expect(info2.id).toMatch(/^rule:/);
    });

    it('should generate unique IDs for different components', () => {
      const EmailValidator1 = (email: string) => email.includes('@');
      const EmailValidator2 = (email: string) => email.length > 0 && email.includes('@');

      const Component1 = component('Rule', EmailValidator1);
      const Component2 = component('Rule', EmailValidator2);

      const info1 = Component1.info();
      const info2 = Component2.info();

      expect(info1.id).not.toBe(info2.id);
      expect(info1.id).toMatch(/^rule:/);
      expect(info2.id).toMatch(/^rule:/);
    });

    it('should prevent registering same target with different tags', () => {
      const AgeValidator = (age: number) => age > 18;

      // Simulate a first registration.
      component('Rule', AgeValidator);

      try {
        // Try to register the same function with a different tag should fail.
        component('Value', AgeValidator);
        expect.fail('Should have thrown an error');
      } catch (error) {
        if (error instanceof ComponentError) {
          expect(error.key).toBe('COMPONENT:ALREADY_REGISTERED');
          expect(error.message).toMatch(/Component with id: .* already registered\./);
        } else {
          expect.fail('Should have thrown ComponentError');
        }
      }
    });
  });
});
