import { NextRequest, NextResponse } from 'next/server';

const ADMIN_API_URL = process.env.INTERNAL_ADMIN_API_URL || 'https://admin.restx.food/api';

// Next.js App Router: increase timeout for file uploads
export const maxDuration = 60; // seconds

/**
 * Proxy GET /api/admin/tenants/[id] to the admin backend.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const targetUrl = `${ADMIN_API_URL}/tenants/${id}`;

    try {
        const backendResponse = await fetch(targetUrl);
        const responseBody = await backendResponse.text();

        return new NextResponse(responseBody, {
            status: backendResponse.status,
            headers: {
                'Content-Type': backendResponse.headers.get('content-type') || 'application/json',
            },
        });
    } catch (error: any) {
        console.error(`[API Route] Proxy error for GET /tenants/${id}:`, error.message);
        return NextResponse.json(
            { error: 'Failed to proxy request', detail: error.message },
            { status: 502 }
        );
    }
}

/**
 * Proxy PUT /api/admin/tenants/[id] to the admin backend.
 *
 * This API route exists because Next.js rewrite proxy can fail (500 empty body)
 * when forwarding multipart/form-data with file uploads.
 * By using an explicit API route, we have full control over request streaming.
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const targetUrl = `${ADMIN_API_URL}/tenants/${id}`;

    try {
        // Get the raw body as ArrayBuffer to preserve multipart boundaries exactly
        const body = await request.arrayBuffer();
        const contentType = request.headers.get('content-type') || '';

        console.log(`[API Route] Proxying PUT /tenants/${id} -> ${targetUrl} (${body.byteLength} bytes)`);

        const backendResponse = await fetch(targetUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': contentType,
                'Content-Length': body.byteLength.toString(),
            },
            body: body,
        });

        const responseBody = await backendResponse.text();

        console.log(`[API Route] Backend responded: ${backendResponse.status} (${responseBody.length} chars)`);

        return new NextResponse(responseBody, {
            status: backendResponse.status,
            headers: {
                'Content-Type': backendResponse.headers.get('content-type') || 'application/json',
            },
        });
    } catch (error: any) {
        console.error(`[API Route] Proxy error for PUT /tenants/${id}:`, error.message);
        return NextResponse.json(
            { error: 'Failed to proxy request to admin backend', detail: error.message },
            { status: 502 }
        );
    }
}
