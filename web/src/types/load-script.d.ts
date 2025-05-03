declare module 'load-script' {
  function loadScript(
    src: string,
    callback?: (error: Error | null) => void
  ): HTMLScriptElement;
  export = loadScript;
} 