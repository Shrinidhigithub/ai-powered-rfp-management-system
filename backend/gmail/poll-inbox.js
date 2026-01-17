// Gmail Inbound Email Poller for RFP System
// Requires: npm install googleapis
// 1. Go to https://console.cloud.google.com/
// 2. Create a project, enable Gmail API, and create OAuth credentials (Desktop)
// 3. Download credentials.json and place in backend/gmail/credentials.json
// 4. On first run, follow the link to authorize and paste the code

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const readline = require('readline');
const axios = require('axios');


const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const TOKEN_PATH = path.join(__dirname, 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');

function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  if (fs.existsSync(TOKEN_PATH)) {
    oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH)));
    callback(oAuth2Client);
  } else {
    getNewToken(oAuth2Client, callback);
  }
}

function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
      callback(oAuth2Client);
    });
  });
}

function listMessages(auth) {
  const gmail = google.gmail({ version: 'v1', auth });
  gmail.users.messages.list({ userId: 'me', q: 'is:unread' }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const messages = res.data.messages || [];
    if (messages.length === 0) {
      console.log('No new messages.');
      return;
    }
    messages.forEach((msg) => {
      gmail.users.messages.get({ userId: 'me', id: msg.id }, async (err, res) => {
        if (err) return console.log('Error getting message:', err);
        const subjectHeader = res.data.payload.headers.find(h => h.name === 'Subject');
        const fromHeader = res.data.payload.headers.find(h => h.name === 'From');
        const body = Buffer.from(res.data.payload.parts?.find(p => p.mimeType === 'text/plain')?.body.data || '', 'base64').toString('utf-8');
        // Only process if subject contains 'Request for Proposal' or body contains 'RFP ID:'
        if ((subjectHeader?.value && subjectHeader.value.includes('Request for Proposal')) || body.includes('RFP ID:')) {
          console.log('New RFP reply from:', fromHeader?.value);
          console.log('Subject:', subjectHeader?.value);
          console.log('Body:', body);

          // Extract RFP ID from body
          const rfpIdMatch = body.match(/RFP ID[:\s-]*([a-f0-9-]+)/i);
          const rfpId = rfpIdMatch ? rfpIdMatch[1] : null;
          if (!rfpId) {
            console.log('Could not extract RFP ID from email body. Skipping.');
            return;
          }

          // Extract vendor email
          const fromEmailMatch = fromHeader?.value.match(/<(.+)>/);
          const fromEmail = fromEmailMatch ? fromEmailMatch[1] : fromHeader?.value;
          if (!fromEmail) {
            console.log('Could not extract vendor email. Skipping.');
            return;
          }

          // Lookup vendorId from backend
          try {
            const vendorRes = await axios.get('http://localhost:3001/api/vendors');
            const vendor = vendorRes.data.find(v => v.email.toLowerCase() === fromEmail.toLowerCase());
            if (!vendor) {
              console.log('Vendor not found in system for email:', fromEmail);
              return;
            }
            // Call simulate-response endpoint
            const resp = await axios.post('http://localhost:3001/api/webhooks/simulate-response', {
              rfpId,
              vendorId: vendor.id,
              emailContent: body
            });
            console.log('✅ Proposal processed:', resp.data);
          } catch (err) {
            console.error('Error automating proposal processing:', err.response?.data || err.message);
          }
        }
      });
    });
  });
}


function pollLoop() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  authorize(credentials, listMessages);
}

// Run immediately, then every 5 minutes
pollLoop();
setInterval(pollLoop, 5 * 60 * 1000);
