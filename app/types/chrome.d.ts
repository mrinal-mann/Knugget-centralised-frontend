// Chrome API type declarations for use in Next.js app
interface Chrome {
  storage: {
    local: {
      get: (keys: string[], callback: (result: any) => void) => void;
      set: (items: object, callback?: () => void) => void;
      remove: (keys: string[], callback?: () => void) => void;
    };
  };
  runtime: {
    sendMessage: (message: any) => void;
  };
}

// Add Chrome to the global namespace
declare global {
  interface Window {
    chrome?: Chrome;
  }
  const chrome: Chrome | undefined;
}

export {};
