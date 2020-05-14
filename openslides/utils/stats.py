import asyncio
import time
from typing import List, Optional

from . import logging


class WebsocketLatencyLogger:
    """
    Loggs latencies reported by clients during the ping-pong messages. Collects
    them and calculate the mean and standard derivation in 60 second intervalls
    and print these stats to the logger.

    Usage: WebsocketLatencyLogger.add_latency(<latency>)
    """

    lock = asyncio.Lock()
    """ Locks the access to the shared latency list. """

    instance = None
    """ The only latencylogger instance. """

    logger = logging.getLogger("openslides.websocket.latency")
    """ The logger to log to. """

    def __init__(self) -> None:
        self.reset()

    @classmethod
    async def add_latency(cls, latency: int) -> None:
        """ Add the latency to the logger. """
        # pass the latency value to the single instance
        if cls.instance is None:
            cls.instance = cls()
        await cls.instance._add_latency(latency)

    async def _add_latency(self, latency: int) -> None:
        async with self.lock:
            self.latencies.append(latency)

            # If we waited longer then 60 seconds, flush the data.
            current_time = time.time()
            if current_time > (self.time + 60):
                self.flush()
                return

            # If we have collected too many entries, flush the data.
            if len(self.latencies) > 1000:
                self.flush()

    def flush(self) -> None:
        """ Calc Stats and print to logger. """
        N = len(self.latencies)
        mean = sum(self.latencies) / N
        std = sum((latency - mean) ** 2 for latency in self.latencies)
        self.logger.debug(f"N={N}, mean={mean:.2f}, std={std:.2f}")

        self.reset()

    def reset(self) -> None:
        """ Resets the stats. """
        self.latencies: List[int] = []
        self.time = time.time()


class WebsocketThroughputLogger:
    """
    Usage (give values in bytes):
    - WebsocketThroughputLogger.send(<uncompressed>, <compressed>)
    - WebsocketThroughputLogger.recieve(<uncompressed>, <compressed>)
    The compressed value is optional. If the data is not compressed, just
    give the uncompressed value.
    Note: Only the send values are logged in KB (received values in bytes).
    """

    lock = asyncio.Lock()
    """ To access the stats variables. """

    instance = None
    """ The only throughputlogger instance. """

    logger = logging.getLogger("openslides.websocket.throughput")
    """ The logger to log to. """

    def __init__(self) -> None:
        self.reset()

    @classmethod
    async def send(cls, uncompressed: int, compressed: Optional[int] = None) -> None:
        # pass the latency value to the single instance
        async with cls.lock:
            if cls.instance is None:
                cls.instance = cls()
            if compressed is None:
                compressed = uncompressed
            cls.instance.send_uncompressed += int(uncompressed / 1024)
            cls.instance.send_compressed += int(compressed / 1024)
            await cls.instance.check_and_flush()

    @classmethod
    async def receive(cls, uncompressed: int, compressed: Optional[int] = None) -> None:
        # pass the latency value to the single instance
        async with cls.lock:
            if cls.instance is None:
                cls.instance = cls()
            if compressed is None:
                compressed = uncompressed
            cls.instance.receive_uncompressed += uncompressed
            cls.instance.receive_compressed += compressed
            await cls.instance.check_and_flush()

    async def check_and_flush(self) -> None:
        # If we waited longer then 60 seconds, flush the data.
        current_time = time.time()
        if current_time > (self.time + 60):

            send_ratio = receive_ratio = 1.0
            if self.send_compressed > 0:
                send_ratio = self.send_uncompressed / self.send_compressed
            if self.receive_compressed > 0:
                receive_ratio = self.receive_uncompressed / self.receive_compressed

            self.logger.debug(
                f"tx_uncompressed={self.send_uncompressed} KB, "
                f"tx_compressed={self.send_compressed} KB, "
                f"tx_ratio={send_ratio:.2f}, "
                f"rx_uncompressed={self.receive_uncompressed} B, "
                f"rx_compressed={self.receive_compressed} B, "
                f"rx_ratio={receive_ratio:.2f}"
            )
            self.reset()

    def reset(self) -> None:
        """ Resets the stats. """
        self.send_compressed = 0
        self.send_uncompressed = 0
        self.receive_compressed = 0
        self.receive_uncompressed = 0
        self.time = time.time()
