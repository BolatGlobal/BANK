// Retain only pending work, even when a demo is replayed without a reset.
export function createDemoTimers() {
  const pending = new Set<ReturnType<typeof setTimeout>>();

  return {
    get size() { return pending.size; },
    schedule(callback: () => void, delay: number) {
      const timer = setTimeout(() => {
        pending.delete(timer);
        callback();
      }, delay);
      pending.add(timer);
    },
    clear() {
      pending.forEach(clearTimeout);
      pending.clear();
    },
  };
}
