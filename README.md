# Yes Energy Forecast Dashboard

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Getting Started](#getting-started)
   - [Clone the Repository](#clone-the-repository)
   - [Environment Setup](#environment-setup)
   - [Install Dependencies](#install-dependencies)
   - [Database Setup](#database-setup)
   - [Running the Application](#running-the-application)
5. [Project Structure](#project-structure)
6. [Key Features](#key-features)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)
9. [Contributing](#contributing)
10. [License](#license)

## Project Overview

Yes Energy Forecast Dashboard is a web application designed to visualize and analyze energy market data, including load forecasts and actual load data. It provides interactive visualizations, statistical analysis, and data comparison features for various types of energy forecasts.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes (Edge Runtime)
- **Database**: Cloudflare D1 (SQLite)
- **ORM**: Drizzle ORM
- **Deployment**: Cloudflare Pages

## Prerequisites

Before you begin, ensure you have the following installed and set up:

- Node.js (v18 or later)
- npm (v7 or later)
- Git
- A Cloudflare account
- Wrangler CLI (for Cloudflare Workers and D1)

## Getting Started

### Clone the Repository

git clone https://github.com/your-username/yes-energy-forecast-dashboard.git

cd yes-energy-forecast-dashboard

### Environment Setup

1. Create a `.env.local` file in the root directory:

```
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
```

2. Set up Cloudflare D1:

   - Log in to your Cloudflare account
   - Navigate to Workers & Pages > D1
   - Create a new database named `yes_energy_db`
   - Note the database ID

3. Update the `wrangler.toml` file with your database ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "yes_energy_db"
database_id = "your_database_id"
```

### Install Dependencies

```bash
npm install
```

### Database Setup

1. Initialize the local D1 database:

```bash
wrangler d1 create yes_energy_db
```

2. Apply the database schema:

```bash
npm run migrate
```

3. Seed the database with sample data (if available):

```bash
npm run seed
```

### Running the Application

1. Start the development server:

```bash
npm run dev
```

2. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
yes-energy-forecast-dashboard/
├── app/
│   ├── api/
│   ├── components/
│   ├── layout.tsx
│   └── page.tsx
├── db/
│   ├── index.ts
│   └── schema.ts
├── lib/
│   ├── types.ts
│   └── utils.ts
├── public/
├── .env.local
├── next.config.mjs
├── package.json
├── README.md
├── tailwind.config.ts
└── wrangler.toml
```

## Key Features

1. Interactive forecast visualization
2. Date range selection
3. Multiple forecast type comparison
4. Statistical analysis (RMSE, MAPE)
5. Data table view with sorting and filtering
6. Historical forecast comparison

## Deployment

To deploy the application to Cloudflare Pages:

1. Ensure you have the Cloudflare Pages GitHub integration set up.
2. Push your changes to the connected GitHub repository.
3. Cloudflare Pages will automatically build and deploy your application.

For manual deployment:

```bash
npm run build
npm run deploy
```

## Troubleshooting

- If you encounter issues with D1 database connections, ensure your Cloudflare API token has the necessary permissions.
- For local development database issues, try running `wrangler d1 migrations apply yes_energy_db` to ensure all migrations are up to date.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
