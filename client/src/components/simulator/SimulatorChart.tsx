import { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '@/hooks/redux';

interface SimulatorChartProps {
  symbol: string;
}

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

type Timeframe = '1s' | '5s' | '10s' | '30s' | '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';

const SimulatorChart = ({ symbol }: SimulatorChartProps) => {
  const [candles, setCandles] = useState<Candle[]>([]);
  const currentCandleRef = useRef<Candle | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('5s');
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [visibleCandles, setVisibleCandles] = useState(50);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [candleWidth, setCandleWidth] = useState(12);
  const [priceScaleWidth, setPriceScaleWidth] = useState(80);
  const [timeScaleHeight, setTimeScaleHeight] = useState(32);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, offset: 0 });
  const [isResizingPrice, setIsResizingPrice] = useState(false);
  const [isResizingTime, setIsResizingTime] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const livePrices = useAppSelector((state) => state.simulator.livePrices);

  const timeframeMs: Record<Timeframe, number> = {
    '1s': 1000,
    '5s': 5000,
    '10s': 10000,
    '30s': 30000,
    '1m': 60000,
    '5m': 300000,
    '15m': 900000,
    '30m': 1800000,
    '1h': 3600000,
    '4h': 14400000,
    '1d': 86400000,
    '1w': 604800000,
  };

  useEffect(() => {
    if (!livePrices[symbol]) return;

    const price = livePrices[symbol].price;
    const now = Date.now();
    const candleInterval = timeframeMs[timeframe];
    const candleTime = Math.floor(now / candleInterval) * candleInterval;

    if (!currentCandleRef.current || currentCandleRef.current.time !== candleTime) {
      if (currentCandleRef.current) {
        setCandles((prev) => {
          const updated = [...prev, currentCandleRef.current!];
          return updated.slice(-100);
        });
      }

      currentCandleRef.current = {
        time: candleTime,
        open: price,
        high: price,
        low: price,
        close: price,
      };
    } else {
      currentCandleRef.current.high = Math.max(currentCandleRef.current.high, price);
      currentCandleRef.current.low = Math.min(currentCandleRef.current.low, price);
      currentCandleRef.current.close = price;
    }
  }, [livePrices, symbol, timeframe, timeframeMs]);

  useEffect(() => {
    setCandles([]);
    currentCandleRef.current = null;
    setScrollOffset(0);
  }, [timeframe]);

  const allCandles = currentCandleRef.current 
    ? [...candles, currentCandleRef.current]
    : candles;

  const startIndex = Math.max(0, allCandles.length - visibleCandles - scrollOffset);
  const endIndex = allCandles.length - scrollOffset;
  const displayedCandles = allCandles.slice(startIndex, endIndex);

  const handleZoomIn = () => {
    setVisibleCandles(prev => Math.max(20, prev - 10));
    setCandleWidth(prev => Math.min(30, prev + 2));
  };

  const handleZoomOut = () => {
    setVisibleCandles(prev => Math.min(200, prev + 10));
    setCandleWidth(prev => Math.max(4, prev - 2));
  };

  const handleResetZoom = () => {
    setVisibleCandles(50);
    setCandleWidth(12);
    setScrollOffset(0);
  };

  const handleScrollLeft = () => {
    const maxOffset = Math.max(0, allCandles.length - visibleCandles);
    setScrollOffset(prev => Math.min(prev + 10, maxOffset));
  };

  const handleScrollRight = () => {
    setScrollOffset(prev => Math.max(0, prev - 10));
  };

  const handleGoToLatest = () => {
    setScrollOffset(0);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') {
        setVisibleCandles(prev => Math.max(20, prev - 10));
        setCandleWidth(prev => Math.min(30, prev + 2));
      }
      if (e.key === '-' || e.key === '_') {
        setVisibleCandles(prev => Math.min(200, prev + 10));
        setCandleWidth(prev => Math.max(4, prev - 2));
      }
      if (e.key === 'ArrowLeft') {
        setScrollOffset(prev => Math.min(prev + 10, allCandles.length - visibleCandles));
      }
      if (e.key === 'ArrowRight') {
        setScrollOffset(prev => Math.max(0, prev - 10));
      }
      if (e.key === 'Home') {
        setScrollOffset(0);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [allCandles.length, visibleCandles]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isResizingPrice || isResizingTime) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, offset: scrollOffset });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const deltaX = dragStart.x - e.clientX;
    const candlesMoved = Math.floor(deltaX / (candleWidth + 2));
    const newOffset = Math.max(0, Math.min(allCandles.length - visibleCandles, dragStart.offset + candlesMoved));
    setScrollOffset(newOffset);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        setVisibleCandles(prev => Math.max(20, prev - 5));
        setCandleWidth(prev => Math.min(30, prev + 1));
      } else {
        setVisibleCandles(prev => Math.min(200, prev + 5));
        setCandleWidth(prev => Math.max(4, prev - 1));
      }
    } else {
      const candlesMoved = Math.floor(e.deltaY / 10);
      setScrollOffset(prev => Math.max(0, Math.min(allCandles.length - visibleCandles, prev + candlesMoved)));
    }
  };

  const handlePriceResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingPrice(true);
  };

  const handleTimeResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingTime(true);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isResizingPrice && chartRef.current) {
        const rect = chartRef.current.getBoundingClientRect();
        const newWidth = Math.max(60, Math.min(150, rect.right - e.clientX));
        setPriceScaleWidth(newWidth);
      }
      if (isResizingTime && chartRef.current) {
        const rect = chartRef.current.getBoundingClientRect();
        const newHeight = Math.max(24, Math.min(60, rect.bottom - e.clientY));
        setTimeScaleHeight(newHeight);
      }
    };

    const handleGlobalMouseUp = () => {
      setIsResizingPrice(false);
      setIsResizingTime(false);
    };

    if (isResizingPrice || isResizingTime) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isResizingPrice, isResizingTime]);

  const currentPrice = livePrices[symbol]?.price || 0;
  const priceChange = displayedCandles.length >= 2
    ? displayedCandles[displayedCandles.length - 1].close - displayedCandles[0].open
    : 0;
  const priceChangePercent = displayedCandles.length >= 2
    ? ((priceChange / displayedCandles[0].open) * 100)
    : 0;

  const prices = displayedCandles.flatMap(c => [c.high, c.low]);
  const maxPrice = prices.length > 0 ? Math.max(...prices) : currentPrice;
  const minPrice = prices.length > 0 ? Math.min(...prices) : currentPrice;
  const priceRange = maxPrice - minPrice || 1;
  const padding = priceRange * 0.1;

  const renderCandle = (candle: Candle, index: number, chartHeight: number) => {
    const isGreen = candle.close >= candle.open;
    const bodyTop = Math.max(candle.open, candle.close);
    const bodyBottom = Math.min(candle.open, candle.close);
    
    const spacing = 2;
    const x = index * (candleWidth + spacing) + candleWidth / 2;
    
    const priceToY = (price: number) => {
      return chartHeight - ((price - minPrice + padding) / (priceRange + 2 * padding)) * chartHeight;
    };
    
    const highY = priceToY(candle.high);
    const lowY = priceToY(candle.low);
    const bodyTopY = priceToY(bodyTop);
    const bodyBottomY = priceToY(bodyBottom);
    const bodyHeight = Math.max(Math.abs(bodyBottomY - bodyTopY), 1);

    return (
      <g key={index}>
        <line
          x1={x}
          y1={highY}
          x2={x}
          y2={lowY}
          stroke={isGreen ? '#22c55e' : '#ef4444'}
          strokeWidth="1"
        />
        <rect
          x={x - candleWidth / 2}
          y={Math.min(bodyTopY, bodyBottomY)}
          width={candleWidth}
          height={bodyHeight}
          fill={isGreen ? '#22c55e' : '#ef4444'}
          stroke={isGreen ? '#16a34a' : '#dc2626'}
          strokeWidth="1"
        />
      </g>
    );
  };

  return (
    <div className="rounded-lg bg-[#131722] border border-gray-800 overflow-hidden">
      <div className="bg-[#1a1d26] px-4 py-3 flex items-center justify-between flex-wrap gap-3 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">{symbol}</h3>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span className={priceChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                {priceChange >= 0 ? '▲' : '▼'} {Math.abs(priceChangePercent).toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="flex gap-1 flex-wrap">
            {(['1s', '5s', '10s', '30s', '1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 text-xs font-semibold rounded transition ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => setChartType('candle')}
              className={`px-3 py-1 text-xs font-semibold rounded transition ${
                chartType === 'candle'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
              title="Candlestick"
            >
              📊
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 text-xs font-semibold rounded transition ${
                chartType === 'line'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
              title="Line Chart"
            >
              📈
            </button>
          </div>

          <div className="flex items-center gap-1 border-l border-gray-700 pl-2">
            <button
              onClick={handleScrollLeft}
              disabled={allCandles.length <= visibleCandles || scrollOffset >= allCandles.length - visibleCandles}
              className="px-2 py-1 text-xs bg-gray-800 text-gray-400 hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
              title="Scroll Left (←)"
            >
              ◀
            </button>
            <button
              onClick={handleScrollRight}
              disabled={scrollOffset <= 0}
              className="px-2 py-1 text-xs bg-gray-800 text-gray-400 hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
              title="Scroll Right (→)"
            >
              ▶
            </button>
            <button
              onClick={handleGoToLatest}
              disabled={scrollOffset === 0}
              className="px-2 py-1 text-xs bg-gray-800 text-gray-400 hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
              title="Latest (Home)"
            >
              ⏭
            </button>
            <div className="w-px h-4 bg-gray-700"></div>
            <button
              onClick={handleZoomIn}
              disabled={visibleCandles <= 20}
              className="px-2 py-1 text-xs bg-gray-800 text-gray-400 hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
              title="Zoom In (+)"
            >
              🔍+
            </button>
            <button
              onClick={handleZoomOut}
              disabled={visibleCandles >= 200}
              className="px-2 py-1 text-xs bg-gray-800 text-gray-400 hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
              title="Zoom Out (-)"
            >
              🔍-
            </button>
            <button
              onClick={handleResetZoom}
              className="px-2 py-1 text-xs bg-gray-800 text-gray-400 hover:bg-gray-700 rounded"
              title="Reset View"
            >
              ⟲
            </button>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-400">Live Price</div>
          <div className={`text-2xl font-mono font-bold ${
            priceChange >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {currentPrice.toFixed(5)}
          </div>
        </div>
      </div>
      
      <div 
        ref={chartRef}
        className="relative h-[500px] rounded-lg bg-[#1a1d26] border border-gray-700 select-none"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {displayedCandles.length > 0 ? (
          <div className="relative w-full h-full">
            <div 
              className="absolute inset-0 overflow-hidden"
              style={{ 
                bottom: `${timeScaleHeight}px`, 
                right: `${priceScaleWidth}px` 
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onWheel={handleWheel}
            >
              <svg 
                className="h-full pointer-events-auto" 
                width={displayedCandles.length * (candleWidth + 2)}
                height="100%"
                style={{ minWidth: '100%', cursor: isDragging ? 'grabbing' : 'grab' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
              >
                <defs>
                  <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#2d3139" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
                  const y = (i / 8) * 100;
                  return (
                    <line
                      key={i}
                      x1="0"
                      y1={`${y}%`}
                      x2="100%"
                      y2={`${y}%`}
                      stroke="#2d3139"
                      strokeWidth="1"
                    />
                  );
                })}
                
                <g>
                  {chartType === 'candle' ? (
                    displayedCandles.map((candle, index) => 
                      renderCandle(candle, index, 450)
                    )
                  ) : (
                    <polyline
                      points={displayedCandles.map((candle, i) => {
                        const x = i * (candleWidth + 2) + candleWidth / 2;
                        const priceToY = (price: number) => {
                          return 450 - ((price - minPrice + padding) / (priceRange + 2 * padding)) * 450;
                        };
                        return `${x},${priceToY(candle.close)}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="2"
                    />
                  )}
                </g>
              </svg>
              
              <div 
                className="absolute left-0 right-0 border-t-2 border-dashed border-yellow-500 pointer-events-none"
                style={{
                  top: `${100 - ((currentPrice - minPrice + padding) / (priceRange + 2 * padding)) * 100}%`
                }}
              />
            </div>
            
            <div 
              className="absolute right-0 top-0 flex flex-col justify-between py-2 text-xs text-gray-400 font-mono bg-[#1a1d26] border-l border-gray-700"
              style={{ 
                width: `${priceScaleWidth}px`, 
                bottom: `${timeScaleHeight}px` 
              }}
            >
              <div 
                className="absolute left-0 top-0 bottom-0 w-1 hover:bg-blue-500 cursor-col-resize z-10"
                onMouseDown={handlePriceResizeStart}
                title="Drag to resize price scale"
              />
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
                const price = maxPrice + padding - (i * (priceRange + 2 * padding) / 8);
                const yPercent = 100 - ((currentPrice - minPrice + padding) / (priceRange + 2 * padding)) * 100;
                const isCurrentPrice = Math.abs((i / 8) * 100 - yPercent) < 2;
                
                return (
                  <div key={i} className={`px-2 text-right ${isCurrentPrice ? 'bg-yellow-500 text-black font-bold' : ''}`}>
                    {price.toFixed(3)}
                  </div>
                );
              })}
            </div>
            
            <div 
              className="absolute bottom-0 left-0 flex items-center justify-between px-4 text-xs text-gray-400 font-mono bg-[#1a1d26] border-t border-gray-700"
              style={{ 
                right: `${priceScaleWidth}px`, 
                height: `${timeScaleHeight}px` 
              }}
            >
              <div 
                className="absolute left-0 right-0 top-0 h-1 hover:bg-blue-500 cursor-row-resize z-10"
                onMouseDown={handleTimeResizeStart}
                title="Drag to resize time scale"
              />
              {displayedCandles.length > 5 && [0, 1, 2, 3, 4, 5].map((i) => {
                const candleIndex = Math.floor((i / 5) * (displayedCandles.length - 1));
                const candle = displayedCandles[candleIndex];
                const date = new Date(candle.time);
                const timeStr = timeframe.includes('d') || timeframe.includes('w') 
                  ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
                
                return (
                  <div key={i} className="text-gray-500">
                    {timeStr}
                  </div>
                );
              })}
            </div>
            
            <div 
              className="absolute bg-yellow-500 text-black px-2 py-0.5 text-xs font-bold text-center z-10 pointer-events-none"
              style={{
                right: 0,
                width: `${priceScaleWidth}px`,
                top: `${100 - ((currentPrice - minPrice + padding) / (priceRange + 2 * padding)) * 100}%`,
                transform: 'translateY(-50%)'
              }}
            >
              {currentPrice.toFixed(5)}
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 text-lg mb-2">Waiting for price data...</div>
              <div className="text-gray-500 text-sm">Connecting to Deriv market data</div>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-[#1a1d26] px-4 py-2 flex items-center justify-between text-xs text-gray-400 border-t border-gray-800">
        <div className="flex items-center gap-4">
          <span className="text-gray-500">{allCandles.length} candles ({displayedCandles.length} visible)</span>
          <span className="text-gray-500">•</span>
          <span className="text-blue-400 font-semibold">{timeframe}</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-500">Zoom: {visibleCandles}</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-500">Deriv Real-time</span>
        </div>
        {displayedCandles.length > 0 && (
          <div className="flex gap-4 font-mono">
            <span className="text-gray-500">O <span className="text-white">{displayedCandles[displayedCandles.length - 1].open.toFixed(5)}</span></span>
            <span className="text-green-400">H <span className="text-white">{displayedCandles[displayedCandles.length - 1].high.toFixed(5)}</span></span>
            <span className="text-red-400">L <span className="text-white">{displayedCandles[displayedCandles.length - 1].low.toFixed(5)}</span></span>
            <span className="text-gray-500">C <span className="text-white">{displayedCandles[displayedCandles.length - 1].close.toFixed(5)}</span></span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimulatorChart;
