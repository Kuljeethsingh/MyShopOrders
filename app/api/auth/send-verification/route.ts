import { NextResponse } from 'next/server';
import { saveVerificationOTP } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/email';
import { loadDoc } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Check if user already exists (optional, but good UX to tell them to login)
        const doc = await loadDoc();
        const sheet = doc.sheetsByTitle['Users'];
        const rows = await sheet.getRows();
        const existingUser = rows.find(row => row.get('email') === email);

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists. Please sign in.' }, { status: 409 });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await saveVerificationOTP(email, otp);
        await sendVerificationEmail(email, otp);

        return NextResponse.json({ message: 'Verification code sent' });
    } catch (error) {
        console.error('Send Verification Error:', error);
        return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 });
    }
}
