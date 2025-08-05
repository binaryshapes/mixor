import type { Any, Prettify } from './generics';
import { type Traceable } from './trace';

/**
 * Infer the type of a traceable element.
 *
 * @typeParam T - The type to infer.
 * @typeParam Tag - The tag of the traceable element.
 * @returns The type of the traceable element.
 */
type Infer<T, Tag extends string = never> = Tag extends never
  ? T extends Traceable<Any, infer Type, Any>
    ? Type
    : never
  : Tag extends 'Schema' | 'Value'
    ? T extends (args: infer F) => Any
      ? F
      : never
    : T extends Record<Any, Any>
      ? Prettify<T>
      : T;

export type { Infer };
