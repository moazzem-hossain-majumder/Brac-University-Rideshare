# BRACU Rideshare (Vercel + Supabase)

Campus ridesharing platform for BRAC University students and riders, powered by **React 19**, **Tailwind CSS v4**, **Supabase (PostgreSQL, Realtime & Storage)**, and optimized for **Vercel**.

---

## 🚀 Quick Setup with Supabase

### 1. Create a Supabase Project
1. Go to [Supabase](https://supabase.com) and create a free project.
2. In your Supabase Dashboard, open the **SQL Editor**.
3. Copy the contents of [`supabase_schema.sql`](./supabase_schema.sql) and click **Run**.
   * Creates all tables: `profiles`, `ride_requests`, `ride_offers`, `active_rides`, `chats`, `feedbacks`, `notifications`.
   * Enables Supabase Realtime subscriptions.
   * Creates the `avatars` storage bucket for profile pictures.
   * Seeds the default Super Admin account (`admin@gmail.com`).

### 2. Configure Environment Variables
In the `frontend` folder, create `.env` (or copy `.env.example`):
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
*(You can find these in Supabase Dashboard → **Project Settings** → **API**)*

---

## 💻 Running Locally

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Note:** If you haven't added Supabase credentials yet, the app runs in **Local Demo Mode** using local storage and seeded accounts so you can test immediately!

---

## 🔑 Default Accounts

* **Super Admin**:
  * Email: `admin@gmail.com`
  * Role: Admin
  * Access: Full student approvals, ride oversight, and feedback management.
* **Student Registration**:
  * Only `@g.bracu.ac.bd` institutional emails are accepted.
  * Pending accounts must be approved by the Admin before logging in.

---

## ☁️ Deploying to Vercel

1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com) and click **Add New Project**.
3. Import your GitHub repository (`Brac-University-Rideshare`).
4. Set the **Root Directory** to `frontend`.
5. Under **Environment Variables**, add:
   * `VITE_SUPABASE_URL`: Your Supabase Project URL
   * `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
6. Click **Deploy**! 🚀
