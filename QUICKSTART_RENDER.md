# Quick Backend Setup for Render.com

## Step 1: Create Render Account & Deploy

1. Go to https://render.com/register
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Authorize Render to access your GitHub
5. Select: `jayakrishna0023/RootVerse-Blockchain`
6. Fill in:
   - **Name**: `rootverse-backend`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: Leave blank
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

## Step 2: Add Environment Variables

Click "Advanced" → Add these environment variables:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_service_role_key
VECHAIN_PRIVATE_KEY=your_vechain_private_key
VECHAIN_WALLET_ADDRESS=your_wallet_address
PASSWORD_SALT=ROOTVERSE_SECURE_SALT_2025_BLOCKCHAIN
JWT_SECRET=ROOTVERSE_JWT_SECRET_BLOCKCHAIN_2025
VECHAIN_NODE_URL=https://testnet.vechain.org
VECHAIN_EXPLORER_URL=https://explore-testnet.vechain.org
```

## Step 3: Deploy

1. Click "Create Web Service"
2. Wait 3-5 minutes for deployment
3. Your backend URL will be: `https://rootverse-backend.onrender.com`

## Step 4: Update Vercel Frontend

Go to your Vercel project:
1. Visit: https://vercel.com/dashboard
2. Select your project
3. Go to "Settings" → "Environment Variables"
4. Add new variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://rootverse-backend.onrender.com` (your Render URL)
   - **Environment**: Production
5. Click "Save"
6. Go to "Deployments" tab
7. Click "..." on latest deployment → "Redeploy"

## Done! 🎉

Your app is now fully hosted:
- Frontend: https://your-project.vercel.app
- Backend: https://rootverse-backend.onrender.com

## CORS Configuration

Your backend already has CORS enabled in main.py, but verify these lines exist:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins including Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Troubleshooting

If backend doesn't start on Render:
1. Check logs in Render dashboard
2. Verify all environment variables are set
3. Make sure `requirements.txt` has all dependencies
4. Check that Python version is 3.9+

If frontend can't connect to backend:
1. Open browser console (F12)
2. Look for CORS errors
3. Verify `VITE_API_URL` is set in Vercel
4. Make sure Render service is running (green status)
