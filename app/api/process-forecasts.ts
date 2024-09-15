import { NextApiRequest, NextApiResponse } from 'next';
import { ForecastData } from '@/lib/types';
import { calculateStatistics, processForecasts } from '@/lib/server-calculations';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { forecasts, dateRange } = req.body;
      const processedForecasts = await processForecasts(forecasts, dateRange);
      const statistics = await calculateStatistics(processedForecasts);

      res.status(200).json({ processedForecasts, statistics });
    } catch (error) {
      res.status(500).json({ error: 'Error processing forecasts' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}