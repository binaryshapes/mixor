import { err, ok, spec } from '@mixor/core';

import type { UserProps } from './user.schema';

const UserShouldBeUnverified = spec<UserProps>()
  .rule('User should be unverified in order to activate his account', (u) =>
    ['active', 'inactive'].includes(u.status) ? ok(u) : err('USER_SHOULD_BE_UNVERIFIED'),
  )
  .build();

const UserShouldBeActive = UserShouldBeUnverified.not('USER_SHOULD_BE_ACTIVE');

export { UserShouldBeUnverified, UserShouldBeActive };
