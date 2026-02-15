
import { NextResponse } from 'next/server';
import { loadDoc } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const doc = await loadDoc();
        const sheet = doc.sheetsByTitle['Users'];
        const rows = await sheet.getRows();
        const user = rows.find(row => row.get('email') === email);

        if (!user) {
            return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP to DB
        const { saveOTP } = await import('@/lib/db');
        await saveOTP(email, otp);

        // Send Email using centralized lib
        const { sendPasswordResetEmail } = await import('@/lib/email');

        try {
            await sendPasswordResetEmail(email, otp);
            return NextResponse.json({ message: 'OTP sent to your email.' });
        } catch (emailError) {
            console.error('[RESET API] Error sending email:', emailError);
            return NextResponse.json({ error: 'Failed to send OTP email.' }, { status: 500 });
        }

    } catch (error) {
        console.error('[RESET API] Internal Server Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
