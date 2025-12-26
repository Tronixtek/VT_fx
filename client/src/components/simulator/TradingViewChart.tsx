import { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import type { 
  IChartApi, 
  ISeriesApi, 
  CandlestickData, 
  Time
} from 'lightweight-charts';
import { useAppSelector } from '../../hooks/redux';
import ChartDrawingTools, { DrawingTool } from './ChartDrawingTools';

interface TradingViewChartProps {
  symbol: string;
  timeframe: string;
}

interface Trade {
  _id: string;
  symbol: string;
  entryPrice: number;
  entryTime: number;
  exitPrice?: number;
  exitTime?: number;
  stopLoss?: number;
  takeProfit?: number;
  type: 'BUY' | 'SELL';
  status: 'active' | 'closed';
}

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface DrawingObject {
  id: string;
  type: DrawingTool;
  points: { x: number; y: number; price: number; time: number }[];
  color: string;
}

const TIMEFRAME_SECONDS: Record<string, number> = {
  '1s': 1,
  '5s': 5,
  '10s': 10,
  '30s': 30,
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '30m': 1800,
  '1h': 3600,
  '4h': 14400,
  '1d': 86400,
  '1w': 604800,
};

export default function TradingViewChart({ symbol, timeframe }: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentDrawingRef = useRef<DrawingObject | null>(null);
  const [candles, setCandles] = useState<Map<number, Candle>>(new Map());
  const [initializedSymbol, setInitializedSymbol] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<DrawingTool>('cursor');
  const [drawings, setDrawings] = useState<DrawingObject[]>([]);
  const [currentDrawing, setCurrentDrawing] = useState<DrawingObject | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [isDraggingPoint, setIsDraggingPoint] = useState<{ drawingId: string; pointIndex: number } | null>(null);
  const livePrices = useAppSelector((state: any) => state.simulator?.livePrices || {});
  const activeTrades = useAppSelector((state: any) => state.simulator?.activeTrades || []);
  const tradeHistory = useAppSelector((state: any) => state.simulator?.tradeHistory || []);

  // Generate initial historical candles when symbol changes
  useEffect(() => {
    if (initializedSymbol === symbol) return;
    
    const priceData = livePrices[symbol];
    if (!priceData?.price) return;

    const intervalSeconds = TIMEFRAME_SECONDS[timeframe];
    if (!intervalSeconds) return;

    // Fetch real historical candles from Deriv API
    const fetchHistoricalData = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await fetch(
          `${apiUrl}/simulator/candles/${symbol}?granularity=${intervalSeconds}&count=100`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const historicalCandles = new Map<number, Candle>();
            
            result.data.forEach((candle: any) => {
              // Backend returns 'time' in seconds (Unix timestamp)
              const candleTime = candle.time || candle.epoch;
              historicalCandles.set(candleTime, {
                time: candleTime,
                open: parseFloat(candle.open),
                high: parseFloat(candle.high),
                low: parseFloat(candle.low),
                close: parseFloat(candle.close),
              });
            });

            setCandles(historicalCandles);
            setInitializedSymbol(symbol);
            return;
          }
        }

        // Fallback: Generate simulated historical candles if API fails
        console.log('Using simulated historical data as fallback');
        generateSimulatedCandles();
      } catch (error) {
        console.error('Error fetching historical candles:', error);
        // Fallback: Generate simulated historical candles
        generateSimulatedCandles();
      }
    };

    const generateSimulatedCandles = () => {
      const basePrice = priceData.price;
      const historicalCandles = new Map<number, Candle>();
      const now = Date.now();
      const numCandles = 100;
      let currentPrice = basePrice;

      for (let i = numCandles; i >= 0; i--) {
        const candleTime = Math.floor((now - i * intervalSeconds * 1000) / (intervalSeconds * 1000)) * intervalSeconds;
        
        // Realistic price movement
        const volatility = basePrice * 0.001; // 0.1% volatility
        const trend = (Math.random() - 0.5) * volatility * 0.1; // Small trend
        const change = (Math.random() - 0.5) * volatility;
        
        const open = currentPrice;
        const close = currentPrice + change + trend;
        const high = Math.max(open, close) + Math.random() * volatility * 0.3;
        const low = Math.min(open, close) - Math.random() * volatility * 0.3;

        historicalCandles.set(candleTime, {
          time: candleTime,
          open,
          high,
          low,
          close,
        });

        currentPrice = close; // Next candle continues from this close
      }

      setCandles(historicalCandles);
      setInitializedSymbol(symbol);
    };

    fetchHistoricalData();
  }, [symbol, livePrices, timeframe, initializedSymbol]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#1a1d26' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2a2e39' },
        horzLines: { color: '#2a2e39' },
      },
      handleScroll: selectedTool === 'cursor',
      handleScale: selectedTool === 'cursor',
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [timeframe]);

  // Update chart interaction based on selected tool
  useEffect(() => {
    if (!chartRef.current) return;

    chartRef.current.applyOptions({
      handleScroll: selectedTool === 'cursor',
      handleScale: selectedTool === 'cursor',
    });
  }, [selectedTool]);

  // Build candles from live prices
  useEffect(() => {
    const priceData = livePrices[symbol];
    if (!priceData?.price) return;
    
    const price = priceData.price;
    const intervalSeconds = TIMEFRAME_SECONDS[timeframe];
    if (!intervalSeconds) return;

    const now = Date.now();
    const candleTime = Math.floor(now / (intervalSeconds * 1000)) * intervalSeconds;

    setCandles((prevCandles) => {
      const newCandles = new Map(prevCandles);
      const existingCandle = newCandles.get(candleTime);

      if (existingCandle) {
        // Update existing candle
        newCandles.set(candleTime, {
          time: candleTime,
          open: existingCandle.open,
          high: Math.max(existingCandle.high, price),
          low: Math.min(existingCandle.low, price),
          close: price,
        });
      } else {
        // Create new candle
        newCandles.set(candleTime, {
          time: candleTime,
          open: price,
          high: price,
          low: price,
          close: price,
        });

        // Keep last 1000 candles
        if (newCandles.size > 1000) {
          const sortedTimes = Array.from(newCandles.keys()).sort((a, b) => a - b);
          const toRemove = sortedTimes.slice(0, sortedTimes.length - 1000);
          toRemove.forEach((time) => newCandles.delete(time));
        }
      }

      return newCandles;
    });
  }, [livePrices, symbol, timeframe]);

  // Update chart with candles
  useEffect(() => {
    if (!candlestickSeriesRef.current || candles.size === 0) return;

    const chartData: CandlestickData[] = Array.from(candles.values())
      .sort((a, b) => a.time - b.time)
      .map((candle) => ({
        time: candle.time as Time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }));

    candlestickSeriesRef.current.setData(chartData);
  }, [candles]);

  // Add current price line
  useEffect(() => {
    const priceData = livePrices[symbol];
    if (!priceData?.price || !candlestickSeriesRef.current) return;

    // The price line will be automatically visible as the latest candle close price
    // TradingView handles this automatically
  }, [livePrices, symbol]);

  // Add trade markers and price lines
  useEffect(() => {
    if (!chartRef.current || !candlestickSeriesRef.current) return;

    // Note: Price lines and markers will be added in future version
    // For now, we'll display trades in the UI overlay
  }, [activeTrades, tradeHistory, symbol]);

  // Setup drawing canvas
  useEffect(() => {
    const canvas = drawingCanvasRef.current;
    const container = chartContainerRef.current;
    if (!canvas || !container) {
      console.log('Canvas or container not ready');
      return;
    }

    // Match canvas size to container
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        console.log('Container has no size yet');
        return;
      }
      canvas.width = rect.width;
      canvas.height = rect.height;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      console.log('Canvas sized:', rect.width, 'x', rect.height);
      setTimeout(() => redrawCanvas(), 100);
    };

    // Wait for container to have size
    const checkAndResize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        resizeCanvas();
      } else {
        setTimeout(checkAndResize, 100);
      }
    };

    checkAndResize();
    
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Redraw all drawings on canvas
  const redrawCanvas = () => {
    const canvas = drawingCanvasRef.current;
    const chart = chartRef.current;
    if (!canvas || !chart) {
      console.log('Cannot redraw - missing canvas or chart');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('Cannot get canvas context');
      return;
    }

    console.log('Redrawing canvas with', drawings.length, 'drawings');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all saved drawings
    drawings.forEach((drawing) => {
      drawObject(ctx, drawing);
    });

    // Draw current drawing in progress
    if (currentDrawing) {
      console.log('Drawing current:', currentDrawing);
      drawObject(ctx, currentDrawing);
    }
  };

  // Draw a single object
  const drawObject = (ctx: CanvasRenderingContext2D, drawing: DrawingObject) => {
    const isSelected = drawing.id === selectedDrawingId;
    ctx.strokeStyle = isSelected ? '#00FF00' : drawing.color;
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.setLineDash([]);

    const chart = chartRef.current;
    const canvas = drawingCanvasRef.current;
    if (!chart || !canvas) return;

    const timeScale = chart.timeScale();
    
    // Get price range from candles for Y coordinate calculation
    const candleArray = Array.from(candles.values());
    if (candleArray.length === 0) return;
    
    const prices = candleArray.flatMap(c => [c.high, c.low]);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const priceRange = maxPrice - minPrice;
    
    const priceToY = (price: number) => {
      return ((maxPrice - price) / priceRange) * canvas.height;
    };

    switch (drawing.type) {
      case 'horizontal-line':
        if (drawing.points.length > 0) {
          const y = priceToY(drawing.points[0].price);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();

          // Price label
          ctx.fillStyle = isSelected ? '#00FF00' : drawing.color;
          ctx.fillRect(canvas.width - 80, y - 10, 75, 20);
          ctx.fillStyle = '#fff';
          ctx.font = '12px monospace';
          ctx.fillText(drawing.points[0].price.toFixed(5), canvas.width - 75, y + 4);
          
          // Draw control point if selected
          if (isSelected) {
            ctx.fillStyle = '#00FF00';
            ctx.beginPath();
            ctx.arc(50, y, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;

      case 'trend-line':
        if (drawing.points.length === 2) {
          const y1 = priceToY(drawing.points[0].price);
          const y2 = priceToY(drawing.points[1].price);
          const x1 = timeScale.timeToCoordinate(drawing.points[0].time as Time);
          const x2 = timeScale.timeToCoordinate(drawing.points[1].time as Time);

          if (x1 !== null && x2 !== null) {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            
            // Draw control points if selected
            if (isSelected) {
              ctx.fillStyle = '#00FF00';
              ctx.beginPath();
              ctx.arc(x1, y1, 6, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(x2, y2, 6, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
        break;

      case 'fibonacci':
        if (drawing.points.length === 2) {
          const y1 = priceToY(drawing.points[0].price);
          const y2 = priceToY(drawing.points[1].price);

          const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
          const fibColors = ['#808080', '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#808080'];

          fibLevels.forEach((level, index) => {
            const y = y1 + (y2 - y1) * level;
            const price = drawing.points[0].price + (drawing.points[1].price - drawing.points[0].price) * level;

            ctx.strokeStyle = isSelected ? '#00FF00' : fibColors[index];
            ctx.globalAlpha = 0.6;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();

            // Label
            ctx.globalAlpha = 1;
            ctx.fillStyle = isSelected ? '#00FF00' : fibColors[index];
            ctx.fillRect(canvas.width - 100, y - 10, 95, 20);
            ctx.fillStyle = '#fff';
            ctx.font = '11px monospace';
            ctx.fillText(`${(level * 100).toFixed(1)}% (${price.toFixed(5)})`, canvas.width - 95, y + 4);
          });

          ctx.globalAlpha = 1;
          ctx.setLineDash([]);
          
          // Draw control points if selected
          if (isSelected) {
            ctx.fillStyle = '#00FF00';
            ctx.beginPath();
            ctx.arc(50, y1, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(50, y2, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;

      case 'rectangle':
        if (drawing.points.length === 2) {
          const y1 = priceToY(drawing.points[0].price);
          const y2 = priceToY(drawing.points[1].price);
          const x1 = timeScale.timeToCoordinate(drawing.points[0].time as Time);
          const x2 = timeScale.timeToCoordinate(drawing.points[1].time as Time);

          if (x1 !== null && x2 !== null) {
            ctx.fillStyle = (isSelected ? '#00FF00' : drawing.color) + '20';
            ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
            
            // Draw control points if selected
            if (isSelected) {
              ctx.fillStyle = '#00FF00';
              // Top-left
              ctx.beginPath();
              ctx.arc(x1, y1, 6, 0, Math.PI * 2);
              ctx.fill();
              // Top-right
              ctx.beginPath();
              ctx.arc(x2, y1, 6, 0, Math.PI * 2);
              ctx.fill();
              // Bottom-left
              ctx.beginPath();
              ctx.arc(x1, y2, 6, 0, Math.PI * 2);
              ctx.fill();
              // Bottom-right
              ctx.beginPath();
              ctx.arc(x2, y2, 6, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
        break;
    }
  };

  // Mouse handlers for drawing
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('MOUSE DOWN DETECTED!', 'Tool:', selectedTool);
    
    const canvas = drawingCanvasRef.current;
    const chart = chartRef.current;
    if (!canvas || !chart) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // In cursor mode, check if clicking on a control point of selected drawing
    if (selectedTool === 'cursor' && selectedDrawingId) {
      const selectedDrawing = drawings.find(d => d.id === selectedDrawingId);
      if (selectedDrawing) {
        const timeScale = chart.timeScale();
        const candleArray = Array.from(candles.values());
        if (candleArray.length > 0) {
          const prices = candleArray.flatMap(c => [c.high, c.low]);
          const maxPrice = Math.max(...prices);
          const minPrice = Math.min(...prices);
          const priceRange = maxPrice - minPrice;

          // Check if clicked on any control point
          for (let i = 0; i < selectedDrawing.points.length; i++) {
            const point = selectedDrawing.points[i];
            const pointX = timeScale.timeToCoordinate(point.time as Time);
            const pointY = ((maxPrice - point.price) / priceRange) * canvas.height;

            if (pointX !== null) {
              const distance = Math.sqrt(Math.pow(x - pointX, 2) + Math.pow(y - pointY, 2));
              if (distance < 10) {
                // Start dragging this point
                setIsDraggingPoint({ drawingId: selectedDrawingId, pointIndex: i });
                console.log('Started dragging point', i);
                e.preventDefault();
                e.stopPropagation();
                return;
              }
            }
          }
        }
      }
    }
    
    // In cursor mode, don't start drawing
    if (selectedTool === 'cursor') return;

    e.preventDefault();
    e.stopPropagation();

    // rect, x, y already declared above - just recalculate if needed
    console.log('Mouse position:', x, y);

    const timeScale = chart.timeScale();
    const priceScale = candlestickSeriesRef.current?.priceScale();
    if (!priceScale) {
      console.log('No price scale');
      return;
    }

    const time = timeScale.coordinateToTime(x);
    const price = priceScale.coordinateToPrice ? priceScale.coordinateToPrice(y) : null;

    // Fallback: calculate price from chart dimensions if API method doesn't exist
    if (price === null && candlestickSeriesRef.current) {
      const candleArray = Array.from(candles.values());
      if (candleArray.length > 0) {
        const prices = candleArray.flatMap(c => [c.high, c.low]);
        const maxPrice = Math.max(...prices);
        const minPrice = Math.min(...prices);
        if (canvas) {
          const priceRange = maxPrice - minPrice;
          const calculatedPrice = maxPrice - (y / canvas.height) * priceRange;
          
          const point = { x, y, price: calculatedPrice, time: (time || Date.now() / 1000) as number };
          
          console.log('Drawing started:', { tool: selectedTool, point });

          const newDrawing = {
            id: Date.now().toString(),
            type: selectedTool,
            points: [point],
            color: '#FFA500',
          };

          setCurrentDrawing(newDrawing);
          setIsDrawing(true);
          isDrawingRef.current = true;
          currentDrawingRef.current = newDrawing;

          // Draw test dot immediately
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#00FF00';
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
            console.log('Drew test dot at', x, y);
          }
          return;
        }
      }
    }

    console.log('Converted to:', { time, price });

    if (time === null || price === null) {
      console.log('Failed to convert coordinates');
      return;
    }

    const point = { x, y, price, time: time as number };

    console.log('Drawing started:', { tool: selectedTool, point });

    const newDrawing = {
      id: Date.now().toString(),
      type: selectedTool,
      points: [point],
      color: '#FFA500',
    };

    setCurrentDrawing(newDrawing);
    setIsDrawing(true);
    isDrawingRef.current = true;
    currentDrawingRef.current = newDrawing;

    // Draw test dot immediately
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#00FF00';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      console.log('Drew test dot at', x, y);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('MOUSE MOVE EVENT', { isDrawing: isDrawingRef.current, hasCurrentDrawing: !!currentDrawingRef.current, selectedTool, isDraggingPoint: !!isDraggingPoint });
    
    const canvas = drawingCanvasRef.current;
    const chart = chartRef.current;
    if (!canvas || !chart) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Handle dragging a control point
    if (isDraggingPoint) {
      e.preventDefault();
      e.stopPropagation();

      const timeScale = chart.timeScale();
      const time = timeScale.coordinateToTime(x);

      const candleArray = Array.from(candles.values());
      if (candleArray.length === 0) return;
      
      const prices = candleArray.flatMap(c => [c.high, c.low]);
      const maxPrice = Math.max(...prices);
      const minPrice = Math.min(...prices);
      const priceRange = maxPrice - minPrice;
      const price = maxPrice - (y / canvas.height) * priceRange;

      if (time === null) return;

      // Update the drawing
      setDrawings(prevDrawings => 
        prevDrawings.map(drawing => {
          if (drawing.id === isDraggingPoint.drawingId) {
            const newPoints = [...drawing.points];
            newPoints[isDraggingPoint.pointIndex] = { x, y, price, time: time as number };
            return { ...drawing, points: newPoints };
          }
          return drawing;
        })
      );

      setTimeout(() => redrawCanvas(), 0);
      return;
    }
    
    if (!isDrawingRef.current || !currentDrawingRef.current || selectedTool === 'cursor') {
      console.log('Mouse move ignored:', { isDrawing: isDrawingRef.current, hasCurrentDrawing: !!currentDrawingRef.current, selectedTool });
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const timeScale = chart.timeScale();
    const time = timeScale.coordinateToTime(x);

    // Calculate price from canvas position
    const candleArray = Array.from(candles.values());
    if (candleArray.length === 0) return;
    
    const prices = candleArray.flatMap(c => [c.high, c.low]);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const priceRange = maxPrice - minPrice;
    const price = maxPrice - (y / canvas.height) * priceRange;

    if (time === null) return;

    const point = { x, y, price, time: time as number };

    console.log('Mouse move:', selectedTool, point);

    let updatedDrawing: DrawingObject;

    if (selectedTool === 'horizontal-line') {
      // Update price only for horizontal line
      updatedDrawing = {
        ...currentDrawingRef.current,
        points: [{ ...currentDrawingRef.current.points[0], price, y }],
      };
    } else {
      // For other tools, add second point
      updatedDrawing = {
        ...currentDrawingRef.current,
        points: [currentDrawingRef.current.points[0], point],
      };
    }
    
    // Update both state and ref
    setCurrentDrawing(updatedDrawing);
    currentDrawingRef.current = updatedDrawing;
    
    // IMMEDIATELY redraw with the updated drawing (don't wait for state)
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw all saved drawings
      drawings.forEach((drawing) => {
        drawObject(ctx, drawing);
      });
      
      // Draw current in-progress drawing
      drawObject(ctx, updatedDrawing);
      
      console.log('Drew in progress:', updatedDrawing.type, updatedDrawing.points.length, 'points');
    }
  };

  const handleCanvasMouseUp = (e?: React.MouseEvent<HTMLCanvasElement>) => {
    // Stop dragging point
    if (isDraggingPoint) {
      console.log('Stopped dragging point');
      setIsDraggingPoint(null);
      return;
    }

    if (!isDrawingRef.current || !currentDrawingRef.current) return;

    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log('Drawing completed:', currentDrawingRef.current);

    // Save the drawing
    if (currentDrawingRef.current.points.length > 0) {
      setDrawings([...drawings, currentDrawingRef.current]);
    }

    setCurrentDrawing(null);
    setIsDrawing(false);
    isDrawingRef.current = false;
    currentDrawingRef.current = null;
    setSelectedTool('cursor');
  };

  // Redraw when drawings change
  useEffect(() => {
    console.log('Drawings changed, redrawing...');
    setTimeout(() => redrawCanvas(), 50);
  }, [drawings, currentDrawing, candles, selectedDrawingId]);

  // Click detection for selecting drawings
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Only select in cursor mode
    if (selectedTool !== 'cursor') return;
    
    // Don't select if we were drawing
    if (isDrawingRef.current) return;

    const canvas = drawingCanvasRef.current;
    const chart = chartRef.current;
    if (!canvas || !chart) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    console.log('Click detected at:', x, y, 'checking', drawings.length, 'drawings');

    // Check if clicked near any drawing
    for (let i = drawings.length - 1; i >= 0; i--) {
      const drawing = drawings[i];
      
      // Check if clicked on any point (10px tolerance)
      for (let pointIndex = 0; pointIndex < drawing.points.length; pointIndex++) {
        const point = drawing.points[pointIndex];
        const timeScale = chart.timeScale();
        const pointX = timeScale.timeToCoordinate(point.time as Time);
        
        const candleArray = Array.from(candles.values());
        if (candleArray.length === 0) continue;
        const prices = candleArray.flatMap(c => [c.high, c.low]);
        const maxPrice = Math.max(...prices);
        const minPrice = Math.min(...prices);
        const priceRange = maxPrice - minPrice;
        const pointY = ((maxPrice - point.price) / priceRange) * canvas.height;

        if (pointX !== null) {
          const distance = Math.sqrt(Math.pow(x - pointX, 2) + Math.pow(y - pointY, 2));
          if (distance < 10) {
            setSelectedDrawingId(drawing.id);
            console.log('Selected drawing:', drawing.id);
            return;
          }
        }
      }
    }

    // Clicked on empty space - deselect
    setSelectedDrawingId(null);
  };

  // Delete selected drawing with Delete key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedDrawingId) {
        setDrawings(drawings.filter(d => d.id !== selectedDrawingId));
        setSelectedDrawingId(null);
        console.log('Deleted drawing:', selectedDrawingId);
      }
      if (e.key === 'Escape') {
        setSelectedTool('cursor');
        setSelectedDrawingId(null);
      }
      if (e.key === 'h' || e.key === 'H') setSelectedTool('horizontal-line');
      if (e.key === 't' || e.key === 'T') setSelectedTool('trend-line');
      if (e.key === 'f' || e.key === 'F') setSelectedTool('fibonacci');
      if (e.key === 'r' || e.key === 'R') setSelectedTool('rectangle');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDrawingId, drawings]);

  return (
    <div className="relative w-full h-full bg-[#1a1d26]">
      {/* Drawing Tools Toolbar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30, pointerEvents: 'auto' }}>
        <ChartDrawingTools
          selectedTool={selectedTool}
          onToolSelect={(tool) => {
            console.log('Tool selected:', tool);
            setSelectedTool(tool);
          }}
          onClearAll={() => {
            console.log('Clearing all drawings');
            setDrawings([]);
          }}
        />
        {/* Drawing Mode Indicator */}
        {selectedTool !== 'cursor' && (
          <div style={{
            position: 'absolute',
            top: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#FFA500',
            color: '#000',
            padding: '8px 16px',
            borderRadius: '4px',
            fontWeight: 'bold',
            fontSize: '14px',
            pointerEvents: 'none'
          }}>
            {isDrawingRef.current ? '🖊️ DRAWING - Keep dragging...' : `🎯 Click and DRAG to draw ${selectedTool}`}
          </div>
        )}
      </div>

      {/* Chart Container */}
      <div 
        ref={chartContainerRef} 
        className="w-full h-full"
        style={{ position: 'relative', zIndex: 1 }}
      />
      
      {/* Drawing Canvas Overlay - Always present */}
      <canvas
        ref={drawingCanvasRef}
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          cursor: selectedTool === 'cursor' ? 'default' : 'crosshair',
          zIndex: 20,
          pointerEvents: 'auto', // Always capture events
          backgroundColor: 'transparent'
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onClick={handleCanvasClick}
        onMouseLeave={() => {
          if (isDrawingRef.current) handleCanvasMouseUp();
          if (isDraggingPoint) setIsDraggingPoint(null);
        }}
      />
      
      {/* Live Price Display */}
      <div className="absolute top-4 left-4 bg-[#2a2e39] px-4 py-2 rounded-lg shadow-lg pointer-events-none" style={{ zIndex: 20 }}>
        <div className="text-xs text-gray-400 mb-1">{symbol}</div>
        <div className="text-2xl font-bold text-yellow-400">
          {livePrices[symbol]?.price?.toFixed(5) || '0.00000'}
        </div>
      </div>

      {/* Candle Stats */}
      {candles.size > 0 && (
        <div className="absolute top-4 right-4 bg-[#2a2e39] px-4 py-2 rounded-lg shadow-lg text-xs pointer-events-none">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <div className="text-gray-400">O</div>
              <div className="text-white font-mono">
                {Array.from(candles.values()).slice(-1)[0]?.open.toFixed(5)}
              </div>
            </div>
            <div>
              <div className="text-gray-400">H</div>
              <div className="text-green-400 font-mono">
                {Array.from(candles.values()).slice(-1)[0]?.high.toFixed(5)}
              </div>
            </div>
            <div>
              <div className="text-gray-400">L</div>
              <div className="text-red-400 font-mono">
                {Array.from(candles.values()).slice(-1)[0]?.low.toFixed(5)}
              </div>
            </div>
            <div>
              <div className="text-gray-400">C</div>
              <div className="text-white font-mono">
                {Array.from(candles.values()).slice(-1)[0]?.close.toFixed(5)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Trades Info */}
      {activeTrades.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-[#2a2e39] px-4 py-2 rounded-lg shadow-lg text-xs space-y-1 pointer-events-none">
          <div className="text-gray-400 font-semibold mb-2">Active Trades</div>
          {activeTrades.filter((t: Trade) => t.symbol === symbol).map((trade: Trade) => (
            <div key={trade._id} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${trade.type === 'BUY' ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-white font-mono">{trade.type}</span>
              <span className="text-gray-400">@</span>
              <span className="text-white font-mono">{trade.entryPrice.toFixed(5)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
