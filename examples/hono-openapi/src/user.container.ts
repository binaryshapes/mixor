import { adapter, container, ok } from '@mixor/core';

import { UserIdGenerator, UserPasswordHasher, UserService } from './user';
import type { UserProps } from './user';

const UUIDIdGenerator = adapter<typeof UserIdGenerator>(() => {
  return {
    generate: () => ok(crypto.randomUUID()),
  };
});

const LocalPasswordHasher = adapter<typeof UserPasswordHasher>(() => {
  return {
    hash: (password: UserProps['password']) =>
      ok(password.padEnd(16, 'x') as UserProps['password']),
    verify: (password: UserProps['password'], hashPassword: UserProps['password']) =>
      ok(password === hashPassword),
  };
});

const UserContainer = container()
  .add(UserService)
  .bind(UserIdGenerator, UUIDIdGenerator)
  .bind(UserPasswordHasher, LocalPasswordHasher);

const User = UserContainer.get(UserService);

export { User };
