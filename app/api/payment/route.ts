import { NextResponse } from 'next/server';
import { getRazorpay } from '@/lib/razorpay';
import crypto from 'crypto';
import { createOrder } from '@/lib/db';
import { sendInvoiceEmail } from '@/lib/email';

export async function POST(req: Request) {
    const { amount } = await req.json();

    const options = {
        amount: amount * 100, // amount in paisa
        currency: "INR",
        receipt: "receipt_" + Math.random().toString(36).substring(7),
    };

    try {
        const razorpay = getRazorpay();
        const order = await razorpay.orders.create(options);
        return NextResponse.json(order);
    } catch (error) {
        return NextResponse.json({ error: 'Error creating order' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const data = await req.json();
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            email,
            name,
            items,
            amount,
            address,
            contact
        } = data;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Save Order to DB
            // Generate 8 digit order id
            const order_id = Math.floor(10000000 + Math.random() * 90000000).toString();

            await createOrder({
                order_id: order_id, // Custom 8 digit ID
                user_email: email,
                name: name,
                amount: amount,
                status: 'paid',
                items: items,
                address: address,
                contact: contact,
                razorpay_payment_id: razorpay_payment_id,
                razorpay_order_id: razorpay_order_id // Store original razorpay order id too
            });

            // Send Automatic Invoice Email
            try {
                // Ensure items is suitable for email (array of objects)
                // In DB it might be stringified, but here 'items' from req is likely the array/object
                const emailItems = typeof items === 'string' ? JSON.parse(items) : items;

                await sendInvoiceEmail({
                    orderId: order_id,
                    email: email,
                    customer: name || email.split('@')[0],
                    amount: amount,
                    items: emailItems
                });
                console.log(`[Payment] Invoice email sent for order ${order_id}`);
            } catch (emailError) {
                console.error(`[Payment] Failed to send invoice email for order ${order_id}`, emailError);
                // Don't fail the payment response if email fails, just log it
            }

            return NextResponse.json({ message: 'Payment verified', order_id: order_id });

            return NextResponse.json({ message: 'Payment verified', order_id: order_id });
        } else {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }
    } catch (error: any) {
        console.error("Payment Verification Error:", error);
        console.error("Error specifics:", error.response?.data || error.message);
        return NextResponse.json({ error: 'Internal Server Error: ' + error.message }, { status: 500 });
    }
}
