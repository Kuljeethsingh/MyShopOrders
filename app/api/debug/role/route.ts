
import { NextResponse } from 'next/server';
import { loadDoc } from '@/lib/db';

export async function GET() {
    try {
        const doc = await loadDoc();
        const sheet = doc.sheetsByTitle['Users'];
        const rows = await sheet.getRows();
        const user = rows.find(r => r.get('email') === 'kuljeethsingh1224@gmail.com');

        if (user) {
            return NextResponse.json({
                email: user.get('email'),
                role: user.get('role'),
                message: "If role is not 'admin', please change it in the Google Sheet manually!"
            });
        }
        return NextResponse.json({ error: 'User not found in DB' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to check role', details: error });
    }
}
