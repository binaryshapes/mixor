/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { n } from '@nuxo/core';

/**
 * The type of the context.
 *
 * @public
 */
type Context = Record<string, n.Any>;

/**
 * Http common status codes.
 *
 * @public
 */
const HttpStatusCode = {
  BAD_REQUEST: {
    code: 'BAD_REQUEST',
    status: 400,
    message: 'Bad Request',
  },
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    status: 401,
    message: 'Unauthorized',
  },
  FORBIDDEN: {
    code: 'FORBIDDEN',
    status: 403,
    message: 'Forbidden',
  },
  NOT_FOUND: {
    code: 'NOT_FOUND',
    status: 404,
    message: 'Not Found',
  },
  METHOD_NOT_SUPPORTED: {
    code: 'METHOD_NOT_SUPPORTED',
    status: 405,
    message: 'Method Not Supported',
  },
  NOT_ACCEPTABLE: {
    code: 'NOT_ACCEPTABLE',
    status: 406,
    message: 'Not Acceptable',
  },
  TIMEOUT: {
    code: 'TIMEOUT',
    status: 408,
    message: 'Request Timeout',
  },
  CONFLICT: {
    code: 'CONFLICT',
    status: 409,
    message: 'Conflict',
  },
  PRECONDITION_FAILED: {
    code: 'PRECONDITION_FAILED',
    status: 412,
    message: 'Precondition Failed',
  },
  PAYLOAD_TOO_LARGE: {
    code: 'PAYLOAD_TOO_LARGE',
    status: 413,
    message: 'Payload Too Large',
  },
  UNSUPPORTED_MEDIA_TYPE: {
    code: 'UNSUPPORTED_MEDIA_TYPE',
    status: 415,
    message: 'Unsupported Media Type',
  },
  UNPROCESSABLE_CONTENT: {
    code: 'UNPROCESSABLE_CONTENT',
    status: 422,
    message: 'Unprocessable Content',
  },
  TOO_MANY_REQUESTS: {
    code: 'TOO_MANY_REQUESTS',
    status: 429,
    message: 'Too Many Requests',
  },
  CLIENT_CLOSED_REQUEST: {
    code: 'CLIENT_CLOSED_REQUEST',
    status: 499,
    message: 'Client Closed Request',
  },
  INTERNAL_SERVER_ERROR: {
    code: 'INTERNAL_SERVER_ERROR',
    status: 500,
    message: 'Internal Server Error',
  },
  NOT_IMPLEMENTED: {
    code: 'NOT_IMPLEMENTED',
    status: 501,
    message: 'Not Implemented',
  },
  BAD_GATEWAY: {
    code: 'BAD_GATEWAY',
    status: 502,
    message: 'Bad Gateway',
  },
  SERVICE_UNAVAILABLE: {
    code: 'SERVICE_UNAVAILABLE',
    status: 503,
    message: 'Service Unavailable',
  },
  GATEWAY_TIMEOUT: {
    code: 'GATEWAY_TIMEOUT',
    status: 504,
    message: 'Gateway Timeout',
  },
} as const;

/**
 * The type of the HTTP status code.
 *
 * @public
 */
type HttpStatusCode = keyof typeof HttpStatusCode;

export { HttpStatusCode };
export type { Context };
