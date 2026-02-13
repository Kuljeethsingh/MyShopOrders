
import { NextResponse } from 'next/server';
import { createUser } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const success = await createUser({
            email,
            password_hash,
            name,
            role: 'customer', // Default role
        });

        if (!success) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        return NextResponse.json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Signup Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
