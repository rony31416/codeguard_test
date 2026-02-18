# 🔐 Security Fix - Remove Exposed API Keys from Git History

## ⚠️ CRITICAL: API Keys Exposed in Commit 4e21887

**Status**: Keys are visible in Git history even though removed in later commits

**Exposed Keys**:
- OLLAMA_API_KEY: `****REDACTED_OLLAMA_KEY****`
- OPENROUTER_API_KEY: `****REDACTED_OPENROUTER_KEY****`

---

## 🚨 STEP 1: REVOKE EXPOSED KEYS IMMEDIATELY

### Revoke Ollama API Key
1. Go to: https://ollama.com/account/api-keys
2. Find and revoke: `****REDACTED_OLLAMA_KEY****`
3. Generate new key
4. Save it securely (do NOT commit to Git)

### Revoke OpenRouter API Key
1. Go to: https://openrouter.ai/keys
2. Find and revoke: `****REDACTED_OPENROUTER_KEY****`
3. Generate new key
4. Save it securely (do NOT commit to Git)

---

## 🛠️ STEP 2: REMOVE KEYS FROM GIT HISTORY

### Option A: Rewrite History with git filter-repo (RECOMMENDED)

**⚠️ WARNING**: This will rewrite Git history. Coordinate with team members if repo is shared.

#### Install git-filter-repo
```powershell
# Using pip
pip install git-filter-repo
```

#### Create expressions file
Create file `filter-expressions.txt`:
```
****REDACTED_OLLAMA_KEY****==>****REDACTED_OLLAMA_KEY****
****REDACTED_OPENROUTER_KEY****==>****REDACTED_OPENROUTER_KEY****
```

#### Run filter-repo
```powershell
cd F:\Codeguard

# Backup your repo first
git clone . ../codeguard-backup

# Filter the repository
git filter-repo --replace-text filter-expressions.txt --force
```

#### Force push to remote
```powershell
# This will overwrite remote history
git push origin --force --all
git push origin --force --tags
```

---

### Option B: Simple Force Push (If you control the repo)

**Use this if**:
- You're the only developer
- No one else has cloned the repository
- Commit 4e21887 is recent

#### Step 1: Reset to commit before the leak
```powershell
cd F:\Codeguard

# See commit history
git log --oneline

# Find the commit BEFORE 4e21887, let's say it's abc1234
# Reset to that commit
git reset --hard <commit-before-4e21887>
```

#### Step 2: Re-apply your changes (with sanitized files)
```powershell
# Your current files already have keys removed
# Create a new commit
git add .
git commit -m "feat: Add deployment configuration (API keys secured)"
```

#### Step 3: Force push
```powershell
# WARNING: This will overwrite remote history
git push origin main --force
```

---

### Option C: Make Repository Private (TEMPORARY MITIGATION)

If you can't immediately fix the history:

1. Go to: https://github.com/rony31416/codeguard_test/settings
2. Scroll to "Danger Zone"
3. Click "Change visibility" → "Make private"
4. This prevents public access WHILE you fix the history
5. Do NOT rely on this alone - still revoke and rotate keys!

---

## 📝 STEP 3: UPDATE LOCAL .ENV FILE

After getting new API keys:

```powershell
# Create/update .env file in backend directory
cd F:\Codeguard\backend

# Edit .env file
notepad .env
```

Add new keys:
```env
# LLM API Keys (DO NOT COMMIT THIS FILE!)
OLLAMA_API_KEY=your_new_ollama_key_here
OPENROUTER_API_KEY=your_new_openrouter_key_here

# Database
DATABASE_URL=sqlite:///./codeguard.db

# Docker
DOCKER_HOST=unix:///var/run/docker.sock
DOCKER_TIMEOUT=5
DOCKER_MEMORY_LIMIT=128m
```

---

## 🔒 STEP 4: VERIFY .GITIGNORE

Ensure `.env` is in `.gitignore`:

```powershell
# Check if .env is ignored
git check-ignore .env
git check-ignore backend/.env

# If not, add to .gitignore
echo ".env" >> .gitignore
echo "backend/.env" >> .gitignore
```

---

## ✅ VERIFICATION CHECKLIST

After completing the fix:

- [ ] Old Ollama API key revoked
- [ ] Old OpenRouter API key revoked
- [ ] New Ollama API key generated and saved securely
- [ ] New OpenRouter API key generated and saved securely
- [ ] Git history rewritten (commit 4e21887 removed or sanitized)
- [ ] Force pushed to remote repository
- [ ] `.env` file created with new keys (NOT committed)
- [ ] `.env` added to `.gitignore`
- [ ] Tested backend locally with new keys
- [ ] Updated Render environment variables with new keys

---

## 🚀 STEP 5: UPDATE RENDER WITH NEW KEYS

1. Go to: https://dashboard.render.com/
2. Select service: `codeguard-backend-g7ka`
3. Go to "Environment" tab
4. Update variables:
   - `OLLAMA_API_KEY`: [paste new key]
   - `OPENROUTER_API_KEY`: [paste new key]
5. Click "Save Changes"
6. Render will automatically redeploy

---

## 📚 PREVENTION FOR FUTURE

### Use git-secrets
```powershell
# Install git-secrets to prevent committing secrets
# https://github.com/awslabs/git-secrets

# Add patterns to detect API keys
git secrets --add 'sk-or-v1-[a-zA-Z0-9]{64}'
git secrets --add '[a-f0-9]{32}\.[a-zA-Z0-9]{16}'
```

### Pre-commit Hooks
Create `.git/hooks/pre-commit`:
```bash
#!/bin/sh
# Check for potential API keys
if git diff --cached | grep -E "(sk-or-v1-|OLLAMA_API_KEY|OPENROUTER_API_KEY)" | grep -v "****"; then
    echo "⚠️  ERROR: Potential API key detected in commit!"
    echo "Please remove sensitive data before committing."
    exit 1
fi
```

---

## ❓ NEED HELP?

If you're unsure about any step, STOP and ask for guidance before proceeding.

**Key Points**:
- Rewriting history is destructive - make backups first
- Force pushing requires `--force` flag
- Coordinate with team if repo is shared
- Always revoke exposed keys FIRST
