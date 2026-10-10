/** Share in-flight initialization; a failed attempt must not poison later retries. */
export function runtimeLoader<T>(initialize: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | null = null;
  return () => {
    if (!pending) {
      pending = initialize().catch((error: unknown) => {
        pending = null;
        throw error;
      });
    }
    return pending;
  };
}
