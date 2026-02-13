
require('dotenv').config({ path: './.env.local' });
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

async function check() {
    console.log('Connecting to Google Sheet...');

    // Auth
    const serviceAccountAuth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        scopes: [
            'https://www.googleapis.com/auth/spreadsheets',
        ],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);

    try {
        await doc.loadInfo();
        console.log(`Loaded doc: ${doc.title}`);

        const sheet = doc.sheetsByTitle['Users'];
        if (!sheet) {
            console.error('Users sheet not found!');
            return;
        }

        const rows = await sheet.getRows();
        const emailToFind = 'kuljeethsingh1224@gmail.com';
        const user = rows.find(r => r.get('email') === emailToFind);

        if (user) {
            console.log(`\nUser found: ${emailToFind}`);
            console.log(`Current Role: '${user.get('role')}'`);

            if (user.get('role') !== 'admin') {
                console.log('Role is NOT admin. Updating to admin...');
                user.assign({ role: 'admin' });
                await user.save();
                console.log('Successfully updated role to admin!');
            } else {
                console.log('Role is already admin.');
            }

        } else {
            console.log(`\nUser ${emailToFind} NOT found in DB.`);
            console.log('Registered users:', rows.map(r => r.get('email')));
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

check();
