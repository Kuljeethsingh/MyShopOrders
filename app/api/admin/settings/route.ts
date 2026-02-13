
import { NextResponse } from 'next/server';
import { getShopDetails, saveShopDetails } from '@/lib/db';

export async function GET() {
    try {
        const details = await getShopDetails();
        return NextResponse.json(details || {});
    } catch (error) {
        console.error('Error fetching shop settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const success = await saveShopDetails(body);

        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
        }
    } catch (error) {
        console.error('Error saving shop settings:', error);
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
