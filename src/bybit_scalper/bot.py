from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from typing import List, Optional

from .client import BybitClient, Candle
from .risk import PositionSizing
from .settings import Settings
from .strategy import ScalpingStrategy, ScalpingSignal

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("bybit_scalper")


@dataclass
class PaperPosition:
    side: str
    entry: float
    size: float
    stop: float
    target: float
    active: bool = True

    def update(self, price: float) -> Optional[str]:
        if not self.active:
            return None
        if self.side == "Buy":
            if price >= self.target:
                self.active = False
                return "tp"
            if price <= self.stop:
                self.active = False
                return "sl"
        else:
            if price <= self.target:
                self.active = False
                return "tp"
            if price >= self.stop:
                self.active = False
                return "sl"
        return None


@dataclass
class PaperTrader:
    balance: float = 1000.0
    positions: List[PaperPosition] = field(default_factory=list)

    def enter(self, side: str, entry: float, size: float, stop: float, target: float) -> None:
        self.positions.append(PaperPosition(side, entry, size, stop, target))
        logger.info("Paper %s %.4f @ %.2f stop %.2f target %.2f", side, size, entry, stop, target)

    def evaluate(self, price: float) -> None:
        for pos in self.positions:
            result = pos.update(price)
            if result == "tp":
                self.balance += abs(price - pos.entry) * pos.size
                logger.info("Paper %s hit TP at %.2f. Balance: %.2f", pos.side, price, self.balance)
            elif result == "sl":
                self.balance -= abs(price - pos.entry) * pos.size
                logger.info("Paper %s hit SL at %.2f. Balance: %.2f", pos.side, price, self.balance)
        self.positions = [p for p in self.positions if p.active]


class TradingBot:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.client = BybitClient(settings.base_url, settings.api_key, settings.api_secret)
        self.strategy = ScalpingStrategy()
        self.sizer = PositionSizing(
            quote_size=settings.quote_size,
            max_position_fraction=settings.max_position_fraction,
            risk_per_trade=settings.risk_per_trade,
        )
        self.paper = PaperTrader()

    def run_once(self) -> None:
        candles = self.client.fetch_klines(self.settings.symbol, self.settings.interval, self.settings.lookback)
        signal = self.strategy.evaluate(candles)
        last_price = candles[-1].close
        self.paper.evaluate(last_price)
        logger.info(
            "Signal: %s | close=%.2f | fast=%.2f slow=%.2f RSI=%.2f | balance=%.2f",
            signal.signal,
            last_price,
            signal.fast_ma,
            signal.slow_ma,
            signal.rsi_value,
            self.paper.balance,
        )
        if signal.signal != "hold":
            self._execute(signal, last_price)

    def _execute(self, signal: ScalpingSignal, price: float) -> None:
        size = self.sizer.order_size(price, self.paper.balance)
        if size <= 0:
            logger.info("Order size zero, skipping.")
            return
        stop_gap = price * 0.0015
        target_gap = stop_gap * self.settings.target_rr
        if signal.signal == "buy":
            stop = price - stop_gap
            target = price + target_gap
            side = "Buy"
        else:
            stop = price + stop_gap
            target = price - target_gap
            side = "Sell"
        if self.settings.live:
            self.client.place_order(self.settings.symbol, side=side, qty=size)
        else:
            self.paper.enter(side, price, size, stop, target)

    def loop(self, delay: int = 15) -> None:
        while True:
            try:
                self.run_once()
            except Exception as exc:  # noqa: BLE001
                logger.exception("Cycle failed: %s", exc)
            time.sleep(delay)
