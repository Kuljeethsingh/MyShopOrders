import { NextResponse } from 'next/server';
import { sendInvoiceEmail } from '@/lib/email';

export async function POST(req: Request) {
    try {
        const { orderId, email, customer, amount, items } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;

        await sendInvoiceEmail({
            orderId,
            email,
            customer,
            amount,
            items: parsedItems
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Email error details:', error);
        return NextResponse.json({ error: 'Failed to send email: ' + (error.message || 'Unknown error') }, { status: 500 });
    }
}
