from typing import Any

from streamlit_perspective._component import component


def perspective_static(
    data: list[dict[str, Any]],
    *,
    config: dict[str, Any] | None = None,
    height: int = 500,
    key: str | None = None,
) -> dict[str, Any]:
    """Display a Perspective viewer with static in-memory data."""
    return component(
        data={
            "mode": "static",
            "rows": data,
            "height": height,
            "config": config,
        },
        default={"config": config or {}},
        key=key,
        height=height,
        on_config_change=lambda: None,
    )
