import { ComponentError, component, isComponent, tracer } from '../src/component';
import { ok } from '../src/result';

/**
 * component-001: Basic component creation for a function.
 */
function componentBasicFunctionCreation() {
  console.log('component-001: Basic component creation for a function');

  const testFunction = (input: string) => ok(input.toUpperCase());
  const componentInstance = component('Rule', testFunction);

  console.log('Component created:', componentInstance);
  console.log('Component info:', componentInstance.info());
  // output: Component created with Rule tag and function capabilities
}

/**
 * component-002: Basic component creation for an object.
 */
function componentBasicObjectCreation() {
  console.log('component-002: Basic component creation for an object');

  const testObject = { name: 'TestService', version: '1.0.0' };
  const componentInstance = component('Object', testObject);

  console.log('Component created:', componentInstance);
  console.log('Component info:', componentInstance.info());
  // output: Component created with Object tag and object capabilities
}

/**
 * component-003: Injectable component creation.
 */
function componentInjectableCreation() {
  console.log('component-003: Injectable component creation');

  const service = { name: 'UserService', getUser: () => ({ id: 1, name: 'John' }) };
  const componentInstance = component('Object', service).injectable();

  console.log('Injectable component created:', componentInstance);
  console.log('Component info:', componentInstance.info());
  // output: Injectable component with Service tag
}

/**
 * component-004: Traceable component creation.
 */
function componentTraceableCreation() {
  console.log('component-004: Traceable component creation');

  const rule = (input: number) => ok(input * 2);
  const componentInstance = component('Rule', rule).traceable();

  console.log('Traceable component created:', componentInstance);
  console.log('Component info:', componentInstance.info());
  // output: Traceable component with Rule tag
}

/**
 * component-005: Component with metadata.
 */
function componentWithMetadata() {
  console.log('component-005: Component with metadata');

  const schema = (data: any) => ok(data);
  const componentInstance = component('Schema', schema).meta({
    name: 'UserSchema',
    description: 'Validates user data structure',
    scope: 'authentication',
    example: { id: 1, email: 'user@example.com' },
  });

  console.log('Component with metadata:', componentInstance);
  console.log('Component info:', componentInstance.info());
  // output: Component with custom metadata and example
}

/**
 * component-006: Component with parent relationship.
 */
function componentWithParent() {
  console.log('component-006: Component with parent relationship');

  const parentRule = component('Rule', (input: string) => ok(input.length > 0));
  const childRule = component('Rule', (input: string) => ok(input.toUpperCase()));

  childRule.parent(parentRule);

  console.log('Child component info:', childRule.info());
  console.log('Parent ID:', childRule.info().parentId);
  // output: Child component with parent relationship established
}

/**
 * component-007: Component subtype specification.
 */
function componentWithSubtype() {
  console.log('component-007: Component subtype specification');

  const valueComponent = component('Value', (input: string) => ok(input));
  const typedComponent = valueComponent.subType('string');

  console.log('Component with subtype:', typedComponent);
  console.log('Subtype:', typedComponent.info().subType);
  // output: Component with string subtype specified
}

/**
 * component-008: Component validation with isComponent.
 */
function componentValidation() {
  console.log('component-008: Component validation with isComponent');

  const regularFunction = () => ok('test');
  const componentInstance = component('Rule', regularFunction);

  console.log('Is regular function a component?', isComponent(regularFunction));
  console.log('Is component instance a component?', isComponent(componentInstance));
  console.log('Is component instance a Rule?', isComponent(componentInstance, 'Rule'));
  // output: Validation results for different objects
}

/**
 * component-009: Tracer event subscription.
 */
function tracerEventSubscription() {
  console.log('component-009: Tracer event subscription');

  const tracedFunction = component('Rule', (input: number) => ok(input * 2)).traceable();

  tracer.on('start', (data) => {
    console.log('Tracer start event:', data.traceId);
  });

  tracer.on('finish', (data) => {
    console.log('Tracer finish event:', data);
  });

  const result = tracedFunction(5);
  console.log('Function result:', result);
  // output: Tracer events emitted and captured
}

/**
 * component-010: Tracer statistics.
 */
function tracerStatistics() {
  console.log('component-010: Tracer statistics');

  const stats = tracer.stats();
  console.log('Tracer stats:', stats);
  console.log('Available events:', stats.events);
  console.log('Max listeners:', stats.maxListeners);
  // output: Tracer configuration and statistics
}

/**
 * component-011: Error handling with ComponentError.
 */
function componentErrorHandling() {
  console.log('component-011: Error handling with ComponentError');

  try {
    // This should throw an error
    component('Rule', null as any);
  } catch (error) {
    if (error instanceof ComponentError) {
      console.log('ComponentError caught:', error.message);
      console.log('Error type:', error.code);
    }
  }
  // output: ComponentError properly caught and handled
}

/**
 * component-012: Component chaining methods.
 */
function componentMethodChaining() {
  console.log('component-012: Component method chaining');

  const chainedComponent = component('Rule', (input: string) => ok(input))
    .meta({
      name: 'ChainedRule',
      description: 'Demonstrates method chaining',
      scope: 'example',
      example: 'example string',
    })
    .traceable()
    .subType('string');

  console.log('Chained component:', chainedComponent);
  console.log('Component info:', chainedComponent.info());
  // output: Component with multiple methods chained together
}

// Execute all examples
console.log('=== Component Module Examples ===\n');

componentBasicFunctionCreation();
console.log('');

componentBasicObjectCreation();
console.log('');

componentInjectableCreation();
console.log('');

componentTraceableCreation();
console.log('');

componentWithMetadata();
console.log('');

componentWithParent();
console.log('');

componentWithSubtype();
console.log('');

componentValidation();
console.log('');

tracerEventSubscription();
console.log('');

tracerStatistics();
console.log('');

componentErrorHandling();
console.log('');

componentMethodChaining();
console.log('');

console.log('=== All Examples Completed ===');
