/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Component, component } from './component.ts';
import type { Any, IsEmptyObject, MergeUnion, Pretty, RemovePrefix } from './generics.ts';
import { type I18n, i18n, type I18nLanguage, type I18nTranslations } from './i18n.ts';
import { logger } from './logger.ts';
import { panic } from './panic.ts';
import type { Provider } from './provider.ts';
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
 * Union type representing all possible failure keys in the error object structure.
 *
 * @internal
 */
type FailureKeys =
  | typeof INPUT_FAILURES_KEY
  | typeof OUTPUT_FAILURES_KEY
  | typeof LOGIC_FAILURES_KEY;

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
 * @internal
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
> = [InputFailures | OutputFailures | LogicFailures] extends [never] ? F
  : InputFailures | OutputFailures | LogicFailures;

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
 * @returns The language type if the failure has a `t` function, otherwise `I18nLanguage`.
 *
 * @internal
 */
type GetFailureLanguages<F> = F extends Failure<Any, infer LL, Any>['Type'] ? LL : I18nLanguage;

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
 * The type for the failure info.
 *
 * @typeParam F - The failures object type.
 * @returns The failure info type.
 *
 * @internal
 */
type FailureInfo<
  F extends Record<string, Any>,
  Types extends string =
    & keyof MergeUnion<{ [K in keyof F]: K extends FailureKeys ? K : never }>
    & string,
> = Pretty<{
  type: Capitalize<
    RemovePrefix<Types extends FailureKeys ? Types : 'Input', typeof FAILURE_PREFIX>
  >;
  code: GetFailureCodes<FlatFailures<F>>;
  message: string;
  params: Record<string, unknown>;
}>;

/**
 * The error type supported by failures in results.
 *
 * This type represents all valid error formats that can be used in a Result:
 * - A single failure instance.
 * - An array of failure instances.
 * - A record with any subset of failure keys (`$input`, `$output`, `$logic`) where values are
 *   failure instances or arrays of failure instances.
 *
 * @typeParam L - Error string literal type.
 *
 * @public
 */
type FailureErrorType<L extends string> =
  | Failure<L, Any, Any>['Type']
  | Failure<L, Any, Any>['Type'][]
  | Partial<Record<FailureKeys, Failure<L, Any, Any>['Type'] | Failure<L, Any, Any>['Type'][]>>;

/**
 * The type for the failure component.
 *
 * A failure component is a component that represents an error condition in the system.
 * It extends the Error class and provides internationalization support through the
 * `t` method. The failure can be instantiated with parameters that are used in
 * the translation templates.
 *
 * When the failure has no parameters (empty object), the constructor does not require
 * any arguments. Otherwise, it requires the params object.
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
> = Component<
  typeof FAILURE_TAG,
  IsEmptyObject<Params> extends true ? new () => FailureClass<Code, Languages, Templates>
    : new (params: Params) => FailureClass<Code, Languages, Templates>,
  InstanceType<typeof FailureClass<Code, Languages, Templates>>
>;

/**
 * The panic error for the failure module.
 *
 * @public
 */
class FailurePanic extends panic<typeof FAILURE_TAG, 'CannotUnwrapFailure'>(FAILURE_TAG) {}

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
  public readonly t: (language: Languages) => string;

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
   * @param target - The target failure key (`$input`, `$output` or `$logic`).
   * @returns The formatted failure with the appropriate structure.
   *
   * @public
   */
  public as<T extends FailureKeys>(target: T): { [K in T]: this } {
    return failureAs(this, target) as { [K in T]: this };
  }
}

/**
 * Formats the failures for the contract depending on the target failure type.
 *
 * This function ensures that failures are properly structured with the correct
 * failure key (`$input`, `$output` or `$logic`) based on the target.
 * If the failures are already properly structured, they are returned as-is.
 * If they are a plain object, they are wrapped with the appropriate key.
 *
 * @typeParam T - The target failure type key.
 * @param failures - The failures to format. Can be a failure instance, a record of failures,
 * a FailureErrorType, or an already-structured failure object.
 * @param target - The target failure type key (`$input`, `$output` or `$logic`).
 * @returns The formatted failures with the appropriate structure.
 *
 * @public
 */
const failureAs = <T extends FailureKeys>(
  failures: unknown,
  target: T,
): FailureErrorType<string> => {
  logger.assert(failures !== null, 'The failures object is null');
  logger.assert(typeof failures === 'object', 'The failures object is not an object');

  // Type narrowing: failures is now known to be an object.
  const failuresObj = failures as Record<string, unknown>;

  // Handle arrays - wrap them in the target key
  if (Array.isArray(failures)) {
    return { [target]: failures };
  }

  // Check if the target key already exists in the failures object.
  if (target in failuresObj) {
    return failuresObj;
  }

  // Check if any failure key exists (meaning it's already structured).
  // If so, extract the value from the existing key and create a new structure with the target.
  if (INPUT_FAILURES_KEY in failuresObj) {
    // Extract the value from $input and create new structure with target.
    return { [target]: failuresObj[INPUT_FAILURES_KEY] };
  }

  if (OUTPUT_FAILURES_KEY in failuresObj) {
    // Extract the value from $output and create new structure with target
    return { [target]: failuresObj[OUTPUT_FAILURES_KEY] };
  }

  if (LOGIC_FAILURES_KEY in failuresObj) {
    // Extract the value from $logic and create new structure with target.
    return { [target]: failuresObj[LOGIC_FAILURES_KEY] };
  }

  // Otherwise, it's a plain failure instance or object - wrap it in the target key.
  return { [target]: failuresObj };
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
const unwrapFailure = <
  L extends string,
  F extends // Record of failures.
  | Partial<
    Record<
      FailureKeys,
      | Failure<L, Any, string, Any>['Type']
      | Failure<L, Any, string, Any>['Type'][]
      | Record<
        string,
        Failure<L, Any, string, Any>['Type']
      >
    >
  >
  // Single failure instance.
  | Failure<L, Any, string, Any>['Type']
  | Failure<L, Any, string, Any>['Type'][],
>(
  failure: F,
  language: GetFailureLanguages<FlatFailures<F>>,
): FailureInfo<F> => {
  const unwrap = (failureValue: Any, failureKey: FailureKeys): FailureInfo<F> => {
    // Remove the prefix from the failure key and capitalize the first letter.
    let failureType = failureKey.replace(FAILURE_PREFIX, '');
    failureType = failureType.charAt(0).toUpperCase() + failureType.slice(1);

    // Handle Record types (e.g., { status: SomeFailure }) - extract the first failure.
    let actualFailure: Any = failureValue;
    if (
      typeof failureValue === 'object' &&
      failureValue !== null &&
      !Array.isArray(failureValue) &&
      !('t' in failureValue) &&
      !('code' in failureValue) &&
      !('message' in failureValue)
    ) {
      // It's a Record with field failures, extract the first failure.
      const recordValue = failureValue as Record<string, Any>;
      const firstKey = Object.keys(recordValue)[0];
      if (firstKey && recordValue[firstKey]) {
        actualFailure = recordValue[firstKey];
      }
    }

    // Handle arrays - take the first element.
    if (Array.isArray(actualFailure) && actualFailure.length > 0) {
      actualFailure = actualFailure[0];
    }

    // Avoid unwrapping a object that is not an instance of Failure.
    if (!(actualFailure instanceof FailureClass)) {
      throw new FailurePanic(
        'CannotUnwrapFailure',
        'Cannot unwrap a object that is not an instance of Failure',
      );
    }

    // Try to get the message from the actual failure.
    const message = (typeof actualFailure?.t === 'function')
      ? actualFailure.t(language as I18nLanguage)
      : actualFailure?.message ??
        actualFailure?.code ??
        (typeof actualFailure === 'string' ? actualFailure : String(actualFailure)) ??
        // FIXME: This is a temporary fix to handle unexpected errors (hate hardcoded messages).
        'Something went wrong. Please contact support if the problem persists.';

    return {
      type: failureType as FailureInfo<F>['type'],
      code: actualFailure?.code ??
        (typeof actualFailure === 'string' ? actualFailure : String(actualFailure)),
      message,
      params: actualFailure?.params ?? {},
    };
  };

  const failureKey = Object.keys(failure)[0] as FailureKeys;

  // Indicate if the failure is grouped.
  const isGroupedFailure = [
    INPUT_FAILURES_KEY,
    OUTPUT_FAILURES_KEY,
    LOGIC_FAILURES_KEY,
  ].includes(
    failureKey,
  );

  // Process grouped failures.
  if (isGroupedFailure) {
    return unwrap(failure[failureKey as keyof F], failureKey);
  }

  // Process individual failures.
  return unwrap(failure, INPUT_FAILURES_KEY);
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
   *
   * When the failure has no parameters, the constructor can be called without arguments.
   */
  type ParamsType = I18n<Code, Languages, Templates>['Params'];
  class FailureError extends FailureClass<Code, Languages, Templates> {
    public constructor(params?: ParamsType) {
      super(
        code,
        (code, params, language) => tr.t(code, params ?? ({} as ParamsType), language),
        params ?? ({} as ParamsType),
      );
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
  unwrapFailure,
};
export type { Failure, FailureErrorType, FailureKeys, GroupFailures, InferFailure };
