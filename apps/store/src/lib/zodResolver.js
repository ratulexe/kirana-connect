/**
 * Minimal bridge between Zod and React Hook Form.
 *
 * Hand-written rather than pulling in @hookform/resolvers: it is a dozen lines,
 * and the project keeps its dependency list to the agreed stack.
 */
export function zodResolver(schema) {
  return async (values) => {
    const result = schema.safeParse(values);

    if (result.success) {
      return { values: result.data, errors: {} };
    }

    const errors = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      // Keep the first message per field: showing three at once is noise.
      if (path && !errors[path]) {
        errors[path] = { type: issue.code, message: issue.message };
      }
    }

    return { values: {}, errors };
  };
}
