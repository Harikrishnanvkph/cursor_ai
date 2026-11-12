import { NextResponse } from 'next/server';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || 'hm8gafKanpnbyLhHr4lNfscg8EZNkIG5fnl5W0u9S7mqgSqhlCGQfzeS';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query')?.trim() || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = Math.min(parseInt(searchParams.get('per_page') || '20', 10), 80);
    const orientation = searchParams.get('orientation'); // landscape, portrait, square

    if (!PEXELS_API_KEY) {
      console.error('PEXELS_API_KEY is not configured');
      return NextResponse.json({ error: 'Pexels API key not configured' }, { status: 500 });
    }

    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });
    if (orientation) {
      params.set('orientation', orientation);
    }

    let url: string;
    if (query) {
      params.set('query', query);
      url = `https://api.pexels.com/v1/search?${params.toString()}`;
    } else {
      url = `https://api.pexels.com/v1/curated?${params.toString()}`;
    }

    const res = await fetch(url, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Pexels API error:', res.status, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch images from Pexels', details: errorText },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in Pexels proxy route:', error);
    return NextResponse.json(
      { error: 'Internal server error while calling Pexels', message: error?.message },
      { status: 500 }
    );
  }
}
