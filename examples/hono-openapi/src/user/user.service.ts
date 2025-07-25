import { flow, service } from '@mixor/core';

import { User } from './user.aggregate';
import { UserIdGenerator, UserPasswordHasher } from './user.ports';
import { type UserProps } from './user.schema';

type UserCreateInput = Pick<UserProps, 'email' | 'password'>;

const UserService = service(
  { idGenerator: UserIdGenerator, passwordHasher: UserPasswordHasher },
  ({ idGenerator, passwordHasher }) => ({
    create: flow<UserCreateInput>()
      .bind('id', () => idGenerator.generate())
      .bind('hashedPassword', (input) => passwordHasher.hash(input.password))
      .map(({ email, id, hashedPassword }) =>
        User({
          id,
          email,
          password: hashedPassword,
          status: 'unverified',
        }),
      )
      .tap((user) => user.emit('user.created', user))
      .build(),
  }),
);

export { UserService };
