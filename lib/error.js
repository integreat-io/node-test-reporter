const getCause = (cause) =>
  typeof cause === "string"
    ? cause
    : cause instanceof Error
      ? cause.message || String(cause)
      : "Unknown";

export const createError = (event) => ({
  name: event.data.name,
  file: event.data.file,
  line: event.data.line,
  column: event.data.column,
  type: event.data.details.error.failureType,
  cause: getCause(event.data.details.error),
});
