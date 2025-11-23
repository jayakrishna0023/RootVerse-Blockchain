# Backend Deployment Options

## Option 1: Render.com (Free Tier) - RECOMMENDED ✅

1. Create account at https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repo: `jayakrishna0023/RootVerse-Blockchain`
4. Configure:
   - **Name**: rootverse-backend
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables:
   - SUPABASE_URL
   - SUPABASE_SERVICE_KEY
   - VECHAIN_PRIVATE_KEY
   - VECHAIN_WALLET_ADDRESS
   - PASSWORD_SALT
   - JWT_SECRET
6. Click "Create Web Service"
7. Copy your URL: `https://rootverse-backend.onrender.com`
8. Update `.env.production` with: `VITE_API_URL=https://rootverse-backend.onrender.com`

## Option 2: Railway.app (Free Tier)

1. Visit https://railway.app
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `RootVerse-Blockchain`
5. Railway auto-detects Python
6. Add environment variables (same as above)
7. Copy deployment URL
8. Update `.env.production`

## Option 3: ngrok (Temporary - For Testing)

**FASTEST OPTION FOR IMMEDIATE TESTING** 🚀

1. Download ngrok: https://ngrok.com/download
2. Run your backend locally: `python main.py`
3. In another terminal: `ngrok http 8005`
4. Copy the forwarding URL (e.g., `https://xxxx-xx-xxx.ngrok-free.app`)
5. Update Vercel environment variable:
   ```bash
   vercel env add VITE_API_URL production
   # Paste your ngrok URL
   ```
6. Redeploy: `vercel --prod`

**Note**: ngrok URLs expire when you close the terminal. Use Render/Railway for permanent hosting.

## Option 4: PythonAnywhere (Free Tier)

1. Create account at https://www.pythonanywhere.com
2. Upload your Python files
3. Configure WSGI with FastAPI
4. Use provided URL: `https://yourusername.pythonanywhere.com`

## Quick Test (Current Setup)

Your frontend is live at Vercel, but API calls will fail until backend is hosted.

To test locally:
1. Keep `python main.py` running on your computer
2. Use ngrok to expose it: `ngrok http 8005`
3. Update Vercel environment: `VITE_API_URL=your_ngrok_url`
4. Redeploy Vercel

## Recommended: Render.com

- Free tier with 750 hours/month
- Automatic deploys from GitHub
- No credit card required
- Supports Python/FastAPI natively
- Auto SSL certificates
