import { createRoute, z } from '@hono/zod-openapi';

import { User } from './user.container';

const CreateUserRequest = z
  .object({
    email: z.string().openapi({
      description: 'Email address related to the user account',
      example: 'test@test.com',
    }),
    password: z.string().min(8).openapi({
      description: 'Password related to the user account',
      example: 'password',
    }),
  })
  .openapi('CreateUserRequest');

const CreateUserResponse = z
  .object({
    id: z.string().openapi({
      description: 'The user uuid version 4',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
  })
  .openapi('CreateUserResponse');

const CreateUserErrorResponse = z
  .object({
    error: z.string().openapi({
      description: 'The error message',
      example: 'The user has not been created successfully',
    }),
  })
  .openapi('CreateUserErrorResponse');

/**
 * Create a user.
 * @param input - The input of the user.
 * @returns The user.
 * @throws An error if the user creation fails.
 */
const createUser = (input: Parameters<typeof User.create>[0]) =>
  User.create({
    email: input.email,
    password: input.password,
  });

const createUserRoute = createRoute({
  method: 'post',
  path: '/user',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateUserRequest,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: CreateUserResponse,
        },
      },
      description: 'The user has been created successfully',
    },
    400: {
      content: {
        'application/json': {
          schema: CreateUserErrorResponse,
        },
      },
      description: 'The user has not been created successfully',
    },
  },
});

const userApi = {
  createUser: {
    route: createUserRoute,
    handler: createUser,
  },
};

export { userApi };
