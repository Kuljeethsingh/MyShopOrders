
import { NextResponse } from 'next/server';
import { loadDoc } from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from 'fs';
import path from 'path';
import { uploadImageToDrive } from '@/lib/drive';

// ... existing POST ...

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const adminEmail = session?.user?.email || 'Admin';

        const formData = await req.formData();
        const id = formData.get('id') as string;
        // ... rest of form data extraction ...
        const name = formData.get('name') as string;
        const price = formData.get('price') as string;
        const description = formData.get('description') as string;
        const category = formData.get('category') as string;
        const imageFile = formData.get('image') as File | null;

        let image_url: string | undefined;

        if (imageFile && imageFile.size > 0) {
            try {
                const buffer = Buffer.from(await imageFile.arrayBuffer());
                const timestamp = Date.now();
                const filename = `${timestamp}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
                const mimeType = imageFile.type || 'image/jpeg';

                console.log(`Uploading ${filename} to Drive (Update)...`);
                image_url = await uploadImageToDrive(buffer, filename, mimeType);
                console.log(`Upload successful: ${image_url}`);
            } catch (e) {
                console.error("Error uploading file to Drive in PUT:", e);
            }
        }

        const doc = await loadDoc();
        const sheet = doc.sheetsByTitle['Products'];
        const rows = await sheet.getRows();
        const row = rows.find(r => r.get('id') === id);

        if (!row) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const oldPrice = parseFloat(row.get('price') || '0');
        const newPriceVal = parseFloat(price);

        console.log(`[Products API] Updating product ${id}. Old Price: ${oldPrice}, New Price: ${newPriceVal}`);

        // Check and Log Price Change
        if (oldPrice !== newPriceVal) {
            console.log("[Products API] Price change detected. Logging...");
            // Import logPriceChange dynamically if needed or assume it's imported at top
            const { logPriceChange } = await import('@/lib/db');
            const logSuccess = await logPriceChange(id, name, oldPrice, newPriceVal, adminEmail);
            console.log(`[Products API] Price change logged? ${logSuccess}`);
        } else {
            console.log("[Products API] Price unchanged. Skipping log.");
        }

        row.assign({
            name,
            price,
            description,
            category,
            ...(image_url ? { image_url } : {})
        });
        await row.save();

        return NextResponse.json({ message: 'Product updated' });

    } catch (error) {
        console.error('Error updating product', error);
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        const doc = await loadDoc();
        const sheet = doc.sheetsByTitle['Products'];
        const rows = await sheet.getRows();
        const row = rows.find(r => r.get('id') === id);

        if (row) {
            await row.delete();
        }

        return NextResponse.json({ message: 'Product deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
}
