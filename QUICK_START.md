# Trading Simulator - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Register Deriv App (2 min)
```
1. Visit: https://api.deriv.com/app-registration
2. Create app (name: "VTfx Trading Simulator")
3. Copy APP_ID
4. Update server/.env:
   DERIV_APP_ID=your_app_id_here
```

### Step 2: Run Migration (1 min)
```bash
cd server
node src/scripts/migrateSimulator.js
```

### Step 3: Start Server (1 min)
```bash
cd server
npm run dev
```
✅ Look for: `[Deriv] Connected to Deriv WebSocket`

### Step 4: Start Frontend (1 min)
```bash
cd client
npm run dev
```
✅ Visit: http://localhost:5173/dashboard/simulator

---

## 📍 Quick Links

- **Simulator**: http://localhost:5173/dashboard/simulator
- **Performance**: http://localhost:5173/dashboard/performance
- **API Docs**: server/src/routes/simulatorRoutes.js

---

## 🎮 First Trade Test

1. Select **R_75** symbol
2. Click **BUY**
3. Lot size: **0.10**
4. Risk %: **1%**
5. Click **"Calc SL"**
6. Click **"Calc TP"**
7. Click **"BUY R_75"**
8. ✅ Trade opens in Active Trades
9. Wait or close manually
10. Check Trade History

---

## 🔍 Verify Installation

### Backend ✅
```bash
# Test API
curl http://localhost:5000/api/simulator/balance

# Expected response:
{
  "success": true,
  "data": {
    "balance": 10000,
    "level": 1,
    "totalTrades": 0
  }
}
```

### Frontend ✅
```bash
# Check browser console
# Should see:
Connected to market data
Subscribed to R_75
```

---

## 📊 Key Features

### Trading
- ✅ 3 Symbols: R_75, R_100, frxEURUSD
- ✅ Real-time prices (500ms updates)
- ✅ Auto SL/TP calculation
- ✅ Live P/L tracking

### Rules
- ✅ Max 2% risk per trade
- ✅ Max 10 trades/day
- ✅ Mandatory SL/TP
- ✅ 30-min cooldown after 3 losses

### Achievements
- ✅ 12 Badges
- ✅ 3 Levels
- ✅ Leaderboard
- ✅ Performance stats

---

## 🐛 Troubleshooting

### Issue: "Deriv not connected"
**Fix:**
```bash
# Check DERIV_APP_ID in server/.env
# Restart server
npm run dev
```

### Issue: "No price updates"
**Fix:**
```javascript
// Browser console → check:
socket.connected // Should be true
socket.emit('subscribe', 'R_75')
```

### Issue: "Trading Locked"
**Reasons:**
1. 10 trades already today → Wait until midnight
2. 3 consecutive losses → Wait 30 minutes
3. Insufficient balance → Reset in Performance page

---

## 📞 Support

- **Setup Guide**: SIMULATOR_SETUP_GUIDE.md
- **Architecture**: TRADING_SIMULATOR_ARCHITECTURE.md
- **Status**: FINAL_IMPLEMENTATION_STATUS.md
- **Deriv API**: https://api.deriv.com/

---

## ✅ Deployment Checklist

- [ ] DERIV_APP_ID set in .env
- [ ] Migration script executed
- [ ] Server running (Deriv connected)
- [ ] Frontend running
- [ ] First test trade successful
- [ ] WebSocket price updates working
- [ ] SL/TP monitoring functional
- [ ] Performance page displays stats

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Status**: Production Ready ✅
