from __future__ import annotations

import argparse
import os

from dotenv import load_dotenv

from bybit_scalper.bot import TradingBot
from bybit_scalper.settings import Settings


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Autonomous Bybit scalping bot.")
    parser.add_argument("--symbol", default="BTCUSDT", help="Bybit symbol, e.g., BTCUSDT.")
    parser.add_argument("--interval", default="1", help="Kline interval (Bybit format).")
    parser.add_argument("--quote-size", type=float, default=100.0, help="Quote size per trade.")
    parser.add_argument("--live", action="store_true", help="Send live orders instead of paper trading.")
    parser.add_argument("--delay", type=int, default=15, help="Seconds between polling cycles.")
    return parser.parse_args()


def main() -> None:
    load_dotenv()
    args = parse_args()
    settings = Settings.from_env(
        symbol=args.symbol,
        interval=args.interval,
        quote_size=args.quote_size,
        live=args.live,
    )
    bot = TradingBot(settings)
    bot.loop(delay=args.delay)


if __name__ == "__main__":
    main()
