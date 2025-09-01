export class ChartManager {
    constructor() {
        this.priceChart = null;
        this.initializeCharts();
    }
    
    async initializeCharts() {
        // Import Chart.js dynamically
        const { Chart, registerables } = await import('chart.js');
        Chart.register(...registerables);
        
        this.Chart = Chart;
        this.createPriceChart();
    }
    
    createPriceChart() {
        const ctx = document.getElementById('priceChart');
        if (!ctx) return;
        
        this.priceChart = new this.Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Energy Price ($/kWh)',
                    data: [],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            color: '#475569'
                        },
                        ticks: {
                            color: '#94a3b8',
                            maxTicksLimit: 8
                        }
                    },
                    y: {
                        display: true,
                        grid: {
                            color: '#475569'
                        },
                        ticks: {
                            color: '#94a3b8',
                            callback: function(value) {
                                return '$' + value.toFixed(3);
                            }
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 0,
                        hoverRadius: 6
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }
    
    updatePriceChart(priceHistory) {
        if (!this.priceChart || !priceHistory) return;
        
        const labels = priceHistory.map(entry => {
            const parts = entry.time.split(', ');
            return parts[1]; // Just show the time part
        });
        
        const prices = priceHistory.map(entry => entry.price);
        
        this.priceChart.data.labels = labels;
        this.priceChart.data.datasets[0].data = prices;
        this.priceChart.update('none'); // No animation for real-time updates
    }
    
    createSupplyDemandChart() {
        // Future enhancement: supply/demand chart
    }
    
    createProfitChart() {
        // Future enhancement: profit over time chart
    }
}