export class EnergyTradingGame {
    constructor() {
        this.gameState = {
            currentDay: 1,
            currentHour: 6,
            isRunning: false,
            isPaused: false,
            gameSpeed: 1000, // ms per hour
            
            market: {
                currentPrice: 0.12,
                supply: 1250,
                demand: 1180,
                volume: 340,
                priceHistory: [],
                weather: 'sunny'
            },
            
            player: null,
            participants: new Map(),
            orders: [],
            trades: [],
            leaderboard: [],
            
            events: [],
            automationRules: []
        };
        
        this.participantTypes = {
            residential: {
                name: "Residential Prosumer",
                icon: "🏠",
                generation: 8,
                consumption: 12,
                battery: 15,
                automation: 4,
                riskTolerance: 3,
                startingCash: 500,
                assets: ["5kW Solar Panels", "10kWh Battery", "Smart Home System"]
            },
            commercial: {
                name: "Commercial Prosumer",
                icon: "🏢", 
                generation: 150,
                consumption: 200,
                battery: 300,
                automation: 7,
                riskTolerance: 6,
                startingCash: 5000,
                assets: ["100kW Solar Array", "200kWh Battery Bank", "Building Management System"]
            },
            industrial: {
                name: "Industrial Consumer",
                icon: "🏭",
                generation: 50,
                consumption: 800,
                battery: 100,
                automation: 6,
                riskTolerance: 8,
                startingCash: 10000,
                assets: ["Backup Generators", "Load Management System", "Process Flexibility"]
            },
            community: {
                name: "Energy Community",
                icon: "🌍",
                generation: 300,
                consumption: 250,
                battery: 500,
                automation: 8,
                riskTolerance: 4,
                startingCash: 2000,
                assets: ["Community Solar Farm", "Shared Battery Storage", "Smart Grid Management"]
            }
        };
        
        this.weatherEffects = {
            sunny: { solar: 1.5, wind: 0.8, icon: '☀️' },
            cloudy: { solar: 0.5, wind: 1.0, icon: '☁️' },
            windy: { solar: 1.0, wind: 2.0, icon: '💨' },
            rainy: { solar: 0.3, wind: 1.2, icon: '🌧️' }
        };
        
        this.timePatterns = {
            peakHours: [14, 15, 16, 17, 18, 19],
            offPeakHours: [22, 23, 0, 1, 2, 3, 4, 5],
            normalHours: [6, 7, 8, 9, 10, 11, 12, 13, 20, 21]
        };
        
        this.gameLoop = null;
        this.eventHandlers = new Map();
        
        this.initializeMarket();
        this.generateDemoParticipants();
    }
    
    initPlayer(playerData) {
        this.gameState.player = {
            ...playerData,
            cash: 0,
            energy: 0,
            battery: 0,
            totalProfit: 0,
            dailyProfit: 0,
            tradesCount: 0,
            participantType: null
        };
    }
    
    setParticipantType(type) {
        if (!this.participantTypes[type]) return false;
        
        const participantData = this.participantTypes[type];
        this.gameState.player.participantType = type;
        this.gameState.player.cash = participantData.startingCash;
        this.gameState.player.maxGeneration = participantData.generation;
        this.gameState.player.maxConsumption = participantData.consumption;
        this.gameState.player.maxBattery = participantData.battery;
        this.gameState.player.battery = participantData.battery * 0.5; // Start half charged
        
        this.emit('playerUpdated', this.gameState.player);
        return true;
    }
    
    startGame() {
        if (this.gameState.isRunning) return;
        
        this.gameState.isRunning = true;
        this.gameState.isPaused = false;
        
        this.gameLoop = setInterval(() => {
            if (!this.gameState.isPaused) {
                this.updateGameState();
            }
        }, this.gameState.gameSpeed);
        
        this.emit('gameStarted');
    }
    
    pauseGame() {
        this.gameState.isPaused = !this.gameState.isPaused;
        this.emit('gamePaused', this.gameState.isPaused);
    }
    
    stopGame() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        
        this.gameState.isRunning = false;
        this.gameState.isPaused = false;
        
        this.emit('gameStopped');
    }
    
    updateGameState() {
        // Update time
        this.gameState.currentHour++;
        if (this.gameState.currentHour >= 24) {
            this.gameState.currentHour = 0;
            this.gameState.currentDay++;
            this.onNewDay();
        }
        
        // Update market conditions
        this.updateMarket();
        
        // Process automation rules
        this.processAutomation();
        
        // Update player energy generation/consumption
        this.updatePlayerEnergy();
        
        // Process random events
        this.processRandomEvents();
        
        // Update leaderboard
        this.updateLeaderboard();
        
        // Emit updates
        this.emit('gameStateUpdated', this.gameState);
        
        // Check for game end
        if (this.gameState.currentDay > 7) {
            this.endGame();
        }
    }
    
    updateMarket() {
        const hour = this.gameState.currentHour;
        const weather = this.gameState.market.weather;
        
        // Base price calculation
        let basePrice = 0.12;
        
        // Time-based pricing
        if (this.timePatterns.peakHours.includes(hour)) {
            basePrice *= 2.5;
        } else if (this.timePatterns.offPeakHours.includes(hour)) {
            basePrice *= 0.6;
        }
        
        // Weather effects on supply
        const weatherEffect = this.weatherEffects[weather];
        const renewableSupply = 800 * weatherEffect.solar + 400 * weatherEffect.wind;
        
        // Supply/demand dynamics
        const totalSupply = renewableSupply + 500; // Base grid supply
        const totalDemand = this.calculateTotalDemand();
        
        const supplyDemandRatio = totalSupply / totalDemand;
        basePrice *= (2 - supplyDemandRatio); // Price inversely related to supply/demand ratio
        
        // Add some randomness
        basePrice *= (0.9 + Math.random() * 0.2);
        
        // Update market state
        this.gameState.market.currentPrice = Math.max(0.05, Math.min(0.50, basePrice));
        this.gameState.market.supply = Math.round(totalSupply);
        this.gameState.market.demand = Math.round(totalDemand);
        
        // Update price history
        this.gameState.market.priceHistory.push({
            time: `Day ${this.gameState.currentDay}, ${hour}:00`,
            price: this.gameState.market.currentPrice,
            supply: this.gameState.market.supply,
            demand: this.gameState.market.demand
        });
        
        // Keep only last 24 hours of data
        if (this.gameState.market.priceHistory.length > 24) {
            this.gameState.market.priceHistory.shift();
        }
        
        // Random weather changes
        if (Math.random() < 0.1) {
            this.changeWeather();
        }
    }
    
    calculateTotalDemand() {
        const hour = this.gameState.currentHour;
        let baseDemand = 1000;
        
        // Time-based demand patterns
        if (this.timePatterns.peakHours.includes(hour)) {
            baseDemand *= 1.8;
        } else if (this.timePatterns.offPeakHours.includes(hour)) {
            baseDemand *= 0.6;
        }
        
        // Add participant consumption
        this.gameState.participants.forEach(participant => {
            baseDemand += participant.currentConsumption || 0;
        });
        
        if (this.gameState.player && this.gameState.player.participantType) {
            const playerType = this.participantTypes[this.gameState.player.participantType];
            baseDemand += playerType.consumption;
        }
        
        return baseDemand;
    }
    
    changeWeather() {
        const weathers = Object.keys(this.weatherEffects);
        const newWeather = weathers[Math.floor(Math.random() * weathers.length)];
        
        if (newWeather !== this.gameState.market.weather) {
            this.gameState.market.weather = newWeather;
            this.emit('weatherChanged', {
                weather: newWeather,
                icon: this.weatherEffects[newWeather].icon
            });
        }
    }
    
    updatePlayerEnergy() {
        if (!this.gameState.player || !this.gameState.player.participantType) return;
        
        const playerType = this.participantTypes[this.gameState.player.participantType];
        const weather = this.weatherEffects[this.gameState.market.weather];
        
        // Calculate generation
        const generation = playerType.generation * weather.solar;
        const consumption = playerType.consumption;
        
        const netEnergy = generation - consumption;
        
        // Update battery
        if (netEnergy > 0) {
            // Excess energy - charge battery or sell
            const batterySpace = this.gameState.player.maxBattery - this.gameState.player.battery;
            const toBattery = Math.min(netEnergy, batterySpace);
            this.gameState.player.battery += toBattery;
            this.gameState.player.energy = netEnergy - toBattery;
        } else {
            // Energy deficit - use battery or buy
            const fromBattery = Math.min(-netEnergy, this.gameState.player.battery);
            this.gameState.player.battery -= fromBattery;
            this.gameState.player.energy = netEnergy + fromBattery;
        }
        
        this.emit('playerEnergyUpdated', {
            generation,
            consumption,
            battery: this.gameState.player.battery,
            netEnergy: this.gameState.player.energy
        });
    }
    
    processAutomation() {
        this.gameState.automationRules.forEach(rule => {
            if (rule.enabled && this.checkRuleCondition(rule)) {
                this.executeAutomationRule(rule);
            }
        });
    }
    
    checkRuleCondition(rule) {
        const currentPrice = this.gameState.market.currentPrice;
        
        switch (rule.type) {
            case 'autoSell':
                return currentPrice >= rule.priceThreshold && this.gameState.player.energy > 0;
            case 'autoBuy':
                return currentPrice <= rule.priceThreshold && this.gameState.player.energy < 0;
            default:
                return false;
        }
    }
    
    executeAutomationRule(rule) {
        const amount = Math.abs(this.gameState.player.energy);
        const price = this.gameState.market.currentPrice;
        
        if (rule.type === 'autoSell' && amount > 0) {
            this.executeTrade('sell', amount, price, true);
        } else if (rule.type === 'autoBuy' && amount > 0) {
            this.executeTrade('buy', amount, price, true);
        }
    }
    
    addAutomationRule(rule) {
        this.gameState.automationRules.push({
            id: Date.now(),
            ...rule,
            enabled: true
        });
        
        this.emit('automationRuleAdded', rule);
    }
    
    toggleAutomationRule(ruleId, enabled) {
        const rule = this.gameState.automationRules.find(r => r.id === ruleId);
        if (rule) {
            rule.enabled = enabled;
            this.emit('automationRuleToggled', { ruleId, enabled });
        }
    }
    
    executeTrade(type, amount, price, isAutomated = false) {
        if (!this.gameState.player) return false;
        
        const totalCost = amount * price;
        
        if (type === 'buy') {
            if (this.gameState.player.cash < totalCost) {
                this.emit('tradeError', 'Insufficient funds');
                return false;
            }
            
            this.gameState.player.cash -= totalCost;
            this.gameState.player.energy += amount;
        } else if (type === 'sell') {
            if (this.gameState.player.energy < amount) {
                this.emit('tradeError', 'Insufficient energy');
                return false;
            }
            
            this.gameState.player.cash += totalCost;
            this.gameState.player.energy -= amount;
        }
        
        // Record trade
        const trade = {
            id: Date.now(),
            playerId: this.gameState.player.id,
            type,
            amount,
            price,
            totalValue: totalCost,
            timestamp: new Date(),
            isAutomated,
            day: this.gameState.currentDay,
            hour: this.gameState.currentHour
        };
        
        this.gameState.trades.unshift(trade);
        this.gameState.player.tradesCount++;
        
        // Update daily profit
        const profit = type === 'sell' ? totalCost : -totalCost;
        this.gameState.player.dailyProfit += profit;
        this.gameState.player.totalProfit += profit;
        
        // Update market volume
        this.gameState.market.volume += amount;
        
        this.emit('tradeExecuted', trade);
        this.emit('playerUpdated', this.gameState.player);
        
        return true;
    }
    
    processRandomEvents() {
        // 5% chance of random event each hour
        if (Math.random() < 0.05) {
            this.triggerRandomEvent();
        }
    }
    
    triggerRandomEvent() {
        const events = [
            {
                type: 'equipment_failure',
                title: 'Equipment Maintenance',
                message: 'Solar panel efficiency reduced by 20% for 2 hours',
                effect: { solarEfficiency: 0.8, duration: 2 }
            },
            {
                type: 'grid_congestion',
                title: 'Grid Congestion',
                message: 'High demand causing price spike!',
                effect: { priceMultiplier: 1.5, duration: 1 }
            },
            {
                type: 'renewable_bonus',
                title: 'Renewable Energy Bonus',
                message: 'Government incentive: +$0.02/kWh for renewable sales',
                effect: { renewableBonus: 0.02, duration: 3 }
            },
            {
                type: 'market_manipulation',
                title: 'Market Volatility',
                message: 'Unusual trading activity detected',
                effect: { priceVolatility: 2.0, duration: 2 }
            }
        ];
        
        const event = events[Math.floor(Math.random() * events.length)];
        
        this.gameState.events.push({
            ...event,
            id: Date.now(),
            timestamp: new Date(),
            day: this.gameState.currentDay,
            hour: this.gameState.currentHour
        });
        
        this.emit('randomEvent', event);
    }
    
    onNewDay() {
        // Reset daily profit
        this.gameState.player.dailyProfit = 0;
        
        // Clear old events
        this.gameState.events = this.gameState.events.filter(event => 
            event.day >= this.gameState.currentDay - 1
        );
        
        this.emit('newDay', this.gameState.currentDay);
    }
    
    updateLeaderboard() {
        // Update demo leaderboard with current player
        this.gameState.leaderboard = [
            {
                rank: 1,
                name: this.gameState.player?.name || 'Demo User',
                type: this.gameState.player?.participantType || 'residential',
                profit: this.gameState.player?.totalProfit || 0,
                trades: this.gameState.player?.tradesCount || 0
            },
            ...this.generateDemoLeaderboard()
        ].sort((a, b) => b.profit - a.profit).map((player, index) => ({
            ...player,
            rank: index + 1
        }));
    }
    
    generateDemoLeaderboard() {
        return [
            { name: 'EcoTrader_42', type: 'commercial', profit: 1250, trades: 45 },
            { name: 'SolarMom', type: 'residential', profit: 890, trades: 32 },
            { name: 'GreenFactory', type: 'industrial', profit: 2100, trades: 67 },
            { name: 'CommunityGrid', type: 'community', profit: 1560, trades: 54 },
            { name: 'PowerSaver', type: 'residential', profit: 720, trades: 28 }
        ];
    }
    
    generateDemoParticipants() {
        const demoParticipants = [
            { id: 'demo1', name: 'EcoTrader_42', type: 'commercial', online: true },
            { id: 'demo2', name: 'SolarMom', type: 'residential', online: true },
            { id: 'demo3', name: 'GreenFactory', type: 'industrial', online: false },
            { id: 'demo4', name: 'CommunityGrid', type: 'community', online: true },
            { id: 'demo5', name: 'PowerSaver', type: 'residential', online: true }
        ];
        
        demoParticipants.forEach(participant => {
            this.gameState.participants.set(participant.id, participant);
        });
    }
    
    initializeMarket() {
        // Initialize with some historical data
        for (let i = 0; i < 24; i++) {
            this.gameState.market.priceHistory.push({
                time: `Day 0, ${i}:00`,
                price: 0.08 + Math.random() * 0.08,
                supply: 1000 + Math.random() * 500,
                demand: 900 + Math.random() * 400
            });
        }
    }
    
    endGame() {
        this.stopGame();
        
        const finalReport = {
            totalProfit: this.gameState.player.totalProfit,
            totalTrades: this.gameState.player.tradesCount,
            finalRank: this.gameState.leaderboard.findIndex(p => 
                p.name === this.gameState.player.name) + 1,
            daysPlayed: this.gameState.currentDay - 1
        };
        
        this.emit('gameEnded', finalReport);
    }
    
    // Event system
    on(event, callback) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(callback);
    }
    
    emit(event, data) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).forEach(callback => callback(data));
        }
    }
    
    // Getters
    getGameState() {
        return this.gameState;
    }
    
    getPlayer() {
        return this.gameState.player;
    }
    
    getMarket() {
        return this.gameState.market;
    }
    
    getLeaderboard() {
        return this.gameState.leaderboard;
    }
    
    getTrades() {
        return this.gameState.trades.slice(0, 10); // Return last 10 trades
    }
}