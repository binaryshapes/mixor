import { aggregate, flow, ok } from '@mixor/core';

import { UserEvents } from './user.events';
import { UserSchema } from './user.schema';
import { UserShouldBeActive, UserShouldBeUnverified } from './user.specs';

const User = aggregate('User', {
  schema: UserSchema,
  events: UserEvents,
  specs: {
    UserShouldBeUnverified,
    UserShouldBeActive,
  },
  methods: ({ self, fn }) => ({
    changeEmail: fn(
      'Change user email',
      flow<string>()
        .bind('emails', (email) => {
          const emails = { oldEmail: self.getState().email, newEmail: email };
          self.set('email', email);
          return ok(emails);
        })
        .tap(({ emails: { oldEmail, newEmail } }) =>
          self.emit('user.email.changed', {
            id: self.getState().id,
            oldEmail,
            newEmail,
          }),
        )
        .build(),
      {
        before: UserShouldBeActive,
      },
    ),
  }),
});

export { User };
