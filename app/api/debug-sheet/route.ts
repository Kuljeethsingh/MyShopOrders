
import { NextResponse } from 'next/server';
import { loadDoc } from '@/lib/db';

export async function GET() {
    try {
        const doc = await loadDoc();
        const sheetTitle = 'PriceLogs';
        let sheet = doc.sheetsByTitle[sheetTitle];

        const debugInfo = {
            title: doc.title,
            sheetExists: !!sheet,
            existingSheets: Object.keys(doc.sheetsByTitle),
            env: {
                hasSheetId: !!process.env.GOOGLE_SHEET_ID,
                hasEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                hasKey: !!process.env.GOOGLE_PRIVATE_KEY
            }
        };

        if (!sheet) {
            try {
                sheet = await doc.addSheet({ title: sheetTitle, headerValues: ['id', 'product_name', 'old_price', 'new_price', 'admin_email', 'date_time'] });
                return NextResponse.json({ message: "Sheet created successfully during debug", debugInfo });
            } catch (e: any) {
                return NextResponse.json({ error: "Failed to create sheet", details: e.message, debugInfo }, { status: 500 });
            }
        }

        // Try adding a row
        try {
            await sheet.addRow({
                id: 'debug-123',
                product_name: 'Debug Test',
                old_price: 0,
                new_price: 0,
                admin_email: 'debug@test.com',
                date_time: new Date().toISOString()
            });
            return NextResponse.json({ message: "Sheet exists and row added successfully", debugInfo });
        } catch (e: any) {
            return NextResponse.json({ error: "Sheet exists but failed to add row", details: e.message, debugInfo }, { status: 500 });
        }

    } catch (error: any) {
        return NextResponse.json({
            error: "Failed to load doc",
            details: error.message,
            stack: error.stack,
            envCheck: {
                hasSheetId: !!process.env.GOOGLE_SHEET_ID,
                hasEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                hasKey: !!process.env.GOOGLE_PRIVATE_KEY
            }
        }, { status: 500 });
    }
}
