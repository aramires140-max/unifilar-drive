const { google } = require('googleapis');

const FOLDER_ID = '1Vlj9takMxWC-n1lPAshB2pvihYsdZn7A';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const { filename, base64, folderId } = req.body;

    if (!filename || !base64) {
      return res.status(400).json({ ok: false, error: 'filename e base64 são obrigatórios' });
    }

    const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: privateKey,
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    const buffer = Buffer.from(base64, 'base64');
    const { Readable } = require('stream');
    const stream = Readable.from(buffer);

    const targetFolder = folderId || FOLDER_ID;

    const response = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [targetFolder],
        mimeType: 'application/pdf',
      },
      media: {
        mimeType: 'application/pdf',
        body: stream,
      },
    });

    return res.status(200).json({ ok: true, name: filename, id: response.data.id });
  } catch (e) {
    console.error('Erro upload Drive:', e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
