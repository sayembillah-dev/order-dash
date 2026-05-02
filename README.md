# Order Dash

State management dashboard for order intake, parcel creation, Pathao entry, and a **ready-to-ship** archive. Each order has two independent completion flags so teams can work in any order without blocking each other.

## Features

- **Order intake** (`/intake`) — Create orders with customer fields, price, and optional photos (Cloudinary unsigned uploads).
- **Parcel creation** (`/parcel`) — Queue: `parcelCreationDone === false`.
- **Pathao entry** (`/entry`) — Queue: `pathaoEntryDone === false`.
- **Archive** (`/archive`) — Both flags true (“ready to ship”). Full edit/delete plus **reopen** actions to fix mistaken completions.

Authentication is a single shared username/password from the environment (HTTP-only signed session cookie).

## Stack

- [Next.js](https://nextjs.org/) 16 (App Router)
- [MongoDB](https://www.mongodb.com/) via Mongoose (Atlas-ready)
- [Cloudinary](https://cloudinary.com/) unsigned uploads from the browser
- [shadcn/ui](https://ui.shadcn.com/) + Tailwind CSS 4

## Setup

1. **Clone and install**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env.local` and fill in:

   | Variable | Purpose |
   |----------|---------|
   | `MONGODB_URI` | MongoDB connection string (e.g. Atlas) |
   | `AUTH_USERNAME` / `AUTH_PASSWORD` | Dashboard login |
   | `AUTH_SECRET` | Long random string used to sign the session cookie (min 16 chars) |
   | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
   | `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Unsigned upload preset name |

3. **Cloudinary**

   In the Cloudinary console, enable unsigned uploads for the preset used above (folder `order-dash` is sent from the app but optional on the preset).

4. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Unauthenticated users are sent to `/login`; after login, `/intake` is the default workspace.

## Production notes

- Serve over HTTPS so secure cookies work as intended (`NODE_ENV=production`).
- Restrict who can reach the app; credentials are plain env vars suitable for a small trusted team.
- Consider rate-limiting `/login` behind your reverse proxy or edge firewall.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
