export async function requestWakeLock(): Promise<() => void> {
  if ('wakeLock' in navigator) {
    try {
      const lock = await (navigator as any).wakeLock.request('screen');
      return () => lock.release();
    } catch {}
  }
  // Fallback: NoSleep
  try {
    const NoSleep = (await import('nosleep.js')).default;
    const ns = new NoSleep();
    await ns.enable();
    return () => ns.disable();
  } catch {}
  return () => {};
}
