
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { loadDoc } from '@/lib/db';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const doc = await loadDoc();
        const sheet = doc.sheetsByTitle['Orders'];
        const rows = await sheet.getRows();

        // Helper to parse amount safely
        const getAmount = (row: any) => {
            const val = parseFloat(row.get('amount') || '0');
            return isNaN(val) ? 0 : val;
        };

        const userOrders = rows
            .filter(row => row.get('user_email') === session.user?.email)
            .map(o => ({
                id: o.get('order_id'),
                customer: (o.get('name') && o.get('name') !== 'undefined' ? o.get('name') : null) || o.get('user_email').split('@')[0],
                email: o.get('user_email'),
                address: o.get('address'),
                amount: getAmount(o),
                date: o.get('created_at'),
                status: o.get('status') || 'Pending',
                contact: o.get('contact'),
                items: o.get('items')
            }))
            .reverse(); // Newest first

        return NextResponse.json(userOrders);
    } catch (error) {
        console.error('Error fetching user orders:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}
