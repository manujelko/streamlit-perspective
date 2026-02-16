"""WebSocket streaming example.

Run the server first:
    uv run python examples/websocket/server.py

Then in another terminal:
    uv run streamlit run examples/websocket/app.py
"""

import streamlit as st

from streamlit_perspective import perspective_websocket

st.title("WebSocket Streaming")

perspective_websocket(
    url="ws://localhost:8080/websocket",
    table_name="data_source_one",
    height=600,
    key="websocket",
    config={  # copied from the perspective ui
        "version": "4.1.1",
        "columns_config": {},
        "plugin": "Datagrid",
        "plugin_config": {},
        "settings": True,
        "table": "data_source_one",
        "theme": "Solarized Dark",
        "title": None,
        "group_by": [],
        "split_by": [],
        "sort": [["lastUpdate", "desc"]],
        "filter": [],
        "expressions": {},
        "columns": [
            "name",
            "client",
            "open",
            "high",
            "low",
            "close",
            "lastUpdate",
            "date",
        ],
        "aggregates": {},
    },
)
