# 🚀 Render Deployment Guide - CodeGuard Backend

## 📋 Pre-Deployment Checklist

✅ Backend tested locally (all 3 stages working)  
✅ Dual LLM system configured (Ollama + OpenRouter)  
✅ All dependencies in requirements.txt  
✅ Environment variables documented  
✅ Git repository ready  

---

## 🔧 Step 1: Prepare for Deployment

### 1.1 Verify All Files Are Ready

Check that these files exist and are up to date:
```
backend/
├── app/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   └── analyzers/
│       ├── static_analyzer.py
│       ├── dynamic_analyzer.py
│       ├── linguistic_analyzer.py
│       └── linguistic/
│           ├── LLM_response.py (Dual API: Ollama + OpenRouter)
│           └── layers/
│               ├── layer1_rule_engine.py
│               ├── layer2_ast_analyzer.py
│               ├── layer3_llm_reasoner.py
│               └── aggregator.py
├── requirements.txt
├── render.yaml
└── .env (for reference only, NOT committed)
```

### 1.2 Test Locally One More Time

```powershell
# Make sure server is running
cd F:\Codeguard\backend
F:/Codeguard/.venv/Scripts/python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# In another terminal, run the full backend test
F:/Codeguard/.venv/Scripts/python.exe test_full_backend.py
```

**Expected Result**: All 3 stages should pass ✅

---

## 💾 Step 2: Commit and Push to GitHub

### 2.1 Check Git Status

```powershell
cd F:\Codeguard
git status
```

### 2.2 Add All Changes

```powershell
git add .
```

### 2.3 Commit Changes

```powershell
git commit -m "feat: Add dual LLM system (Ollama + OpenRouter) + 3-layer cascade + aggregation"
```

### 2.4 Push to GitHub

```powershell
git push origin main
```

**⚠️ IMPORTANT**: Make sure `.env` is in `.gitignore` so API keys are NOT committed!

---

## 🌐 Step 3: Deploy on Render

### 3.1 Login to Render

1. Go to: https://dashboard.render.com/
2. Sign in with your account

### 3.2 Option A: Create New Web Service (First Time)

If you haven't deployed before:

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `Codeguard`
3. Configure settings:
   - **Name**: `codeguard-backend`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt && python -m spacy download en_core_web_sm`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

### 3.2 Option B: Re-Deploy Existing Service

If `codeguard-backend-g7ka` already exists:

1. Go to **Dashboard** → Select `codeguard-backend-g7ka`
2. Click **"Manual Deploy"** → **"Deploy latest commit"**
3. Or just push to GitHub (auto-deploy if enabled)

---

## 🔐 Step 4: Set Environment Variables

### 4.1 Navigate to Environment Settings

1. In Render Dashboard, select your service: `codeguard-backend-g7ka`
2. Go to **"Environment"** tab
3. Click **"Add Environment Variable"**

### 4.2 Add Required Variables

Add each of these variables:

#### Database Configuration
```
Key: DATABASE_URL
Value: sqlite:///./codeguard.db
```

#### LLM API Keys (Primary: Ollama)
```
Key: OLLAMA_API_KEY
Value: *********************
```

#### LLM API Keys (Fallback: OpenRouter)
```
Key: OPENROUTER_API_KEY
Value: ***********************************
```

#### Docker Configuration
```
Key: DOCKER_TIMEOUT
Value: 5
```

```
Key: DOCKER_MEMORY_LIMIT
Value: 128m
```

```
Key: DOCKER_HOST
Value: unix:///var/run/docker.sock
```

### 4.3 Save Changes

Click **"Save Changes"** after adding all variables.

---

## ⏳ Step 5: Wait for Build to Complete

### 5.1 Monitor Build Logs

1. Go to **"Logs"** tab
2. Watch the build process:
   - Installing Python dependencies (~2-3 min)
   - Installing spaCy models (~2-3 min)
   - Installing sentence-transformers (~3-5 min)
   - Total: **5-10 minutes**

### 5.2 Expected Build Output

```
Installing collected packages: fastapi, uvicorn, spacy, sentence-transformers, keybert, scikit-learn, ollama...
Successfully installed [all packages]
Downloading en_core_web_sm model...
✓ Download and installation successful
```

### 5.3 Check Deployment Status

Look for:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:10000
```

**Status should show**: 🟢 **Live**

---

## ✅ Step 6: Test Deployed Backend

### 6.1 Test Health Endpoint

```powershell
Invoke-WebRequest -Uri "https://codeguard-backend-g7ka.onrender.com/health" -Method GET -UseBasicParsing
```

**Expected Response**:
```json
{
  "status": "healthy",
  "backend": "render",
  "database": "supabase"
}
```

### 6.2 Test Analysis Endpoint

```powershell
$payload = @{
    prompt = "Write a function to add two numbers"
    code = @"
def add(a, b):
    print(f'Adding {a} and {b}')  # Debug print
    logging.info('Addition')       # Logging
    return a + b
"@
} | ConvertTo-Json

Invoke-WebRequest `
    -Uri "https://codeguard-backend-g7ka.onrender.com/api/analyze" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $payload `
    -TimeoutSec 120 | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**Expected Response**: JSON with bug patterns detected (NPC, etc.)

### 6.3 Check Which LLM API is Being Used

Look at the Render logs:
- If you see Ollama queries → ✅ Primary API working
- If you see OpenRouter errors → ⚠️ Fallback to OpenRouter
- If both fail → System will skip LLM layer (Layer 1 + 2 still work)

---

## 🔍 Step 7: Verify 3-Layer System on Production

### 7.1 Test Linguistic Analysis

Use the same test as local:

```powershell
$testPayload = @{
    prompt = "Create a simple authentication function"
    code = @"
def authenticate(username, password):
    print(f'Debug: Auth user {username}')
    logging.info('Login attempt')
    if username == "admin" and password == "admin123":
        return True
    return False
"@
} | ConvertTo-Json

Invoke-WebRequest `
    -Uri "https://codeguard-backend-g7ka.onrender.com/api/analyze" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $testPayload `
    -TimeoutSec 120
```

**Check Response for**:
- ✅ NPC detected (debug prints, logging)
- ✅ Prompt bias detected (hardcoded "admin")
- ✅ Linguistic analysis execution time (~30s with LLM)

---

## 🎯 Step 8: Update Frontend to Use Production URL

### 8.1 Update API URL in Frontend

**File**: `frontend/src/services/api.ts`

```typescript
// Change from localhost to production
const API_URL = 'https://codeguard-backend-g7ka.onrender.com';

// Or use environment variable
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
```

### 8.2 Test VS Code Extension

1. Open your VS Code extension
2. Generate some code with an LLM
3. Run CodeGuard analysis
4. Verify results show:
   - Static analysis
   - Dynamic analysis
   - Linguistic analysis (with 3-layer aggregation)
   - Bug patterns with severity scores

---

## ⚠️ Troubleshooting

### Issue 1: Build Fails - Missing Dependencies

**Solution**: Check `requirements.txt` has all packages:
```
ollama>=0.4.3
spacy==3.8.11
sentence-transformers==5.2.2
```

### Issue 2: Server Crashes on Startup

**Solution**: Check Render logs for:
- Missing environment variables
- Database connection issues
- Port binding issues

### Issue 3: LLM Analysis Takes Too Long (>60s)

**Solution**: 
- Check if Ollama API key is valid
- Verify OpenRouter fallback is working
- Consider increasing timeout in frontend

### Issue 4: "Module 'app' not found"

**Solution**: Verify Root Directory in Render settings is set to `backend`

### Issue 5: Ollama API Fails

**Solution**:
- System automatically falls back to OpenRouter
- If both fail, only Layer 1 + 2 will work (still functional)
- Check API keys are correct in Render environment variables

---

## 📊 Performance Expectations on Render Free Tier

### Response Times
- **Static Analysis**: ~0.02s ⚡
- **Dynamic Analysis**: ~0.5s 🏃
- **Linguistic Analysis**: ~25-35s 🧠 (with Ollama LLM)
- **Total**: ~35-40s

### Memory Usage
- **Expected**: 400-500 MB
- **Limit (Free Tier)**: 512 MB
- **Status**: Should fit comfortably ✅

### Cold Start
- **First request after sleep**: ~10-15s (Docker + NLP models loading)
- **Subsequent requests**: Normal timing

---

## 🎉 Success Checklist

After deployment, verify:

✅ Health endpoint returns `{"status": "healthy"}`  
✅ Analyze endpoint accepts requests  
✅ All 3 stages execute (static, dynamic, linguistic)  
✅ Linguistic analysis uses Ollama API (check logs)  
✅ OpenRouter fallback works if Ollama fails  
✅ Bug patterns are detected and classified  
✅ Response time is reasonable (~35-40s)  
✅ No server crashes or memory issues  
✅ Frontend can connect to backend  
✅ VS Code extension works end-to-end  

---

## 📝 Deployment URL

**Production Backend**: `https://codeguard-backend-g7ka.onrender.com`

**Endpoints**:
- Health: `GET /health`
- Root: `GET /`
- Analyze: `POST /api/analyze`
- Docs: `GET /docs` (Swagger UI)

---

## 🔄 Re-Deployment Process (For Future Updates)

When you make changes:

1. Test locally first
2. Commit and push to GitHub:
   ```powershell
   git add .
   git commit -m "fix: your message here"
   git push origin main
   ```
3. Render will auto-deploy (if enabled)
4. Or manually click "Deploy latest commit" in Render dashboard
5. Wait 5-10 minutes for build
6. Test production endpoint
7. Update frontend if API changes

---

## 🎯 Next Steps After Deployment

1. **Monitor Logs**: Watch for errors in first 24 hours
2. **Test Extension**: Use VS Code extension with real code
3. **Optimize**: If slow, consider paid tier or optimize LLM calls
4. **Scale**: If needed, upgrade from Free tier to Starter ($7/month)

---

## 🆘 Support

- **Render Status**: https://status.render.com/
- **Render Docs**: https://render.com/docs
- **Your Dashboard**: https://dashboard.render.com/

---

**Deployment prepared by**: CodeGuard AI Assistant  
**Date**: February 19, 2026  
**Backend Version**: 2.0.0 (3-Layer Cascade + Dual LLM)
