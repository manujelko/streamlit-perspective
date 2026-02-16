# streamlit-perspective

<!--toc:start-->
- [streamlit-perspective](#streamlit-perspective)
  - [Installation](#installation)
  - [Quick start](#quick-start)
    - [Static data](#static-data)
    - [WebSocket streaming](#websocket-streaming)
  - [API](#api)
    - [`perspective_static`](#perspectivestatic)
    - [`perspective_websocket`](#perspectivewebsocket)
    - [Viewer config](#viewer-config)
    - [Return value](#return-value)
  - [Examples](#examples)
  - [Development](#development)
    - [Prerequisites](#prerequisites)
    - [Setup](#setup)
    - [Project structure](#project-structure)
    - [Workflow](#workflow)
    - [How it works](#how-it-works)
  - [License](#license)
<!--toc:end-->

A [Streamlit](https://streamlit.io/) component that wraps
[Perspective](https://perspective.finos.org/) — a high-performance
data visualization engine powered by WebAssembly. Pivot, filter,
sort, and chart millions of rows directly in the browser.

Built on Streamlit's [V2 component API](https://docs.streamlit.io/develop/concepts/custom-components/intro)
(no iframe).

## Installation

```bash
pip install streamlit-perspective
```

## Quick start

### Static data

Pass data directly from Python. Perspective handles all rendering,
pivoting, and charting client-side via WebAssembly.

```python
import streamlit as st
from streamlit_perspective import perspective_static

st.title("My Dashboard")

perspective_static(
    data=[
        {"name": "AAPL", "price": 189.84, "volume": 50_000},
        {"name": "GOOGL", "price": 141.80, "volume": 30_000},
        {"name": "MSFT", "price": 378.91, "volume": 45_000},
    ],
    config={"theme": "Pro Dark"},
    height=600,
)
```

### WebSocket streaming

Connect to a running
[perspective-python](https://pypi.org/project/perspective-python/)
server. The viewer streams data directly over WebSocket — Python
only provides the connection details.

```python
import streamlit as st
from streamlit_perspective import perspective_websocket

st.title("Live Market Data")

perspective_websocket(
    url="ws://localhost:8080/websocket",
    table_name="market_data",
    height=600,
    config={
        "theme": "Pro Dark",
        "plugin": "Datagrid",
        "sort": [["timestamp", "desc"]],
        "columns": [
            "symbol",
            "price",
            "volume",
            "timestamp",
        ],
    },
)
```

## API

### `perspective_static`

Display a Perspective viewer with static in-memory data.

```python
perspective_static(
    data: list[dict[str, Any]],
    *,
    config: dict[str, Any] | None = None,
    height: int = 500,
    key: str | None = None,
) -> dict[str, Any]
```

| Parameter | Type           | Default    | Description            |
|-----------|----------------|------------|------------------------|
| `data`    | `list[dict]`   | required   | Row dicts to display   |
| `config`  | `dict \| None` | `None`     | Viewer config (below)  |
| `height`  | `int`          | `500`      | Height in pixels       |
| `key`     | `str \| None`  | `None`     | Streamlit session key  |

### `perspective_websocket`

Display a Perspective viewer connected to a remote WebSocket server.

```python
perspective_websocket(
    url: str,
    table_name: str,
    *,
    config: dict[str, Any] | None = None,
    height: int = 500,
    key: str | None = None,
) -> dict[str, Any]
```

| Parameter    | Type           | Default    | Description           |
|--------------|----------------|------------|-----------------------|
| `url`        | `str`          | required   | WebSocket URL         |
| `table_name` | `str`          | required   | Table name on server  |
| `config`     | `dict \| None` | `None`     | Viewer config (below) |
| `height`     | `int`          | `500`      | Height in pixels      |
| `key`        | `str \| None`  | `None`     | Streamlit session key |

### Viewer config

The `config` dict maps directly to Perspective's [viewer configuration](https://perspective.finos.org/docs/config/).
Common options:

```python
config = {
    # Pro Light, Pro Dark, Monokai, Solarized,
    # Solarized Dark, Vaporwave
    "theme": "Pro Dark",
    # Datagrid, X Bar, Y Bar, X/Y Scatter,
    # Treemap, Sunburst, ...
    "plugin": "Datagrid",
    "columns": ["col_a", "col_b"],
    "group_by": ["category"],
    "split_by": ["region"],
    "sort": [["timestamp", "desc"]],
    "filter": [["price", ">", 100]],
    "expressions": {
        "profit": "\"revenue\" - \"cost\"",
    },
    "aggregates": {"price": "avg"},
}
```

You can interactively configure the viewer in the browser, then export the config
JSON to use in your code.

### Return value

Both functions return a `dict` with a `config` key containing the viewer's current
configuration. This is useful for inspecting what the user changed in the UI:

```python
result = perspective_static(data=my_data, key="viewer")
st.json(result["config"])  # current viewer state
```

## Examples

The `examples/` directory contains runnable demos.
The WebSocket example requires extra dependencies:

```bash
pip install streamlit-perspective[examples]
```

```bash
# Static data
uv run streamlit run examples/static.py

# WebSocket streaming (start the server first)
uv run python examples/websocket/server.py
# then in another terminal:
uv run streamlit run examples/websocket/app.py
```

## Development

### Prerequisites

- Python 3.10+
- [uv](https://docs.astral.sh/uv/)
- Node.js 18+

### Setup

```bash
# Clone the repo
git clone https://github.com/manuelsaric/streamlit-perspective.git
cd streamlit-perspective

# Install Python dependencies
uv sync

# Install frontend dependencies
cd src/streamlit_perspective/frontend && npm install

# Build frontend assets
cd src/streamlit_perspective/frontend && npm run build
```

### Project structure

```
streamlit-perspective/
├── src/streamlit_perspective/
│   ├── __init__.py          # Re-exports
│   ├── _component.py        # Component registration
│   ├── static.py            # perspective_static()
│   ├── websocket.py         # perspective_websocket()
│   └── frontend/
│       ├── package.json
│       ├── vite.config.ts   # Vite library mode
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts     # Component renderer
│           └── styles.css
├── examples/
│   ├── static.py
│   └── websocket/
│       ├── server.py        # Streaming server
│       └── app.py
├── pyproject.toml
└── Makefile
```

### Workflow

```bash
# Build frontend after making changes
cd src/streamlit_perspective/frontend && npm run build

# Run an example to test
uv run streamlit run examples/static.py

# Format and lint
make format
make lint
make type
```

### How it works

The frontend is a Vite library-mode build that produces a single ES module + CSS
file. Streamlit loads these directly (no iframe) via the V2 component API. The module
exports a renderer function that:

1. Creates a `<perspective-viewer>` custom element
2. Initializes Perspective's WebAssembly engine
3. Loads data from either a local worker (static mode)
   or a WebSocket connection
4. Applies the viewer config (theme, columns, pivots, etc.)

The WASM binaries are inlined as base64 in the JS bundle,
so no extra asset handling is needed.

## License

MIT
