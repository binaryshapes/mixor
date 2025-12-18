/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Component, component } from './component.ts';
import type { Provider } from './container.ts';
import type { Any, MergeUnion, Pretty, RemovePrefix } from './generics.ts';
import { type I18n, i18n, type I18nLanguage, type I18nTranslations } from './i18n.ts';
import type { ResultFunction } from './result.ts';

/**
 * The tag for the failure component.
 *
 * @internal
 */
const FAILURE_TAG = 'Failure' as const;

/**
 * The prefix used for failure keys in the error object structure.
 *
 * @internal
 */
const FAILURE_PREFIX = '$' as const;

/**
 * The key for input failures in the error object structure.
 *
 * @public
 */
const INPUT_FAILURES_KEY = `${FAILURE_PREFIX}input` as const;

/**
 * The key for output failures in the error object structure.
 *
 * @public
 */
const OUTPUT_FAILURES_KEY = `${FAILURE_PREFIX}output` as const;

/**
 * The key for logic failures in the error object structure.
 *
 * @public
 */
const LOGIC_FAILURES_KEY = `${FAILURE_PREFIX}logic` as const;

/**
 * The key for panic failures in the error object structure.
 *
 * @public
 */
const PANIC_FAILURES_KEY = `${FAILURE_PREFIX}panic` as const;

/**
 * Union type representing all possible failure keys in the error object structure.
 *
 * @internal
 */
type FailureKeys =
  | typeof INPUT_FAILURES_KEY
  | typeof OUTPUT_FAILURES_KEY
  | typeof LOGIC_FAILURES_KEY
  | typeof PANIC_FAILURES_KEY;

/**
 * Extracts all failures from a given errors object and flattens them into a union type.
 *
 * This type extracts failures from the structured error object that may contain
 * `$input`, `$output`, or `$logic` keys, and returns a union of all failure types.
 *
 * @typeParam F - The failures type that should be a record containing failure keys.
 * @typeParam InputFailures - The input failures extracted from the `$input` key (inferred).
 * @typeParam OutputFailures - The output failures extracted from the `$output` key (inferred).
 * @typeParam LogicFailures - The logic failures extracted from the `$logic` key (inferred).
 * @returns A union type of all flattened failure types (Input, Output, or Logic).
 *
 * @public
 */
type FlatFailures<
  F extends Record<string, Any>,
  InputFailures = F extends { [INPUT_FAILURES_KEY]: infer I }
    ? I extends Record<string, infer II> ? II : never
    : never,
  OutputFailures = F extends { [OUTPUT_FAILURES_KEY]: infer O }
    ? O extends Record<string, infer OO> ? OO : never
    : never,
  LogicFailures = F extends { [LOGIC_FAILURES_KEY]: infer E } ? E : never,
> = InputFailures | OutputFailures | LogicFailures;

/**
 * Extracts the error code from a failure type.
 *
 * @typeParam F - The failure type to extract the code from.
 * @returns The code type if the failure has a `code` property, otherwise `never`.
 *
 * @internal
 */
type GetFailureCodes<F> = F extends { code: infer C } ? C : never;

/**
 * Extracts the language type from a failure's translation function.
 *
 * @typeParam F - The failure type to extract the language from.
 * @returns The language type if the failure has a `t` function, otherwise `never`.
 *
 * @internal
 */
type GetFailureLanguages<F> = F extends { t: (l: infer L) => string } ? L : never;

/**
 * Groups failures into a structured error object with the appropriate keys.
 *
 * This type creates a union of failure objects, each with the appropriate key
 * (`$input`, `$output`, or `$logic`) based on which failure types are provided.
 * If a failure type is `never` or an empty record, it is excluded from the union.
 *
 * @typeParam InputFailures - The input failures to group.
 * @typeParam OutputFailures - The output failures to group.
 * @typeParam LogicFailures - The logic failures to group.
 * @returns A union type of failure objects with the appropriate keys.
 *
 * @public
 */
type GroupFailures<InputFailures, OutputFailures, LogicFailures> = Pretty<
  | ([InputFailures] extends [never] ? never
    : InputFailures extends Record<PropertyKey, never> ? never
    : { [INPUT_FAILURES_KEY]: InputFailures })
  | ([OutputFailures] extends [never] ? never
    : OutputFailures extends Record<PropertyKey, never> ? never
    : { [OUTPUT_FAILURES_KEY]: OutputFailures })
  | ([LogicFailures] extends [never] ? never
    : LogicFailures extends Record<PropertyKey, never> ? never
    : { [LOGIC_FAILURES_KEY]: LogicFailures })
>;

/**
 * Infers the failure type from various sources.
 *
 * This type attempts to extract failure types from:
 * - Component types with an `Errors` property
 * - Result functions with error types
 * - Provider types with error types
 *
 * The inference prioritizes output failures over input failures over logic failures.
 * Panic failures are not included in the inference process.
 *
 * @typeParam T - The type to infer failures from.
 * @returns The inferred failure type, or `never` if no failures can be inferred.
 *
 * @public
 */
type InferFailure<T> = T extends { Errors: infer E }
  ? E extends { [OUTPUT_FAILURES_KEY]: infer OE } ? OE
  : E extends { [INPUT_FAILURES_KEY]: infer IE } ? IE
  : E extends { [LOGIC_FAILURES_KEY]: infer EE } ? EE
  : never
  : T extends ResultFunction<Any, infer E> ? E
  : T extends Provider<infer T, Any> ? T extends { Errors: infer E } ? E : never
  : never;

/**
 * The type for the failure class.
 *
 * @typeParam Code - The unique code identifier for the failure.
 * @typeParam Languages - The supported languages for translations.
 * @typeParam Templates - The template strings used in translations.
 * @returns The failure class type.
 *
 * @public
 */
class FailureClass<
  Code extends string,
  Languages extends I18nLanguage,
  Templates extends string,
> extends Error {
  public readonly code: Code;
  public readonly params: I18n<Code, Languages, Templates>['Params'];
  public readonly t: (language: I18nLanguage) => string;

  public constructor(
    code: Code,
    tr: (
      code: Code,
      params: I18n<Code, Languages, Templates>['Params'],
      language?: Languages,
    ) => string,
    params: I18n<Code, Languages, Templates>['Params'],
  ) {
    super(tr(code, params));
    this.code = code;
    this.params = params;
    this.t = (l: I18nLanguage) => tr(code, params, l as Languages);
  }

  /**
   * Formats the failure as a specific target.
   *
   * @param target - The target failure key (`$input`, `$output`, `$logic`, or `$panic`).
   * @returns The formatted failure with the appropriate structure.
   *
   * @public
   */
  public as<T extends FailureKeys>(target: T): ReturnType<typeof failureAs<typeof this, T>> {
    return failureAs(this, target);
  }
}

/**
 * The type for the failure info.
 *
 * @typeParam F - The failures object type.
 * @returns The failure info type.
 *
 * @internal
 */
type FailureInfo<
  Failures extends Record<string, Any>,
  Types extends string = keyof MergeUnion<{ [K in keyof Failures]: K }> & string,
> = Pretty<{
  type: Capitalize<RemovePrefix<Types, typeof FAILURE_PREFIX>>;
  code: GetFailureCodes<FlatFailures<Failures>>;
  message: string;
  params: Record<string, Any>;
}>;

/**
 * The type for the failure component.
 *
 * A failure component is a component that represents an error condition in the system.
 * It extends the Error class and provides internationalization support through the
 * `t` method. The failure can be instantiated with parameters that are used in
 * the translation templates.
 *
 * @typeParam Code - The unique code identifier for the failure.
 * @typeParam Languages - The supported languages for translations.
 * @typeParam Templates - The template strings used in translations.
 *
 * @public
 */
type Failure<
  Code extends string,
  Languages extends I18nLanguage,
  Templates extends string,
  Params extends Record<string, Any> = I18n<Code, Languages, Templates>['Params'],
> = Component<typeof FAILURE_TAG, new (params: Params) => FailureClass<Code, Languages, Templates>>;

/**
 * Formats the failures for the contract depending on the target failure type.
 *
 * This function ensures that failures are properly structured with the correct
 * failure key (`$input`, `$output`, `$logic`, or `$panic`) based on the target.
 * If the failures are already properly structured, they are returned as-is.
 * If they are a plain object, they are wrapped with the appropriate key.
 *
 * @param failures - The failures to format. Must be an object (either a plain
 * object or an already-structured failure object).
 * @param target - The target failure type key (`$input`, `$output`, `$logic`, or `$panic`).
 * @returns The formatted failures with the appropriate structure.
 *
 * @internal
 */
const failureAs = <
  F,
  T extends FailureKeys,
  E = { [K in T]: F },
>(failures: F, target: T): E => {
  // FIXME: This is a temporary fix to allow the failure API to be used with strings.
  if (typeof failures !== 'object' || failures === null) {
    throw new Error('Failures must be an object');
  }

  // FIXME: remove this once the failure API is fully implemented. This should be a failure instance.
  if (typeof failures === 'string') {
    return { [target]: failures } as E;
  }

  if (target === INPUT_FAILURES_KEY) {
    return (typeof failures === 'object' && INPUT_FAILURES_KEY in failures)
      ? failures as E
      : { [INPUT_FAILURES_KEY]: failures } as E;
  }

  if (target === LOGIC_FAILURES_KEY) {
    return ((INPUT_FAILURES_KEY in failures) || (LOGIC_FAILURES_KEY in failures)
      ? failures as E
      : { [LOGIC_FAILURES_KEY]: failures } as E);
  }

  if (target === OUTPUT_FAILURES_KEY) {
    return ((INPUT_FAILURES_KEY in failures) || (OUTPUT_FAILURES_KEY in failures) ||
        (LOGIC_FAILURES_KEY in failures)
      ? failures as E
      : { [OUTPUT_FAILURES_KEY]: failures } as E);
  }

  return failures as E;
};

/**
 * Unwraps a failure object into a structured error response with type, code, and message.
 *
 * This function extracts the failure key from the failures object, determines the
 * failure type (Input, Output, Logic, or Panic), and resolves the error message using
 * either the translation function (if available) or the message property.
 *
 * @typeParam F - The failures object type.
 * @param failures - The failures object containing the failure key and value.
 * @param language - The language to use for translating the error message.
 * @returns An object containing the failure type, code, message, and params.
 *
 * @public
 */
const unwrapFailure = <F extends Record<string, Any>>(
  failures: F,
  language: GetFailureLanguages<FlatFailures<F>>,
): FailureInfo<F> => {
  const failureKey = Object.keys(failures)[0] as FailureKeys;
  const failureValue = failures[failureKey];

  // Remove the prefix from the failure key and capitalize the first letter.
  let failureType = failureKey.replace(FAILURE_PREFIX, '');
  failureType = failureType.charAt(0).toUpperCase() + failureType.slice(1);

  return {
    type: failureType as FailureInfo<F>['type'],
    code: failureValue.code,
    message: failureValue.t ? failureValue.t(language) : failureValue.message ??
      'An unexpected error occurred. Please contact support if the problem persists.',
    params: failureValue.params ?? {},
  };
};

/**
 * Creates a failure component with internationalization support.
 *
 * @remarks
 * The failure component serves as a wrapper for i18n translations for expected errors
 * in the system. It can be used as a value in a Result function, as a custom error type,
 * or thrown as an exception. For instance, the rule and value components use the failure
 * component to return errors.
 *
 * The failure component inherits from the Error class, so it can be thrown and caught like
 * any other error and has error tracking capabilities. The error message is automatically
 * set to the translated message for the given code, parameters, and default language.
 *
 * @typeParam Code - The unique code identifier for the failure.
 * @typeParam Languages - The supported languages for translations.
 * @typeParam Templates - The template strings used in translations.
 * @param code - The unique code identifier for the failure.
 * @param translations - The translation mappings for each supported language.
 * @returns A failure component class that can be instantiated with parameters.
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
): Failure<Code, Languages, Templates> => {
  // Register the translations in the i18n system.
  const tr = i18n.add({ [code]: translations });

  /**
   * The failure error class.
   *
   * @remarks
   * The failure error class is a subclass of the Error class and inherits from the failure
   * component. It is used to create new failure instances with the provided parameters.
   * The error message is automatically set using the translation system with the default
   * language, and the `t` method can be used to get translations in other languages.
   */
  class FailureError extends FailureClass<Code, Languages, Templates> {
    public constructor(params: I18n<Code, Languages, Templates>['Params']) {
      super(code, (code, params, language) => tr.t(code, params, language), params);
    }
  }

  return component(FAILURE_TAG, FailureError, { code, translations });
};

export {
  failure,
  failureAs,
  INPUT_FAILURES_KEY,
  LOGIC_FAILURES_KEY,
  OUTPUT_FAILURES_KEY,
  PANIC_FAILURES_KEY,
  unwrapFailure,
};
export type { Failure, FlatFailures, GroupFailures, InferFailure };
