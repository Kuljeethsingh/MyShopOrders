
import { NextResponse } from 'next/server';
import { loadDoc } from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ role: null }, { status: 401 });
    }

    try {
        const doc = await loadDoc();
        const sheet = doc.sheetsByTitle['Users'];
        const rows = await sheet.getRows();
        const user = rows.find(r => r.get('email') === session.user.email);

        if (user) {
            return NextResponse.json({ role: user.get('role') });
        }
        return NextResponse.json({ role: 'user' }); // Default if not found
    } catch (error) {
        console.error('Error fetching role:', error);
        // Fail safe to 'user' role to prevent app crash/reload loops
        // This means if DB is down, admin access is temporarily revoked, which is safer than crashing.
        return NextResponse.json({ role: 'user' });
    }
}
