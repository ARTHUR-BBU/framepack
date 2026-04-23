export function createMissingPlaywrightError() {
  return new Error(
    "Playwright is required for automated asset materialization. Install it with `npm install playwright` and then run `npx playwright install chromium`.",
  );
}

export async function loadChromium() {
  try {
    const module = (await (new Function('return import("playwright")')() as Promise<any>));
    return module.chromium as {
      launch: (options: { headless: boolean }) => Promise<{
        newPage: (options: { viewport: { width: number; height: number } }) => Promise<any>;
        close: () => Promise<void>;
      }>;
    };
  } catch {
    throw createMissingPlaywrightError();
  }
}
