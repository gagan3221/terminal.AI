export {};

declare global {
  interface Window {
    platform: {
      name: string;
      version: string;
    };
    terminal: {
      onData: (callback: (data: string) => void) => void;
      sendInput: (data: string) => void;
      resize: (cols: number, rows: number) => void;
    };
  }
}
