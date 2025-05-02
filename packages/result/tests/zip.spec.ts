import { Pipeline } from '../src/pipeline';
import { fail, isSuccess, success } from '../src/result';

describe('Pipeline.zip', () => {
  it('should combine two successful pipelines into a tuple', async () => {
    const result = await Pipeline.from(success('hello'))
      .zip(Pipeline.from(success(42)))
      .run();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.isValue).toEqual(['hello', 42]);
    }
  });

  it('should return first failure if either pipeline fails', async () => {
    const result = await Pipeline.from(success('hello'))
      .zip(Pipeline.from(fail('error')))
      .run();

    expect(isSuccess(result)).toBe(false);
    if (!isSuccess(result)) {
      expect(result.isFailure).toBe('error');
    }
  });

  it('should handle async pipelines', async () => {
    const result = await Pipeline.from(Promise.resolve(success('hello')))
      .zip(Pipeline.from(Promise.resolve(success(42))))
      .run();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.isValue).toEqual(['hello', 42]);
    }
  });

  it('should handle function pipelines', async () => {
    const result = await Pipeline.fromFunction(() => success('hello'))
      .zip(Pipeline.fromFunction(() => success(42)))
      .run();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.isValue).toEqual(['hello', 42]);
    }
  });

  it('should handle mixed pipeline types', async () => {
    const result = await Pipeline.from(success('hello'))
      .zip(Pipeline.from(Promise.resolve(success(42))))
      .run();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.isValue).toEqual(['hello', 42]);
    }
  });

  it('should handle complex nested objects with type inference', async () => {
    const userPipeline = Pipeline.from(
      success({
        id: 1,
        name: 'John',
        profile: {
          email: 'john@example.com',
          preferences: {
            theme: 'dark',
            notifications: true,
          },
        },
      }),
    );

    const postPipeline = Pipeline.from(
      success({
        id: 1,
        title: 'Hello World',
        content: 'This is a test post',
        metadata: {
          createdAt: new Date(),
          tags: ['test', 'hello'],
        },
      }),
    );

    const result = await userPipeline.zip(postPipeline).run();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      const [user, post] = result.isValue;
      expect(user.name).toBe('John');
      expect(post.title).toBe('Hello World');
      expect(user.profile.preferences.theme).toBe('dark');
      expect(post.metadata.tags).toEqual(['test', 'hello']);
    }
  });
});

describe('Pipeline.zipWith', () => {
  it('should combine two successful pipelines using a function', async () => {
    const result = await Pipeline.from(success('hello'))
      .zipWith(Pipeline.from(success(42)), (str, num) => `${str} ${num}`)
      .run();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.isValue).toBe('hello 42');
    }
  });

  it('should return first failure if either pipeline fails', async () => {
    const result = await Pipeline.from(success('hello'))
      .zipWith(Pipeline.from(fail('error')), (str, num) => `${str} ${num}`)
      .run();

    expect(isSuccess(result)).toBe(false);
    if (!isSuccess(result)) {
      expect(result.isFailure).toBe('error');
    }
  });

  it('should handle async combination function', async () => {
    const result = await Pipeline.from(success('hello'))
      .zipWith(Pipeline.from(success(42)), async (str, num) => `${str} ${num}`)
      .run();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.isValue).toBe('hello 42');
    }
  });

  it('should handle complex object combinations', async () => {
    const result = await Pipeline.from(success({ name: 'John' }))
      .zipWith(Pipeline.from(success({ age: 30 })), (user, details) => ({ ...user, ...details }))
      .run();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.isValue).toEqual({ name: 'John', age: 30 });
    }
  });

  it('should handle complex object transformations with type inference', async () => {
    const userPipeline = Pipeline.from(
      success({
        id: 1,
        name: 'John',
        profile: {
          email: 'john@example.com',
          preferences: {
            theme: 'dark',
            notifications: true,
          },
        },
      }),
    );

    const settingsPipeline = Pipeline.from(
      success({
        language: 'en',
        timezone: 'UTC',
        display: {
          fontSize: 16,
          colorScheme: 'dark',
        },
      }),
    );

    const result = await userPipeline
      .zipWith(settingsPipeline, (user, settings) => ({
        user: {
          ...user,
          settings: {
            ...settings,
            theme: user.profile.preferences.theme,
          },
        },
      }))
      .run();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.isValue.user.name).toBe('John');
      expect(result.isValue.user.settings.language).toBe('en');
      expect(result.isValue.user.settings.theme).toBe('dark');
    }
  });
});

describe('Pipeline.zipAll', () => {
  it('should collect all successful results', async () => {
    const result = await Pipeline.zipAll([
      Pipeline.from(success('hello')),
      Pipeline.from(success(42)),
      Pipeline.from(success(true)),
    ] as const).run();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.isValue).toEqual(['hello', 42, true]);
    }
  });

  it('should return first failure if any pipeline fails', async () => {
    const result = await Pipeline.zipAll([
      Pipeline.from(success('hello')),
      Pipeline.from(fail('error')),
      Pipeline.from(success(42)),
    ] as const).run();

    expect(isSuccess(result)).toBe(false);
    if (!isSuccess(result)) {
      expect(result.isFailure).toBe('error');
    }
  });

  it('should handle empty array of pipelines', async () => {
    const result = await Pipeline.zipAll([]).run();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.isValue).toEqual([]);
    }
  });

  it('should handle async pipelines', async () => {
    const result = await Pipeline.zipAll([
      Pipeline.from(Promise.resolve(success('hello'))),
      Pipeline.from(Promise.resolve(success('world'))),
    ] as const).run();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.isValue).toEqual(['hello', 'world']);
    }
  });

  it('should handle function pipelines', async () => {
    const result = await Pipeline.zipAll([
      Pipeline.fromFunction(() => success('hello')),
      Pipeline.fromFunction(() => success('world')),
    ] as const).run();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.isValue).toEqual(['hello', 'world']);
    }
  });

  it('should handle mixed pipeline types', async () => {
    const result = await Pipeline.zipAll([
      Pipeline.from(success('hello')),
      Pipeline.from(Promise.resolve(success('world'))),
      Pipeline.fromFunction(() => success('!')),
    ] as const).run();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.isValue).toEqual(['hello', 'world', '!']);
    }
  });

  it('should handle multiple complex objects with type inference', async () => {
    const userPipeline = Pipeline.from(
      success({
        id: 1,
        name: 'John',
        profile: {
          email: 'john@example.com',
          preferences: {
            theme: 'dark',
            notifications: true,
          },
        },
      }),
    );

    const postPipeline = Pipeline.from(
      success({
        id: 1,
        title: 'Hello World',
        content: 'This is a test post',
        metadata: {
          createdAt: new Date(),
          tags: ['test', 'hello'],
        },
      }),
    );

    const commentPipeline = Pipeline.from(
      success({
        id: 1,
        content: 'Great post!',
        author: {
          id: 2,
          name: 'Jane',
        },
        metadata: {
          createdAt: new Date(),
          likes: 5,
        },
      }),
    );

    const result = await Pipeline.zipAll([
      userPipeline,
      postPipeline,
      commentPipeline,
    ]).run();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      const [user, post, comment] = result.isValue;
      expect(user.name).toBe('John');
      expect(post.title).toBe('Hello World');
      expect(comment.content).toBe('Great post!');
      expect(user.profile.preferences.theme).toBe('dark');
      expect(post.metadata.tags).toEqual(['test', 'hello']);
      expect(comment.author.name).toBe('Jane');
    }
  });

  it('should handle complex object transformations with zipAll', async () => {
    const userPipeline = Pipeline.from(
      success({
        id: 1,
        name: 'John',
        profile: {
          email: 'john@example.com',
          preferences: {
            theme: 'dark',
            notifications: true,
          },
        },
      }),
    );

    const postPipeline = Pipeline.from(
      success({
        id: 1,
        title: 'Hello World',
        content: 'This is a test post',
        metadata: {
          createdAt: new Date(),
          tags: ['test', 'hello'],
        },
      }),
    );

    const commentPipeline = Pipeline.from(
      success({
        id: 1,
        content: 'Great post!',
        author: {
          id: 2,
          name: 'Jane',
        },
        metadata: {
          createdAt: new Date(),
          likes: 5,
        },
      }),
    );

    const result = await Pipeline.zipAll([
      userPipeline,
      postPipeline,
      commentPipeline,
    ]).run();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      const [user, post, comment] = result.isValue;
      const userProfile = user.profile;
      const postMetadata = post.metadata;
      const commentAuthor = comment.author;

      expect(userProfile.preferences.theme).toBe('dark');
      expect(postMetadata.tags).toEqual(['test', 'hello']);
      expect(commentAuthor.name).toBe('Jane');
    }
  });

  describe('Pipeline.zipWith nested examples', () => {
    it('should handle multiple nested zipWith operations', async () => {
      const userPipeline = Pipeline.from(
        success({
          id: 1,
          name: 'John',
          email: 'john@example.com',
        }),
      );

      const preferencesPipeline = Pipeline.from(
        success({
          theme: 'dark',
          language: 'es',
          notifications: true,
        }),
      );

      const statsPipeline = Pipeline.from(
        success({
          posts: 42,
          followers: 1000,
          lastActive: new Date('2024-03-20'),
        }),
      );

      const result = await userPipeline
        .zipWith(preferencesPipeline, (user, prefs) => ({
          ...user,
          preferences: prefs,
        }))
        .zipWith(statsPipeline, (userWithPrefs, stats) => ({
          ...userWithPrefs,
          stats: stats,
        }))
        .run();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const finalResult = result.isValue;
        expect(finalResult.name).toBe('John');
        expect(finalResult.preferences.theme).toBe('dark');
        expect(finalResult.stats.posts).toBe(42);
        expect(finalResult.stats.followers).toBe(1000);
      }
    });

    it('should handle string transformations with multiple zipWith', async () => {
      const firstNamePipeline = Pipeline.from(success('John'));
      const lastNamePipeline = Pipeline.from(success('Doe'));
      const agePipeline = Pipeline.from(success(30));
      const rolePipeline = Pipeline.from(success('Developer'));

      const result = await firstNamePipeline
        .zipWith(lastNamePipeline, (first, last) => `${first} ${last}`)
        .zipWith(agePipeline, (fullName, age) => `${fullName} (${age} years old)`)
        .zipWith(rolePipeline, (nameWithAge, role) => `${nameWithAge} - ${role}`)
        .run();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.isValue).toBe('John Doe (30 years old) - Developer');
      }
    });
  });
});
