import { describe, expect, expectTypeOf, it } from 'vitest';

import { EnvError, env } from '../src/env';
import { type Result, err, isOk, ok, unwrap } from '../src/result';
import { schema } from '../src/schema';
import { rule, value } from '../src/value';

// Shared test utilities.
const createTestHelpers = () => ({
  // Mock environment variables for testing.
  mockEnv: (envVars: Record<string, string>) => {
    const originalEnv = process.env;
    process.env = { ...originalEnv, ...envVars };
    return () => {
      process.env = originalEnv;
    };
  },

  // Create test schemas.
  createRedisSchema: () =>
    schema({
      REDIS_HOST: value(
        rule((value: string) => (value.length > 0 ? ok(value) : err('EMPTY_HOST'))),
      ),
      REDIS_PORT: value(
        rule((value: number) => {
          // Force coercion to number.
          const port = Number(value);
          return !isNaN(port) && port > 0 ? ok(port) : err('INVALID_PORT');
        }),
      ),
    }),

  createConfigSchema: () =>
    schema({
      DATABASE_URL: value(
        rule((value: string) => (value.length > 0 ? ok(value) : err('EMPTY_URL'))),
      ),
      API_KEY: value(rule((value: string) => (value.length > 0 ? ok(value) : err('EMPTY_KEY')))),
    }),
});

describe('env', () => {
  const helpers = createTestHelpers();

  describe('Basic functionality', () => {
    it('should create an environment configuration function', () => {
      const redisConfig = env(helpers.createRedisSchema());

      expectTypeOf(redisConfig).toBeFunction();
      expectTypeOf(redisConfig).returns.toEqualTypeOf<
        Result<
          {
            REDIS_HOST: string;
            REDIS_PORT: number;
          },
          {
            REDIS_HOST: 'EMPTY_HOST' | 'EMPTY_HOST'[];
            REDIS_PORT: 'INVALID_PORT' | 'INVALID_PORT'[];
          }
        >
      >();
    });

    it('should validate environment variables against schema', () => {
      const cleanup = helpers.mockEnv({
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
      });

      try {
        const redisConfig = env(helpers.createRedisSchema());
        const result = redisConfig('all');

        expect(unwrap(result)).toEqual({
          REDIS_HOST: 'localhost',
          REDIS_PORT: 6379,
        });
      } finally {
        cleanup();
      }
    });

    it('should handle schema validation errors', () => {
      const cleanup = helpers.mockEnv({
        REDIS_HOST: '',
        REDIS_PORT: 'invalid',
      });

      try {
        const redisConfig = env(helpers.createRedisSchema());
        const result = redisConfig();

        if (isOk(result)) {
          throw new Error('Expected error result');
        } else {
          expect(unwrap(result)).toEqual({
            REDIS_HOST: ['EMPTY_HOST'],
            REDIS_PORT: ['INVALID_PORT'],
          });
        }
      } finally {
        cleanup();
      }
    });
  });

  describe('Runtime compatibility', () => {
    it('should work with Node.js environment', () => {
      const cleanup = helpers.mockEnv({
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
      });

      try {
        const redisConfig = env(helpers.createRedisSchema());
        const result = redisConfig();

        expect(unwrap(result)).toEqual({
          REDIS_HOST: 'localhost',
          REDIS_PORT: 6379,
        });
      } finally {
        cleanup();
      }
    });

    it('should throw error for unsupported runtime', () => {
      // Mock a runtime without process.env
      const originalProcess = global.process;
      // @ts-expect-error - Intentionally removing process for testing
      global.process = undefined;

      try {
        const redisConfig = env(helpers.createRedisSchema());
        expect(() => redisConfig()).toThrow(EnvError);
        expect(() => redisConfig()).toThrow('Unsupported runtime');
      } finally {
        global.process = originalProcess;
      }
    });
  });

  describe('Error handling', () => {
    it('should throw error for missing environment variables', () => {
      const cleanup = helpers.mockEnv({});

      try {
        const config = env(helpers.createConfigSchema());
        expect(() => config()).toThrow(EnvError);
        expect(() => config()).toThrow('Missing environment variables: DATABASE_URL, API_KEY');
      } finally {
        cleanup();
      }
    });

    it('should throw error for partially missing environment variables', () => {
      const cleanup = helpers.mockEnv({
        DATABASE_URL: 'postgres://localhost:5432/db',
      });

      try {
        const config = env(helpers.createConfigSchema());
        expect(() => config()).toThrow(EnvError);
        expect(() => config()).toThrow('Missing environment variables: API_KEY');
      } finally {
        cleanup();
      }
    });
  });

  describe('Type safety', () => {
    it('should provide correct type inference', () => {
      const redisConfig = env(helpers.createRedisSchema());

      // Typechecking.
      expectTypeOf(redisConfig).toBeFunction();
      expectTypeOf(redisConfig).returns.toEqualTypeOf<ReturnType<typeof redisConfig>>();
    });

    it('should handle complex schema types', () => {
      const complexSchema = schema({
        STRING_FIELD: value(rule((value: string) => ok(value))),
        NUMBER_FIELD: value(rule((value: string) => ok(value))),
        BOOLEAN_FIELD: value(rule((value: string) => ok(value))),
      });

      const config = env(complexSchema);

      // Typechecking.
      expectTypeOf(config).toBeFunction();
      expectTypeOf(config).returns.toEqualTypeOf<ReturnType<typeof config>>();
    });

    it('should infer correctly the type for strict mode error', () => {
      const redisConfig = env(helpers.createRedisSchema());
      const result = redisConfig('strict');

      expectTypeOf(result).toEqualTypeOf<
        Result<
          {
            REDIS_HOST: string;
            REDIS_PORT: number;
          },
          {
            REDIS_HOST: 'EMPTY_HOST';
            REDIS_PORT: 'INVALID_PORT';
          }
        >
      >();
    });

    it('should infer correctly the type for all mode error', () => {
      const redisConfig = env(helpers.createRedisSchema());
      const result = redisConfig('all');

      expectTypeOf(result).toEqualTypeOf<
        Result<
          {
            REDIS_HOST: string;
            REDIS_PORT: number;
          },
          {
            REDIS_HOST: 'EMPTY_HOST'[];
            REDIS_PORT: 'INVALID_PORT'[];
          }
        >
      >();
    });
  });

  describe('Code examples', () => {
    it('should run example env-001: Basic environment variable validation with schema', () => {
      const cleanup = helpers.mockEnv({
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
      });

      try {
        // env-001: Basic environment variable validation with schema.
        const redisConfig = env(
          schema({
            REDIS_HOST: value(
              rule((value: string) => (value.length > 0 ? ok(value) : err('EMPTY_HOST'))),
            ),
            REDIS_PORT: value(
              rule((value: string) => {
                const port = parseInt(value);
                return !isNaN(port) && port > 0 ? ok(value) : err('INVALID_PORT');
              }),
            ),
          }),
        );

        const result = redisConfig();
        expect(unwrap(result)).toEqual({
          REDIS_HOST: 'localhost',
          REDIS_PORT: '6379',
        });

        // Typechecking.
        expectTypeOf(redisConfig).toBeFunction();
        expectTypeOf(result).toEqualTypeOf<
          Result<
            {
              REDIS_HOST: string;
              REDIS_PORT: string;
            },
            {
              REDIS_HOST: 'EMPTY_HOST'[];
              REDIS_PORT: 'INVALID_PORT'[];
            }
          >
        >();
      } finally {
        cleanup();
      }
    });

    it('should run example env-002: Error handling for missing environment variables', () => {
      const cleanup = helpers.mockEnv({});

      try {
        // env-002: Error handling for missing environment variables.
        const config = env(
          schema({
            DATABASE_URL: value(
              rule((value: string) => (value.length > 0 ? ok(value) : err('EMPTY_URL'))),
            ),
            API_KEY: value(
              rule((value: string) => (value.length > 0 ? ok(value) : err('EMPTY_KEY'))),
            ),
          }),
        );

        expect(() => config()).toThrow(EnvError);
        expect(() => config()).toThrow(
          'Missing environment variables: DATABASE_URL, API_KEY. Please check your .env file.',
        );

        // Typechecking.
        expectTypeOf(config).toBeFunction();
        expectTypeOf(config).returns.toEqualTypeOf<ReturnType<typeof config>>();
      } finally {
        cleanup();
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle empty environment variables', () => {
      const cleanup = helpers.mockEnv({
        REDIS_HOST: '',
        REDIS_PORT: '6379',
      });

      try {
        const redisConfig = env(helpers.createRedisSchema());
        const result = redisConfig();

        if (isOk(result)) {
          throw new Error('Expected error result');
        } else {
          expect(unwrap(result)).toEqual({
            REDIS_HOST: ['EMPTY_HOST'],
          });
        }
      } finally {
        cleanup();
      }
    });

    it('should handle undefined environment variables', () => {
      const cleanup = helpers.mockEnv({
        REDIS_HOST: 'localhost',
        // REDIS_PORT is undefined
      });

      try {
        const redisConfig = env(helpers.createRedisSchema());
        expect(() => redisConfig()).toThrow(EnvError);
        expect(() => redisConfig()).toThrow('Missing environment variables: REDIS_PORT');
      } finally {
        cleanup();
      }
    });

    it('should filter only schema fields from environment', () => {
      const cleanup = helpers.mockEnv({
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
        UNRELATED_VAR: 'should-be-ignored',
        ANOTHER_VAR: 'also-ignored',
      });

      try {
        const redisConfig = env(helpers.createRedisSchema());
        const result = redisConfig('strict');

        expect(unwrap(result)).toEqual({
          REDIS_HOST: 'localhost',
          REDIS_PORT: 6379,
        });

        // Verify unrelated variables are not included.
        const resultValue = unwrap(result);
        expect(resultValue).not.toHaveProperty('UNRELATED_VAR');
        expect(resultValue).not.toHaveProperty('ANOTHER_VAR');
      } finally {
        cleanup();
      }
    });
  });
});
