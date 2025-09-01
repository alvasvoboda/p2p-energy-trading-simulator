export class NetworkManager {
    constructor(game) {
        this.game = game;
        this.isConnected = false;
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        // For demo purposes, we'll simulate network activity
        this.isDemo = true;
    }
    
    async init() {
        // In a real implementation, this would initialize Socket.IO
        // For now, we'll simulate network connectivity
        this.simulateNetworkActivity();
    }
    
    connect(username) {
        if (this.isDemo) {
            // Simulate connection for demo
            this.isConnected = true;
            this.simulateMultiplayerActivity();
            return;
        }
        
        // Real Socket.IO connection would go here
        /*
        this.socket = io('ws://localhost:3001', {
            auth: {
                username: username
            }
        });
        
        this.socket.on('connect', () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.game.emit('networkConnected');
        });
        
        this.socket.on('disconnect', () => {
            this.isConnected = false;
            this.game.emit('networkDisconnected');
            this.attemptReconnect();
        });
        
        this.socket.on('marketUpdate', (data) => {
            this.game.updateMarketFromNetwork(data);
        });
        
        this.socket.on('tradeExecuted', (data) => {
            this.game.addNetworkTrade(data);
        });
        
        this.socket.on('playerJoined', (data) => {
            this.game.addNetworkPlayer(data);
        });
        
        this.socket.on('playerLeft', (data) => {
            this.game.removeNetworkPlayer(data);
        });
        */
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
        this.isConnected = false;
    }
    
    sendTrade(tradeData) {
        if (this.isDemo) {
            // Simulate network trade
            this.simulateNetworkTrade(tradeData);
            return;
        }
        
        if (this.socket && this.isConnected) {
            this.socket.emit('executeTrade', tradeData);
        }
    }
    
    sendMarketUpdate(marketData) {
        if (this.socket && this.isConnected) {
            this.socket.emit('marketUpdate', marketData);
        }
    }
    
    simulateNetworkActivity() {
        // Simulate other players joining/leaving
        setInterval(() => {
            const participants = this.game.getGameState().participants;
            participants.forEach((participant, id) => {
                // Randomly change online status
                if (Math.random() < 0.1) {
                    participant.online = !participant.online;
                }
            });
        }, 10000);
    }
    
    simulateMultiplayerActivity() {
        // Simulate other players making trades
        setInterval(() => {
            if (Math.random() < 0.3) {
                this.simulateRandomTrade();
            }
        }, 5000);
        
        // Simulate market updates from other players
        setInterval(() => {
            this.simulateMarketActivity();
        }, 2000);
    }
    
    simulateRandomTrade() {
        const participants = Array.from(this.game.getGameState().participants.values());
        const randomParticipant = participants[Math.floor(Math.random() * participants.length)];
        
        if (!randomParticipant || !randomParticipant.online) return;
        
        const tradeTypes = ['buy', 'sell'];
        const type = tradeTypes[Math.floor(Math.random() * tradeTypes.length)];
        const amount = Math.floor(Math.random() * 50) + 10;
        const basePrice = this.game.getMarket().currentPrice;
        const price = basePrice * (0.95 + Math.random() * 0.1); // ±5% of market price
        
        const trade = {
            id: Date.now() + Math.random(),
            playerId: randomParticipant.id,
            playerName: randomParticipant.name,
            type,
            amount,
            price,
            totalValue: amount * price,
            timestamp: new Date(),
            isAutomated: Math.random() < 0.4,
            day: this.game.getGameState().currentDay,
            hour: this.game.getGameState().currentHour
        };
        
        // Add to trades list
        this.game.getGameState().trades.unshift(trade);
        
        // Update market volume
        this.game.getGameState().market.volume += amount;
        
        // Emit trade event
        this.game.emit('networkTradeExecuted', trade);
    }
    
    simulateMarketActivity() {
        // Simulate small market fluctuations from network activity
        const market = this.game.getMarket();
        const fluctuation = (Math.random() - 0.5) * 0.01; // ±$0.005
        
        market.currentPrice = Math.max(0.05, Math.min(0.50, 
            market.currentPrice + fluctuation));
        
        // Simulate supply/demand changes
        market.supply += Math.floor((Math.random() - 0.5) * 100);
        market.demand += Math.floor((Math.random() - 0.5) * 80);
        
        market.supply = Math.max(500, market.supply);
        market.demand = Math.max(400, market.demand);
    }
    
    simulateNetworkTrade(tradeData) {
        // Simulate network latency
        setTimeout(() => {
            // Simulate trade confirmation
            this.game.emit('networkTradeConfirmed', {
                ...tradeData,
                networkId: Date.now(),
                confirmed: true
            });
        }, 100 + Math.random() * 200);
    }
    
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.game.emit('networkReconnectFailed');
            return;
        }
        
        this.reconnectAttempts++;
        
        setTimeout(() => {
            if (!this.isConnected) {
                this.connect();
            }
        }, Math.pow(2, this.reconnectAttempts) * 1000); // Exponential backoff
    }
    
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts
        };
    }
}