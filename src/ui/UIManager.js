import { ChartManager } from './ChartManager.js';

export class UIManager {
    constructor(game) {
        this.game = game;
        this.chartManager = new ChartManager();
        this.notifications = [];
        
        this.setupEventListeners();
    }
    
    init() {
        this.setupGameEventListeners();
        this.setupUIEventListeners();
        this.updatePlatformStats();
    }
    
    setupEventListeners() {
        // Game event listeners
        this.game.on('gameStateUpdated', (gameState) => {
            this.updateGameInterface(gameState);
        });
        
        this.game.on('playerUpdated', (player) => {
            this.updatePlayerInfo(player);
        });
        
        this.game.on('tradeExecuted', (trade) => {
            this.addTradeToList(trade);
            this.showNotification(
                `Trade executed: ${trade.type} ${trade.amount} kWh at $${trade.price.toFixed(3)}/kWh`,
                'success'
            );
        });
        
        this.game.on('weatherChanged', (weather) => {
            this.updateWeatherDisplay(weather);
            this.showNotification(`Weather changed to ${weather.weather}`, 'info');
        });
        
        this.game.on('randomEvent', (event) => {
            this.showNotification(event.message, 'warning');
        });
        
        this.game.on('newDay', (day) => {
            this.showNotification(`Day ${day} begins!`, 'info');
        });
        
        this.game.on('gameEnded', (report) => {
            this.showGameEndReport(report);
        });
    }
    
    setupGameEventListeners() {
        // Pause/Resume button
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.game.pauseGame();
        });
        
        this.game.on('gamePaused', (isPaused) => {
            const btn = document.getElementById('pauseBtn');
            btn.textContent = isPaused ? '▶️ Resume' : '⏸️ Pause';
        });
    }
    
    setupUIEventListeners() {
        // Trade form
        this.setupTradeForm();
        
        // Automation rules
        this.setupAutomationRules();
        
        // Modal close
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.hideParticipantSelection();
        });
    }
    
    setupTradeForm() {
        const tradeTypeBtns = document.querySelectorAll('.trade-type-btn');
        const executeBtn = document.getElementById('executeTradeBtn');
        const amountInput = document.getElementById('tradeAmount');
        const priceInput = document.getElementById('tradePrice');
        
        let selectedType = 'buy';
        
        tradeTypeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tradeTypeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedType = btn.dataset.type;
            });
        });
        
        executeBtn.addEventListener('click', () => {
            const amount = parseFloat(amountInput.value);
            const price = parseFloat(priceInput.value);
            
            if (!amount || !price || amount <= 0 || price <= 0) {
                this.showNotification('Please enter valid amount and price', 'error');
                return;
            }
            
            if (this.game.executeTrade(selectedType, amount, price)) {
                amountInput.value = '';
                priceInput.value = '';
            }
        });
        
        // Auto-fill current market price
        priceInput.addEventListener('focus', () => {
            if (!priceInput.value) {
                priceInput.value = this.game.getMarket().currentPrice.toFixed(3);
            }
        });
    }
    
    setupAutomationRules() {
        const autoSellToggle = document.getElementById('autoSell');
        const autoBuyToggle = document.getElementById('autoBuy');
        
        autoSellToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                const threshold = parseFloat(e.target.parentElement.parentElement
                    .querySelector('.rule-input').value);
                this.game.addAutomationRule({
                    type: 'autoSell',
                    priceThreshold: threshold
                });
            } else {
                // Remove rule logic here
            }
        });
        
        autoBuyToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                const threshold = parseFloat(e.target.parentElement.parentElement
                    .querySelector('.rule-input').value);
                this.game.addAutomationRule({
                    type: 'autoBuy',
                    priceThreshold: threshold
                });
            } else {
                // Remove rule logic here
            }
        });
    }
    
    showParticipantSelection() {
        const modal = document.getElementById('participantModal');
        modal.classList.remove('hidden');
        
        // Setup participant card clicks
        document.querySelectorAll('.participant-card').forEach(card => {
            card.addEventListener('click', () => {
                const type = card.dataset.type;
                if (this.game.setParticipantType(type)) {
                    this.hideParticipantSelection();
                    this.game.startGame();
                    this.showNotification(`Welcome, ${this.game.participantTypes[type].name}!`, 'success');
                }
            });
        });
    }
    
    hideParticipantSelection() {
        document.getElementById('participantModal').classList.add('hidden');
    }
    
    updateGameInterface(gameState) {
        // Update time display
        document.getElementById('gameDay').textContent = `Day ${gameState.currentDay}`;
        document.getElementById('gameTime').textContent = 
            `${gameState.currentHour.toString().padStart(2, '0')}:00`;
        
        // Update market price
        document.getElementById('currentPrice').textContent = 
            `$${gameState.market.currentPrice.toFixed(3)}`;
        
        // Update market stats
        document.getElementById('marketSupply').textContent = 
            `${gameState.market.supply.toLocaleString()} kWh`;
        document.getElementById('marketDemand').textContent = 
            `${gameState.market.demand.toLocaleString()} kWh`;
        document.getElementById('tradingVolume').textContent = 
            `${gameState.market.volume.toLocaleString()} kWh`;
        
        // Update weather
        const weather = this.game.weatherEffects[gameState.market.weather];
        document.getElementById('weatherIcon').textContent = weather.icon;
        document.getElementById('weatherCondition').textContent = 
            gameState.market.weather.charAt(0).toUpperCase() + gameState.market.weather.slice(1);
        
        // Update chart
        this.chartManager.updatePriceChart(gameState.market.priceHistory);
        
        // Update leaderboard
        this.updateLeaderboard(gameState.leaderboard);
        
        // Update recent trades
        this.updateTradesList(this.game.getTrades());
    }
    
    updatePlayerInfo(player) {
        if (!player || !player.participantType) return;
        
        const participantData = this.game.participantTypes[player.participantType];
        
        // Update header
        document.getElementById('userName').textContent = player.name;
        document.getElementById('userBalance').textContent = `$${player.cash.toFixed(2)}`;
        
        // Update participant info
        document.getElementById('participantType').textContent = participantData.name;
        document.getElementById('solarGeneration').textContent = `${participantData.generation} kW`;
        document.getElementById('batteryCapacity').textContent = `${player.battery.toFixed(1)}/${participantData.battery} kWh`;
        document.getElementById('consumption').textContent = `${participantData.consumption} kW`;
    }
    
    updateWeatherDisplay(weather) {
        document.getElementById('weatherIcon').textContent = weather.icon;
        document.getElementById('weatherCondition').textContent = 
            weather.weather.charAt(0).toUpperCase() + weather.weather.slice(1);
    }
    
    updateLeaderboard(leaderboard) {
        const container = document.getElementById('leaderboard');
        container.innerHTML = '';
        
        leaderboard.slice(0, 5).forEach(player => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            
            const participantData = this.game.participantTypes[player.type];
            const icon = participantData ? participantData.icon : '👤';
            
            item.innerHTML = `
                <div class="leaderboard-rank">${player.rank}</div>
                <div class="leaderboard-info">
                    <div class="leaderboard-name">${icon} ${player.name}</div>
                    <div class="leaderboard-type">${participantData?.name || 'Unknown'}</div>
                </div>
                <div class="leaderboard-profit">$${player.profit.toFixed(2)}</div>
            `;
            
            container.appendChild(item);
        });
    }
    
    updateTradesList(trades) {
        const container = document.getElementById('recentTrades');
        container.innerHTML = '';
        
        trades.forEach(trade => {
            const item = document.createElement('div');
            item.className = 'trade-item';
            
            item.innerHTML = `
                <div class="trade-info">
                    <span class="trade-type ${trade.type}">${trade.type.toUpperCase()}</span>
                    <span>${trade.amount} kWh</span>
                </div>
                <div class="trade-price">$${trade.price.toFixed(3)}</div>
                <div class="trade-total">$${trade.totalValue.toFixed(2)}</div>
            `;
            
            container.appendChild(item);
        });
    }
    
    addTradeToList(trade) {
        // This will be handled by updateTradesList when game state updates
    }
    
    updatePlatformStats() {
        // Simulate live platform stats
        setInterval(() => {
            const activeTraders = 120 + Math.floor(Math.random() * 20);
            const energyTraded = (2.0 + Math.random() * 1.0).toFixed(1);
            const avgPrice = (0.10 + Math.random() * 0.06).toFixed(3);
            
            const tradersEl = document.getElementById('activeTraders');
            const energyEl = document.getElementById('energyTraded');
            const priceEl = document.getElementById('avgPrice');
            
            if (tradersEl) tradersEl.textContent = activeTraders;
            if (energyEl) energyEl.textContent = `${energyTraded} MWh`;
            if (priceEl) priceEl.textContent = `$${avgPrice}`;
        }, 5000);
    }
    
    showNotification(message, type = 'info') {
        const container = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        notification.innerHTML = `
            <div class="notification-content">
                <p>${message}</p>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
        
        // Remove on click
        notification.addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }
    
    showGameEndReport(report) {
        const message = `
            Game Complete! 
            Final Profit: $${report.totalProfit.toFixed(2)}
            Total Trades: ${report.totalTrades}
            Final Rank: #${report.finalRank}
        `;
        
        this.showNotification(message, 'success');
        
        // Could show a detailed modal here
    }
    
    showSettings() {
        // Placeholder for settings modal
        this.showNotification('Settings panel coming soon!', 'info');
    }
}