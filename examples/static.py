"""Static data example.

Run with:
    uv run streamlit run examples/static.py
"""

import streamlit as st

from streamlit_perspective import perspective_static

st.title("Static Data")

perspective_static(
    data=[
        {"name": "Bob", "age": 35},
        {"name": "Jane", "age": 29},
    ],
    config={"theme": "Pro Dark"},
    height=600,
    key="static",
)
