# 🚀 CodeGuard Deployment Test Guide

## Current Deployment Status

✅ **Backend API**: Deployed on Render.com  
✅ **Database**: Deployed on Supabase (PostgreSQL)  
⏳ **Docker Sandbox**: Running locally (Fly.io requires credit card)  

**Backend URL**: https://codeguard-backend-g7ka.onrender.com

---

## 🧪 Testing Steps

### Step 1: Verify Backend is Running

Open browser and visit:
```
https://codeguard-backend-g7ka.onrender.com/health
```

**Expected Response:**
```json
{
  "message": "CodeGuard API is running",
  "version": "2.0.0",
  "stages": ["static", "dynamic", "linguistic"],
  "bug_patterns": 10
}
```

✅ **Status**: Backend is running!

---

### Step 2: Run Automated Test Script

```powershell
cd F:\Codeguard
python test_deployment.py
```

**This will test:**
1. Health check endpoint
2. Code analysis endpoint
3. Feedback submission

**Expected Output:**
```
============================================================
CodeGuard Deployment Test
Backend: Render.com + Supabase
Docker: Local (for now)
============================================================
🔍 Testing health check...
✅ Backend is running!

🔍 Testing code analysis...
   Sending request... (may take 30-50s on first request)
✅ Analysis successful!
   Analysis ID: 38
   Bugs found: 3
   Severity: 8/10

🔍 Testing feedback submission...
✅ Feedback submitted successfully!
============================================================
```

---

### Step 3: Test VS Code Extension

#### 3.1 Start Local Backend (for Docker)

Since Fly.io requires credit card, Docker will run locally:

```powershell
# Terminal 1: Start local backend
cd F:\Codeguard\backend
F:/Codeguard/.venv/Scripts/python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**OR** 

Use the deployed backend (but dynamic analysis may be limited without Docker):

```powershell
# No local backend needed - extension will use Render
```

#### 3.2 Configure Extension

**Option A: Use Production Backend (Render + Supabase)**
1. Open VS Code Settings (Ctrl+,)
2. Search for "CodeGuard"
3. Settings:
   - `codeguard.apiUrl`: `https://codeguard-backend-g7ka.onrender.com`
   - `codeguard.useLocalBackend`: `false`

**Option B: Use Local Backend (for Docker support)**
1. Open VS Code Settings (Ctrl+,)
2. Search for "CodeGuard"
3. Settings:
   - `codeguard.apiUrl`: `http://localhost:8000`
   - `codeguard.useLocalBackend`: `true`

#### 3.3 Launch Extension Development Host

1. Open `F:\Codeguard\codeguard-vscode-extension` in VS Code
2. Press **F5** to launch Extension Development Host
3. New VS Code window opens

#### 3.4 Test Analysis

1. Open `test_buggy_code.py` (or create new Python file)
2. Click **CodeGuard** icon in Activity Bar (sidebar)
3. In CodeGuard panel:
   - Enter prompt: "Write a discount calculator"
   - Click **"Analyze Code"** button
4. **Wait**: First request may take 30-50 seconds (Render cold start)
5. **Verify**:
   - Summary appears with numbered list
   - Red boxes highlight buggy lines
   - Hover over red boxes shows bug details

#### 3.5 Test Feedback

1. After analysis completes
2. Click **"Want to rate this analysis?"** button at bottom
3. Feedback panel slides up
4. Select star rating (1-5)
5. Click "Helpful" or "Not Helpful"
6. Add optional comment
7. Click **"Submit Feedback"**
8. **Verify**:
   - Success message appears
   - Panel auto-collapses after 1.5 seconds
   - No errors in console

---

## 📊 Test Results Checklist

| Feature | Status | Notes |
|---------|--------|-------|
| Backend API Running | ✅ | https://codeguard-backend-g7ka.onrender.com |
| Database Connected | ✅ | Supabase PostgreSQL |
| Static Analysis | ✅ | Works without Docker |
| Dynamic Analysis | ⚠️ | Requires local Docker (or Fly.io) |
| Linguistic Analysis | ✅ | Works without Docker |
| Bug Classification | ✅ | All 10 patterns working |
| Feedback System | ✅ | Saved to Supabase |
| Red Box Highlighting | ✅ | Editor decorations |
| Hover Tooltips | ✅ | Shows bug details |
| Numbered Summary | ✅ | Left-aligned list |
| Cold Start Handling | ✅ | 90s timeout + warning message |

---

## ⚠️ Known Limitations

### 1. Render Free Tier Cold Starts
**Issue**: After 15 minutes of inactivity, backend sleeps  
**Impact**: First request takes 30-50 seconds  
**Mitigation**: 
- Extension shows warning message
- Timeout increased to 90 seconds
- Users are notified

### 2. Docker Sandbox (Fly.io Not Available)
**Issue**: Fly.io requires credit card  
**Impact**: Dynamic analysis limited on production  
**Workaround**:
- Run local backend for full Docker support
- Or use `useLocalBackend: true` setting

**Future Solution**:
- Get credit card for Fly.io
- Or use Railway.app ($5/month)
- Or use Oracle Cloud free tier (requires card but no charge)

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to backend"
**Solution:**
1. Check backend is running: https://codeguard-backend-g7ka.onrender.com/health
2. If sleeping, wait 30-50 seconds
3. Check VS Code settings for correct API URL

### Issue: "Analysis takes too long"
**Solution:**
1. First request always takes longer (cold start)
2. Subsequent requests should be faster (~5-10 seconds)
3. Check internet connection

### Issue: "Dynamic analysis errors"
**Solution:**
1. Docker is not available on Render free tier
2. Run local backend: `python -m uvicorn app.main:app --reload`
3. Set `useLocalBackend: true` in VS Code settings

### Issue: "Feedback not saving"
**Solution:**
1. Verify database connection (backend logs)
2. Check Supabase dashboard for errors
3. Ensure feedback table exists with correct schema

---

## 📈 Performance Metrics

**Cold Start (First Request):**
- Expected: 30-50 seconds
- Timeout: 90 seconds

**Warm Requests:**
- Static Analysis: 2-5 seconds
- With Docker (local): 5-10 seconds
- Feedback Submission: 1-2 seconds

**Database Queries:**
- Analysis Save: ~100ms
- Feedback Save: ~50ms
- History Fetch: ~200ms

---

## 🎯 Next Steps

1. ✅ Backend deployed and tested
2. ✅ Extension configured for production
3. ⏳ Get credit card for Fly.io (Docker sandbox)
4. ⏳ Publish extension v0.0.5 with production backend
5. ⏳ Monitor usage and performance

---

## 📝 Deployment Configuration Summary

```yaml
Backend API:
  Platform: Render.com
  URL: https://codeguard-backend-g7ka.onrender.com
  Tier: Free (750 hours/month)
  Sleep: After 15 minutes inactivity
  
Database:
  Platform: Supabase
  Type: PostgreSQL
  Tier: Free (500MB)
  
Docker Sandbox:
  Platform: Local (temporarily)
  Future: Fly.io or Railway
  
VS Code Extension:
  Version: 0.0.4
  Default Backend: Production (Render)
  Local Mode: Available via settings
```

---

**Test Date**: February 12, 2026  
**Backend Status**: ✅ Running  
**Database Status**: ✅ Connected  
**Docker Status**: ⏳ Local only
