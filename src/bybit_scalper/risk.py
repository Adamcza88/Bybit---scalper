from __future__ import annotations

from dataclasses import dataclass


@dataclass
class PositionSizing:
    quote_size: float
    max_position_fraction: float
    risk_per_trade: float

    def order_size(self, price: float, balance: float) -> float:
        if price <= 0:
            raise ValueError("Price must be positive.")
        capped_balance = balance * self.max_position_fraction
        risk_cap = balance * self.risk_per_trade
        notional = min(self.quote_size, capped_balance, risk_cap * 3)
        return round(notional / price, 6)
