import WebSocket from 'ws';

class DerivMarketDataService {
  constructor() {
    this.ws = null;
    this.subscriptions = new Map(); // symbol -> { subscribers: Set, latestPrice: number }
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000;
    this.isConnected = false;
    this.appId = process.env.DERIV_APP_ID || '1089'; // Default free app ID
    this.wsUrl = `wss://ws.derivws.com/websockets/v3?app_id=${this.appId}`;
  }

  /**
   * Initialize WebSocket connection to Deriv API
   */
  connect() {
    if (this.ws && this.isConnected) {
      console.log('⚠️  Deriv WebSocket already connected');
      return;
    }

    console.log('🔌 Connecting to Deriv WebSocket...');
    this.ws = new WebSocket(this.wsUrl);

    this.ws.on('open', () => {
      console.log('✅ Deriv WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Resubscribe to all active symbols
      this.resubscribeAll();
    });

    this.ws.on('message', (data) => {
      this.handleMessage(data);
    });

    this.ws.on('error', (error) => {
      console.error('❌ Deriv WebSocket error:', error.message);
    });

    this.ws.on('close', () => {
      console.log('🔴 Deriv WebSocket disconnected');
      this.isConnected = false;
      this.attemptReconnect();
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(rawData) {
    try {
      const message = JSON.parse(rawData);

      // Handle tick updates
      if (message.tick) {
        console.log(`📊 Tick received: ${message.tick.symbol} = ${message.tick.quote}`);
        this.updatePrice(message.tick.symbol, message.tick.quote);
      }

      // Handle candles/OHLC
      if (message.candles) {
        // Can be used for chart data later
        console.log('📊 Candles received:', message.candles.length);
      }

      // Handle errors
      if (message.error) {
        console.error('❌ Deriv API error:', message.error.message);
      }
    } catch (error) {
      console.error('❌ Failed to parse Deriv message:', error.message);
    }
  }

  /**
   * Subscribe to price updates for a symbol
   */
  subscribeTo(symbol) {
    if (!this.subscriptions.has(symbol)) {
      this.subscriptions.set(symbol, {
        subscribers: new Set(),
        latestPrice: null,
      });
    }

    if (this.isConnected && this.ws) {
      const request = {
        ticks: symbol,
        subscribe: 1,
      };

      this.ws.send(JSON.stringify(request));
      console.log(`📡 Subscribed to ${symbol}`);
    }
  }

  /**
   * Unsubscribe from a symbol
   */
  unsubscribeFrom(symbol) {
    if (this.subscriptions.has(symbol)) {
      this.subscriptions.delete(symbol);

      if (this.isConnected && this.ws) {
        const request = {
          forget_all: 'ticks',
        };
        this.ws.send(JSON.stringify(request));
        console.log(`🔕 Unsubscribed from ${symbol}`);
      }
    }
  }

  /**
   * Update cached price and notify subscribers
   */
  updatePrice(symbol, price) {
    if (this.subscriptions.has(symbol)) {
      const subscription = this.subscriptions.get(symbol);
      subscription.latestPrice = price;
      console.log(`💰 Price update for ${symbol}: ${price}`);

      // Emit to Socket.IO subscribers (will be handled by socket handler)
      // This is called by the main socket handler
    }
  }

  /**
   * Get latest cached price for a symbol
   */
  getLatestPrice(symbol) {
    const subscription = this.subscriptions.get(symbol);
    return subscription?.latestPrice || null;
  }

  /**
   * Get candles (historical data)
   */
  async getCandles(symbol, granularity = 60, count = 100) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.ws) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const request = {
        ticks_history: symbol,
        style: 'candles',
        granularity, // in seconds (60 = 1 min)
        count,
      };

      // Set up one-time listener for response
      const messageHandler = (data) => {
        try {
          const message = JSON.parse(data);
          if (message.candles) {
            this.ws.removeListener('message', messageHandler);
            resolve(message.candles);
          }
          if (message.error) {
            this.ws.removeListener('message', messageHandler);
            reject(new Error(message.error.message));
          }
        } catch (error) {
          reject(error);
        }
      };

      this.ws.on('message', messageHandler);
      this.ws.send(JSON.stringify(request));

      // Timeout after 10 seconds
      setTimeout(() => {
        this.ws.removeListener('message', messageHandler);
        reject(new Error('Request timeout'));
      }, 10000);
    });
  }

  /**
   * Resubscribe to all active symbols after reconnection
   */
  resubscribeAll() {
    for (const symbol of this.subscriptions.keys()) {
      this.subscribeTo(symbol);
    }
  }

  /**
   * Attempt to reconnect after disconnect
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached. Giving up.');
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
    );

    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
  }

  /**
   * Gracefully close connection
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.isConnected = false;
      console.log('🔴 Deriv WebSocket disconnected gracefully');
    }
  }

  /**
   * Get all subscribed symbols
   */
  getSubscribedSymbols() {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Check connection status
   */
  isConnectionHealthy() {
    return this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
const derivMarketData = new DerivMarketDataService();

export default derivMarketData;
