import { EventEmitter } from 'events';

/**
 * Price Simulator Service
 * Generates realistic simulated market data using Brownian motion
 * Replaces Deriv API with fully controlled price generation
 */
class PriceSimulator extends EventEmitter {
  constructor() {
    super();
    this.assets = new Map(); // symbol -> AssetConfig
    this.currentPrices = new Map(); // symbol -> current price
    this.candles = new Map(); // symbol -> Map<timeframe, candles[]>
    this.subscribers = new Set(); // Active symbols being tracked
    this.tickInterval = 500; // Generate tick every 500ms
    this.intervalId = null;
    this.isRunning = false;
  }

  /**
   * Register an asset for price simulation
   */
  registerAsset(assetConfig) {
    const { symbol, basePrice, volatility, spread } = assetConfig;
    
    this.assets.set(symbol, assetConfig);
    this.currentPrices.set(symbol, {
      bid: basePrice,
      ask: basePrice + spread,
      timestamp: Date.now()
    });

    // Initialize candle storage for all timeframes
    const timeframes = [1, 5, 10, 30, 60, 300, 900, 1800, 3600, 14400, 86400, 604800];
    const candleMap = new Map();
    timeframes.forEach(tf => candleMap.set(tf, []));
    this.candles.set(symbol, candleMap);

    // Generate initial historical candles (100 candles back)
    this.generateHistoricalCandles(symbol, assetConfig);

    console.log(`✅ Registered asset: ${symbol} at base price ${basePrice}`);
  }

  /**
   * Generate historical candles for initial chart data
   */
  generateHistoricalCandles(symbol, config) {
    const { basePrice, volatility } = config;
    const now = Date.now();
    const numCandles = 100;
    
    // Generate for 1 minute timeframe (60 seconds)
    const timeframe = 60;
    const candleMap = this.candles.get(symbol);
    const minuteCandles = [];

    let currentPrice = basePrice;

    for (let i = numCandles; i >= 0; i--) {
      const candleTime = Math.floor((now - i * timeframe * 1000) / (timeframe * 1000)) * timeframe;
      
      // Simulate realistic OHLC movement
      const change = this.generatePriceChange(volatility);
      const open = currentPrice;
      const close = currentPrice * (1 + change);
      const high = Math.max(open, close) * (1 + Math.abs(this.generatePriceChange(volatility * 0.3)));
      const low = Math.min(open, close) * (1 - Math.abs(this.generatePriceChange(volatility * 0.3)));

      minuteCandles.push({
        time: candleTime,
        open,
        high,
        low,
        close
      });

      currentPrice = close;
    }

    candleMap.set(timeframe, minuteCandles);
    
    // Update current price to last candle close
    this.currentPrices.set(symbol, {
      bid: currentPrice,
      ask: currentPrice + config.spread,
      timestamp: Date.now()
    });
  }

  /**
   * Generate realistic price change using Brownian motion
   */
  generatePriceChange(volatility) {
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    
    // Scale by volatility
    return z0 * volatility;
  }

  /**
   * Start price generation loop
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Price simulator already running');
      return;
    }

    console.log('🚀 Starting price simulator...');
    this.isRunning = true;

    this.intervalId = setInterval(() => {
      this.generateTicks();
    }, this.tickInterval);

    console.log(`✅ Price simulator started (${this.tickInterval}ms interval)`);
  }

  /**
   * Stop price generation
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('🛑 Price simulator stopped');
    }
  }

  /**
   * Generate new ticks for all registered assets
   */
  generateTicks() {
    const now = Date.now();

    for (const [symbol, config] of this.assets) {
      const currentPrice = this.currentPrices.get(symbol);
      
      // Generate new price using Brownian motion
      const change = this.generatePriceChange(config.volatility);
      const newMidPrice = currentPrice.bid * (1 + change);
      
      const newPrice = {
        bid: newMidPrice,
        ask: newMidPrice + config.spread,
        timestamp: now
      };

      this.currentPrices.set(symbol, newPrice);

      // Update candles for all timeframes
      this.updateCandles(symbol, newMidPrice, now);

      // Emit price update event
      this.emit('price-update', {
        symbol,
        price: newMidPrice,
        bid: newPrice.bid,
        ask: newPrice.ask,
        timestamp: now
      });
    }
  }

  /**
   * Update OHLC candles for all timeframes
   */
  updateCandles(symbol, price, timestamp) {
    const candleMap = this.candles.get(symbol);
    if (!candleMap) return;

    const timeframes = [1, 5, 10, 30, 60, 300, 900, 1800, 3600, 14400, 86400, 604800];

    for (const timeframe of timeframes) {
      const candles = candleMap.get(timeframe);
      const candleTime = Math.floor(timestamp / (timeframe * 1000)) * timeframe;

      // Check if we're in the same candle or new candle
      const lastCandle = candles[candles.length - 1];

      if (lastCandle && lastCandle.time === candleTime) {
        // Update existing candle
        lastCandle.high = Math.max(lastCandle.high, price);
        lastCandle.low = Math.min(lastCandle.low, price);
        lastCandle.close = price;
      } else {
        // Create new candle
        const newCandle = {
          time: candleTime,
          open: price,
          high: price,
          low: price,
          close: price
        };

        candles.push(newCandle);

        // Keep only last 1000 candles per timeframe
        if (candles.length > 1000) {
          candles.shift();
        }
      }
    }
  }

  /**
   * Subscribe to a symbol (for tracking purposes)
   */
  subscribeTo(symbol) {
    if (!this.assets.has(symbol)) {
      console.log(`⚠️ Symbol ${symbol} not registered`);
      return false;
    }

    this.subscribers.add(symbol);
    console.log(`📊 Subscribed to ${symbol}`);
    return true;
  }

  /**
   * Unsubscribe from a symbol
   */
  unsubscribeFrom(symbol) {
    this.subscribers.delete(symbol);
    console.log(`📊 Unsubscribed from ${symbol}`);
  }

  /**
   * Get latest price for a symbol
   */
  getLatestPrice(symbol) {
    const priceData = this.currentPrices.get(symbol);
    if (!priceData) {
      console.log(`⚠️ No price data for ${symbol}`);
      return null;
    }
    return priceData.bid; // Return mid/bid price
  }

  /**
   * Get historical candles for a symbol
   */
  getCandles(symbol, granularity = 60, count = 100) {
    const candleMap = this.candles.get(symbol);
    if (!candleMap) {
      console.log(`⚠️ No candle data for ${symbol}`);
      return [];
    }

    const candles = candleMap.get(granularity) || [];
    
    // Return last 'count' candles
    const startIndex = Math.max(0, candles.length - count);
    return candles.slice(startIndex);
  }

  /**
   * Get all registered assets
   */
  getAllAssets() {
    return Array.from(this.assets.values());
  }

  /**
   * Get assets by category
   */
  getAssetsByCategory(category) {
    return Array.from(this.assets.values()).filter(
      asset => asset.category === category
    );
  }

  /**
   * Check if simulator is running
   */
  isActive() {
    return this.isRunning;
  }

  /**
   * Get simulation statistics
   */
  getStats() {
    return {
      totalAssets: this.assets.size,
      activeSubscribers: this.subscribers.size,
      isRunning: this.isRunning,
      tickInterval: this.tickInterval,
      uptime: this.isRunning ? Date.now() - this.startTime : 0
    };
  }
}

// Create singleton instance
const priceSimulator = new PriceSimulator();

export default priceSimulator;
