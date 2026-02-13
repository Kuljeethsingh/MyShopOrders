import fs from 'fs';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Load .env.local manually
try {
    const env = fs.readFileSync('.env.local', 'utf8');
    console.log('Read .env.local, length:', env.length);
    const lines = env.split(/\r?\n/);
    lines.forEach(line => {
        const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            const key = match[1];
            let value = match[2] || '';
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            process.env[key] = value;
            console.log(`Loaded ${key}`);
        }
    });
} catch (e) {
    console.error("Could not read .env.local", e);
}

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

console.log('Testing connection with:');
console.log('Sheet ID:', SPREADSHEET_ID);
console.log('Email:', GOOGLE_CLIENT_EMAIL);

const serviceAccountAuth = new JWT({
    email: GOOGLE_CLIENT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
    ],
});

const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);

async function run() {
    try {
        console.log('Loading info...');
        const start = Date.now();
        await doc.loadInfo();
        console.log('Info loaded in', Date.now() - start, 'ms');
        console.log('Title:', doc.title);

        const sheet = doc.sheetsByTitle['Products'];
        if (!sheet) {
            console.log('Sheet "Products" not found. Available sheets:', doc.sheetsByIndex.map(s => s.title));
            return;
        }
        console.log('Fetching rows from Products...');
        const rows = await sheet.getRows();
        console.log('Rows fetched:', rows.length);
    } catch (e) {
        console.error('Error:', e);
    }
}

run();
