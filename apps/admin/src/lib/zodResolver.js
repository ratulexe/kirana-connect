export function zodResolver(schema) {
  return async (values) => {
    const result = await schema.safeParseAsync(values);
    if (result.success) return { values: result.data, errors: {} };

    const errors = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".");
      if (!errors[key]) errors[key] = { type: issue.code, message: issue.message };
    }
    return { values: {}, errors };
  };
}
