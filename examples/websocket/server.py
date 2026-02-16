"""Streaming Perspective server for the WebSocket example.

Run with:
    uv run python examples/websocket/server.py

Serves a WebSocket at ws://localhost:8080/websocket with a table named
"data_source_one" that receives random market data every 50ms.
"""

import datetime
import logging
import random
import threading
import time

import perspective
import perspective.handlers.tornado
import tornado.ioloop
import tornado.web

NAMES = ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "TSLA", "NVDA", "JPM"]
CLIENTS = ["Homer", "Marge", "Bart", "Lisa", "Maggie", "Ned", "Moe", "Barney"]


def make_app(perspective_server):
    return tornado.web.Application(
        [
            (
                r"/websocket",
                perspective.handlers.tornado.PerspectiveTornadoHandler,
                {"perspective_server": perspective_server},
            ),
        ],
        websocket_max_message_size=100 * 1024 * 1024,
    )


def data_generator(table):
    """Background thread that pushes random rows every 50ms."""
    while True:
        rows = []
        for _ in range(5):
            base = random.uniform(50.0, 500.0)
            high = base + random.uniform(0, 20.0)
            low = base - random.uniform(0, 20.0)
            close = random.uniform(low, high)
            rows.append(
                {
                    "name": random.choice(NAMES),
                    "client": random.choice(CLIENTS),
                    "open": base,
                    "high": high,
                    "low": low,
                    "close": close,
                    "lastUpdate": datetime.datetime.now().isoformat(),
                    "date": datetime.date.today().isoformat(),
                }
            )
        table.update(rows)
        time.sleep(0.05)


if __name__ == "__main__":
    server = perspective.Server()
    client = server.new_local_client()

    table = client.table(
        {
            "name": str,
            "client": str,
            "open": float,
            "high": float,
            "low": float,
            "close": float,
            "lastUpdate": datetime.datetime,
            "date": datetime.date,
        },
        name="data_source_one",
        limit=250_000,
    )

    app = make_app(server)
    app.listen(8080)

    logging.critical("Listening on http://localhost:8080")
    logging.critical("WebSocket at ws://localhost:8080/websocket")
    logging.critical("Table: data_source_one")

    thread = threading.Thread(target=data_generator, args=(table,), daemon=True)
    thread.start()

    tornado.ioloop.IOLoop.current().start()
