import { event, events } from '@mixor/core';

import { UserEmail, UserId, UserPassword, UserStatus } from './user.schema';

const UserEvents = events([
  event('User created', {
    key: 'user.created',
    value: {
      id: UserId,
      email: UserEmail,
      password: UserPassword,
      status: UserStatus,
    },
  }),
  event('User password changed', {
    key: 'user.password.changed',
    value: {
      id: UserId,
    },
  }),
  event('User has been verified his email', {
    key: 'user.email.verified',
    value: {
      id: UserId,
      email: UserEmail,
    },
  }),
  event('Email changed', {
    key: 'user.email.changed',
    value: {
      id: UserId,
      oldEmail: UserEmail,
      newEmail: UserEmail,
    },
  }),
]);

export { UserEvents };
