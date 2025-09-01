import { EnergyTradingGame } from './game/GameEngine.js';
import { UIManager } from './ui/UIManager.js';
import { NetworkManager } from './network/NetworkManager.js';

class App {
    constructor() {
        this.game = new EnergyTradingGame();
        this.ui = new UIManager(this.game);
        this.network = new NetworkManager(this.game);
        
        this.init();
    }
    
    async init() {
        // Show loading screen
        this.showLoadingScreen();
        
        // Initialize components
        await this.network.init();
        this.ui.init();
        
        // Hide loading screen and show auth
        setTimeout(() => {
            this.hideLoadingScreen();
            this.showAuthScreen();
        }, 2000);
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    showLoadingScreen() {
        document.getElementById('loadingScreen').classList.remove('hidden');
    }
    
    hideLoadingScreen() {
        document.getElementById('loadingScreen').classList.add('hidden');
    }
    
    showAuthScreen() {
        document.getElementById('authScreen').classList.remove('hidden');
    }
    
    hideAuthScreen() {
        document.getElementById('authScreen').classList.add('hidden');
    }
    
    showGameInterface() {
        document.getElementById('gameInterface').classList.remove('hidden');
    }
    
    setupEventListeners() {
        // Demo button
        document.getElementById('demoBtn').addEventListener('click', () => {
            this.startDemoGame();
        });
        
        // Join button
        document.getElementById('joinBtn').addEventListener('click', () => {
            const username = document.getElementById('usernameInput').value.trim();
            if (username) {
                this.startMultiplayerGame(username);
            } else {
                this.ui.showNotification('Please enter a username', 'warning');
            }
        });
        
        // Settings button
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.ui.showSettings();
        });
    }
    
    startDemoGame() {
        this.hideAuthScreen();
        this.showGameInterface();
        
        // Initialize demo player
        this.game.initPlayer({
            id: 'demo-user',
            name: 'Demo User',
            type: 'residential',
            isDemo: true
        });
        
        // Show participant selection
        this.ui.showParticipantSelection();
        
        this.ui.showNotification('Welcome to the demo! Select your participant type to begin.', 'success');
    }
    
    startMultiplayerGame(username) {
        this.hideAuthScreen();
        this.showGameInterface();
        
        // Initialize multiplayer
        this.network.connect(username);
        
        this.game.initPlayer({
            id: Date.now().toString(),
            name: username,
            type: 'residential',
            isDemo: false
        });
        
        // Show participant selection
        this.ui.showParticipantSelection();
        
        this.ui.showNotification(`Welcome ${username}! Select your participant type to join the trading network.`, 'success');
    }
}

// Start the application
new App();