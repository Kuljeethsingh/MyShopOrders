
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import bcrypt from 'bcryptjs';

// Config variables
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Lazy Doc instance
let doc: GoogleSpreadsheet | null = null;
let serviceAccountAuth: JWT | null = null;

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function withRetry<T>(fn: () => Promise<T>, operationName: string): Promise<T> {
    let lastError;
    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            return await fn();
        } catch (error) {
            console.error(`[DB] Error in ${operationName} (Attempt ${i + 1}/${MAX_RETRIES}):`, error);
            lastError = error;
            if (i < MAX_RETRIES - 1) await new Promise(res => setTimeout(res, RETRY_DELAY * (i + 1))); // Exponential backoff
        }
    }
    throw lastError;
}

export async function loadDoc() {
    if (!doc) {
        if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
            console.error("Missing Google Sheets credentials in environment variables.");
            // Return null or throw? Throwing is better but might crash app if not handled.
            throw new Error("Missing Google Sheets credentials");
        }

        const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
        const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

        serviceAccountAuth = new JWT({
            email: GOOGLE_CLIENT_EMAIL,
            key: GOOGLE_PRIVATE_KEY,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
    }

    // We can't rely on isDocLoaded boolean if we recreate doc. 
    // Just check if title is loaded or force loadInfo.
    // doc.loadInfo() is idempotent enough.
    await withRetry(() => doc!.loadInfo(), 'doc.loadInfo');

    return doc;
}

export interface User {
    email: string;
    password_hash: string;
    role: string;
    name: string;
    Gender?: string;
    Contact?: string;
    otp?: string;
    otp_expiry?: string;
    last_password_reset_at?: string;
}

export interface Product {
    id: string;
    name: string;
    category: string;
    stock: number;
    image_url: string;
    description: string;
    price: number;
}

export async function getProducts(): Promise<Product[]> {
    const doc = await loadDoc();
    const sheet = doc.sheetsByTitle['Products'];
    if (!sheet) throw new Error("Products sheet not found");

    const rows = await withRetry(() => sheet.getRows(), 'getProducts');
    return rows.map(row => ({
        id: row.get('id'),
        name: row.get('name'),
        category: row.get('category'),
        stock: parseInt(row.get('stock') || '0'),
        image_url: row.get('image_url'),
        description: row.get('description'),
        price: parseFloat(row.get('price') || '0'),
    }));
}

export async function verifyUser(email: string, password: string): Promise<User | null> {
    const doc = await loadDoc();
    const sheet = doc.sheetsByTitle['Users'];
    const rows = await withRetry(() => sheet.getRows(), 'verifyUser');

    // Find user by email
    const userRow = rows.find(row => row.get('email') === email);

    if (!userRow) {
        return null;
    }

    const passwordHash = userRow.get('password_hash');

    const isValid = await bcrypt.compare(password, passwordHash);

    if (isValid) {
        return {
            email: userRow.get('email'),
            password_hash: 'REDACTED',
            role: userRow.get('role'),
            name: userRow.get('name'),
            Gender: userRow.get('Gender'),
            Contact: userRow.get('Contact'),
            last_password_reset_at: userRow.get('last_password_reset_at'),
        };
    }

    return null;
}

export async function createUser(userData: User): Promise<boolean> {
    const doc = await loadDoc();
    const sheet = doc.sheetsByTitle['Users'];
    await ensureUserColumns(sheet); // Ensure columns exist

    // Check if user exists
    const rows = await withRetry(() => sheet.getRows(), 'createUser');
    const existingUser = rows.find(row => row.get('email') === userData.email);
    if (existingUser) return false;

    await sheet.addRow({
        email: userData.email,
        password_hash: userData.password_hash,
        role: userData.role || 'customer',
        name: userData.name,
        Gender: userData.Gender || '',
        Contact: userData.Contact || '',
        last_password_reset_at: '',
    });
    return true;
}

export async function saveOTP(email: string, otp: string): Promise<boolean> {
    try {
        console.log(`[DB] saving OTP for ${email}`);
        const doc = await loadDoc();
        const sheet = doc.sheetsByTitle['Users'];
        await ensureUserColumns(sheet); // Ensure columns exist

        const rows = await sheet.getRows();
        const userRow = rows.find(row => row.get('email') === email);

        if (!userRow) {
            console.log(`[DB] User not found for OTP save: ${email}`);
            return false;
        }

        userRow.set('otp', otp);
        // Set 15 minute expiry
        userRow.set('otp_expiry', (Date.now() + 15 * 60 * 1000).toString());
        await userRow.save();
        console.log(`[DB] OTP saved successfully for ${email}`);
        return true;
    } catch (error) {
        console.error('[DB] Error in saveOTP:', error);
        throw error;
    }
}

export async function verifyOTPAndResetPassword(email: string, otp: string, newPasswordHash: string): Promise<{ success: boolean; message: string }> {
    const doc = await loadDoc();
    const sheet = doc.sheetsByTitle['Users'];
    const rows = await withRetry(() => sheet.getRows(), 'verifyOTP');
    const userRow = rows.find(row => row.get('email') === email);

    if (!userRow) return { success: false, message: 'User not found' };

    const storedOTP = userRow.get('otp');
    const expiry = parseInt(userRow.get('otp_expiry') || '0');

    if (!storedOTP || storedOTP !== otp) {
        return { success: false, message: 'Invalid OTP' };
    }

    if (Date.now() > expiry) {
        return { success: false, message: 'OTP Expired' };
    }

    userRow.set('password_hash', newPasswordHash);
    userRow.set('otp', ''); // Clear OTP
    userRow.set('otp_expiry', '');
    userRow.set('last_password_reset_at', new Date().toISOString()); // Capture Timestamp
    await userRow.save();

    return { success: true, message: 'Password updated successfully' };
}

async function ensureUserColumns(sheet: any) {
    // Sheet header loading is sufficient
    await sheet.loadHeaderRow();
    const headers = sheet.headerValues;
    const newHeaders = [...headers];
    let changed = false;

    if (!headers.includes('otp')) {
        newHeaders.push('otp');
        changed = true;
    }
    if (!headers.includes('otp_expiry')) {
        newHeaders.push('otp_expiry');
        changed = true;
    }
    if (!headers.includes('last_password_reset_at')) {
        newHeaders.push('last_password_reset_at');
        changed = true;
    }

    if (changed) {
        await sheet.setHeaderRow(newHeaders);
    }
}

export async function createOrder(orderData: any): Promise<boolean> {
    const doc = await loadDoc();
    let sheet = doc.sheetsByTitle['Orders'];

    if (!sheet) {
        try {
            sheet = await doc.addSheet({ title: 'Orders' });
        } catch (e) {
            console.error("[DB] Failed to create Orders sheet", e);
            throw new Error("Failed to initialize Orders database");
        }
    }

    // Ensure columns
    try {
        await sheet.loadHeaderRow();
    } catch (e) {
        // Presumably empty sheet, logging and continuing
        console.log("[DB] Could not load headers (sheet might be empty), proceeding to add headers.");
    }

    const headers = sheet.headerValues || [];
    const requiredHeaders = ['order_id', 'user_email', 'name', 'amount', 'status', 'items', 'address', 'contact', 'created_at', 'razorpay_payment_id', 'razorpay_order_id'];
    const newHeaders = [...headers];
    let changed = false;

    requiredHeaders.forEach(h => {
        if (!headers.includes(h)) {
            newHeaders.push(h);
            changed = true;
        }
    });

    if (changed) {
        try {
            await sheet.setHeaderRow(newHeaders);
        } catch (e) {
            console.error("[DB] Failed to update header row", e);
            // If failed to update headers, adding row might still work if columns align or loose schema? 
            // Warning: This might lead to data mismatch if headers aren't set.
        }
    }

    await sheet.addRow({
        order_id: orderData.order_id,
        user_email: orderData.user_email,
        name: orderData.name || '',
        amount: orderData.amount,
        status: orderData.status,
        items: JSON.stringify(orderData.items),
        address: orderData.address,
        contact: orderData.contact,
        created_at: new Date().toISOString(),
        razorpay_payment_id: orderData.razorpay_payment_id || '',
        razorpay_order_id: orderData.razorpay_order_id || ''
    });

    return true;
}

export async function updateOrderStatus(orderId: string, newStatus: string): Promise<boolean> {
    const doc = await loadDoc();
    const sheet = doc.sheetsByTitle['Orders'];
    const rows = await withRetry(() => sheet.getRows(), 'updateOrderStatus');
    const orderRow = rows.find(row => row.get('order_id') === orderId);

    if (orderRow) {
        orderRow.set('status', newStatus);
        await orderRow.save();
        return true;
    }
    return false;
}

export interface ShopSettings {
    name: string;
    address: string;
    contact: string;
    gstin: string;
}

export async function getShopDetails(): Promise<ShopSettings | null> {
    const doc = await loadDoc();
    let sheet = doc.sheetsByTitle['Settings'];
    if (!sheet) {
        // Create sheet if it doesn't exist (if permissions allow, otherwise might fail)
        try {
            sheet = await doc.addSheet({ title: 'Settings', headerValues: ['key', 'value'] });
        } catch (e) {
            console.error("Could not create Settings sheet", e);
            return null;
        }
    }

    const rows = await sheet.getRows();
    const settings: any = {};
    rows.forEach(row => {
        settings[row.get('key')] = row.get('value');
    });

    if (Object.keys(settings).length === 0) return null;

    return {
        name: settings.name || '',
        address: settings.address || '',
        contact: settings.contact || '',
        gstin: settings.gstin || ''
    };
}

export async function saveShopDetails(formattedDetails: ShopSettings): Promise<boolean> {
    const doc = await loadDoc();
    let sheet = doc.sheetsByTitle['Settings'];
    if (!sheet) {
        try {
            sheet = await doc.addSheet({ title: 'Settings', headerValues: ['key', 'value'] });
        } catch (e) {
            console.error("Could not create Settings sheet to save", e);
            return false;
        }
    }

    const rows = await sheet.getRows();

    // Helper to update or add
    const updateOrAdd = async (key: string, value: string) => {
        const row = rows.find(r => r.get('key') === key);
        if (row) {
            row.set('value', value);
            await row.save();
        } else {
            await sheet.addRow({ key, value });
        }
    };

    await updateOrAdd('name', formattedDetails.name);
    await updateOrAdd('address', formattedDetails.address);
    await updateOrAdd('contact', formattedDetails.contact);
    await updateOrAdd('gstin', formattedDetails.gstin);

    return true;
}
export async function saveVerificationOTP(email: string, otp: string): Promise<boolean> {
    const doc = await loadDoc();
    let sheet = doc.sheetsByTitle['Verifications'];
    if (!sheet) {
        try {
            sheet = await doc.addSheet({ title: 'Verifications', headerValues: ['email', 'otp', 'expiry', 'created_at'] });
        } catch (e) {
            console.error("[DB] Could not create Verifications sheet", e);
            return false;
        }
    }

    // Clean up old OTPs for this email if any (optional, but good practice)
    const rows = await sheet.getRows();
    const existingRow = rows.find(row => row.get('email') === email);

    const expiry = (Date.now() + 15 * 60 * 1000).toString(); // 15 mins

    if (existingRow) {
        existingRow.set('otp', otp);
        existingRow.set('expiry', expiry);
        existingRow.set('created_at', new Date().toISOString());
        await existingRow.save();
    } else {
        await sheet.addRow({
            email,
            otp,
            expiry,
            created_at: new Date().toISOString()
        });
    }
    return true;
}

// ... existing code ...
export async function verifySignupOTP(email: string, otp: string): Promise<boolean> {
    const doc = await loadDoc();
    const sheet = doc.sheetsByTitle['Verifications'];
    if (!sheet) return false;

    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('email') === email);

    if (!row) return false;

    const storedOTP = row.get('otp');
    const expiry = parseInt(row.get('expiry') || '0');

    if (storedOTP === otp && Date.now() < expiry) {
        await row.delete();
        return true;
    }

    return false;
}

export async function logPriceChange(productId: string, productName: string, oldPrice: number, newPrice: number, updatedBy: string): Promise<boolean> {
    const doc = await loadDoc();
    let sheet = doc.sheetsByTitle['PriceLogs'];

    if (!sheet) {
        try {
            sheet = await doc.addSheet({ title: 'PriceLogs', headerValues: ['product_id', 'product_name', 'old_price', 'new_price', 'updated_by', 'timestamp'] });
        } catch (e) {
            console.error("[DB] Failed to create PriceLogs sheet", e);
            return false;
        }
    }

    try {
        await sheet.addRow({
            product_id: productId,
            product_name: productName,
            old_price: oldPrice,
            new_price: newPrice,
            updated_by: updatedBy,
            timestamp: new Date().toISOString()
        });
        return true;
    } catch (e) {
        console.error("[DB] Failed to log price change", e);
        return false;
    }
}

