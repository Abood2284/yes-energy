// pages/api/list-files.ts

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const workerResponse = await fetch(' https://yes-energy-worker.sayyedabood69.workers.dev/list-files', {
      method: 'GET',
    });

    if (!workerResponse.ok) {
      throw new Error(`Worker responded with status ${workerResponse.status}`);
    }

    const result = await workerResponse.json();
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching file list:', error);
    res.status(500).json({ message: 'Error fetching file list' });
  }
}