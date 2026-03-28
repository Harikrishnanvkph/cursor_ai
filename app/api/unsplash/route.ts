import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || 'business dataset chart';
    
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      console.error('UNSPLASH_ACCESS_KEY is not configured');
      return NextResponse.json({ error: 'Unsplash API key not configured' }, { status: 500 });
    }

    // Call Unsplash API
    const res = await fetch(`https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape`, {
      headers: { 
        Authorization: `Client-ID ${accessKey}` 
      },
      // In Next.js App Router, we can control caching with fetch options or next config
      next: { revalidate: 3600 } // Cache for 1 hour to save limit for same queries
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Unsplash API error:', res.status, errorText);
      return NextResponse.json({ error: 'Failed to fetch image from Unsplash' }, { status: res.status });
    }

    const data = await res.json();
    
    // We only need the URL for the background
    // Unsplash recommends using the 'regular' size for backgrounds to balance quality and load time
    return NextResponse.json({ 
      url: data.urls.regular,
      authorName: data.user.name,
      authorLink: data.user.links.html,
      blurHash: data.blur_hash
    });
  } catch (error) {
    console.error('Error in Unsplash proxy route:', error);
    return NextResponse.json({ error: 'Internal server error while calling Unsplash' }, { status: 500 });
  }
}
