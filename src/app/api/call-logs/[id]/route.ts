import { NextRequest, NextResponse } from 'next/server';

// Helper function to transform S3 URLs to CloudFront URLs
function transformRecordingUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // CloudFront domain
  const CLOUDFRONT_DOMAIN = 'https://dcjbta4brzdzs.cloudfront.net';
  
  // Check if the URL is an S3 URL
  const s3Pattern = /https:\/\/[^\/]+\.s3\.[^\/]+\.amazonaws\.com\//;
  
  if (s3Pattern.test(url)) {
    // Extract the path after the S3 domain
    const pathMatch = url.match(/https:\/\/[^\/]+\.s3\.[^\/]+\.amazonaws\.com\/(.+)/);
    if (pathMatch && pathMatch[1]) {
      return `${CLOUDFRONT_DOMAIN}/${pathMatch[1]}`;
    }
  }
  
  // If it's already a CloudFront URL or not an S3 URL, return as is
  return url;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get the backend API base URL from environment variables
    const backendApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    
    if (!backendApiUrl) {
      return NextResponse.json(
        { error: 'Backend API URL not configured' },
        { status: 500 }
      );
    }

    // Get authorization token from request headers
    const authorization = request.headers.get('authorization');

    // Make request to backend API
    const backendUrl = `${backendApiUrl}/api/call-logs/${id}`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(authorization && { 'Authorization': authorization }),
      },
    });

    // Parse the response
    const data = await response.json();

    // Return the response from backend
    if (!response.ok) {
      return NextResponse.json(
        data,
        { status: response.status }
      );
    }

    // Transform recording URL from S3 to CloudFront
    if (data.recording_link) {
      data.recording_link = transformRecordingUrl(data.recording_link);
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching call log details:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch call log details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

