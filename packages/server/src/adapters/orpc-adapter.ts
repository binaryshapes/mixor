/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Controller } from '@nuxo/components';
import { n } from '@nuxo/core';
import { OpenAPIHandler } from '@orpc/openapi/node';
import { onError, ORPCError, os, type ProcedureHandlerOptions } from '@orpc/server';
import { CORSPlugin } from '@orpc/server/plugins';
import { createServer } from 'node:http';

import type { AppAdapter } from '../app.ts';
import { resultToResponse } from '../utils.ts';

class OrpcAppAdapter implements AppAdapter {
  #controllers: Record<string, n.Any> = {};

  public init(port: number, host: string, name: string, version: string) {
    const handler = new OpenAPIHandler(this.#controllers, {
      plugins: [new CORSPlugin()],
      interceptors: [
        onError((error) => n.logger.error(error as string)),
      ],
    });

    const server = createServer(async (req, res) => {
      const result = await handler.handle(req, res, {
        context: { headers: req.headers },
      });

      if (!result.matched) {
        res.statusCode = 404;
        res.end('No procedure matched');
      }
    });

    server.listen(
      port,
      host,
      () => n.logger.success(`Listening on http://${host}:${port} - ${name} v${version}`),
    );
  }

  async #handler(
    args: ProcedureHandlerOptions<n.Any, n.Any, n.Any, n.Any>,
    controller: Controller<n.Any, n.Any, n.Any>,
  ) {
    const fnResult = await controller(args);
    const response = resultToResponse(fnResult);

    if (response.type === 'success') {
      return response.data;
    }

    throw new ORPCError(response.code, response);
  }

  public registerController(controller: Controller<n.Any, n.Any, n.Any>) {
    // console.log('Registering controller:', controller);
    const route = os
      .route({ method: controller.method, path: controller.path })
      .handler((args) => this.#handler(args, controller));

    const segments = controller.path.split('/').filter(Boolean);
    const basePath = segments.slice(0, -1).join('/');
    const subPath = segments[segments.length - 1] ?? '';

    this.#controllers[basePath] = { ...this.#controllers[basePath] ?? {}, [subPath]: route };
  }
}

export { OrpcAppAdapter };
