import { NextRequest, NextResponse } from 'next/server'
import { ForecastData } from '@/lib/types'
import { DateRange } from 'react-day-picker'
import { processForecasts, calculateStatistics } from '@/lib/server-calculations'

export const runtime = 'edge'

interface ProcessForecastsRequest {
  forecasts: ForecastData[]
  dateRange?: DateRange
  showHistoricalData: boolean
  historicalDaysAhead: string
  historicalTime: string
  selectedForecasts: string[]
}

export async function POST(req: NextRequest) {
  try {
    const body: ProcessForecastsRequest = await req.json()
    console.log("Request body:", JSON.stringify(body, null, 2));
    const { forecasts, dateRange, showHistoricalData, historicalDaysAhead, historicalTime, selectedForecasts } = body
    console.log("API received request:", { showHistoricalData, historicalDaysAhead, historicalTime, selectedForecasts, dateRange })

    let processedForecasts: ForecastData[]

    // Ensure dateRange is valid before passing it to functions
    const validDateRange = dateRange && dateRange.from && dateRange.to
      ? { from: new Date(dateRange.from), to: new Date(dateRange.to) }
      : undefined

    console.log("Valid date range:", validDateRange)

    processedForecasts = await processForecasts(
      forecasts, 
      validDateRange, 
      showHistoricalData, 
      showHistoricalData ? parseInt(historicalDaysAhead) : undefined, 
      showHistoricalData ? historicalTime : undefined
    )

    console.log("Processed forecasts:", processedForecasts.slice(0, 5)) // Log first 5 forecasts

    const statistics = await calculateStatistics(processedForecasts)
    console.log("Calculated statistics:", statistics)

    return NextResponse.json({ processedForecasts, statistics })
  } catch (error) {
    console.error('Error processing forecasts:', error)
    if (error instanceof Error) {
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json({ error: 'Error processing forecasts', details: (error as Error).message, stack: (error as Error).stack }, { status: 500 })
  }
}