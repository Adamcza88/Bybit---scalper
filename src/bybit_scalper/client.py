from __future__ import annotations

import hashlib
import hmac
import time
from dataclasses import dataclass
from typing import Any, Dict, List

import httpx


class BybitAPIError(RuntimeError):
    pass


@dataclass
class Candle:
    timestamp: int
    open: float
    high: float
    low: float
    close: float
    volume: float

    @classmethod
    def from_row(cls, row: List[str]) -> "Candle":
        return cls(
            timestamp=int(row[0]),
            open=float(row[1]),
            high=float(row[2]),
            low=float(row[3]),
            close=float(row[4]),
            volume=float(row[5]),
        )


class BybitClient:
    def __init__(self, base_url: str, api_key: str | None = None, api_secret: str | None = None) -> None:
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.api_secret = api_secret
        self._client = httpx.Client(timeout=10)

    def _signed_headers(self, params: Dict[str, Any]) -> Dict[str, str]:
        if not self.api_key or not self.api_secret:
            return {}

        timestamp = str(int(time.time() * 1000))
        recv_window = "5000"
        param_str = "&".join(f"{k}={v}" for k, v in sorted(params.items()))
        to_sign = timestamp + self.api_key + recv_window + param_str
        signature = hmac.new(self.api_secret.encode(), to_sign.encode(), hashlib.sha256).hexdigest()
        return {
            "X-BAPI-SIGN": signature,
            "X-BAPI-TIMESTAMP": timestamp,
            "X-BAPI-RECV-WINDOW": recv_window,
            "X-BAPI-API-KEY": self.api_key,
        }

    def fetch_klines(self, symbol: str, interval: str, limit: int = 200, category: str = "linear") -> List[Candle]:
        params = {"symbol": symbol, "interval": interval, "limit": limit, "category": category}
        response = self._client.get(f"{self.base_url}/v5/market/kline", params=params)
        self._ensure_ok(response)
        data = response.json()["result"]["list"]
        candles = [Candle.from_row(row) for row in reversed(data)]
        return candles

    def place_order(
        self,
        symbol: str,
        side: str,
        qty: float,
        order_type: str = "Market",
        category: str = "linear",
        time_in_force: str = "IOC",
    ) -> Dict[str, Any]:
        if not self.api_key or not self.api_secret:
            raise BybitAPIError("Live trading requires BYBIT_API_KEY and BYBIT_API_SECRET.")

        params: Dict[str, Any] = {
            "category": category,
            "symbol": symbol,
            "side": side,
            "orderType": order_type,
            "qty": qty,
            "timeInForce": time_in_force,
        }
        headers = self._signed_headers(params)
        response = self._client.post(f"{self.base_url}/v5/order/create", json=params, headers=headers)
        self._ensure_ok(response)
        return response.json()

    def _ensure_ok(self, response: httpx.Response) -> None:
        if response.status_code != 200:
            raise BybitAPIError(f"HTTP {response.status_code}: {response.text}")
        payload = response.json()
        if payload.get("retCode") not in (0, "0"):
            raise BybitAPIError(f"API error: {payload}")
