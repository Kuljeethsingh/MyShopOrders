# MyShop - SweetShop Application

A modern e-commerce application for a Sweet Shop, built with Next.js, Google Sheets as a database, and Tailwind CSS.

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or newer)
- [Git](https://git-scm.com/)

### 🛠️ Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Kuljeethsingh/MyShopOrders.git
    cd MyShopOrders
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env.local` file in the root directory and add the following environment variables. You will need your Google Service Account credentials and Sheet ID.

    ```env
    GOOGLE_SHEET_ID=your_sheet_id_here
    GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email@project.iam.gserviceaccount.com
    GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
    NEXTAUTH_SECRET=your_generated_secret_here
    NEXTAUTH_URL=http://localhost:3000
    GMAIL_USER=your_gmail@gmail.com
    GMAIL_APP_PASSWORD=your_gmail_app_password
    NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
    ```

4.  **Run the development server**:
    ```bash
    npm run dev
    ```

5.  **Open the app**:
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

- `app/`: Next.js App Router pages and API routes.
- `components/`: Reusable React components.
- `lib/`: Utility functions and database connections (Google Sheets).
- `public/`: Static assets (images, icons).

## ✨ Features

- **Product Catalog**: Browse sweets with images and details.
- **Cart & Checkout**: Add items to cart and place orders (integrated with Razorpay).
- **Admin Dashboard**: Manage products, view orders, and download PDF invoices.
- **Authentication**: secure login for users and admins.
- **Google Sheets Database**: Lightweight and easy-to-manage backend.

## 📄 License

This project is for educational purposes.
