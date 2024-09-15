# project overview
Yes Energy is a leading energy market data platform with ISO/RTO
data, LMP prices, FTR auction results, transmission and generation
outages, real-time generation and flow data, and load and weather
forecasts. The TESLA time develops and deploys the load forecats
and solar/wind power generation forecasts. We are looking to develop
electricity price forecasts as well. We would like to build a dashboard
to visaluize these electricity price forecasts.

The project scope is to develop a website (front-end and back-end) to
display time series data. We will initially provide template data, but in
the final week of the project, our Data Science team will provide four
real-time series forecasts in the same format (.csv) as the template
data.



# Feature requirements
The primary objective of the website is to present interactive
visualizations for each of the four forecasts. Additionally, the website
should allow for easy comparison between the different forecasts.

Interactive features include:
- Have a side panel, with options for Data series selection – single and multi-select
- side panel to change Date range slicing
- Graph, Statistics & spreadsheet tabs
- Select Historic Forecasts
- sheets tab should have a full forecast sheet displayed in a table wise.
- The table should have these non-negogiable columns : Date, Time (whatever forecast is selcted) Actual


# Current File Structure

yes-energy
├── .next
├── .vercel
├── .wrangler
├── app
│   ├── api
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   ├── not-found.tsx
│   ├── page.tsx
│   └── components
│       ├── shared
│       └── ui
├── db
│   ├── dummy.sql
│   ├── index.ts
│   └── schema.ts
├── drizzle
│   ├── meta
│   ├── migrations
│   └── 0000_wet_boomerang.sql
├── lib
│   ├── types.ts
│   └── utils.ts
├── node_modules
├── public
└── requirements
    └── frontend_requirements...

# Rules

- Every new page file should be created in app folder
- And every new component file should be created inside shared folder inside components folder
