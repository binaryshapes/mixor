import { beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest';

import { ComponentError, component, isComponent, tracer } from '../src/component';
import { ok } from '../src/result';

describe('Component', () => {
  // Test data and utilities
  const mockFunction = () => (value: string) => ok(value);
  const mockObject = () => ({ key: 'value' });
  const mockErrorFunction = () => () => {
    throw new Error('Test error');
  };

  // Injectable components need objects or functions that don't return Result
  const mockInjectableObject = () => ({ service: 'injectable service' });

  beforeEach(() => {
    // Clear tracer listeners before each test
    tracer.clear();
  });

  describe('Public API', () => {
    describe('component factory function', () => {
      it('should create component with valid function target', () => {
        const testComponent = component('Rule', mockFunction());

        expect(testComponent).toBeDefined();
        expect(typeof testComponent).toBe('function');
        expect(isComponent(testComponent)).toBe(true);
      });

      it('should create component with valid object target', () => {
        const testComponent = component('Object', mockObject());

        expect(testComponent).toBeDefined();
        expect(typeof testComponent).toBe('object');
        expect(isComponent(testComponent)).toBe(true);
      });

      it('should create component with correct tag', () => {
        const testComponent = component('Schema', mockFunction());
        const info = testComponent.info();

        expect(info.tag).toBe('Schema');
      });

      it('should generate unique deterministic ID', () => {
        const component1 = component('Rule', mockFunction());
        const component2 = component('Rule', mockFunction());

        expect(component1.info().id).toBe(component2.info().id);
        expect(component1.info().id).toMatch(/^rule:/);
      });
    });

    describe('isComponent guard', () => {
      it('should return true for valid components', () => {
        const testComponent = component('Rule', mockFunction());
        expect(isComponent(testComponent)).toBe(true);
      });

      it('should return false for non-components', () => {
        expect(isComponent(mockFunction)).toBe(false);
        expect(isComponent(mockObject())).toBe(false);
        expect(isComponent(null)).toBe(false);
        expect(isComponent(undefined)).toBe(false);
      });

      it('should check component against specific tag', () => {
        const testComponent = component('Rule', mockFunction());
        expect(isComponent(testComponent, 'Rule')).toBe(true);
        expect(isComponent(testComponent, 'Schema')).toBe(false);
      });
    });

    describe('ComponentError', () => {
      it('should throw AlreadyRegisteredError for duplicate registration', () => {
        const fn = mockFunction();
        component('Rule', fn);

        try {
          component('Rule', fn);
        } catch (error) {
          expect(error).toBeInstanceOf(ComponentError);
          expect(error).toHaveProperty('code', 'Component:AlreadyRegisteredError');
        }
      });

      it('should throw InvalidTargetError for invalid targets', () => {
        expect(() => component('Rule', null as never)).toThrow(ComponentError);
        expect(() => component('Rule', undefined as never)).toThrow(ComponentError);
      });
    });
  });

  describe('Injectable vs Non-Injectable Components', () => {
    describe('Non-Injectable Components', () => {
      const nonInjectableTags = [
        'Aggregate',
        'Builder',
        'Command',
        'Criteria',
        'Event',
        'Flow',
        'Query',
        'Rule',
        'Schema',
        'Specification',
        'Value',
      ] as const;

      it.each(nonInjectableTags)('should create %s component as non-injectable', (tag) => {
        const testComponent = component(tag, mockFunction());
        const info = testComponent.info();

        expect(info.injectable).toBe(false);
        expect(info.tag).toBe(tag);
      });

      it('should provide traceable and subType methods on non-injectable components', () => {
        const testComponent = component('Rule', mockFunction());

        expect(typeof testComponent.traceable).toBe('function');
        expect(typeof testComponent.subType).toBe('function');
        expect('injectable' in testComponent).toBe(false);
      });
    });

    describe('Injectable Components', () => {
      const injectableTags = ['Port', 'Adapter', 'Service', 'Container', 'Object'] as const;

      it.each(injectableTags)('should create %s component as injectable', (tag) => {
        const testComponent = component(tag, mockInjectableObject());
        const info = testComponent.info();

        expect(info.injectable).toBe(true);
        expect(info.tag).toBe(tag);
      });

      it('should provide injectable method on injectable components', () => {
        const testComponent = component('Port', mockFunction());

        expect(typeof testComponent.injectable).toBe('function');
        expect('traceable' in testComponent).toBe(false);
        expect('subType' in testComponent).toBe(false);
      });
    });

    describe('Component Category Detection', () => {
      it('should detect function category correctly', () => {
        const testComponent = component('Rule', mockFunction());
        const info = testComponent.info();

        expect(info.category).toBe('function');
      });

      it('should detect object category correctly', () => {
        const testComponent = component('Object', mockObject());
        const info = testComponent.info();

        expect(info.category).toBe('object');
      });
    });
  });

  describe('Component Methods & Prototypes', () => {
    describe('Base Methods (All Components)', () => {
      it('should provide meta method on all components', () => {
        const testComponent = component('Rule', mockFunction());

        expect(typeof testComponent.meta).toBe('function');

        const result = testComponent.meta({
          name: 'Test Rule',
          description: 'Test description',
          scope: 'test',
          example: 'example value',
        });

        expect(result).toBe(testComponent);
        expect(testComponent.info().meta?.name).toBe('Test Rule');
      });

      it('should provide parent method on all components', () => {
        const parentComponent = component('Schema', mockFunction());
        const childComponent = component('Rule', mockFunction());

        const result = childComponent.parent(parentComponent);

        expect(result).toBe(childComponent);
        expect(childComponent.info().parentId).toBe(parentComponent.info().id);
      });

      it('should provide info method on all components', () => {
        const testComponent = component('Rule', mockFunction());
        const info = testComponent.info();

        expect(info).toBeDefined();
        expect(info.id).toBeDefined();
        expect(info.tag).toBeDefined();
        expect(info.category).toBeDefined();
        expect(info.traceable).toBeDefined();
        expect(info.injectable).toBeDefined();
        expect(info.meta).toBeDefined();
      });

      it('should return frozen info object', () => {
        const testComponent = component('Rule', mockFunction());
        const info = testComponent.info();

        expect(() => {
          // @ts-expect-error - we want to test the immutability of the info object.
          info.tag = 'Modified';
        }).toThrow();
      });
    });

    describe('Non-Injectable Specific Methods', () => {
      it('should provide traceable method that makes function traceable', () => {
        const testComponent = component('Rule', mockFunction()).traceable();
        expect(testComponent.info().traceable).toBe(true);
      });

      it('should provide subType method to set component subtype', () => {
        const testComponent = component('Rule', mockFunction());
        const result = testComponent.subType('string');

        expect(result).toBe(testComponent);
        expect(testComponent.info().subType).toBe('string');
      });

      it('should support method chaining for non-injectable components', () => {
        const testComponent = component('Rule', mockFunction())
          .meta({ name: 'Test', description: 'Desc', scope: 'test', example: 'example' })
          .subType('string')
          .traceable();

        expect(testComponent.info().meta?.name).toBe('Test');
        expect(testComponent.info().subType).toBe('string');
        expect(testComponent.info().traceable).toBe(true);
      });
    });

    describe('Injectable Specific Methods', () => {
      it('should provide injectable method that marks component as injectable', () => {
        const testComponent = component('Port', mockFunction()).injectable();
        expect(testComponent.info().injectable).toBe(true);
      });

      it('should support method chaining for injectable components', () => {
        const testComponent = component('Port', mockFunction())
          .meta({ name: 'Test', description: 'Desc', scope: 'test' })
          .injectable();

        expect(testComponent.info().meta?.name).toBe('Test');
        expect(testComponent.info().injectable).toBe(true);
      });
    });
  });

  describe('Tracing & Traceable Components', () => {
    describe('Traceable Method Validation', () => {
      it('should throw error when trying to make non-function traceable', () => {
        const testComponent = component('Object', mockObject());

        expect(() => {
          // @ts-expect-error - we want to test the immutability of the info object.
          testComponent.traceable();
        }).toThrow();
      });

      it('should allow making function components traceable', () => {
        const testComponent = component('Rule', mockFunction());

        expect(() => {
          testComponent.traceable();
        }).not.toThrow();
      });
    });

    describe('Tracer Events', () => {
      it('should emit start event when traced function begins execution', () => {
        const startSpy = vi.fn();
        tracer.on('start', startSpy);

        const testComponent = component('Rule', mockFunction()).traceable();
        testComponent('test result');

        expect(startSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            elementId: testComponent.info().id,
            input: expect.any(Object),
          }),
        );
      });

      it('should emit finish and performance events for synchronous functions', () => {
        const finishSpy = vi.fn();
        const performanceSpy = vi.fn();

        tracer.on('finish', finishSpy);
        tracer.on('performance', performanceSpy);

        const testComponent = component('Rule', mockFunction()).traceable();
        testComponent('test result');

        expect(finishSpy).toHaveBeenCalled();
        expect(performanceSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            async: false,
            durationMs: expect.any(Number),
          }),
        );
      });

      it('should emit finish and performance events for asynchronous functions', async () => {
        const finishSpy = vi.fn();
        const performanceSpy = vi.fn();

        tracer.on('finish', finishSpy);
        tracer.on('performance', performanceSpy);

        // For async functions in non-injectable components, they must return Result directly
        const asyncResultFunction = async () => ok('async result');
        const testComponent = component('Flow', asyncResultFunction).traceable();
        await testComponent();

        expect(finishSpy).toHaveBeenCalled();
        expect(performanceSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            async: true,
            durationMs: expect.any(Number),
          }),
        );
      });

      it('should emit error events when function throws', () => {
        const errorSpy = vi.fn();
        tracer.on('error', errorSpy);

        const testComponent = component('Rule', mockErrorFunction()).traceable();

        expect(() => testComponent()).toThrow('Test error');
        expect(errorSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.any(Error),
            async: false,
          }),
        );
      });

      it('should emit error events for async function rejections', async () => {
        const errorSpy = vi.fn();
        tracer.on('error', errorSpy);

        const asyncErrorFunction = async () => {
          throw new Error('Async error');
        };

        const testComponent = component('Flow', asyncErrorFunction).traceable();

        await expect(testComponent()).rejects.toThrow('Async error');
        expect(errorSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.any(Error),
            async: true,
          }),
        );
      });
    });

    describe('Tracer Object', () => {
      it('should allow subscribing to tracer events', () => {
        const listener = vi.fn();
        tracer.on('start', listener);

        expect(listener).toBeDefined();
      });

      it('should allow subscribing to tracer events once', () => {
        const listener = vi.fn();
        tracer.once('start', listener);

        expect(listener).toBeDefined();
      });

      it('should provide tracer statistics', () => {
        const stats = tracer.stats();

        expect(stats).toHaveProperty('count');
        expect(stats).toHaveProperty('maxListeners');
        expect(stats).toHaveProperty('events');
        expect(stats.events).toEqual(['start', 'finish', 'error', 'performance', 'buildtime']);
      });

      it('should emit events correctly', () => {
        const listener = vi.fn();
        tracer.on('start', listener);

        tracer.emit('start', { test: 'data' });

        expect(listener).toHaveBeenCalledWith({ test: 'data' });
      });
    });

    describe('Tracing Wrapper Functionality', () => {
      it('should preserve original function name', () => {
        const namedFunction = function testFunction() {
          return ok('result');
        };
        const testComponent = component('Rule', namedFunction).traceable();

        expect(testComponent.name).toBe('testFunction');
      });

      it('should maintain function behavior while adding tracing', () => {
        const testComponent = component('Rule', mockFunction()).traceable();
        const result = testComponent('test result');
        expect(result).toEqual(ok('test result'));
      });

      it('should handle complex arguments correctly', () => {
        const complexFunction = (obj: { key: string }, arr: number[]) => ok({ ...obj, items: arr });
        const testComponent = component('Rule', complexFunction).traceable();
        const result = testComponent({ key: 'value' }, [1, 2, 3]);
        expect(result).toEqual(ok({ key: 'value', items: [1, 2, 3] }));
      });
    });
  });

  describe('Edge Cases & Error Handling', () => {
    describe('Component Registration', () => {
      it('should handle component with same tag but different targets', () => {
        const function1 = () => ok('result1');
        const function2 = () => ok('result2');

        const component1 = component('Rule', function1);
        const component2 = component('Rule', function2);

        expect(component1.info().id).not.toBe(component2.info().id);
        expect(isComponent(component1)).toBe(true);
        expect(isComponent(component2)).toBe(true);
      });
    });

    describe('Metadata Handling', () => {
      it('should handle null metadata correctly', () => {
        const testComponent = component('Rule', mockFunction());
        const info = testComponent.info();

        expect(info.meta).toBe(null);
      });

      it('should handle metadata with example for Value/Rule/Schema/Object tags', () => {
        const testComponent = component('Value', mockFunction());

        const result = testComponent.meta({
          name: 'Test Value',
          description: 'Test description',
          scope: 'test',
          example: 'example value',
        });

        expect(result).toBe(testComponent);
        expect(testComponent.info().meta?.example).toBe('example value');
      });
    });

    describe('Parent-Child Relationships', () => {
      it('should handle null parent ID correctly', () => {
        const testComponent = component('Rule', mockFunction());
        const info = testComponent.info();

        expect(info.parentId).toBe(null);
      });

      it('should support deep parent-child hierarchies', () => {
        const grandparent = component('Schema', mockFunction());
        const parent = component('Rule', mockFunction());
        const child = component('Value', mockFunction());

        parent.parent(grandparent);
        child.parent(parent);

        expect(parent.info().parentId).toBe(grandparent.info().id);
        expect(child.info().parentId).toBe(parent.info().id);
      });
    });

    describe('SubType Handling', () => {
      it('should handle all valid subType values', () => {
        const validSubTypes = [
          'string',
          'number',
          'boolean',
          'bigint',
          'symbol',
          'date',
          'url',
          'array',
        ] as const;
        const testComponent = component('Rule', mockFunction());

        validSubTypes.forEach((subType) => {
          const result = testComponent.subType(subType);
          expect(result).toBe(testComponent);
          expect(testComponent.info().subType).toBe(subType);
        });
      });
    });
  });

  describe('Type Safety', () => {
    describe('Component Type Inference', () => {
      it('should provide correct type inference for Rule components', () => {
        const testComponent = component('Rule', mockFunction());

        expectTypeOf(testComponent).toHaveProperty('traceable');
        expectTypeOf(testComponent).toHaveProperty('subType');
        expectTypeOf(testComponent).not.toHaveProperty('injectable');
      });

      it('should provide correct type inference for Object components', () => {
        const testComponent = component('Object', mockObject());

        expectTypeOf(testComponent).toHaveProperty('injectable');
        expectTypeOf(testComponent).not.toHaveProperty('traceable');
        expectTypeOf(testComponent).not.toHaveProperty('subType');
      });

      it('should provide correct type inference for Port components', () => {
        const testComponent = component('Port', mockInjectableObject);

        expectTypeOf(testComponent).toHaveProperty('injectable');
        expectTypeOf(testComponent).not.toHaveProperty('traceable');
        expectTypeOf(testComponent).not.toHaveProperty('subType');
      });
    });

    describe('Method Return Types', () => {
      it('should return correct types for meta method', () => {
        const testComponent = component('Rule', mockFunction());

        expectTypeOf(testComponent.meta).toBeFunction();
        expectTypeOf(
          testComponent.meta({
            name: 'test',
            description: 'desc',
            scope: 'test',
            example: 'example',
          }),
        ).toEqualTypeOf<typeof testComponent>();
      });

      it('should return correct types for parent method', () => {
        const testComponent = component('Rule', mockFunction());
        const parentComponent = component('Schema', mockFunction());

        expectTypeOf(testComponent.parent).toBeFunction();
        expectTypeOf(testComponent.parent(parentComponent)).toEqualTypeOf<typeof testComponent>();
      });

      it('should return correct types for info method', () => {
        const testComponent = component('Rule', mockFunction());

        expectTypeOf(testComponent.info).toBeFunction();
        expectTypeOf(testComponent.info()).toHaveProperty('id');
        expectTypeOf(testComponent.info()).toHaveProperty('tag');
        expectTypeOf(testComponent.info()).toHaveProperty('category');
      });
    });

    describe('Component Tag Types', () => {
      it('should accept all valid component tags', () => {
        const validTags = [
          'Aggregate',
          'Builder',
          'Command',
          'Criteria',
          'Event',
          'Flow',
          'Query',
          'Rule',
          'Schema',
          'Specification',
          'Value',
          'Port',
          'Adapter',
          'Service',
          'Container',
          'Object',
        ] as const;

        validTags.forEach((tag) => {
          if (tag === 'Object') {
            expectTypeOf(component).toBeCallableWith(tag, mockObject());
          } else {
            expectTypeOf(component).toBeCallableWith(tag, mockFunction());
          }
        });
      });
    });

    describe('Error Types', () => {
      it('should provide correct error types', () => {
        expectTypeOf(ComponentError).toBeObject();
        expect(() => {
          throw new ComponentError('AlreadyRegisteredError', 'Test error');
        }).toThrow(ComponentError);
      });
    });
  });
});
