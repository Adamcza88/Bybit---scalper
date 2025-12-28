from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List, Literal

from .client import Candle


Signal = Literal["buy", "sell", "hold"]


def rsi(closes: Iterable[float], period: int = 14) -> float:
    closes_list: List[float] = list(closes)
    if len(closes_list) < period + 1:
        raise ValueError("Not enough data to compute RSI.")

    gains = []
    losses = []
    for previous, current in zip(closes_list[:-1], closes_list[1:]):
        delta = current - previous
        if delta >= 0:
            gains.append(delta)
            losses.append(0)
        else:
            gains.append(0)
            losses.append(-delta)
    avg_gain = sum(gains[-period:]) / period
    avg_loss = sum(losses[-period:]) / period
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))


def simple_ma(series: Iterable[float], length: int) -> float:
    values = list(series)
    if len(values) < length:
        raise ValueError("Not enough data for moving average.")
    return sum(values[-length:]) / length


@dataclass
class ScalpingSignal:
    signal: Signal
    rsi_value: float
    fast_ma: float
    slow_ma: float


class ScalpingStrategy:
    def __init__(self, fast_length: int = 9, slow_length: int = 21, rsi_length: int = 14) -> None:
        self.fast_length = fast_length
        self.slow_length = slow_length
        self.rsi_length = rsi_length

    def evaluate(self, candles: List[Candle]) -> ScalpingSignal:
        closes = [c.close for c in candles]
        fast = simple_ma(closes, self.fast_length)
        slow = simple_ma(closes, self.slow_length)
        rsi_value = rsi(closes, self.rsi_length)

        bias: Signal = "hold"
        if fast > slow and rsi_value > 55:
            bias = "buy"
        elif fast < slow and rsi_value < 45:
            bias = "sell"

        return ScalpingSignal(signal=bias, rsi_value=rsi_value, fast_ma=fast, slow_ma=slow)
