import { NextResponse } from 'next/server'
import { getAppVersion } from '@/server/app-version'

export async function GET() {
  return NextResponse.json({
    name: 'RouterConnect API',
    version: getAppVersion(),
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
}
