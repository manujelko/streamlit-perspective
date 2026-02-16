import {
  FrontendRenderer,
  FrontendRendererArgs,
} from "@streamlit/component-v2-lib";

import perspective_viewer from "@perspective-dev/viewer";
import perspective from "@perspective-dev/client";
import "@perspective-dev/viewer-datagrid";
import "@perspective-dev/viewer-d3fc";

import "@perspective-dev/viewer/dist/css/pro.css";
import "@perspective-dev/viewer/dist/css/pro-dark.css";
import "@perspective-dev/viewer/dist/css/solarized.css";
import "@perspective-dev/viewer/dist/css/solarized-dark.css";
import "@perspective-dev/viewer/dist/css/monokai.css";
import "@perspective-dev/viewer/dist/css/vaporwave.css";

import "./styles.css";

import SERVER_WASM from "@perspective-dev/server/dist/wasm/perspective-server.wasm?url";
import CLIENT_WASM from "@perspective-dev/viewer/dist/wasm/perspective-viewer.wasm?url";

const DEFAULT_THEME = "Pro Dark";

// Lazy WASM init — cached promise, runs once.
let initPromise: Promise<void> | null = null;
function ensureInit(): Promise<void> {
  if (!initPromise) {
    initPromise = Promise.all([
      perspective.init_server(fetch(SERVER_WASM)),
      perspective_viewer.init_client(fetch(CLIENT_WASM)),
    ]).then(() => {
      console.log("[perspective] WASM initialized");
    });
  }
  return initPromise;
}

// Cached worker for static mode — avoids creating a new
// WASM worker on every mount.
let workerPromise: Promise<unknown> | null = null;
function ensureWorker(): Promise<unknown> {
  if (!workerPromise) {
    workerPromise = perspective.worker();
  }
  return workerPromise;
}

type FrontendState = {
  config: Record<string, unknown>;
};

type ComponentData = {
  mode: "static" | "websocket";
  height: number;
  config: Record<string, unknown> | null;
  // Static mode
  rows?: Record<string, unknown>[];
  // WebSocket mode
  url?: string;
  table_name?: string;
};

type PerspectiveViewerElement = HTMLElement & {
  load: (table: unknown) => Promise<void>;
  restore: (config: Record<string, unknown>) => Promise<void>;
  save: () => Promise<Record<string, unknown>>;
  delete: () => Promise<void>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WebSocketClient = { open_table: (name: string) => Promise<any> };

type Instance = {
  viewer: PerspectiveViewerElement;
  configListener: EventListener;
  wsClient?: WebSocketClient;
  url?: string;
  tableName?: string;
};

const instances: WeakMap<
  FrontendRendererArgs["parentElement"],
  Instance
> = new WeakMap();

function effectiveConfig(
  config: Record<string, unknown> | null,
): Record<string, unknown> {
  const base = { theme: DEFAULT_THEME };
  return { ...base, ...config };
}

async function loadStatic(
  viewer: PerspectiveViewerElement,
  rows: Record<string, unknown>[],
  config: Record<string, unknown> | null,
) {
  await ensureInit();
  const worker = await ensureWorker();
  // @ts-expect-error — worker type is opaque
  const table = await worker.table(rows);
  await viewer.load(table);
  await viewer.restore(effectiveConfig(config));
  console.log("[perspective] static table loaded,", rows.length, "rows");
}

async function loadWebSocket(
  instance: Instance,
  url: string,
  tableName: string,
  config: Record<string, unknown> | null,
) {
  await ensureInit();
  const client = await perspective.websocket(url);
  instance.wsClient = client as unknown as WebSocketClient;
  const table = await client.open_table(tableName);
  await instance.viewer.load(table);
  await instance.viewer.restore(effectiveConfig(config));
  console.log("[perspective] websocket table loaded:", url, tableName);
}

function showError(rootElement: Element | ShadowRoot, err: unknown) {
  console.error("[perspective] load failed:", err);
  const msg = document.createElement("pre");
  msg.style.color = "red";
  msg.style.padding = "1em";
  msg.textContent = `Perspective error: ${err}`;
  rootElement.appendChild(msg);
}

const PerspectiveViewer: FrontendRenderer<FrontendState, ComponentData> = (args) => {
  const { parentElement, data, setStateValue } = args;
  console.log("[perspective] renderer called, mode:", data.mode);

  const rootElement = parentElement.querySelector(".component-root") ?? parentElement;

  if (!instances.has(parentElement)) {
    const viewer = document.createElement("perspective-viewer") as PerspectiveViewerElement;
    viewer.style.height = `${data.height}px`;
    rootElement.appendChild(viewer);

    const configListener = async () => {
      const currentConfig = await viewer.save();
      setStateValue("config", currentConfig);
    };
    viewer.addEventListener("perspective-config-update", configListener);

    const instance: Instance = { viewer, configListener };
    instances.set(parentElement, instance);

    if (data.mode === "websocket" && data.url && data.table_name) {
      instance.url = data.url;
      instance.tableName = data.table_name;
      loadWebSocket(instance, data.url, data.table_name, data.config)
        .catch((err) => showError(rootElement, err));
    } else if (data.rows) {
      loadStatic(viewer, data.rows, data.config)
        .catch((err) => showError(rootElement, err));
    }
  } else {
    const instance = instances.get(parentElement)!;

    if (
      data.mode === "websocket" &&
      data.url && data.table_name &&
      (instance.url !== data.url || instance.tableName !== data.table_name)
    ) {
      instance.url = data.url;
      instance.tableName = data.table_name;
      loadWebSocket(instance, data.url, data.table_name, data.config)
        .catch((err) => console.error("[perspective] reconnect failed:", err));
    }
  }

  return () => {
    const instance = instances.get(parentElement);
    if (instance) {
      instance.viewer.removeEventListener(
        "perspective-config-update",
        instance.configListener,
      );
      instance.viewer.delete().catch(() => {});
      instances.delete(parentElement);
    }
  };
};

export default PerspectiveViewer;
