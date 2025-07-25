import { serve } from '@hono/node-server';
import { OpenAPIHono } from '@hono/zod-openapi';

import { isErr } from '@mixor/core';

import { userApi } from './user.api';

const app = new OpenAPIHono();

app.openapi(userApi.createUser.route, (c) => {
  const { email, password } = c.req.valid('json');
  const user = userApi.createUser.handler({ email, password });

  console.log('use case result', user);

  if (isErr(user)) {
    return c.json({ error: user.error.toString() }, 400);
  }

  return c.json({ id: user.value.getState().id }, 200);
});

app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'My API',
  },
});

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
