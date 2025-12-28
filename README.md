Bybit scalper bot targeting the public Bybit API with an autonomous loop that applies a simple, risk-managed scalping signal.

## Features
- Pulls recent klines from the public Bybit market endpoint.
- Computes a lightweight RSI and short/long moving averages for a high-frequency biased signal.
- Paper-trading executor to evaluate entries/exits without credentials.
- Hooks for live trading via environment variables (API key/secret) without storing secrets in code.
- CLI loop that keeps running until stopped.

## Quick start
```
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py --symbol BTCUSDT --interval 1 --quote-size 100
```

The CLI defaults to paper trading. To enable live trading, provide `BYBIT_API_KEY` and `BYBIT_API_SECRET` environment variables and add `--live`.

## Tests
```
pytest
```
