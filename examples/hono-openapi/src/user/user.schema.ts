import { type InferSchema, schema, value } from '@mixor/core';
import { email, enumerate, str, uuid } from '@mixor/values';

const UserId = value(uuid);
const UserEmail = value(email.isEmail().build());
const UserPassword = value(str.hasMinLength(8).hasMaxLength(16).build());
const UserStatus = value(enumerate(['active', 'inactive', 'unverified']));

const UserSchema = schema({
  id: UserId,
  email: UserEmail,
  password: UserPassword,
  status: UserStatus,
});

type UserProps = InferSchema<typeof UserSchema>;

export type { UserProps };
export { UserId, UserEmail, UserPassword, UserStatus, UserSchema };
