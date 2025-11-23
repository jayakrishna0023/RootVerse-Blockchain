# 🚀 DEPLOY YOUR BACKEND NOW - 5 MINUTES

## ✅ What I've Done For You:
1. ✅ Updated API configuration to use environment variables
2. ✅ Pushed changes to GitHub
3. ✅ CORS already configured for Vercel

## 🎯 YOUR NEXT STEPS (Super Easy!)

### Step 1: Deploy Backend to Render.com (2 minutes)

1. **Open**: https://render.com/register
2. **Sign in** with GitHub
3. **Click**: "New +" button → "Web Service"
4. **Select**: `RootVerse-Blockchain` repository
5. **Configure**:
   ```
   Name: rootverse-backend
   Runtime: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

6. **Add Environment Variables** (Click "Advanced"):
   - Copy from your `.env` file:
   ```
   SUPABASE_URL=<your_value>
   SUPABASE_SERVICE_KEY=<your_value>
   VECHAIN_PRIVATE_KEY=<your_value>
   VECHAIN_WALLET_ADDRESS=<your_value>
   PASSWORD_SALT=ROOTVERSE_SECURE_SALT_2025_BLOCKCHAIN
   JWT_SECRET=ROOTVERSE_JWT_SECRET_BLOCKCHAIN_2025
   ```

7. **Click**: "Create Web Service"
8. **Wait**: 3-5 minutes for build
9. **Copy**: Your URL (looks like: `https://rootverse-backend.onrender.com`)

### Step 2: Connect Backend to Vercel Frontend (1 minute)

1. **Open**: https://vercel.com/dashboard
2. **Select**: Your RootVerse project
3. **Go to**: Settings → Environment Variables
4. **Add**:
   - Key: `VITE_API_URL`
   - Value: `https://rootverse-backend.onrender.com` (your Render URL)
   - Environment: ✅ Production
5. **Click**: Save
6. **Go to**: Deployments tab
7. **Click**: "..." on latest → "Redeploy"

### Step 3: Test! 🎉

1. Open your Vercel URL
2. Try login/signup
3. Check browser console (F12) - should see: `🔗 API Base URL: https://rootverse-backend.onrender.com`

## ⚡ Alternative: Quick Test with Local Backend

If you want to test immediately while Render deploys:

1. Keep your backend running: `python main.py`
2. In Vercel, set `VITE_API_URL=http://localhost:8005`
3. This will only work when testing locally

## 📝 Notes

- **Render Free Tier**: Backend may sleep after 15 min inactivity (first request takes 30 sec to wake)
- **Upgrade to Paid**: $7/month for always-on backend
- **Alternative Free Hosts**: Railway.app, PythonAnywhere (see BACKEND_DEPLOYMENT.md)

## 🆘 Having Issues?

Check:
1. Render logs (in Render dashboard)
2. Browser console for API errors
3. Verify environment variables in both Render and Vercel
4. Make sure Render service shows "Live" (green)

## ✨ That's It!

Your full-stack app is now live on the internet!
- Frontend: https://your-project.vercel.app
- Backend: https://rootverse-backend.onrender.com
