# Deployment Script for Render
# Run this in PowerShell from F:\Codeguard

Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "  CodeGuard Backend - Render Deployment Helper" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

# 0. Check if we're in the right directory
if (-not (Test-Path ".\backend\app\main.py")) {
    Write-Host "❌ Error: Not in CodeGuard root directory!" -ForegroundColor Red
    Write-Host "   Please run this script from F:\Codeguard" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Current directory: $PWD" -ForegroundColor Green
Write-Host ""

# 1. Run quick local test
Write-Host "=" * 80 -ForegroundColor Yellow
Write-Host "Step 0: Quick Local Test (Optional)" -ForegroundColor Yellow
Write-Host "=" * 80 -ForegroundColor Yellow
Write-Host ""
Write-Host "Do you want to run a quick backend test first?" -ForegroundColor Yellow
$runTest = Read-Host "Enter 'y' to test, 'n' to skip"

if ($runTest -eq 'y') {
    Write-Host "Running backend test..." -ForegroundColor Yellow
    
    # Check if server is running
    $serverRunning = Get-Process -Name "python*" -ErrorAction SilentlyContinue | Where-Object {$_.Path -like "*uvicorn*"}
    
    if (-not $serverRunning) {
        Write-Host "⚠️  Backend server not running. Please start it first:" -ForegroundColor Yellow
        Write-Host "   cd backend" -ForegroundColor White
        Write-Host "   ..\\.venv\Scripts\python.exe -m uvicorn app.main:app --reload" -ForegroundColor White
        Write-Host ""
        $startServer = Read-Host "Start server now? (y/n)"
        if ($startServer -eq 'y') {
            Write-Host "Starting server in background..." -ForegroundColor Yellow
            Start-Process -FilePath "F:\Codeguard\.venv\Scripts\python.exe" `
                -ArgumentList "-m", "uvicorn", "app.main:app", "--reload", "--host", "127.0.0.1", "--port", "8000" `
                -WorkingDirectory "F:\Codeguard\backend" `
                -NoNewWindow
            Start-Sleep -Seconds 5
        }
    }
    
    # Run test
    Write-Host "Testing API..." -ForegroundColor Yellow
    try {
        $testResult = Invoke-WebRequest -Uri "http://127.0.0.1:8000/health" -Method GET -UseBasicParsing -TimeoutSec 5
        if ($testResult.StatusCode -eq 200) {
            Write-Host "✅ Local backend is working!" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  Warning: Local backend test failed" -ForegroundColor Yellow
        Write-Host "   Continue anyway? (y/n)" -ForegroundColor Yellow
        $continue = Read-Host
        if ($continue -ne 'y') {
            exit 1
        }
    }
    Write-Host ""
}

# 2. Check Git Status
Write-Host "=" * 80 -ForegroundColor Yellow
Write-Host "Step 1: Checking Git Status" -ForegroundColor Yellow
Write-Host "=" * 80 -ForegroundColor Yellow
Write-Host ""

$gitStatus = git status --short

if ($gitStatus) {
    Write-Host "📝 Modified files:" -ForegroundColor Yellow
    git status --short
    Write-Host ""
} else {
    Write-Host "✅ No changes to commit" -ForegroundColor Green
    Write-Host ""
    Write-Host "Do you want to continue with re-deployment anyway?" -ForegroundColor Yellow
    $proceed = Read-Host "Enter 'y' to continue, 'n' to cancel"
    if ($proceed -ne 'y') {
        Write-Host "Cancelled." -ForegroundColor Red
        exit 0
    }
}

# 3. Git Add All
Write-Host "=" * 80 -ForegroundColor Yellow
Write-Host "Step 2: Adding Files to Git" -ForegroundColor Yellow
Write-Host "=" * 80 -ForegroundColor Yellow
Write-Host ""

Write-Host "Adding all changes..." -ForegroundColor Yellow
git add .
Write-Host "✅ Files added" -ForegroundColor Green
Write-Host ""

# 4. Git Commit
Write-Host "=" * 80 -ForegroundColor Yellow
Write-Host "Step 3: Committing Changes" -ForegroundColor Yellow
Write-Host "=" * 80 -ForegroundColor Yellow
Write-Host ""

Write-Host "Enter commit message (or press Enter for default):" -ForegroundColor Yellow
$customMessage = Read-Host
if ([string]::IsNullOrWhiteSpace($customMessage)) {
    $commitMsg = "feat: Deploy backend with dual LLM (Ollama + OpenRouter) + 3-layer cascade"
} else {
    $commitMsg = $customMessage
}

Write-Host "Committing with message: $commitMsg" -ForegroundColor Yellow
git commit -m $commitMsg
Write-Host "✅ Changes committed" -ForegroundColor Green
Write-Host ""

# 5. Git Push
Write-Host "=" * 80 -ForegroundColor Yellow
Write-Host "Step 4: Pushing to GitHub" -ForegroundColor Yellow
Write-Host "=" * 80 -ForegroundColor Yellow
Write-Host ""

Write-Host "Pushing to origin main..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Code pushed to GitHub successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Git push failed!" -ForegroundColor Red
    Write-Host "   Please check your Git configuration and try again." -ForegroundColor Red
    exit 1
}
Write-Host ""

# 6. Environment Variables Reminder
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "Step 5: IMPORTANT - Set Environment Variables in Render" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠️  CRITICAL: You must set these environment variables in Render Dashboard!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Go to: https://dashboard.render.com/" -ForegroundColor White
Write-Host "Select: codeguard-backend-g7ka" -ForegroundColor White
Write-Host "Click: Environment Tab" -ForegroundColor White
Write-Host ""

Write-Host "Add these variables:" -ForegroundColor Yellow
Write-Host ""
Write-Host "DATABASE_URL" -ForegroundColor Cyan
Write-Host "  Value: sqlite:///./codeguard.db" -ForegroundColor White
Write-Host ""
Write-Host "OLLAMA_API_KEY" -ForegroundColor Cyan
Write-Host "  Value: ****REDACTED_OLLAMA_KEY****" -ForegroundColor White
Write-Host ""
Write-Host "OPENROUTER_API_KEY" -ForegroundColor Cyan
Write-Host "  Value: ****REDACTED_OPENROUTER_KEY****" -ForegroundColor White
Write-Host ""
Write-Host "DOCKER_TIMEOUT" -ForegroundColor Cyan
Write-Host "  Value: 5" -ForegroundColor White
Write-Host ""
Write-Host "DOCKER_MEMORY_LIMIT" -ForegroundColor Cyan
Write-Host "  Value: 128m" -ForegroundColor White
Write-Host ""

Write-Host "Press Enter after you've set the environment variables..." -ForegroundColor Yellow
Read-Host

# 7. Render Deployment Instructions
Write-Host ""
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "Step 6: Deploy on Render" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

Write-Host "Option 1: Auto-Deploy (if enabled)" -ForegroundColor Yellow
Write-Host "  - Render will automatically deploy from GitHub push" -ForegroundColor White
Write-Host "  - Wait 5-10 minutes for build to complete" -ForegroundColor White
Write-Host ""

Write-Host "Option 2: Manual Deploy" -ForegroundColor Yellow
Write-Host "  1. Go to: https://dashboard.render.com/" -ForegroundColor White
Write-Host "  2. Select service: codeguard-backend-g7ka" -ForegroundColor White
Write-Host "  3. Click 'Manual Deploy' -> 'Deploy latest commit'" -ForegroundColor White
Write-Host "  4. Wait 5-10 minutes for build" -ForegroundColor White
Write-Host ""

Write-Host "Build will include:" -ForegroundColor Yellow
Write-Host "  - Installing Python dependencies (~2 min)" -ForegroundColor White
Write-Host "  - Installing spaCy models (~2 min)" -ForegroundColor White
Write-Host "  - Installing NLP libraries (~3-5 min)" -ForegroundColor White
Write-Host "  - Installing Ollama client" -ForegroundColor White
Write-Host ""

# 8. Test Deployment
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "Step 7: Test Deployed Backend" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

Write-Host "After deployment completes, test with:" -ForegroundColor Yellow
Write-Host ""

Write-Host "# Test health endpoint" -ForegroundColor Green
Write-Host 'Invoke-WebRequest -Uri "https://codeguard-backend-g7ka.onrender.com/health" -UseBasicParsing' -ForegroundColor White
Write-Host ""

Write-Host "# Test analysis endpoint" -ForegroundColor Green
Write-Host '$payload = @{prompt="Add two numbers"; code="def add(a,b): print(a+b); return a+b"} | ConvertTo-Json' -ForegroundColor White
Write-Host 'Invoke-WebRequest -Uri "https://codeguard-backend-g7ka.onrender.com/api/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body $payload -TimeoutSec 120' -ForegroundColor White
Write-Host ""

# 9. Final Summary
Write-Host "=" * 80 -ForegroundColor Green
Write-Host "  Deployment Process Complete!" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Green
Write-Host ""

Write-Host "✅ Code committed and pushed to GitHub" -ForegroundColor Green
Write-Host "✅ Environment variables listed (set them in Render)" -ForegroundColor Green
Write-Host "⏳ Waiting for Render deployment (5-10 minutes)" -ForegroundColor Yellow
Write-Host ""

Write-Host "📚 For detailed instructions, see:" -ForegroundColor Cyan
Write-Host "   F:\Codeguard\RENDER_DEPLOYMENT_GUIDE.md" -ForegroundColor White
Write-Host ""

Write-Host "🔗 Useful Links:" -ForegroundColor Cyan
Write-Host "   Render Dashboard: https://dashboard.render.com/" -ForegroundColor White
Write-Host "   Backend URL: https://codeguard-backend-g7ka.onrender.com" -ForegroundColor White
Write-Host "   API Docs: https://codeguard-backend-g7ka.onrender.com/docs" -ForegroundColor White
Write-Host ""

Write-Host "=" * 80 -ForegroundColor Green
Write-Host ""
