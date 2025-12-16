/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Component } from './component.ts';
import { config } from './config.ts';
import type { Any } from './generics.ts';
import { logger } from './logger.ts';
import { panic } from './panic.ts';

// TODO: Implement some standard formats for translation like ICU MessageFormat.
// TODO: Implement some cache for processed translations.
// TODO: Handle contexts or namespaces for translations.

/**
 * The tag for the i18n component.
 *
 * @internal
 */
const I18N_TAG = 'I18n';

/**
 * The language code.
 *
 * @remarks
 * The language code is a string of the form 'en-US', 'es-ES', etc.
 * This format follows the BCP 47 language tag standard.
 *
 * @internal
 */
type I18nLanguage = `${string}-${string}`;

/**
 * Maps primitive type names to their corresponding TypeScript types.
 *
 * @internal
 */
type I18nPrimitiveMap = {
  string: string;
  number: number;
  boolean: boolean;
  null: null;
  undefined: undefined;
  object: object;
};

/**
 * Extracts parameter types from a translation template string.
 *
 * @remarks
 * This type recursively parses a translation string to extract parameter placeholders
 * in the format `{{name | type}}` and builds a record type mapping parameter names
 * to their corresponding TypeScript types.
 *
 * The supported types are: `string`, `number`, `boolean`, `null`, `undefined`, and `object`.
 *
 * @typeParam T - The translation template string to parse.
 * @typeParam Acc - The accumulator record that collects extracted parameters.
 *
 * @internal
 */
type InferTemplateParams<
  T extends string,
  // deno-lint-ignore ban-types
  Acc extends Record<string, Any> = {},
> = T extends `${infer _Before}{{${infer Name} | ${infer Type}}}${infer Rest}`
  ? InferTemplateParams<
    Rest,
    & Acc
    & {
      [K in Name]: I18nPrimitiveMap[Type & keyof I18nPrimitiveMap];
    }
  >
  : Acc;

/**
 * The type of translations for a given set of languages and text template.
 *
 * @remarks
 * This type creates a record where each key is a language code and each value
 * is the same text template string. This ensures type safety when adding
 * translations for multiple languages.
 *
 * @typeParam Languages - The language codes for which translations are provided.
 * @typeParam Text - The translation template string (may contain parameter placeholders).
 *
 * @internal
 */
type I18nTranslations<Languages extends I18nLanguage, Text extends string> = Record<
  Languages,
  Text
>;

/**
 * The type of an i18n translation component.
 *
 * @remarks
 * An i18n component represents a translation template with:
 * - A unique code identifier
 * - Translations for multiple languages
 * - Extracted parameter types from the translation template
 *
 * The translation template can contain parameter placeholders in the format
 * `{{parameterName | type}}` which will be replaced at runtime with actual values.
 *
 * @typeParam Code - The unique code identifier for this translation.
 * @typeParam Languages - The language codes for which translations are provided.
 * @typeParam Text - The translation template string (may contain parameter placeholders).
 *
 * @public
 */
type I18n<
  Code extends string,
  Languages extends I18nLanguage,
  Text extends string,
> = Component<
  typeof I18N_TAG,
  { [Key in Code]: I18nTranslations<Languages, Text> } & { Params: InferTemplateParams<Text> }
>;

/**
 * The panic error for the i18n module.
 *
 * @remarks
 * This error is thrown when:
 * - A mandatory translation is missing for a required language (configured via
 *   `NUXO_I18N_MANDATORY_LANGUAGES`)
 * - A translation template with the same code already exists in the registry
 *
 * @public
 */
class I18nPanic
  extends panic<typeof I18N_TAG, 'MandatoryTranslationMissing' | 'TemplateAlreadyExists'>(
    I18N_TAG,
  ) {}

/**
 * Translates a message template by replacing parameter placeholders with actual values.
 *
 * @remarks
 * This function processes a translation template string and replaces placeholders
 * in the format `{{parameterName | type}}` with values from the provided parameters object.
 *
 * The function performs a runtime type check (logged as debug) but does not throw
 * if the type doesn't match, allowing for flexible parameter passing.
 *
 * @param message - The translation template string containing parameter placeholders.
 * @param params - The parameters object mapping parameter names to their values.
 * @returns The translated message with all placeholders replaced by their corresponding values.
 *
 * @internal
 */
const translate = (message: string, params: Record<string, unknown>) =>
  message.replace(/{{\s*(.*?)\s*\|\s*(.*?)\s*}}/g, (_match, p1, p2) => {
    // deno-lint-ignore valid-typeof
    if (typeof params[p1] !== p2) {
      logger.debug(`The parameter "${p1}" is not of type "${p2}".`);
    }
    return params[p1] as string;
  });

/**
 * Internationalization registry for managing translations.
 *
 * @remarks
 * This class provides a centralized registry for managing translations across multiple
 * languages. It allows you to:
 * - Register translation templates with parameter placeholders
 * - Retrieve translations for specific language codes
 * - Ensure mandatory translations are provided for required languages
 * - List all registered translations
 *
 * Translation templates can contain parameter placeholders in the format
 * `{{parameterName | type}}` which are replaced at runtime with actual values.
 *
 * The registry validates that all mandatory languages (configured via
 * `NUXO_I18N_MANDATORY_LANGUAGES`) have translations when adding new templates.
 *
 * @typeParam Templates - The type of all registered translation templates.
 *
 * @internal
 */
class I18nRegistry<Templates> {
  /**
   * The map of registered translations.
   *
   * @remarks
   * Each key is a translation code, and each value is a record mapping
   * language codes to their corresponding translation strings.
   */
  public translations: Map<keyof Templates, Record<I18nLanguage, string>> = new Map();

  /**
   * Adds a new translation template to the i18n registry.
   *
   * @remarks
   * This method registers a new translation template with translations for multiple languages.
   * The template must include translations for all mandatory languages configured via
   * `NUXO_I18N_MANDATORY_LANGUAGES`.
   *
   * The translation template can contain parameter placeholders in the format
   * `{{parameterName | type}}` which will be replaced at runtime when calling {@link t}.
   *
   * If a translation with the same code already exists, this method throws an
   * {@link I18nPanic} with code `TemplateAlreadyExists`.
   *
   * @typeParam Code - The unique code identifier for this translation.
   * @typeParam Message - The translation template string (may contain parameter placeholders).
   * @typeParam Languages - The language codes for which translations are provided.
   * @param template - An object with a single key (the translation code) and a value
   *   containing translations for all specified languages.
   * @returns The registry instance with the updated type that includes the new translation.
   * @throws {I18nPanic} If a mandatory translation is missing or if the template already exists.
   */
  public add<
    Code extends string,
    Message extends string,
    Languages extends I18nLanguage,
  >(
    template: { [Key in Code]: I18nTranslations<Languages, Message> },
  ) {
    for (const [, translations] of Object.entries(template)) {
      for (const language of config.get('NUXO_I18N_MANDATORY_LANGUAGES')) {
        if (!(translations as Record<I18nLanguage, string>)[language]) {
          throw new I18nPanic(
            'MandatoryTranslationMissing',
            `Mandatory translation is missing.`,
            `The translation for "${language}" is mandatory and must be provided.`,
          );
        }
      }
    }

    // Check if the template is already in the translations.
    const key = Object.keys(template)[0];
    if (this.translations.has(key as keyof Templates)) {
      throw new I18nPanic(
        'TemplateAlreadyExists',
        `The key "${key}" already exists in the i18n translations registry.`,
      );
    }

    this.translations.set(key as keyof Templates, template[key as keyof typeof template]);

    return this as I18nRegistry<Templates & { [Key in Code]: Record<Languages, Message> }>;
  }

  /**
   * Gets a translated message for a given code and language.
   *
   * @remarks
   * This method retrieves a translation for the specified code and language, then
   * replaces any parameter placeholders in the format `{{parameterName | type}}` with
   * the values provided in the params object.
   *
   * If no translation is found for the specified code and language, the code itself
   * is returned as a fallback.
   *
   * The language parameter defaults to the value configured via `NUXO_I18N_DEFAULT_LANGUAGE`.
   *
   * @typeParam Code - The translation code to retrieve.
   * @typeParam Language - The language code for the translation.
   * @typeParam Message - The translation template string (inferred from the code and language).
   * @param code - The code of the translation to retrieve.
   * @param params - The parameters object to replace placeholders in the translation template.
   *   The parameter names and types are automatically inferred from the translation template.
   * @param language - The language code for the translation. Defaults to the configured
   *   default language.
   * @returns The translated message with all parameter placeholders replaced. If no
   *   translation is found, returns the code as a fallback.
   */
  public t<
    Code extends keyof Templates,
    Language extends I18nLanguage,
    Message extends string = Templates[Code] extends Record<I18nLanguage, string>
      ? Templates[Code][Language]
      : never,
  >(
    code: Code,
    params: InferTemplateParams<Message>,
    language: I18nLanguage = config.get('NUXO_I18N_DEFAULT_LANGUAGE'),
  ): string {
    return translate(this.translations.get(code)?.[language] ?? code as Any, params);
  }

  /**
   * Gets all registered translations.
   *
   * @remarks
   * This method returns a plain object containing all registered translations,
   * organized by translation code. Each translation code maps to an object
   * containing all language variants for that translation.
   *
   * @returns A record mapping translation codes to their language variants.
   *   Each value is a record mapping language codes to translation strings.
   */
  public list() {
    return Object.fromEntries(
      Array.from(this.translations.entries()).map((
        [language, translations],
      ) => [
        language,
        Object.fromEntries(Object.entries(translations).map(([code, message]) => [code, message])),
      ]),
    );
  }
}

/**
 * The global i18n registry instance.
 *
 * @remarks
 * This is the default instance of the i18n registry that should be used throughout
 * the application. Use {@link I18nRegistry.add} to register translations and
 * {@link I18nRegistry.t} to retrieve translated messages.
 *
 * @public
 */
const i18n = new I18nRegistry();

export { i18n, I18nPanic };
export type { I18n, I18nLanguage, I18nTranslations };
