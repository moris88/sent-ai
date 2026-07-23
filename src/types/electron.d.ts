export {};

declare global {
  interface Window {
    electronAPI?: {
      saveData: (key: string, data: unknown) => Promise<{ success: boolean; error?: unknown }>;
      loadData: <T = unknown>(key: string) => Promise<T | null>;
    };
  }
}
