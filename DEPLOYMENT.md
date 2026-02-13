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

> [!WARNING]
> **Important Note on Images:**
> This application currently saves uploaded product images to the **local file system** (`public/uploads`).
>
> On cloud platforms like Vercel, the file system is **ephemeral** (temporary). This means:
> 1.  Images you upload in production **will disappear** when the server restarts or redeploys.
> 2.  Images uploaded locally and pushed to GitHub *will* allow display, but new uploads won't persist.
>
> **Recommended Fix for Production:**
> To fix this for a real online store, you should integrate a cloud storage service like **Cloudinary**, **AWS S3**, or **Firebase Storage** to handle image uploads.
