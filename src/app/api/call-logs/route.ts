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

export async function GET(request: NextRequest) {
  try {
    // Get query parameters from the request
    const searchParams = request.nextUrl.searchParams;
    const skip = searchParams.get('skip') || '0';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const organization_id = searchParams.get('organization_id');

    // Validate required parameters
    if (!organization_id) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      );
    }

    // Build query parameters for backend API
    const backendParams = new URLSearchParams({
      skip,
      limit,
      organization_id,
    });

    if (search) {
      backendParams.append('search', search);
    }

    if (status) {
      backendParams.append('status', status);
    }

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
    const backendUrl = `${backendApiUrl}/api/call-logs?${backendParams.toString()}`;
    
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

    // Transform recording URLs from S3 to CloudFront
    if (data.call_logs && Array.isArray(data.call_logs)) {
      data.call_logs = data.call_logs.map((log: any) => ({
        ...log,
        recording_link: transformRecordingUrl(log.recording_link)
      }));
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching call logs:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch call logs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

