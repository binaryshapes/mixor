import { n } from '@nuxo/core';
import { HttpStatusCode } from './types.ts';

/**
 * The error response.
 *
 * @public
 */
type ResponseError = {
  type: 'error';
  status: number;
  message: string;
  code: string;
  data: n.Any;
};

/**
 * The success response.
 *
 * @public
 */
type ResponseOk = {
  type: 'success';
  data: n.Any;
};

/**
 * Utility function to convert a result to an HTTP response.
 *
 * @param result - The result to convert.
 * @returns The HTTP response.
 *
 * @public
 */
const resultToResponse = (result: n.Result<n.Any, n.Any>): ResponseError | ResponseOk => {
  if (n.isOk(result)) {
    return {
      type: 'success',
      data: result.value,
    };
  }

  // Processing errors.
  const errors = result.error as { $input?: n.Any; $output?: n.Any; $error?: n.Any };

  if ('$input' in errors) {
    return {
      type: 'error',
      data: errors.$input,
      ...HttpStatusCode.BAD_REQUEST,
    };
  }

  if ('$output' in errors) {
    return {
      type: 'error',
      data: errors.$output,
      ...HttpStatusCode.INTERNAL_SERVER_ERROR,
    };
  }

  if ('$error' in errors && errors.$error !== 'PANIC_ERROR') {
    return {
      type: 'error',
      data: errors.$error,
      ...HttpStatusCode.PRECONDITION_FAILED,
    };
  }

  // This should never happen, but we log it for debugging purposes.
  n.logger.debug(`Unknown error: ${JSON.stringify(errors)}`);

  return {
    type: 'error',
    data: errors,
    ...HttpStatusCode.INTERNAL_SERVER_ERROR,
  };
};

export { resultToResponse };
