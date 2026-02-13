
import { NextResponse } from 'next/server';
import { updateOrderStatus } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const { orderId, status } = await req.json();

        if (!orderId || !status) {
            return NextResponse.json({ error: 'Missing orderId or status' }, { status: 400 });
        }

        const success = await updateOrderStatus(orderId, status);

        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Order not found or failed to update' }, { status: 404 });
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
