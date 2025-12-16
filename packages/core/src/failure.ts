/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Component, component } from './component.ts';
import { type I18n, i18n, type I18nLanguage, type I18nTranslations } from './i18n.ts';

/**
 * The tag for the failure component.
 *
 * @internal
 */
const FAILURE_TAG = 'Failure' as const;

/**
 * The type for the failure component.
 *
 * @typeParam Code - The code of the failure.
 * @typeParam Languages - The languages of the failure.
 * @typeParam Templates - The templates of the failure.
 *
 * @public
 */
type Failure<
  Code extends string,
  Languages extends I18nLanguage,
  Templates extends string,
> = Component<
  typeof FAILURE_TAG,
  new (params: I18n<Code, Languages, Templates>['Params']) => Error & {
    code: Code;
    params: I18n<Code, Languages, Templates>['Params'];
    t: (language: Languages) => string;
  }
>;

/**
 * Creates a failure component.
 *
 * @remarks
 * The failure component mostly serves as a wrapper for the i18n translations for expected errors
 * in the system, which means can be used as a value in a Result function, as a custom error type,
 * etc. For instance the rule and value components use the failure component to return errors.
 *
 * The failure component inherits from the Error class, so it can be thrown and caught like any
 * other error and has the error tracking capabilities. The error message is the translated message
 * for the given code and parameters and default language.
 *
 * @param code - The code of the failure.
 * @param translations - The translations of the failure.
 * @param params - The parameters of the failure.
 * @returns The failure component.
 *
 * @public
 */
const failure = <
  Code extends string,
  Languages extends I18nLanguage,
  Templates extends string,
>(
  code: Code,
  translations: I18nTranslations<Languages, Templates>,
) => {
  // Register the translations in the i18n system.
  const tr = i18n.add({ [code]: translations });

  /**
   * The failure error class.
   *
   * @remarks
   * The failure error class is a subclass of the Error class and inherits from the failure
   * component. It is used to create new failure instances.
   */
  class FailureError extends Error {
    public readonly code: Code = code;
    public readonly params: I18n<Code, Languages, Templates>['Params'];
    public readonly t: (l: Languages) => string;
    constructor(params: I18n<Code, Languages, Templates>['Params']) {
      // The error message is the translated message for the given code and parameters and
      // default language.
      super(tr.t(code, params));
      this.params = params;

      // This is the translation function.
      this.t = (l: Languages) => tr.t(code, params, l);

      // Hacky to return the component with the failure error class.
      return component(FAILURE_TAG, this);
    }
  }

  return FailureError as unknown as Failure<Code, Languages, Templates>;
};

export { failure };
export type { Failure };
