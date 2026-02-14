import { google } from 'googleapis';
import { Readable } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive'];

async function getDriveClient() {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        throw new Error('Missing Google Service Account credentials');
    }

    const auth = new google.auth.JWT(
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        undefined,
        process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        SCOPES
    );

    return google.drive({ version: 'v3', auth });
}

export async function uploadImageToDrive(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    try {
        const drive = await getDriveClient();

        // Check if a folder named "SweetShopImages" exists, if not create it
        // Ideally we cache the folder ID, but for simplicity we search/create
        let folderId = '';
        const folderRes = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.folder' and name='SweetShopImages' and trashed=false",
            fields: 'files(id, name)',
        });

        if (folderRes.data.files && folderRes.data.files.length > 0) {
            folderId = folderRes.data.files[0].id!;
        } else {
            const folderMetadata = {
                name: 'SweetShopImages',
                mimeType: 'application/vnd.google-apps.folder',
            };
            const folder = await drive.files.create({
                requestBody: folderMetadata,
                fields: 'id',
            });
            folderId = folder.data.id!;
        }

        // Upload the file
        const fileMetadata = {
            name: fileName,
            parents: [folderId],
        };

        const media = {
            mimeType: mimeType,
            body: Readable.from(fileBuffer),
        };

        const file = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, webViewLink, webContentLink',
        });

        const fileId = file.data.id!;

        // Make the file public
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        // Construct a direct viewing link (or use webContentLink)
        // Note: webContentLink forces download usually. 
        // A common trick for images is using the 'uc' (user content) export link or lh3.googleusercontent.com if available (but that requires Drive API v2 or other hacks).
        // For Next.js Image component, we might need a specific format.
        // Let's try the thumbnail/export link format which is often more reliable for embedding.
        // https://drive.google.com/uc?export=view&id=FILE_ID

        return `https://drive.google.com/uc?export=view&id=${fileId}`;

    } catch (error) {
        console.error('Error uploading to Google Drive:', error);
        throw error;
    }
}
