/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * A JSON Schema type for OpenAPI and other purposes.
 *
 * @public
 */
type JsonSchema = {
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null';
  enum?: readonly string[] | readonly number[];
  format?:
    | 'date-time'
    | 'date'
    | 'time'
    | 'email'
    | 'uri'
    | 'url'
    | 'uuid'
    | 'ipv4'
    | 'ipv6'
    | 'hostname'
    | 'regex'
    | 'int32'
    | 'int64'
    | 'float'
    | 'double'
    | 'byte'
    | 'binary'
    | 'password';
  description?: string;
  example?: unknown;
  default?: unknown;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  items?: JsonSchema;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean | JsonSchema;
  nullable?: boolean;
};

export type { JsonSchema };
