# P2P Energy Trading Simulator

Peer-to-Peer Energy Trading Simulator is an educational web game that simulates participating in decentralized energy markets. Players explore scenarios as commercial, industrial, prosumer residential, or community energy traders. The game focuses on the opportunities, risks, and strategic decision-making involved in transactive energy trading, including manual and IoT-automated trades.

## Game Objective

Players simulate energy trading over multiple days, buying and selling energy while managing assets and risks. The objective is to maximize profitability and learn the dynamics of P2P energy markets.

## Game Features

- **Participant Types**: Players choose between Residential Prosumer, Commercial Prosumer, Industrial Consumer, or Energy Community, each with unique assets, consumption patterns, risk tolerance, and automation capabilities.
- **Multi-Day Simulation**: A 7-day cycle with hourly trading, dynamic pricing, and random events such as weather affecting renewable generation.
- **Trading Mechanics**: Trade manually or set automated IoT rules. Dynamic pricing reflects real-world market shifts, with peak demand hours and supply/demand variations.
- **IoT Automation**: Configure trading rules such as "sell excess solar when price > $0.15/kWh" or "shift loads to off-peak hours."
- **Profitability Visualization**: Real-time dashboard tracks cash balance, trades, daily and cumulative profits.
- **Event & Risk System**: Simulate equipment failures, market manipulation, regulatory changes, cyber/communication failures, and grid congestion. All risks dynamically affect your trading and profits.
- **Modern, Clean UI**: Responsive web design with energy-themed colors, real-time market charts, weather icons, alerts, and intuitive panel layouts.

## Gameplay Flow

1. **Choose participant type and view assets**
2. **Game starts at Day 1, 6 AM; initial market conditions are shown**
3. **Begin trading and/or set automation rules**
4. **Hourly market events drive price, supply/demand, and weather conditions**
5. **Monitor your dashboard, adjust strategies, respond to events**
6. **After 7 simulated days, receive a performance report and insights**

## Software Design

### Architecture

- **Frontend**: HTML, CSS, JavaScript ES6. All logic is client-side for simplicity and ease of deployment.
- **Components**:
  - **index.html**: Main structure, participant selection, root containers
  - **style.css**: Theme, responsive design, notification, and panel layout
  - **app.js**: Game logic (participant management, trading simulation, event system, profit calculation, automation rules)
- **Game State**: Maintained as a JavaScript object, tracking participant assets, cash balance, battery storage, trading history, and event flags.
- **Event System**: Randomized (or pseudo-realistic) hourly events for weather (affecting renewables), grid conditions, participant-specific risks.
- **Trading Engine**: Simulates market supply/demand, determines price per kWh, resolves buy/sell trades manually and via automation.
- **IoT Automation**: Uses "presets" array per participant for rule-based transaction triggers.
- **UI**: Dynamically renders trading panels, dashboards, leaderboards, charts using vanilla JS DOM manipulation.

### Extensibility

- **Add participants, assets, price models** by editing app.js and HTML
- **Integrate APIs or server-side logic** for real-time multiplayer or persistent leaderboards
- **Advanced Analytics**: Can incorporate chart libraries for more data visualization and risk analysis.

### Security & Privacy

- All simulation logic runs locally in-browser, with no data sent externally. Suitable for classroom, training, and open web deployment.

## Getting Started

1. `git clone <repository-url>`
2. Place `index.html`, `style.css`, and `app.js` in the project root
3. Open `index.html` in your browser

## License

Open-source community/educational license.

---

## Authors

Developed by Perplexity AI, inspired by real-world energy market research and simulation platforms.

