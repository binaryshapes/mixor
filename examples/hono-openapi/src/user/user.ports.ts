import { type Result, port } from '@mixor/core';

import type { UserProps } from './user.schema';

const UserPasswordHasher = port<{
  hash: (password: UserProps['password']) => Result<UserProps['password'], 'CANNOT_HASH_PASSWORD'>;
  verify: (
    password: UserProps['password'],
    hashPassword: UserProps['password'],
  ) => Result<boolean, 'CANNOT_VERIFY_PASSWORD'>;
}>();

const UserIdGenerator = port<{
  generate: () => Result<UserProps['id'], 'CANNOT_GENERATE_ID'>;
}>();

export { UserPasswordHasher, UserIdGenerator };
