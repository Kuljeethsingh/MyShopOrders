# ☁️ Deploying to Vercel

The easiest way to deploy your Next.js application is using **Vercel**, the creators of Next.js.

## 1. Create a Vercel Account
Go to [vercel.com/signup](https://vercel.com/signup) and sign up using your **GitHub** account. This will allow Vercel to see your repositories.

## 2. Import Your Project
1.  On your Vercel dashboard, click **"Add New..."** -> **"Project"**.
2.  Find `MyShopOrders` in the list of your GitHub repositories and click **"Import"**.

## 3. Configure Environment Variables (CRITICAL)
Before clicking "Deploy", you must add your environment variables. Vercel needs these to connect to your Google Sheet and Gmail.

1.  Expand the **"Environment Variables"** section.
2.  Open your local `.env.local` file.
3.  Copy and paste each variable name and value into Vercel.
    *   `GOOGLE_SHEET_ID`
    *   `GOOGLE_SERVICE_ACCOUNT_EMAIL`
    *   `GOOGLE_PRIVATE_KEY` (Warning: ensure the entire key including `-----BEGIN...` lines is copied)
    *   `NEXTAUTH_SECRET`
    *   `NEXTAUTH_URL` (Set this to your Vercel deployment URL later, or just leave it empty for Vercel to auto-handle preview URLs. For production, set it to your domain).
    *   `GMAIL_USER`
    *   `GMAIL_APP_PASSWORD`
    *   `NEXT_PUBLIC_RAZORPAY_KEY_ID`

## 4. Deploy
Click **"Deploy"**. Vercel will build your application and launch it.

---

# ⚡ Deploying to Netlify

You can also deploy to **Netlify**, which has excellent support for Next.js.

## 1. Create a Netlify Account
Go to [netlify.com](https://www.netlify.com/) and sign up using your **GitHub** account.

## 2. Import Your Project
1.  Click **"Add new site"** -> **"Import an existing project"**.
2.  Select **GitHub**.
3.  Authorize Netlify to access your repositories.
4.  Search for and select `MyShopOrders`.

## 3. Build Settings
Netlify usually detects Next.js automatically.
*   **Build command:** `npm run build`
*   **Publish directory:** `.next`
*   *(Note: Netlify may install the `@netlify/plugin-nextjs` automatically).*

## 4. Configure Environment Variables
1.  Click **"Show advanced"** or go to **"Site settings"** -> **"Environment variables"** later.
2.  Add all variables from your `.env.local`:
    *   `GOOGLE_SHEET_ID`
    *   `GOOGLE_SERVICE_ACCOUNT_EMAIL`
    *   `GOOGLE_PRIVATE_KEY` (Copy the full key carefully)
    *   `NEXTAUTH_SECRET`
    *   `NEXTAUTH_URL` (Your Netlify site URL, e.g., `https://your-site.netlify.app`)
    *   `GMAIL_USER`
    *   `GMAIL_APP_PASSWORD`
    *   `NEXT_PUBLIC_RAZORPAY_KEY_ID`

## 5. Deploy
Click **"Deploy site"**.

---

# ☁️ Deploying to Google Cloud Run

For a scalable, containerized deployment, you can use **Google Cloud Run**.

## 1. Prerequisites
*   A [Google Cloud Project](https://console.cloud.google.com/).
*   Billing enabled on your project.

**Option A: Install CLI Locally**
*   [gcloud CLI](https://cloud.google.com/sdk/docs/install) installed and authenticated (`gcloud auth login`).

**Option B: Use Cloud Shell (Easiest)**
*   Go to [shell.cloud.google.com](https://shell.cloud.google.com).
*   This gives you a browser-based terminal with `gcloud` pre-installed.

## 2. Setup Project (Crucial Step)
1.  List your projects to find your **Project ID** (not the name):
    ```bash
    gcloud projects list
    ```
2.  Set your project:
    ```bash
    gcloud config set project YOUR_PROJECT_ID
    ```

## 3. Enable Services
Run these commands in your terminal (or Cloud Shell):
```bash
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com
```

## 3. Deploy
Run the following command (replace `PROJECT_ID` with your actual project ID):

```bash
gcloud run deploy sweetshop-app \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_SHEET_ID="your_sheet_id",GOOGLE_SERVICE_ACCOUNT_EMAIL="your_email",NEXTAUTH_URL="https://your-cloud-run-url",NEXTAUTH_SECRET="your_secret" 
  # ... add all other env vars here separated by specific commas
```

*Note: You can also set environment variables in the Google Cloud Console UI after deployment.*

---

> [!WARNING]
> **Important Note on Images:**
> This application currently saves uploaded product images to the **local file system** (`public/uploads`).
>
> On cloud platforms like Vercel, Netlify, or Cloud Run, the file system is **ephemeral** (temporary). This means:
> 1.  Images you upload in production **will disappear** when the server restarts or redeploys.
> 2.  Images uploaded locally and pushed to GitHub *will* allow display, but new uploads won't persist.
>
> **Recommended Fix for Production:**
> To fix this for a real online store, you should integrate a cloud storage service like **Cloudinary**, **AWS S3**, or **Firebase Storage** to handle image uploads.
