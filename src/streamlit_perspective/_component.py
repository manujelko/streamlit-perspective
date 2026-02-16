import streamlit as st

component = st.components.v2.component(  # ty:ignore[possibly-missing-attribute]
    "streamlit-perspective.streamlit_perspective",
    js="index-*.js",
    css="*.css",
    html='<div class="component-root"></div>',
    isolate_styles=False,
)
