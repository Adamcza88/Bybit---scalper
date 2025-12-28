from bybit_scalper.strategy import ScalpingStrategy, rsi, simple_ma
from bybit_scalper.client import Candle


def make_candles(prices):
    return [Candle(timestamp=i, open=p, high=p, low=p, close=p, volume=1) for i, p in enumerate(prices)]


def test_rsi_extremes():
    upward = list(range(1, 20))
    assert rsi(upward, period=14) > 70
    downward = list(reversed(range(1, 20)))
    assert rsi(downward, period=14) < 30


def test_simple_ma():
    assert simple_ma([1, 2, 3, 4, 5], 3) == 4


def test_strategy_buy_and_sell():
    strategy = ScalpingStrategy(fast_length=2, slow_length=4, rsi_length=3)
    buy_prices = [100, 101, 102, 103, 104]
    buy_signal = strategy.evaluate(make_candles(buy_prices))
    assert buy_signal.signal in ("buy", "hold")

    sell_prices = [104, 103, 102, 101, 100]
    sell_signal = strategy.evaluate(make_candles(sell_prices))
    assert sell_signal.signal in ("sell", "hold")
