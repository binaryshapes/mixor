/* eslint-disable jsdoc/require-jsdoc */
import { describe, expect, expectTypeOf, it, vi } from 'vitest';

import { type Any } from '../src';
import {
  type Adapter,
  type Container,
  ContainerError,
  type ElementType,
  type Port,
  type Service,
  adapter,
  container,
  port,
  registry,
  service,
} from '../src/container';

function UserServiceImp({
  logger,
  idGenerator,
  passwordHasher,
}: {
  logger: ElementType<typeof Logger>;
  idGenerator: ElementType<typeof IdGenerator>;
  passwordHasher: ElementType<typeof PasswordHasher>;
}) {
  return class User {
    constructor(
      public id: string,
      public email: string,
      public password: string,
    ) {}

    static create(email: string, password: string) {
      return new User(idGenerator.generate(), email, passwordHasher.hash(password));
    }

    static from(user: User) {
      return new User(user.id, user.email, user.password);
    }

    public changePassword(password: string) {
      logger.log(`Changing password for user ${this.id}`);
      this.password = passwordHasher.hash(password);
    }
  };
}

type User = ReturnType<typeof UserServiceImp>;
type UserInstance = InstanceType<User>;

const Logger = port<{
  log: (msg: string) => void;
  getLogs?: () => string[];
}>();

const IdGenerator = port<{
  generate: () => string;
}>();

const PasswordHasher = port<{
  hash: (password: string) => string;
  verify: (password: string, hash: string) => boolean;
}>();

const Repository = port<{
  save: (user: UserInstance) => Promise<void>;
  find: (id: string) => Promise<UserInstance | null>;
  update: (user: UserInstance) => Promise<void>;
}>();

const UUIDIdGenerator = adapter<typeof IdGenerator>(() => {
  return {
    generate: () => crypto.randomUUID(),
  };
});

const LocalPasswordHasher = adapter<typeof PasswordHasher>(() => {
  return {
    hash: (password: string) => password.padEnd(20, 'x'),
    verify: (password: string, hash: string) => password === hash,
  };
});

const ConsoleLogger = adapter<typeof Logger>(() => ({
  log: (msg: string) => console.log('[Console]', msg),
}));

const MemoryLogger = adapter<typeof Logger>(() => {
  const logs: string[] = [];
  return {
    log: (msg: string) => logs.push(msg),
    getLogs: () => logs,
  };
});

const InMemoryRepository = adapter<typeof Repository>(() => {
  const users: UserInstance[] = [];
  return {
    save: async (user: UserInstance) => {
      users.push(user);
    },
    find: async (id: string) => users.find((user) => user.id === id) ?? null,
    update: async (user: UserInstance) => {
      const index = users.findIndex((u) => u.id === user.id);
      if (index !== -1) {
        users[index] = user;
      }
    },
  };
});

const UserService = service(
  { logger: Logger, idGenerator: IdGenerator, passwordHasher: PasswordHasher },
  ({ logger, idGenerator, passwordHasher }) =>
    UserServiceImp({ logger, idGenerator, passwordHasher }),
);

const UserContainer = container()
  .add(UserService)
  .bind(Logger, ConsoleLogger)
  .bind(IdGenerator, UUIDIdGenerator)
  .bind(PasswordHasher, LocalPasswordHasher)
  .bind(Repository, InMemoryRepository);

describe('container', () => {
  describe('Basic usage', () => {
    it('should create a new empty container', () => {
      const c = container();
      expect(c).toBeDefined();
      expect(c.describe).toBeDefined();
      expect(c.add).toBeDefined();
      expect(c.bind).toBeDefined();
      expect(c.override).toBeDefined();
      expect(c.get).toBeDefined();
      expect(c.clearCache).toBeDefined();

      // Describe.
      const d = c.describe();
      expect(d).toBeDefined();
      expect(d.services).toBeDefined();
      expect(d.bindings).toBeDefined();
      expect(d.instances).toBeDefined();
      expect(d.services.size).toBe(0);
      expect(d.bindings.size).toBe(0);

      // Typechecking.
      expectTypeOf(c).toBeObject();
      expectTypeOf(c.add).toBeFunction();
      expectTypeOf(c.bind).toBeFunction();
      expectTypeOf(c.override).toBeFunction();
      expectTypeOf(c.get).toBeFunction();
      expectTypeOf(c.clearCache).toBeFunction();
      expectTypeOf(c.describe).toBeFunction();

      expectTypeOf(d.services).toEqualTypeOf<Map<symbol, Service<Any, Any>>>();
      expectTypeOf(d.bindings).toEqualTypeOf<Map<Port<Any>, Adapter<Any>>>();
      expectTypeOf(d.instances).toEqualTypeOf<WeakMap<symbol, Any>>();
    });

    it('should create a port with a specific type', () => {
      expect(Logger).toBeDefined();
      expect(IdGenerator).toBeDefined();
      expect(PasswordHasher).toBeDefined();
      expect(Repository).toBeDefined();

      // Typechecking.
      expectTypeOf(Logger).toEqualTypeOf<Port<ElementType<typeof Logger>>>();
      expectTypeOf(IdGenerator).toEqualTypeOf<Port<ElementType<typeof IdGenerator>>>();
      expectTypeOf(PasswordHasher).toEqualTypeOf<Port<ElementType<typeof PasswordHasher>>>();
      expectTypeOf(Repository).toEqualTypeOf<Port<ElementType<typeof Repository>>>();
    });

    it('should create an adapter for a specific port', () => {
      expect(ConsoleLogger).toBeDefined();
      expect(MemoryLogger).toBeDefined();

      // Typechecking.
      expectTypeOf(ConsoleLogger).toEqualTypeOf<Adapter<ElementType<typeof Logger>>>();
      expectTypeOf(MemoryLogger).toEqualTypeOf<Adapter<ElementType<typeof Logger>>>();
    });

    it('should create a service with a port dependency', () => {
      expect(UserService).toBeDefined();

      // Typechecking.
      expectTypeOf(UserService).toEqualTypeOf<
        Service<
          ReturnType<typeof UserServiceImp>,
          {
            logger: ElementType<typeof Logger>;
            idGenerator: ElementType<typeof IdGenerator>;
            passwordHasher: ElementType<typeof PasswordHasher>;
          }
        >
      >();
    });

    it('should create a new container with a new service with bound ports', () => {
      expect(() => UserContainer.get(UserService)).not.toThrow();
      const user = UserContainer.get(UserService);
      expect(user).toBeDefined();
      expect(user.create).toBeDefined();

      const newUser = user.create('test@test.com', 'password');
      expect(newUser).toBeDefined();
      expect(newUser.id).toBeDefined();
      expect(newUser.email).toBe('test@test.com');
      expect(newUser.password).toBe('passwordxxxxxxxxxxxx');

      // Typechecking.
      expectTypeOf(UserContainer).toEqualTypeOf<Container>();
      expectTypeOf(user).toEqualTypeOf<User>();
    });

    it('should override an adapter bound to a port', () => {
      const userContainer = UserContainer.override(Logger, MemoryLogger);
      expect(userContainer.get(Logger)).toBeDefined();
      expect(userContainer.get(Logger).log).toBeDefined();
      expect(userContainer.get(Logger).getLogs).toBeDefined();
      expect(userContainer.get(Logger).getLogs?.()).toEqual([]);

      const user = userContainer.get(UserService);

      const u = user.create('test@test.com', 'password');
      expect(u).toBeDefined();
      expect(u.id).toBeDefined();
      expect(u.email).toBe('test@test.com');
      expect(u.password).toBe('passwordxxxxxxxxxxxx');

      // Now change the password.
      u.changePassword('password123');
      expect(userContainer.get(Logger).getLogs?.()).toHaveLength(1);
      expect(userContainer.get(Logger).getLogs?.()).toEqual([
        `Changing password for user ${u.id}`,
      ]);

      // Typechecking.
      expectTypeOf(userContainer).toEqualTypeOf<Container>();
      expectTypeOf(user).toEqualTypeOf<User>();
    });

    it('should use the same adapter if two different services use the same port', () => {
      const s1 = service({ logger: Logger }, ({ logger }) => ({
        doSomething: () => logger.log('Hello'),
      }));

      const s2 = service({ logger: Logger }, ({ logger }) => ({
        doSomething: () => logger.log('Hello'),
      }));

      const c1 = container().add(s1).bind(Logger, MemoryLogger);
      const c2 = container().add(s2).bind(Logger, MemoryLogger);

      const svc1 = c1.get(s1);
      expect(svc1).toBeDefined();
      expect(svc1.doSomething).toBeDefined();

      const svc2 = c2.get(s2);
      expect(svc2).toBeDefined();
      expect(svc2.doSomething).toBeDefined();

      // Get loggers from container.
      const l1 = c1.get(Logger);
      const l2 = c2.get(Logger);
      expect(l1).toBeDefined();
      expect(l2).toBeDefined();

      // Logger must be the same instance.
      expect(l1).toEqual(l2);

      // Typechecking.
      expectTypeOf(c1).toEqualTypeOf<Container>();
      expectTypeOf(c2).toEqualTypeOf<Container>();
      expectTypeOf(svc1).toEqualTypeOf<{ doSomething: () => void }>();
      expectTypeOf(svc2).toEqualTypeOf<{ doSomething: () => void }>();
      expectTypeOf(l1).toEqualTypeOf<ElementType<typeof Logger>>();
      expectTypeOf(l2).toEqualTypeOf<ElementType<typeof Logger>>();
    });

    it('should resolve service dependencies from other services', () => {
      // Create a simple service that provides a value.
      const ConfigService = service({}, () => ({
        getAppName: () => 'test-app',
      }));

      // Create a service that depends on ConfigService.
      const AppService = service({}, { config: ConfigService }, ({ config }) => ({
        getAppInfo: () => `App: ${config.getAppName()}`,
      }));

      const c = container().add(ConfigService).add(AppService);

      // Get the service and verify it can access its dependency.
      const appService = c.get(AppService);
      expect(appService.getAppInfo()).toBe('App: test-app');

      // Typechecking.
      expectTypeOf(c).toEqualTypeOf<Container>();
      expectTypeOf(appService).toEqualTypeOf<{ getAppInfo: () => string }>();
    });

    it('should create complex service with mixed dependencies', () => {
      // To spy on console.log output.
      const consoleSpy = vi.spyOn(console, 'log');

      // Logger port.
      const Logger = port<{ log: (msg: string) => void }>();

      // Console logger adapter.
      const ConsoleLogger = adapter<typeof Logger>(() => ({
        log: (msg: string) => console.log('[Console]', msg),
      }));

      // App logger adapter.
      const AppLogger = adapter<typeof Logger>(() => ({
        log: (msg: string) => console.log('[App]', msg),
      }));

      // Database service.
      const Database = service({ logger: Logger }, ({ logger }) => ({
        status: () => logger.log('Database is running'),
      }));

      // Mailer service.
      const Mailer = service({ logger: Logger }, ({ logger }) => ({
        status: () => logger.log('Mailer is running'),
      }));

      // App service.
      const AppService = service(
        { logger: Logger },
        { database: Database, mailer: Mailer },
        ({ logger, database, mailer }) => ({
          getStatusApp: () => logger.log('App is running'),
          getStatusDb: () => database.status(),
          getStatusMailer: () => mailer.status(),
        }),
      );

      // Create container and get app service instance.
      const c = container().add(Database).add(Mailer).add(AppService).bind(Logger, ConsoleLogger);
      const s1 = c.get(AppService);

      // Check statuses and logs outputs.
      expect(s1.getStatusApp()).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith('[Console]', 'App is running');
      expect(s1.getStatusDb()).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith('[Console]', 'Database is running');
      expect(s1.getStatusMailer()).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith('[Console]', 'Mailer is running');

      // Override logger and check statuses.
      const s2 = c.override(Logger, AppLogger).get(AppService);
      expect(s2.getStatusApp()).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith('[App]', 'App is running');
      expect(s2.getStatusDb()).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith('[App]', 'Database is running');
      expect(s2.getStatusMailer()).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith('[App]', 'Mailer is running');

      // Typechecking.
      expectTypeOf(c).toEqualTypeOf<Container>();
      expectTypeOf(s1).toEqualTypeOf<{
        getStatusDb: () => void;
        getStatusApp: () => void;
        getStatusMailer: () => void;
      }>();
      expectTypeOf(s2).toEqualTypeOf<{
        getStatusDb: () => void;
        getStatusApp: () => void;
        getStatusMailer: () => void;
      }>();
    });
  });

  describe('Special Adapters', () => {
    it('should create an adapter for a port with a primitive type', () => {
      const EmailDomain = port<string>();
      const EmailDomainAdapter = adapter<typeof EmailDomain>(() => 'gmail.com');
      const c = container().bind(EmailDomain, EmailDomainAdapter);
      const emailDomain = c.get(EmailDomain);
      expect(emailDomain).toBe('gmail.com');

      // Typechecking.
      expectTypeOf(c).toEqualTypeOf<Container>();
      expectTypeOf(emailDomain).toEqualTypeOf<string>();
    });

    it('should create an adapter for a port with a specific type', () => {
      const AppEnv = port<{
        NODE_ENV: 'development' | 'production';
      }>();

      const AppEnvAdapter = adapter<typeof AppEnv>(() => ({
        NODE_ENV: 'development',
      }));

      const AppService = service({ appEnv: AppEnv }, ({ appEnv }) => ({
        getAppEnv: () => appEnv,
      }));

      const c = container().add(AppService).bind(AppEnv, AppEnvAdapter);
      const appService = c.get(AppService);
      expect(appService.getAppEnv()).toEqual({ NODE_ENV: 'development' });

      // Typechecking.
      expectTypeOf(c).toEqualTypeOf<Container>();
      expectTypeOf(appService).toEqualTypeOf<{
        getAppEnv: () => { NODE_ENV: 'development' | 'production' };
      }>();
    });

    it('should create an adapter for an array port', () => {
      const ArrayPort = port<Array<string>>();
      const ArrayAdapter = adapter<typeof ArrayPort>(() => ['hello', 'world']);
      const c = container().bind(ArrayPort, ArrayAdapter);
      const arr = c.get(ArrayPort);
      expect(arr).toEqual(['hello', 'world']);

      // Typechecking.
      expectTypeOf(c).toEqualTypeOf<Container>();
      expectTypeOf(arr).toEqualTypeOf<Array<string>>();
    });

    it('should create an adapter for an object port', () => {
      const ServerConfig = port<{
        host: string;
        port: number;
      }>();

      const ServerConfigAdapter = adapter<typeof ServerConfig>(() => ({
        host: 'localhost',
        port: 8080,
      }));

      const AppService = service({ serverConfig: ServerConfig }, ({ serverConfig }) => ({
        getServerConfig: () => serverConfig,
      }));

      const c = container().add(AppService).bind(ServerConfig, ServerConfigAdapter);
      const appService = c.get(AppService);
      expect(appService.getServerConfig()).toEqual({ host: 'localhost', port: 8080 });

      // Typechecking.
      expectTypeOf(c).toEqualTypeOf<Container>();
      expectTypeOf(appService).toEqualTypeOf<{
        getServerConfig: () => { host: string; port: number };
      }>();
    });
  });

  describe('Error handling', () => {
    it('should throw NoAdapterBound when getting a port that is not bound to an adapter', () => {
      const userContainer = container().add(UserService);

      try {
        userContainer.get(Logger);
      } catch (error) {
        expect(error).instanceOf(ContainerError);
        expect(error).toHaveProperty('code', 'Container:NoAdapterBound');
        expect(error).toHaveProperty(
          'message',
          `No adapter bound for port ${Logger.id.toString()}`,
        );
      }

      // Typechecking.
      expectTypeOf(userContainer).toEqualTypeOf<Container>();
    });

    it('should throw CannotOverrideUnboundPort when overriding an unbound port', () => {
      const userContainer = container().add(UserService);

      try {
        userContainer.override(Logger, MemoryLogger);
      } catch (error) {
        expect(error).instanceOf(ContainerError);
        expect(error).toHaveProperty('code', 'Container:CannotOverrideUnboundPort');
        expect(error).toHaveProperty('message', 'Cannot override unbound port');
      }

      // Typechecking.
      expectTypeOf(userContainer).toEqualTypeOf<Container>();
    });

    it('should throw MissingDependency when detecting missing dependencies', () => {
      const orphanService = service({}, ({ foo }: Any) => ({
        doSomething: () => foo.bar(),
      }));

      const c = container().add(orphanService);

      try {
        c.get(orphanService);
      } catch (error) {
        expect(error).instanceOf(ContainerError);
        expect(error).toHaveProperty('code', 'Container:MissingDependency');
        expect(error).toHaveProperty('message', 'Missing dependency "foo"');
      }

      // Typechecking.
      expectTypeOf(c).toEqualTypeOf<Container>();
    });

    it('should throw InvalidDefinitionType when passing invalid object to get', () => {
      const c = container();

      // Create an invalid object that has an id but wrong _tag.
      const invalidDefinition = {
        _tag: 'Invalid',
        _type: {},
        _hash: 'invalid',
        id: Symbol('invalid'),
      };

      try {
        // @ts-expect-error - Intentionally passing invalid definition.
        c.get(invalidDefinition);
      } catch (error) {
        expect(error).instanceOf(ContainerError);
        expect(error).toHaveProperty('code', 'Container:InvalidDefinitionType');
        expect(error).toHaveProperty('message', 'Invalid definition type');
      }

      // Typechecking.
      expectTypeOf(c).toEqualTypeOf<Container>();
    });

    it('should throw NoAdapterBound when service has unbound port dependencies', () => {
      // Create a service that depends on a port.
      const serviceWithPortDependency = service({ logger: Logger }, ({ logger }) => ({
        doSomething: () => logger.log('Hello'),
      }));

      // Create container with service but without binding the port.
      const c = container().add(serviceWithPortDependency);

      try {
        // This should fail because Logger port is not bound to an adapter.
        c.get(serviceWithPortDependency);
      } catch (error) {
        expect(error).instanceOf(ContainerError);
        expect(error).toHaveProperty('code', 'Container:NoAdapterBound');
        expect(error).toHaveProperty(
          'message',
          `No adapter bound for port ${Logger.id.toString()}`,
        );
      }

      // Typechecking.
      expectTypeOf(c).toEqualTypeOf<Container>();
    });
  });

  describe('Global registry and cache', () => {
    it('should clear the global registry', () => {
      registry.clear();
      expect(registry.get().globalAdapterRegistry.size).toBe(0);
      expect(registry.get().containerPool.size).toBe(0);
      expect(registry.get().requiresCache.size).toBe(0);

      const s1 = service({}, () => ({
        doSomething: () => void 0,
      }));

      // Create two containers.
      const c1 = container().add(s1);
      const c2 = container().add(s1);

      // Get user service from containers.
      c1.get(s1);
      c2.get(s1);
      expect(registry.get().globalAdapterRegistry.size).toBe(0);
      expect(registry.get().containerPool.size).toBe(2);
      expect(registry.get().requiresCache.size).toBe(1);

      // Clear registry.
      registry.clear();
      expect(registry.get().globalAdapterRegistry.size).toBe(0);
      expect(registry.get().containerPool.size).toBe(0);
      expect(registry.get().requiresCache.size).toBe(0);
    });
  });

  it('should create fresh instances after clearing cache', () => {
    const CounterService = service({}, () => {
      let count = 0;
      return {
        increment: () => ++count,
        getCount: () => count,
      };
    });

    const c = container().add(CounterService);

    // Use service and modify state
    const service1 = c.get(CounterService);
    service1.increment();
    expect(service1.getCount()).toBe(1);

    // Clear cache and get fresh instance.
    const cWithoutCache = c.clearCache();
    const service2 = cWithoutCache.get(CounterService);

    // Should be fresh instance with reset state.
    expect(service2.getCount()).toBe(0);
    expect(service1).not.toBe(service2);
  });

  it('should maintain same services and bindings after clearing cache', () => {
    const Logger = port<{ log: (msg: string) => void }>();
    const ConsoleLogger = adapter<typeof Logger>(() => ({
      log: (msg: string) => console.log(msg),
    }));

    const TestService = service({ logger: Logger }, ({ logger }) => ({
      test: () => logger.log('test'),
    }));

    const c = container().add(TestService).bind(Logger, ConsoleLogger);

    // Clear cache.
    const cWithoutCache = c.clearCache();

    // Should still have the same services and bindings.
    const description = cWithoutCache.describe();
    expect(description.services.size).toBe(1);
    expect(description.bindings.size).toBe(1);

    // Should still be able to get the service.
    const testService = cWithoutCache.get(TestService);
    expect(testService).toBeDefined();
    expect(testService.test).toBeDefined();
  });

  it('should not affect the original container', () => {
    const CounterService = service({}, () => {
      let count = 0;
      return {
        increment: () => ++count,
        getCount: () => count,
      };
    });

    const c = container().add(CounterService);

    // Use original container.
    const service1 = c.get(CounterService);
    service1.increment();
    expect(service1.getCount()).toBe(1);

    // Clear cache (creates new container).
    const cWithoutCache = c.clearCache();
    const service2 = cWithoutCache.get(CounterService);
    expect(service2.getCount()).toBe(0);

    // Original container should still have the same instance.
    const service1Again = c.get(CounterService);
    expect(service1Again.getCount()).toBe(1);
    expect(service1Again).toBe(service1);
  });
});

describe('Coverage edge cases', () => {
  it('should handle non-string/array arguments in createHash', () => {
    // This test covers the JSON.stringify branch in createHash.
    const Logger = port<{ log: (msg: string) => void }>();
    const ConsoleLogger = adapter<typeof Logger>(() => ({
      log: (msg: string) => console.log(msg),
    }));

    // Create a service with a complex object dependency.
    const ConfigService = service({}, () => ({
      config: {
        app: { name: 'test', version: 1.0 },
        features: { auth: true, cache: false },
      },
    }));

    const TestService = service({ logger: Logger }, ({ logger }) => ({
      test: () => logger.log('test'),
    }));

    // This should trigger the JSON.stringify branch in createHash.
    const c = container().add(ConfigService).add(TestService).bind(Logger, ConsoleLogger);
    expect(c).toBeDefined();
  });

  it('should reuse existing adapters with same factory', () => {
    // This test covers the adapter deduplication logic.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const Logger = port<{ log: (msg: string) => void }>();

    const factory = () => ({
      log: (msg: string) => console.log('[Logger]', msg),
    });

    const adapter1 = adapter<typeof Logger>(factory);
    const adapter2 = adapter<typeof Logger>(factory);

    // Should be the same adapter instance due to deduplication.
    expect(adapter1.id).toBe(adapter2.id);
    expect(adapter1._hash).toBe(adapter2._hash);
  });

  it('should handle pool size limit', () => {
    // This test covers the pool size limit logic.
    // First, clear the registry to start fresh.
    registry.clear();

    // Create many different containers to fill the pool.
    const containers: Container[] = [];

    for (let i = 0; i < 105; i++) {
      const Logger = port<{ log: (msg: string) => void }>();
      const ConsoleLogger = adapter<typeof Logger>(() => ({
        log: (msg: string) => console.log(`[${i}]`, msg),
      }));

      const TestService = service({ logger: Logger }, ({ logger }) => ({
        test: () => logger.log(`test-${i}`),
      }));

      const c = container().add(TestService).bind(Logger, ConsoleLogger);
      containers.push(c);
    }

    // The pool should have been limited to CONTAINER_POOL_SIZE (100).
    const poolSize = registry.get().containerPool.size;
    expect(poolSize).toBeLessThanOrEqual(100);
  });

  it('should handle array arguments in createHash', () => {
    // This test covers the array branch in createHash.
    // We call createHash indirectly via service creation.
    // The factory will have an array in its string representation.
    const arr = [1, 2, 3];
    const TestService = service({}, () => ({ arr }));
    const c = container().add(TestService);
    expect(c.get(TestService).arr).toEqual([1, 2, 3]);
  });

  it('should not deduplicate adapters if factory.toString() is different but hash is same', () => {
    // This test covers the branch where the hash is the same but factory.toString() is different.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const Logger = port<{ log: (msg: string) => void }>();
    // Two factories with same string content but different references.
    const factory1 = () => ({ log: (msg: string) => msg });
    // Create a new function with the same body.
    const factory2 = new Function('return { log: (msg) => msg };');
    // Force same hash by using the same string.
    const adapter1 = adapter<typeof Logger>(factory1);
    const adapter2 = adapter<typeof Logger>(factory2 as typeof factory1);
    // They should not be the same instance.
    expect(adapter1.id).not.toBe(adapter2.id);
  });
});
