from typing import Any

from streamlit_perspective._component import component


def perspective_websocket(
    url: str,
    table_name: str,
    *,
    config: dict[str, Any] | None = None,
    height: int = 500,
    key: str | None = None,
) -> dict[str, Any]:
    """Display a Perspective viewer connected to a remote WebSocket server."""
    return component(
        data={
            "mode": "websocket",
            "url": url,
            "table_name": table_name,
            "height": height,
            "config": config,
        },
        default={"config": config or {}},
        key=key,
        height=height,
        on_config_change=lambda: None,
    )
