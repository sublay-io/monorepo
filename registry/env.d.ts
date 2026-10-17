// Registry-only: what each framework provides to the env files
// (`*/utils/env.ts`, `*/env/*.ts`), so the registry typecheck can read them.
// In an app these come from the framework itself (Vite's client types,
// Node's `process`, React Native's `__DEV__`). Not installed with any component.
interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly [key: string]: any;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
declare var process: { env: Record<string, string | undefined> };
declare var __DEV__: boolean;
