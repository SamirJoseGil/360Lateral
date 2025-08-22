/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Extend window for Remix environment variables
declare global {
  interface Window {
    ENV?: {
      API_URL: string;
      API_BASE_URL: string;
      NODE_ENV: string;
    };
  }
}