const nodemailer = require('nodemailer');

let transporter = null;
let testAccount = null;
let emailMode = 'ethereal'; // 'gmail' or 'ethereal'

/**
 * Initialize email transporter
 * Uses Gmail if GMAIL_USER and GMAIL_APP_PASSWORD are set, otherwise Ethereal
 */
async function initializeTransporter() {
  if (transporter) return transporter;

  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (gmailUser && gmailAppPassword) {
    // Use Gmail SMTP for real email delivery
    emailMode = 'gmail';
    console.log('📧 Using Gmail SMTP for real email delivery');
    console.log('   Sending from:', gmailUser);

    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });
  } else {
    // Fallback to Ethereal test account
    emailMode = 'ethereal';
    testAccount = await nodemailer.createTestAccount();
    
    console.log('📧 Ethereal Email Account Created (test mode):');
    console.log('   Email:', testAccount.user);
    console.log('   Password:', testAccount.pass);
    console.log('   View sent emails at: https://ethereal.email/login');
    console.log('');
    console.log('   💡 To send REAL emails, set GMAIL_USER and GMAIL_APP_PASSWORD in .env');

    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  return transporter;
}

/**
 * Send RFP email to a vendor
 */
async function sendRFPEmail(vendor, rfp) {
  const transport = await initializeTransporter();

  const itemsList = rfp.items
    .map(item => `• ${item.name} (Qty: ${item.quantity})${item.description ? ` - ${item.description}` : ''}`)
    .join('\n');

  const specs = rfp.items
    .filter(item => item.specifications)
    .map(item => {
      const specStr = Object.entries(item.specifications || {})
        .map(([key, value]) => `  - ${key}: ${value}`)
        .join('\n');
      return `${item.name}:\n${specStr}`;
    })
    .join('\n\n');

  const emailBody = `
Dear ${vendor.contactPerson || vendor.name},

We are requesting a proposal for the following procurement:

**${rfp.title}**

${rfp.description || ''}

**Items Required:**
${itemsList}

${specs ? `**Specifications:**\n${specs}` : ''}

**Requirements:**
${rfp.budget ? `• Budget: $${rfp.budget.toLocaleString()} ${rfp.currency || 'USD'}` : ''}
${rfp.deliveryDays ? `• Delivery: Within ${rfp.deliveryDays} days` : ''}
${rfp.paymentTerms ? `• Payment Terms: ${rfp.paymentTerms}` : ''}
${rfp.warrantyMonths ? `• Warranty Required: ${rfp.warrantyMonths} months minimum` : ''}

Please reply to this email with your proposal including:
1. Unit prices for each item
2. Total price
3. Delivery timeline
4. Warranty terms
5. Payment terms

Best regards,
Procurement Team

---
RFP ID: ${rfp.id}
  `.trim();

  const htmlBody = emailBody
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  const info = await transport.sendMail({
    from: emailMode === 'gmail' ? process.env.GMAIL_USER : '"RFP System" <rfp@procurement.com>',
    to: vendor.email,
    subject: `Request for Proposal: ${rfp.title}`,
    text: emailBody,
    html: htmlBody,
  });

  // Get preview URL for Ethereal (only works with Ethereal)
  const previewUrl = emailMode === 'ethereal' ? nodemailer.getTestMessageUrl(info) : null;
  
  console.log('✉️  Email sent to:', vendor.email);
  if (previewUrl) {
    console.log('   Preview URL:', previewUrl);
  } else {
    console.log('   Delivered to real inbox!');
  }

  return { 
    success: true, 
    messageId: info.messageId,
    previewUrl: previewUrl,
    mode: emailMode
  };
}

/**
 * Parse inbound email from SendGrid webhook
 */
function parseInboundEmail(webhookData) {
  return {
    from: webhookData.from || webhookData.sender,
    to: webhookData.to,
    subject: webhookData.subject,
    text: webhookData.text || '',
    html: webhookData.html || '',
  };
}

/**
 * Extract RFP ID from email
 */
function extractRFPIdFromEmail(emailData) {
  const subjectMatch = emailData.subject?.match(/RFP[:\s-]*ID[:\s-]*([a-f0-9-]+)/i);
  if (subjectMatch) return subjectMatch[1];

  const bodyMatch = emailData.text?.match(/RFP[:\s-]*ID[:\s-]*([a-f0-9-]+)/i);
  if (bodyMatch) return bodyMatch[1];

  return null;
}

/**
 * Get test account credentials (for viewing sent emails)
 */
function getTestAccountInfo() {
  if (emailMode === 'gmail') {
    return {
      mode: 'gmail',
      email: process.env.GMAIL_USER,
      message: 'Emails are being sent to real inboxes!'
    };
  }
  return testAccount ? {
    mode: 'ethereal',
    email: testAccount.user,
    password: testAccount.pass,
    webUrl: 'https://ethereal.email/login'
  } : null;
}

/**
 * Get current email mode
 */
function getEmailMode() {
  return emailMode;
}

module.exports = {
  sendRFPEmail,
  parseInboundEmail,
  extractRFPIdFromEmail,
  getTestAccountInfo,
  initializeTransporter,
  getEmailMode,
};
