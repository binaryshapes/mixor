/**
 * Options for a project.
 */
type ProjectOptions = {
  /**
   * Whether to enable type checking.
   */
  typecheck?: boolean;
};

// default options for any project.
const DEFAULT_PROJECT_OPTIONS: ProjectOptions = {
  typecheck: true,
};

/**
 * Defines a project for the test runner.
 *
 * @param name - The name of the project.
 * @param options - The options for the project.
 * - typecheck: Whether to enable type checking (default: true).
 * @returns A project configuration object.
 */
function project(name: string, options: ProjectOptions = DEFAULT_PROJECT_OPTIONS) {
  return (tsconfig: string) => {
    const { typecheck } = options;
    return {
      test: {
        name,
        include: [`tests/${name}.spec.ts`],
        typecheck: typecheck
          ? {
              enabled: true,
              include: [`tests/${name}.spec.ts`],
              checker: 'tsc',
              tsconfig,
            }
          : undefined,
      },
    };
  };
}

export { project };
