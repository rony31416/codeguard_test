# 🚀 Quick Deployment Reference

## ⚡ Fast Deployment (3 Commands)

```powershell
cd F:\Codeguard
.\deploy.ps1
# Follow the prompts
```

## 📋 Manual Deployment Steps

### 1. Commit & Push
```powershell
cd F:\Codeguard
git add .
git commit -m "your message"
git push origin main
```

### 2. Set Environment Variables in Render
Go to https://dashboard.render.com/ → `codeguard-backend-g7ka` → Environment

```
OLLAMA_API_KEY=****REDACTED_OLLAMA_KEY****
OPENROUTER_API_KEY=****REDACTED_OPENROUTER_KEY****
DATABASE_URL=sqlite:///./codeguard.db
DOCKER_TIMEOUT=5
DOCKER_MEMORY_LIMIT=128m
```

### 3. Deploy
- **Auto**: Push to GitHub (if auto-deploy enabled)
- **Manual**: Dashboard → Manual Deploy → Deploy latest commit

### 4. Test
```powershell
# Health check
Invoke-WebRequest "https://codeguard-backend-g7ka.onrender.com/health" -UseBasicParsing

# Full analysis test
$payload = @{prompt="Add two numbers"; code="def add(a,b): print(a); return a+b"} | ConvertTo-Json
Invoke-WebRequest "https://codeguard-backend-g7ka.onrender.com/api/analyze" -Method POST -Headers @{"Content-Type"="application/json"} -Body $payload -TimeoutSec 120
```

## ⏱️ Timeline
- Build: 5-10 minutes
- First request (cold start): 10-15 seconds
- Normal requests: ~35-40 seconds

## 🔗 Links
- **Dashboard**: https://dashboard.render.com/
- **Backend**: https://codeguard-backend-g7ka.onrender.com
- **API Docs**: https://codeguard-backend-g7ka.onrender.com/docs
- **Logs**: Dashboard → Logs tab

## ✅ Success Checklist
- [ ] Git pushed successfully
- [ ] All environment variables set
- [ ] Build completed (check Logs)
- [ ] Health endpoint returns 200
- [ ] Analyze endpoint works
- [ ] Linguistic analysis uses Ollama (check logs)
- [ ] All 3 stages execute

## 🆘 Quick Troubleshooting
- **Build fails**: Check requirements.txt, verify Python version
- **500 errors**: Check environment variables, verify API keys
- **Timeout**: Ollama/OpenRouter may be slow, increase timeout to 120s
- **Module not found**: Verify Root Directory = `backend` in Render settings
