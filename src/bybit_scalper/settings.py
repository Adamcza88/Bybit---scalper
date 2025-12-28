from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass
class Settings:
    symbol: str
    interval: str = "1"
    lookback: int = 200
    quote_size: float = 100.0
    live: bool = False
    base_url: str = "https://api.bybit.com"
    api_key: str | None = None
    api_secret: str | None = None
    risk_per_trade: float = 0.01
    max_position_fraction: float = 0.2
    target_rr: float = 1.5

    @classmethod
    def from_env(cls, **overrides: object) -> "Settings":
        env_values = {
            "api_key": os.getenv("BYBIT_API_KEY"),
            "api_secret": os.getenv("BYBIT_API_SECRET"),
        }
        combined = {**env_values, **overrides}
        return cls(**combined)  # type: ignore[arg-type]
