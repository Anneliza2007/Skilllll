# Deploying to Vercel

This application is fully configured for zero-config deployment to **Vercel** with both static client assets and serverless API endpoints.

---

## 1. Quick Deploy via Vercel Dashboard

1. Push this repository to **GitHub**, **GitLab**, or **Bitbucket**.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Select and import your repository.
4. Vercel will automatically detect **Vite** using the included `vercel.json`:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**!

---

## 2. Environment Variables (Optional)

In your Vercel Project Settings under **Settings > Environment Variables**, you can configure:

| Variable | Description | Required? |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Your Google AI Studio / Gemini API key for real-time dynamic quiz, project, and resume generation | **Optional** (The app automatically falls back to curated heuristics if omitted) |

> **Note**: After adding or editing environment variables in Vercel, trigger a redeploy for the new values to take effect.

---

## 3. Architecture on Vercel

- **Frontend**: High-performance static SPA served from Vercel's global Edge Network (`dist/` directory).
- **Backend API**: Serverless Function hosted at `api/index.ts`. All `/api/*` requests (such as `/api/health`, `/api/gemini/quiz`, `/api/gemini/optimize-profile`, `/api/gemini/generate-projects`, and `/api/gemini/match-internships`) route automatically through Vercel's Serverless Node runtime.
- **Client Routing**: Configured in `vercel.json` to fall back to `index.html` for single-page application navigation.

---

## 4. Deploying via Vercel CLI (Alternative)

If you prefer deploying from your terminal:

```bash
# 1. Install Vercel CLI globally
npm i -g vercel

# 2. Log in and deploy
vercel

# 3. For production release
vercel --prod
```
