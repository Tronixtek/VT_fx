# VTfx Setup Script

Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "VTfx - Enterprise Trading Platform Setup" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Check if .env files exist
if (-not (Test-Path ".\server\.env")) {
    Write-Host "Creating server .env file..." -ForegroundColor Yellow
    Copy-Item ".\.env.example" ".\server\.env"
    Write-Host "✅ Created server\.env - Please update with your credentials!" -ForegroundColor Green
} else {
    Write-Host "✅ server\.env already exists" -ForegroundColor Green
}

if (-not (Test-Path ".\client\.env")) {
    Write-Host "Creating client .env file..." -ForegroundColor Yellow
    Copy-Item ".\client\.env.example" ".\client\.env"
    Write-Host "✅ Created client\.env" -ForegroundColor Green
} else {
    Write-Host "✅ client\.env already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
Write-Host ""

# Install root dependencies
Write-Host "Installing root dependencies..." -ForegroundColor Cyan
npm install

# Install server dependencies
Write-Host ""
Write-Host "Installing server dependencies..." -ForegroundColor Cyan
Set-Location server
npm install
Set-Location ..

# Install client dependencies
Write-Host ""
Write-Host "Installing client dependencies..." -ForegroundColor Cyan
Set-Location client
npm install
Set-Location ..

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Green
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Update server\.env with your MongoDB URI and Paystack keys" -ForegroundColor White
Write-Host "2. Start Redis server: redis-server" -ForegroundColor White
Write-Host "3. Seed the database: cd server && npm run seed" -ForegroundColor White
Write-Host "4. Run the application: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Happy Trading! 🚀" -ForegroundColor Cyan
