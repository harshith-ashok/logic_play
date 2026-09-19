// Runs code blocks from blog posts in the visitor's browser, inside Web
// Workers so a runaway loop can be terminated instead of freezing the tab.
// JavaScript gets a fresh worker per run; Pyodide (CPython compiled to
// WebAssembly, loaded from the jsDelivr CDN) is slow to boot so its worker is
// kept between runs and only recycled on timeout.

const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.27.2/full/pyodide.js";

const JS_WORKER = `
self.onmessage = async (event) => {
  const say = (type, args) =>
    self.postMessage({ type, text: args.map((a) => typeof a === "string" ? a : JSON.stringify(a) ?? String(a)).join(" ") });
  console.log = console.info = (...a) => say("out", a);
  console.warn = console.error = (...a) => say("err", a);
  try {
    const run = Object.getPrototypeOf(async function () {}).constructor;
    await new run(event.data)();
  } catch (e) {
    say("err", [String(e)]);
  }
  self.postMessage({ type: "done" });
};`;

const PY_WORKER = `
importScripts("${PYODIDE_URL}");
let pyodide;
self.onmessage = async (event) => {
  const say = (type, text) => self.postMessage({ type, text });
  try {
    pyodide ??= await loadPyodide({ stdout: (t) => say("out", t), stderr: (t) => say("err", t) });
    await pyodide.loadPackagesFromImports(event.data);
    await pyodide.runPythonAsync(event.data);
  } catch (e) {
    say("err", String(e.message ?? e));
  }
  self.postMessage({ type: "done" });
};`;

export type RunnableLanguage = "python" | "javascript";

export interface RunHandlers {
  onOutput: (text: string, isError: boolean) => void;
}

let pythonWorker: Worker | null = null;

function makeWorker(source: string): Worker {
  return new Worker(URL.createObjectURL(new Blob([source], { type: "text/javascript" })));
}

export function runCode(language: RunnableLanguage, code: string, { onOutput }: RunHandlers): Promise<void> {
  const isPython = language === "python";
  const worker = isPython ? (pythonWorker ??= makeWorker(PY_WORKER)) : makeWorker(JS_WORKER);
  const timeoutMs = isPython ? 30_000 : 5_000;

  return new Promise((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      worker.onmessage = null;
      if (!isPython) worker.terminate();
      resolve();
    };
    const timer = setTimeout(() => {
      onOutput(`Stopped: took longer than ${timeoutMs / 1000}s.`, true);
      worker.terminate();
      if (isPython) pythonWorker = null;
      finish();
    }, timeoutMs);

    worker.onmessage = (event: MessageEvent<{ type: "out" | "err" | "done"; text?: string }>) => {
      if (event.data.type === "done") return finish();
      onOutput(event.data.text ?? "", event.data.type === "err");
    };
    worker.postMessage(code);
  });
}
