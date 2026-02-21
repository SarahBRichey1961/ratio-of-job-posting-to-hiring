/**
 * Health check endpoint
 * Used by Railway to verify the application is running
 */

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  )
}
