declare global {
  interface ImportMetaEnv {
    DEV: boolean | undefined;
    readonly VITE_DEV_SERVER_URL: undefined | string;
    readonly VITE_APP_VERSION: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
