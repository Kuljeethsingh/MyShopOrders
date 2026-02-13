
import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/db';

export async function GET() {
    try {
        const products = await getProducts();
        return NextResponse.json(products);
    } catch (error: any) {
        console.error("Error fetching products:", error);
        console.error("Error details:", error.message, error.stack);
        return NextResponse.json({ error: 'Failed to fetch products: ' + error.message }, { status: 500 });
    }
}
