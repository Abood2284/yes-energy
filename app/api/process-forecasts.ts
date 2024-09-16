import { NextApiRequest, NextApiResponse } from 'next';
import { ForecastData } from '@/lib/types';
import { calculateStatistics, processForecasts } from '@/lib/server-calculations';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { forecasts, dateRange, showHistoricalData, historicalDaysAhead, historicalTime } = req.body;

      const processedForecasts = await processForecasts(
        forecasts,
        dateRange,
        showHistoricalData,
        historicalDaysAhead !== undefined ? parseInt(historicalDaysAhead) : undefined,
        historicalTime
      );

      const statistics = await calculateStatistics(processedForecasts);

      res.status(200).json({ processedForecasts, statistics });
    } catch (error) {
      console.error('Error processing forecasts:', error);
      res.status(500).json({ error: 'Error processing forecasts' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}