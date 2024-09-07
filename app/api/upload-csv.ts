// pages/api/upload-csv.ts

import { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const workerResponse = await fetch('https://your-worker-url.workers.dev/upload-csv', {
      method: 'POST',
      body: req.body,
      headers: req.headers as HeadersInit,
    });

    if (!workerResponse.ok) {
      throw new Error(`Worker responded with status ${workerResponse.status}`);
    }

    const result = await workerResponse.json();
    res.status(200).json(result);
  } catch (error) {
    console.error('Error uploading to worker:', error);
    res.status(500).json({ message: 'Error processing CSV' });
  }
}