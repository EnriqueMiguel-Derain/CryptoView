# CryptoView

A beginner-friendly crypto tracker with live market data, a learning hub, and a practice wallet that uses virtual money.

> **Education only.** CryptoView is not financial advice, and the wallet does not use real money.

## Features

- **Dashboard:** total holding, watchlist (most viewed / gain / lose), portfolio summary, and a performance chart with a coin picker (1W to 1Y)
- **Markets:** top 50 coins with search, sortable columns (rank, price, 24h, 7d, market cap), refresh, and a watchlist star
- **Coin Detail:** price, rank, market cap, interactive 7/30/90-day chart, description, and shortcuts to Convert, Buy, and Sell
- **Converter:** crypto to fiat, fiat to crypto, and crypto to crypto, with a swap button and the exact rate shown
- **Watchlist:** all your starred coins in one place
- **Practice Wallet:** buy and sell with virtual money in USD or PHP, with portfolio profit/loss and filterable history
- **Learn & Help:** searchable glossary, FAQ, and a feedback form with validation
- **Extras:** light/dark theme, USD/PHP currency toggle, and a responsive layout (desktop, tablet, mobile)

## Tech stack

- HTML, CSS, and vanilla JavaScript (no frameworks, no build step)
- Charts drawn by hand on an HTML `<canvas>` (no chart library)
- `localStorage` for the wallet, watchlist, theme, currency, and cached data

## APIs used

All of these are free and need **no API key**.

| API | Used for |
|---|---|
| [Coinpaprika](https://api.coinpaprika.com) | Top 50 coin prices, 24h/7d change, market cap, coin descriptions |
| [Binance public market data](https://data-api.binance.vision) | Daily candles for the price charts |
| [fawazahmed0 exchange-api](https://github.com/fawazahmed0/exchange-api) | Fiat exchange rates (USD, PHP, EUR, and more) |
| [Frankfurter](https://api.frankfurter.dev) | Fallback for the PHP rate |

## Project structure

```
CryptoView-website/
├── index.html        # Dashboard
├── markets.html      # Top 50 coins table
├── coin.html         # Coin detail and chart
├── converter.html    # Currency converter
├── watchlist.html    # Starred coins
├── wallet.html       # Practice wallet
├── learn.html        # Glossary, FAQ, feedback form
├── css/
│   └── style.css     # Shared styles, themes, responsive layout
└── js/
    └── app.js        # Shared module: nav, theme, currency, data fetching, charts
```

## How to run

No install is needed.

1. Download or clone the project.
2. Open `index.html` in your browser.

For the most reliable results, serve the folder with a local server instead:

```bash
# Python
python3 -m http.server 8000

# or Node
npx serve .
```

Then open `http://localhost:8000`. An internet connection is needed to load live data.

## How it works

- **Shared module:** every page loads `js/app.js`, which handles the sidebar, search bar, theme toggle, currency toggle, API calls, money formatting, and chart drawing.
- **Caching:** market data is cached for 60 seconds and exchange rates for 1 hour.
- **Resilience:** requests retry up to 3 times. If an API fails, the app shows the last saved data with an "outdated" notice instead of breaking.
- **Wallet logic:** each coin tracks quantity and total cost. Profit/loss is current value minus cost. Orders are blocked if you lack the cash or the coins.
- **Security:** API text is escaped (`esc()`) before it is inserted into the page.

## Known limitations

- Only the top 50 coins are available.
- Chart data comes from the `SYMBOLUSDT` pair on Binance, so some coins have no chart.
- Data refreshes on page load or when you press Refresh, not automatically in the background.
- The feedback form validates input but does not send it anywhere yet.
- All data is stored in your own browser, so clearing browser data resets the wallet and watchlist.
- The practice wallet starts with 10,000,000 USD of virtual cash (`START_CASH` in `js/app.js`).

## Future improvements

- Support more than 50 coins
- Real user accounts
- Send the feedback form to a server
- Automatic background price refresh

## Team

| Member | Parts |
|---|---|
| Enrique Miguel Derain (group leader) | Shared layout and data module, Dashboard, Markets, Learn & Help, theme switcher, final integration |
| Aeric Joseph Angeles | Coin Detail, price chart, Converter, currency toggle |
| Dairnel Reese Sadsad | Watchlist, Practice Wallet |

## Disclaimer

CryptoView is an educational project. Prices are for information only and may be delayed or outdated. Nothing here is financial advice.
