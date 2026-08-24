export function zodResolver(schema) {
  return async (values) => {
    const result = await schema.safeParseAsync(values);
    if (result.success) return { values: result.data, errors: {} };

    const errors = {};
    for (const issue of result.error.issues) {
      setNestedError(errors, issue.path, { type: issue.code, message: issue.message });
    }
    return { values: {}, errors };
  };
}

function setNestedError(target, path, error) {
  if (path.length === 0) {
    target.root = target.root ?? error;
    return;
  }

  let current = target;
  path.forEach((part, index) => {
    const isLast = index === path.length - 1;
    if (isLast) {
      current[part] = current[part] ?? error;
      return;
    }

    const nextPart = path[index + 1];
    current[part] = current[part] ?? (typeof nextPart === "number" ? [] : {});
    current = current[part];
  });
}
