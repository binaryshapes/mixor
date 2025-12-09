/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { n } from '@nuxo/core';

import type { Task, TaskContract, TaskDependencies } from './task.ts';
import type { Workflow } from './workflow.ts';

/**
 * The tag for the controller component.
 *
 * @internal
 */
const CONTROLLER_TAG = 'Controller' as const;

/**
 * The list of all HTTP methods.
 *
 * @remarks
 * This constant defines all the supported HTTP methods that can be used
 * when creating a controller. The methods are: HEAD, GET, POST, PATCH, PUT, and DELETE.
 *
 * @public
 */
const HTTPMethods = ['HEAD', 'GET', 'POST', 'PATCH', 'PUT', 'DELETE'] as const;

/**
 * The type of the HTTP methods.
 *
 * @remarks
 * This type represents a union of all valid HTTP method strings that can be used
 * when creating a controller component.
 *
 * @public
 */
type HTTPMethods = typeof HTTPMethods[number];

/**
 * The type of the HTTP path.
 *
 * @remarks
 * A valid HTTP path must start with a forward slash. This type ensures that
 * all controller paths follow the correct format.
 *
 * @public
 */
type HTTPPath = `/${string}`;

/**
 * The type of the controller parameters.
 *
 * @remarks
 * This type represents the input parameters that are passed to a controller handler.
 * It includes the input data and an optional context object that can contain
 * additional metadata such as path parameters or request headers.
 *
 * @typeParam I - The type of the input data.
 *
 * @internal
 */
type ControllerParams<I> = n.Pretty<
  n.RemoveNevers<{
    input: I;
    context?: Record<string, string> | undefined;
  }>
>;

/**
 * The type of the controller handler function.
 *
 * @remarks
 * A controller handler is an async function that receives controller parameters
 * and returns a result that can either succeed with output data or fail with an error.
 * The handler processes HTTP requests and produces HTTP responses.
 *
 * @typeParam I - The type of the input data.
 * @typeParam O - The type of the output data.
 * @typeParam E - The type of the error data.
 *
 * @internal
 */
type ControllerHandler<I, O, E> = (args: ControllerParams<I>) => Promise<n.Result<O, E>>;

/**
 * Controller component type that represents an HTTP endpoint handler.
 *
 * @remarks
 * A controller is a component that handles HTTP requests for a specific path and method.
 * It can be configured with a workflow or task as its handler, and provides type-safe
 * access to input, output, and error types.
 *
 * Controllers are used to define API endpoints in a type-safe manner, integrating
 * with workflows and tasks to handle business logic.
 *
 * @typeParam I - The type of the input data.
 * @typeParam O - The type of the output data.
 * @typeParam E - The type of the error data.
 *
 * @public
 */
type Controller<I, O, E> = n.Component<
  typeof CONTROLLER_TAG,
  ControllerHandler<I, O, E> & ControllerBuilder & {
    /** Controller Errors type. */
    Errors: ControllerHandler<I, O, E> extends { Errors: infer E } ? E : unknown;
    /** Controller Input type. */
    Input: ControllerHandler<I, O, E> extends { Input: infer I } ? I : unknown;
    /** Controller Output type. */
    Output: ControllerHandler<I, O, E> extends { Output: infer O } ? O : unknown;
  }
>;

/**
 * The type of the controller route.
 *
 * @remarks
 * A controller route is a combination of an HTTP method and a HTTP path.
 *
 * @internal
 */
type ControllerRoute = {
  /**
   * The HTTP method for the controller route.
   *
   * @remarks
   * The HTTP method must be one of the supported HTTP methods.
   *
   * @see {@link HTTPMethods}
   */
  method: HTTPMethods;
  /**
   * The HTTP path for the controller route.
   */
  path: HTTPPath;
};

/**
 * Controller builder type.
 *
 * @remarks
 * Provides a fluent API for configuring a controller component. Use the builder methods to set:
 * - Handler function (via {@link ControllerBuilder.handler}).
 *
 * The builder automatically extracts path parameters from the path string and stores them
 * for later use in request processing.
 *
 * @internal
 */
class ControllerBuilder {
  /**
   * The HTTP path for this controller.
   */
  public path: HTTPPath = '/';

  /**
   * The extracted path parameters from the path string.
   *
   * @remarks
   * Path parameters are extracted from the path string by finding segments wrapped in
   * curly braces (e.g., "/users/{id}" extracts "id"). If no path parameters are found,
   * this value is `null`.
   */
  public pathParams: string | null = null;

  /**
   * The HTTP method for this controller.
   */
  public method: HTTPMethods = 'GET';

  /**
   * Configures the controller route.
   *
   * @remarks
   * This method automatically extracts path parameters from the provided path string.
   * Path parameters are segments wrapped in curly braces, for example:
   * - "/auth/hello/{name}" extracts "name".
   * - "/users/{userId}/posts/{postId}" extracts "userId,postId".
   *
   * @param route - The controller route to configure. Must include both method and path.
   * @returns The controller builder with the route configured.
   */
  public route(route: ControllerRoute) {
    const { path, method } = route;

    // Extract the path params from the path, for instance "/auth/hello/{name}" -> "name".
    const pathParams = path
      .split('/')
      .filter(Boolean)
      .filter((v) => v.startsWith('{') && v.endsWith('}'))
      .join()
      .replace('{', '')
      .replace('}', '')
      .trim() ?? '';

    this.pathParams = pathParams.trim().length > 0 ? pathParams.trim() : null;
    this.path = path;
    this.method = method;

    return this;
  }

  /**
   * Sets the handler function that processes the input and produces the output using a workflow.
   *
   * @remarks
   * The workflow must be a valid workflow component. The controller will delegate
   * request processing to the workflow, which can orchestrate multiple tasks and
   * handle complex business logic. See more in {@link Workflow}.
   *
   * @typeParam T - The type of the workflow component.
   * @param fn - The workflow component to handle the request.
   * @returns The controller component with the workflow handler configured.
   */
  public handler<T extends Workflow<n.Any>>(
    fn: T,
  ): Controller<T['Input'], T['Output'], T['Errors']>;

  /**
   * Sets the handler function that processes the input and produces the output using a task.
   *
   * @remarks
   * The task must be a valid task component. The controller will delegate request
   * processing to the task, which provides retry logic, error handling, and other
   * task-specific features. See more in {@link Task}.
   *
   * @typeParam C - The type of the task contract.
   * @typeParam D - The type of the task dependencies.
   * @param fn - The task component to handle the request.
   * @returns The controller component with the task handler configured.
   */
  public handler<
    C extends TaskContract,
    D extends TaskDependencies,
  >(fn: Task<C, D>): Controller<Task<C, D>['Input'], Task<C, D>['Output'], Task<C, D>['Errors']>;

  /**
   * Sets the handler function that processes the input and produces the output.
   *
   * @remarks
   * This method creates the controller component itself. The handler function receives
   * the controller parameters (input and optional context) and processes the request.
   * The handler can be a workflow, a task, or any other callable component.
   *
   * @param fn - The handler function or component to process the request.
   * @returns The controller component with the handler configured.
   */
  public handler(fn: n.Any) {
    // Here we create the controller component itself.
    // The handler function receives the input and context, and processes the request.
    return n.component(
      CONTROLLER_TAG,
      ({ input, ...rest }: ControllerParams<n.Any>) => fn({ rest, ...input }),
      this,
    );
  }
}

/**
 * Creates a controller builder in order to configure a new controller component.
 *
 * @remarks
 * A controller component is a representation of an HTTP endpoint handler. It handles:
 * - HTTP request routing (via path and method).
 * - Request processing (via workflow or task handlers).
 * - Type-safe input and output validation.
 * - Error handling and response generation.
 *
 * Use the builder methods to configure the controller, then call
 * {@link ControllerBuilder.handler} to set the handler and create the final controller component.
 *
 * @typeParam I - The type of the input data.
 * @typeParam O - The type of the output data.
 * @typeParam E - The type of the error data.
 *
 * @param path - The HTTP path for the controller (must start with "/").
 * @param method - The HTTP method for the controller.
 * @returns A controller builder ready to be configured into a controller component.
 *
 * @public
 */
const controller = <I, O, E>() => new ControllerBuilder() as Controller<I, O, E>;

/**
 * Type guard that checks if a component is a controller component.
 *
 * @remarks
 * This function performs a runtime check to determine if the given component
 * is a controller component by checking its tag. It can be used for type narrowing
 * in TypeScript to safely access controller-specific properties and methods.
 *
 * @typeParam I - The type of the input data.
 * @typeParam O - The type of the output data.
 * @typeParam E - The type of the error data.
 *
 * @param component - The component to check.
 * @returns `true` if the component is a controller, `false` otherwise.
 *
 * @public
 */
const isController = <I, O, E>(
  component: n.Any,
): component is Controller<I, O, E> => n.isComponent(component, CONTROLLER_TAG);

export { controller, HTTPMethods, isController };
export type { Controller, HTTPPath };
