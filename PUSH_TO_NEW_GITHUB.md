# Push to New GitHub Account

## You're currently authenticated as: jayakrishna-certaintiai
## You need to push to: jayakrishnas002311

## Option 1: Use Personal Access Token (RECOMMENDED)

1. **Create Personal Access Token:**
   - Go to: https://github.com/settings/tokens
   - Login with `jayakrishnas002311` account
   - Click "Generate new token" → "Generate new token (classic)"
   - Name: "RootVerse Deploy"
   - Scopes: Check ✅ `repo` (all sub-items)
   - Click "Generate token"
   - **COPY THE TOKEN** (you won't see it again!)

2. **Push with Token:**
   ```powershell
   git remote add new-origin https://YOUR_TOKEN@github.com/jayakrishnas002311/Rootverse.git
   git push -u new-origin main
   ```

   Replace `YOUR_TOKEN` with the token you copied.

## Option 2: Use GitHub CLI (Easier)

```powershell
# Install GitHub CLI
winget install --id GitHub.cli

# Login with new account
gh auth login
# Choose: GitHub.com → HTTPS → Login with browser
# Browser will open - login with jayakrishnas002311

# Push
git remote add new-origin https://github.com/jayakrishnas002311/Rootverse.git
git push -u new-origin main
```

## Option 3: Change Git Credentials

```powershell
# Clear stored credentials
git config --global --unset credential.helper
cmdkey /delete:git:https://github.com

# Push (will prompt for login)
git remote add new-origin https://github.com/jayakrishnas002311/Rootverse.git
git push -u new-origin main
# Enter jayakrishnas002311 username and password/token when prompted
```

## Option 4: Use SSH Key (Best for Multiple Accounts)

1. **Generate new SSH key:**
   ```powershell
   ssh-keygen -t ed25519 -C "your_email@example.com" -f ~/.ssh/id_ed25519_jayakrishnas002311
   ```

2. **Add to GitHub:**
   - Copy public key: `cat ~/.ssh/id_ed25519_jayakrishnas002311.pub`
   - Go to: https://github.com/settings/keys (login as jayakrishnas002311)
   - Click "New SSH key"
   - Paste and save

3. **Configure SSH:**
   - Edit `~/.ssh/config`:
   ```
   Host github-new
     HostName github.com
     User git
     IdentityFile ~/.ssh/id_ed25519_jayakrishnas002311
   ```

4. **Push:**
   ```powershell
   git remote add new-origin git@github-new:jayakrishnas002311/Rootverse.git
   git push -u new-origin main
   ```

## Quick Command (After choosing option):

```powershell
# Once authenticated, run:
git push -u new-origin main

# Verify:
git remote -v

# Set new-origin as default (optional):
git remote rename origin old-origin
git remote rename new-origin origin
```

## After Successful Push:

Update Railway/Render/Vercel to use new repo:
- Repository: `jayakrishnas002311/Rootverse`

All done! 🎉
