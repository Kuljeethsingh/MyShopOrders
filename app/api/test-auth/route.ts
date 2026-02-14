import { NextResponse } from 'next/server';
import { loadDoc } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const envCheck = {
            HAS_GOOGLE_SHEET_ID: !!process.env.GOOGLE_SHEET_ID,
            HAS_GOOGLE_SERVICE_ACCOUNT_EMAIL: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            HAS_GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
            PRIVATE_KEY_LENGTH: process.env.GOOGLE_PRIVATE_KEY?.length || 0,
            EMAIL_CONFIGURED: !!process.env.EMAIL_USER && !!process.env.EMAIL_PASSWORD
        };

        let dbStatus = "Checking...";
        let sheetTitle = "Unknown";

        try {
            const doc = await loadDoc();
            dbStatus = "Connected!";
            sheetTitle = doc.title;
        } catch (e: any) {
            dbStatus = `Connection Failed: ${e.message}`;
        }

        return NextResponse.json({
            status: 'Diagnostics Run',
            environment: envCheck,
            database: {
                status: dbStatus,
                sheetTitle
            }
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
