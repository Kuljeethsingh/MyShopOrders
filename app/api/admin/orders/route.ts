
import { NextResponse } from 'next/server';
import { loadDoc } from '@/lib/db';

export async function GET() {
    try {
        const doc = await loadDoc();
        const ordersSheet = doc.sheetsByTitle['Orders'];
        const usersSheet = doc.sheetsByTitle['Users'];

        const [ordersRows, usersRows] = await Promise.all([
            ordersSheet.getRows(),
            usersSheet.getRows()
        ]);

        // Create a map of email -> name from Users sheet
        const userMap = new Map<string, string>();
        usersRows.forEach(row => {
            const email = row.get('email');
            const name = row.get('name');
            if (email && name) {
                userMap.set(email.toLowerCase(), name);
            }
        });

        // Helper to parse amount safely
        const getAmount = (row: any) => {
            const val = parseFloat(row.get('amount') || '0');
            return isNaN(val) ? 0 : val;
        };

        const orders = ordersRows.map(o => {
            const email = o.get('user_email');
            const storedName = o.get('name');
            // Prefer stored name, then lookup from Users sheet, then fallback to email prefix
            const customerName = (storedName && storedName !== 'undefined')
                ? storedName
                : (userMap.get(email?.toLowerCase()) || email?.split('@')[0] || 'Guest');

            return {
                id: o.get('order_id'),
                customer: customerName,
                email: email,
                address: o.get('address'),
                amount: getAmount(o),
                date: o.get('created_at'),
                status: o.get('status') || 'Pending',
                contact: o.get('contact'),
                items: o.get('items')
            };
        }).reverse(); // Newest first

        return NextResponse.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}
