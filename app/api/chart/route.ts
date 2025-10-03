import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const baseServerUrl = process.env.NEXT_PUBLIC_SERVER_URL || process.env.SERVER_URL || 'http://localhost:3001'
    const targetUrl = `${baseServerUrl}/api/perplexity/process-chart`

    const body = await req.text()
    console.log('Frontend API proxy - Request body preview:', body.substring(0, 200) + '...')

    // No timeout needed - frontend already has 60s timeout
    const upstreamResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward cookies for backend auth
        'cookie': req.headers.get('cookie') || ''
      },
      body,
      cache: 'no-store'
    })

    const text = await upstreamResponse.text()
    console.log('Frontend API proxy - Response status:', upstreamResponse.status)
    console.log('Frontend API proxy - Response preview:', text.substring(0, 300) + '...')
    
    return new Response(text, {
      status: upstreamResponse.status,
      headers: {
        'Content-Type': upstreamResponse.headers.get('content-type') || 'application/json'
      }
    })
  } catch (err: any) {
    console.error('Frontend API proxy error:', err)
    return new Response(JSON.stringify({ error: 'Proxy error', details: err?.message || 'unknown' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

