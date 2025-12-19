/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { n } from '@nuxo/core';
import type { StandardSchemaV1 } from '@standard-schema/spec';

import { DEFAULT_ERROR_MODE, STANDARD_SCHEMA_ERROR_MODE } from './constants.ts';
import type { JsonSchema } from './types.ts';
import type { Value } from './value.ts';

/**
 * The tag for the schema component.
 *
 * @internal
 */
const SCHEMA_TAG = 'Schema' as const;

/**
 * Maps field names to their corresponding {@link Value} components.
 *
 * @remarks
 * This is the input type for the schema function, where each key represents a field name and each
 * value is a Value component that validates that field.
 *
 * @public
 */
type SchemaValues = Record<string, Value<n.Any, n.Any, boolean>>;

/**
 * Infers the TypeScript type of the validated data structure from the schema values.
 *
 * @remarks
 * This type extracts the inferred types from each Value component in the schema, creating a mapped
 * type that represents the structure of validated data. Fields that include undefined are marked as
 * optional, maintaining the original property order.
 *
 * @typeParam V - The schema values type.
 *
 * @internal
 */
type SchemaType<V extends SchemaValues> = n.UndefToOptional<
  {
    [K in keyof V]: V[K]['Type'];
  }
>;

/**
 * Infers the error type structure based on the schema values and validation mode.
 *
 * @remarks
 * This type extracts the error types from each Value component in the schema, creating a mapped
 * type that represents the structure of validation errors. The error format depends on the
 * validation mode ({@link n.ErrorMode}).
 *
 * @typeParam V - The schema values type.
 * @typeParam Mode - The error mode ({@link n.ErrorMode}).
 *
 * @public
 */
type SchemaErrors<V extends SchemaValues, Mode extends n.ErrorMode> = n.Pretty<
  Partial<
    n.RemoveNevers<
      {
        [K in keyof V]: V[K] extends Value<n.Any, infer E> ? n.ApplyErrorMode<E, Mode> : never;
      }
    >
  >
>;

/**
 * Metadata structure for schema components.
 *
 * @remarks
 * Stores additional information about the schema, such as example valid data  structures that
 * match the schema.
 *
 * @typeParam V - The schema values type.
 *
 * @internal
 */
type SchemaMeta<V extends SchemaValues> = {
  // TODO: Make this as full compatible with JSON Schema.
  /**
   * The example valid data structures that match the schema.
   */
  examples: SchemaType<V>[];
};

/**
 * The possible failures for the schema.
 *
 * @internal
 */
type SchemaFailures = typeof n.INPUT_FAILURES_KEY | typeof n.OUTPUT_FAILURES_KEY;

/**
 * Options for schema validation.
 *
 * @remarks
 * Configures the validation behavior of the schema, including the error mode and the type of
 * failures to return. The error mode determines how validation errors are collected, while the
 * error type specifies whether to use input or output failures.
 *
 * @typeParam M - The error mode ({@link n.ErrorMode}).
 * @typeParam E - The error type, either input or output failures key.
 *
 * @internal
 */
type SchemaOptions<
  M extends n.ErrorMode,
  E extends SchemaFailures,
> = {
  mode?: M;
  errorType?: E;
};

/**
 * Function signature for schema validation.
 *
 * @remarks
 * A generic validation function that accepts a value to validate and an optional validation mode.
 * The function validates the input against all value components in the schema and returns a
 * Result with either the validated data or errors.
 *
 * @typeParam V - The schema values type.
 * @typeParam T - The inferred type from the schema values.
 *
 * @internal
 */
type SchemaFunction<
  V extends SchemaValues,
  T = SchemaType<V>,
> = <
  M extends n.ErrorMode | never = never,
  E extends SchemaFailures | never = never,
>(
  value: T,
  options?: SchemaOptions<M, E>,
) => n.Result<
  T,
  [E] extends [never]
    ? [M] extends [never] ? { [n.INPUT_FAILURES_KEY]: SchemaErrors<V, typeof DEFAULT_ERROR_MODE> }
    : { [n.INPUT_FAILURES_KEY]: SchemaErrors<V, M> }
    : E extends typeof n.OUTPUT_FAILURES_KEY ? { [n.OUTPUT_FAILURES_KEY]: SchemaErrors<V, M> }
    : { [n.OUTPUT_FAILURES_KEY]: SchemaErrors<V, M> }
>;

/**
 * Creates a new schema type with only the specified keys picked from the original schema.
 *
 * @remarks
 * This utility type extracts a subset of fields from a schema, creating a new schema type that
 * contains only the selected keys. Useful for creating partial schemas or focusing on specific
 * fields for validation.
 *
 * @typeParam V - The schema values type.
 * @typeParam Picked - The keys to pick from the schema.
 *
 * @internal
 */
type PickSchema<V extends SchemaValues, Picked extends keyof V> = n.Pretty<
  {
    [K in Picked]: V[K];
  }
>;

/**
 * Creates a new schema type with the specified keys omitted from the original schema.
 *
 * @remarks
 * This utility type removes specific fields from a schema, creating a new schema type that
 * excludes the specified keys. Useful for creating schemas that exclude certain fields while
 * keeping the rest.
 *
 * @typeParam V - The schema values type.
 * @typeParam Omitted - The keys to omit from the schema.
 *
 * @internal
 */
type OmitSchema<V extends SchemaValues, Omitted extends keyof V> = n.Pretty<
  {
    [K in keyof V as K extends Omitted ? never : K]: V[K];
  }
>;

/**
 * Creates a new schema type by extending the original schema with additional values.
 *
 * @remarks
 * This utility type merges the original schema with additional value components, creating a new
 * schema type that includes all fields from both schemas. If there are overlapping keys, the
 * additional values take precedence.
 *
 * @typeParam V - The original schema values.
 * @typeParam A - The additional values to extend with.
 *
 * @internal
 */
type ExtendSchema<V extends SchemaValues, A extends SchemaValues> = n.Pretty<V & A>;

/**
 * Creates a new schema type where all values are optional.
 *
 * @remarks
 * This utility type transforms all fields in the schema to be optional, allowing them to be
 * undefined. The resulting schema type will have all properties marked as optional, making them
 * non-required during validation.
 *
 * @typeParam V - The schema values type.
 *
 * @internal
 */
type PartialSchema<V extends SchemaValues> = n.Pretty<
  {
    [K in keyof V]: V[K] extends Value<infer T extends n.DataValue, infer E>
      ? Value<T | undefined, E, false>
      : never;
  }
>;

/**
 * Creates a new schema type where all values are required.
 *
 * @remarks
 * This utility type transforms all fields in the schema to be required, ensuring they must be
 * present during validation. The resulting schema type will have all properties marked as
 * required, making them mandatory.
 *
 * @typeParam V - The schema values type.
 *
 * @internal
 */
type RequiredSchema<V extends SchemaValues> = n.Pretty<
  {
    [K in keyof V]: V[K] extends Value<infer T extends n.DataValue, infer E> ? Value<T, E, true>
      : never;
  }
>;

/**
 * Standard Schema issue extended with custom properties.
 *
 * @remarks
 * Extends the Standard Schema issue type with additional properties specific to Nuxo's error
 * handling system. The code property provides a standardized way to identify error types across
 * the validation system.
 *
 * @internal
 */
type StandardSchemaIssueExtended = StandardSchemaV1.Issue & {
  /**
   * The code of the issue (equivalent to the error code in Nuxo).
   */
  code: string;
};

/**
 * The schema component type.
 *
 * @remarks
 * A component that wraps a schema validation function with its associated values and metadata.
 * The schema component can be used to validate complex object structures against defined
 * value validators.
 *
 * @typeParam V - The schema values type.
 *
 * @public
 */
type Schema<
  V extends SchemaValues,
> = n.Component<
  typeof SCHEMA_TAG,
  & SchemaFunction<V>
  & SchemaBuilder<V>
  & StandardSchemaV1<SchemaType<V>>
  & { Errors: { [n.INPUT_FAILURES_KEY]: SchemaErrors<V, typeof DEFAULT_ERROR_MODE> } },
  SchemaType<V>,
  SchemaMeta<V>
>;

/**
 * Panic error for the schema module.
 *
 * - `AtLeastOneKeyRequired`: At least one key must be provided to pick values from the schema.
 * - `InvalidKey`: The key is not a valid value in the schema.
 * - `InvalidInputSchemaValue`: The value does not have all the keys of the schema.
 *
 * @public
 */
class SchemaPanic extends n.panic<
  typeof SCHEMA_TAG,
  'AtLeastOneKeyRequired' | 'InvalidKey' | 'InvalidInputSchemaValue'
>(SCHEMA_TAG) {}

/**
 * Schema component builder class which provides methods to manipulate and transform schemas.
 *
 * @remarks
 * Provides utility methods for schema manipulation, including picking and omitting fields,
 * extending schemas, making fields optional or required, and converting schemas to JSON Schema
 * format.
 *
 * @typeParam V - The schema values type.
 *
 * @internal
 */
class SchemaBuilder<V extends SchemaValues> {
  /**
   * Constructor for the schema builder.
   *
   * @param values - The values of the schema.
   */
  constructor(public values: V) {}
  /**
   * Validates the keys of the schema.
   *
   * @remarks
   * This method validates that at least one key is provided and that all specified keys exist
   * in the schema. Throws a panic error if validation fails.
   *
   * @param values - An object containing the keys to validate, where each key should exist in
   * the schema. At least one key must be provided.
   *
   * @internal
   */
  private validateKeys(values: SchemaValues) {
    // Runtime assertion check that at least one key must be provided.
    if (Object.keys(values).length === 0) {
      throw new SchemaPanic(
        'AtLeastOneKeyRequired',
        'At least one key must be provided to pick values from the schema.',
        `Valid keys are: ${Object.keys(this.values).join(', ')}`,
      );
    }

    // Runtime assertion check that all keys are valid.
    for (const key of Object.keys(values)) {
      if (!(key in this.values)) {
        throw new SchemaPanic(
          'InvalidKey',
          `Key "${key}" is not a valid value in the schema`,
          `Valid keys are: ${Object.keys(this.values).join(', ')}`,
        );
      }
    }
  }

  /**
   * Creates a new schema with only the specified values.
   *
   * @param values - Object with keys to pick, at least one key must be provided.
   * @returns A new schema with only the picked values.
   */
  public pick<Picked extends keyof V>(values: n.RequireAtLeastOne<Record<Picked, true>>) {
    this.validateKeys(values);

    // Initialize a new schema with the picked values.
    const pickedValues = Object.fromEntries(
      Object.entries(values)
        .filter(([, shouldPick]) => shouldPick)
        .map(([key]) => [key, this.values[key]]),
    );

    return schema(pickedValues) as unknown as Schema<PickSchema<V, Picked>>;
  }

  /**
   * Creates a new schema with the specified values omitted.
   *
   * @param values - Object with keys to omit, at least one key must be provided.
   * @returns A new schema with the omitted values.
   */
  public omit<Omitted extends keyof V>(values: n.RequireAtLeastOne<Record<Omitted, true>>) {
    this.validateKeys(values);

    // Initialize a new schema with the omitted values.
    const omittedValues = Object.fromEntries(
      Object.entries(this.values)
        .filter(([key]) => !(key in values) || !values[key as keyof typeof values]),
    );

    return schema(omittedValues) as unknown as Schema<OmitSchema<V, Omitted>>;
  }

  /**
   * Extends the schema with additional values.
   *
   * @param additionalValues - The additional values to extend with.
   * @returns A new schema with the additional values.
   */
  public extend<A extends SchemaValues>(additionalValues: A) {
    return schema({
      ...this.values,
      ...additionalValues,
    }) as unknown as Schema<ExtendSchema<V, A>>;
  }

  /**
   * Creates a new schema with all values optional.
   *
   * @returns A new schema with all values optional.
   */
  public partial() {
    return schema(Object.fromEntries(
      Object.entries(this.values).map(([key, value]) => [key, value.optional()]),
    )) as unknown as Schema<PartialSchema<V>>;
  }

  /**
   * Creates a new schema with all values required.
   *
   * @returns A new schema with all values required.
   */
  public required() {
    return schema(Object.fromEntries(
      Object.entries(this.values).map(([key, value]) => [key, value.required()]),
    )) as unknown as Schema<RequiredSchema<V>>;
  }

  /**
   * Converts the schema to JSON Schema format.
   *
   * @remarks
   * This method converts the Nuxo schema to a JSON Schema object that can be used
   * with OpenAPI and other tools that support JSON Schema.
   * Under the hood, use the toJsonSchema method for each value in the schema and add some specific
   * properties related to the Schema component.
   *
   * @returns A JSON Schema object representing the schema structure.
   */
  public toJsonSchema(): JsonSchema {
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];

    for (const [fieldName, value] of Object.entries(this.values)) {
      properties[fieldName] = value.toJsonSchema();
      if (!value.isOptional) {
        required.push(fieldName);
      }
    }

    const jsonSchema: JsonSchema = {
      type: 'object',
      properties,
    };

    // Only include required array if there are required fields
    if (required.length > 0) {
      jsonSchema.required = required;
    }

    return jsonSchema;
  }
}

/**
 * Creates a new schema component.
 *
 * A schema is a collection of values that can be validated together. It provides
 * a structured way to validate complex objects by defining individual value validators
 * for each field.
 *
 * @remarks
 * - Supports two validation modes: 'strict' (stops at first error) and 'all' (collects all errors).
 * - Automatically constructs error objects based on the validation mode.
 * - Type-safe validation with inferred types from the value definitions.
 *
 * @typeParam V - The schema values type, which must be a record of Value components.
 * @param values - A record where each key is a field name and each value is a Value component.
 * @returns A schema component that can be used to validate objects matching the schema structure.
 */
const schema = <
  V extends SchemaValues,
>(values: V): Schema<V> => {
  const schemaFn = <
    M extends n.ErrorMode,
    E extends typeof n.INPUT_FAILURES_KEY | typeof n.OUTPUT_FAILURES_KEY,
  >(
    value: SchemaType<V>,
    options?: SchemaOptions<M, E>,
  ) => {
    // Default options.
    const mode = options?.mode ?? DEFAULT_ERROR_MODE as M;
    const errorType = options?.errorType ?? n.INPUT_FAILURES_KEY as E;

    // Check if the given value has all keys of the schema (all required keys must be present).
    const missedKeys = Object.keys(values).filter((key) =>
      !(key in value) && !values[key as keyof typeof values].isOptional
    );

    if (missedKeys.length > 0) {
      throw new SchemaPanic(
        'InvalidInputSchemaValue',
        'The value does not have all the keys of the schema.',
        n.doc`
        Valid keys are: ${Object.keys(values).join(', ')}
        The missed keys are: ${missedKeys.join(', ')}
        The received value is: ${JSON.stringify(value, null, 2)}
        `,
      );
    }

    // Strict mode: Useful when you want to fail fast and don't need all validation errors.
    if (mode === 'strict') {
      const result = {} as Record<string, n.Any>;

      // Validate each field in the schema sequentially.
      for (const fieldName of Object.keys(values)) {
        const fieldFn = values[fieldName];
        const fieldResult = fieldFn(value[fieldName as keyof typeof value], mode);

        if (n.isOk(fieldResult)) {
          // Field validation succeeded, add it to the result object.
          result[fieldName] = fieldResult.value;
        } else {
          // Field validation failed, return error immediately (strict mode).
          return n.err({ [`$${errorType}`]: { [fieldName]: fieldResult.error } } as n.Any);
        }
      }

      // All fields validated successfully.
      return n.ok(result as SchemaType<V>);
    }

    // All mode: Collect all errors, more complete error reporting.
    const { result, errors, hasErrors } = Object.keys(values).reduce(
      (acc, fieldName) => {
        const fieldFn = values[fieldName];
        const fieldResult = fieldFn(value[fieldName as keyof typeof value], mode);

        if (n.isOk(fieldResult)) {
          // Field validation succeeded, add it to the result object.
          acc.result[fieldName] = fieldResult.value;
        } else {
          // Field validation failed, accumulate the error.
          acc.errors[fieldName] = fieldResult.error;
          acc.hasErrors = true;
        }

        return acc;
      },
      {
        result: {} as Record<string, n.Any>,
        errors: {} as Record<string, n.Any>,
        hasErrors: false,
      },
    );

    // Return errors if any validation failed, otherwise return the validated result.
    return hasErrors
      ? n.err({ [`$${errorType}`]: errors } as n.Any)
      : n.ok(result as SchemaType<V>);
  };

  /**
   * Converts schema errors to Standard Schema issues format.
   *
   * @param errors - The error object from schema validation.
   * @returns Array of issues in Standard Schema format.
   *
   * @internal
   */
  const convertErrorsToIssues = (errors: Record<string, n.Any>): StandardSchemaIssueExtended[] => {
    const issues: StandardSchemaIssueExtended[] = [];

    const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

    for (const [fieldName, error] of Object.entries(errors)) {
      issues.push({
        // Standard schema issue field.
        path: [fieldName],
        message: `${capitalize(fieldName)} validation failed`,

        // Custom fields.
        code: error,
      });
    }

    return issues;
  };

  /**
   * Standard Schema validate function.
   *
   * @param value - The value to validate.
   * @returns Validation result in Standard Schema format.
   *
   * @internal
   */
  const standardValidate = (value: SchemaType<V>): StandardSchemaV1.Result<SchemaType<V>> => {
    const result = schemaFn(value as SchemaType<V>, { mode: STANDARD_SCHEMA_ERROR_MODE });

    if (n.isOk(result)) {
      return { value: result.value };
    }

    return { issues: convertErrorsToIssues(result.error) };
  };

  // Initialize the schema builder and create the schema component.
  const schemaBuilder = new SchemaBuilder(values);
  const schemaComponent = n.component(SCHEMA_TAG, schemaFn, schemaBuilder, {
    // This ensures the value names as part of the uniqueness of the schema component.
    fields: Object.keys(values),

    // Add Standard Schema support.
    '~standard': { version: 1, vendor: 'nuxo', validate: standardValidate },
  });

  // Auto infer the schema type from the values.
  const schemaType = Object.fromEntries(
    Object.entries(values).map(([key, fn]) => [key, n.info(fn).props.type as string]),
  );

  // Only set the type and parameters if they are not already set.
  if (!n.info(schemaComponent).props.type) {
    // Add the schema type to the schema component.
    n.info(schemaComponent).type(schemaType);

    // Add the schema parameters to the schema (category: function).
    n.info(schemaComponent).params(['input', schemaType]);
  }

  // Adding the values as children of the schema component.
  n.meta(schemaComponent).children(...Object.values(values));

  // Adding the schema as a referenced object of the values.
  for (const v of Object.values(values)) {
    n.info(v).refs(schemaComponent);
  }

  return schemaComponent as Schema<V>;
};

/**
 * Type guard function to check if an object is a schema component.
 *
 * @remarks
 * Performs a runtime check to determine if the provided object is a valid schema component
 * by verifying its component tag.
 *
 * @param maybeSchema - The object to check.
 * @returns True if the object is a schema component, false otherwise.
 *
 * @public
 */
const isSchema = (maybeSchema: n.Any): maybeSchema is Schema<n.Any> =>
  n.isComponent(maybeSchema, SCHEMA_TAG);

export { isSchema, schema };
export type { Schema, SchemaErrors, SchemaValues };
