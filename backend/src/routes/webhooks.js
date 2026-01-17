const express = require('express');
const multer = require('multer');
const prisma = require('../lib/prisma');
const { parseInboundEmail, extractRFPIdFromEmail } = require('../services/email');
const { parseVendorEmail } = require('../services/groq');

const router = express.Router();
const upload = multer();

// POST /api/webhooks/inbound-email - SendGrid Inbound Parse webhook
router.post('/inbound-email', upload.any(), async (req, res, next) => {
  try {
    console.log('📧 Received inbound email webhook');
    
    const emailData = parseInboundEmail(req.body);
    console.log('From:', emailData.from);
    console.log('Subject:', emailData.subject);
    
    const fromEmail = emailData.from.match(/<(.+)>/)?.[1] || emailData.from;
    const vendor = await prisma.vendor.findFirst({
      where: { email: { contains: fromEmail.toLowerCase(), mode: 'insensitive' } }
    });
    
    if (!vendor) {
      console.log('Unknown vendor email:', fromEmail);
      return res.status(200).json({ message: 'Unknown vendor' });
    }
    
    let rfpId = extractRFPIdFromEmail(emailData);
    
    if (!rfpId) {
      const recentRFPVendor = await prisma.rFPVendor.findFirst({
        where: { vendorId: vendor.id, status: 'SENT' },
        orderBy: { sentAt: 'desc' }
      });
      if (recentRFPVendor) rfpId = recentRFPVendor.rfpId;
    }
    
    if (!rfpId) {
      return res.status(200).json({ message: 'Could not match to RFP' });
    }
    
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      include: { items: true }
    });
    
    if (!rfp) {
      return res.status(200).json({ message: 'RFP not found' });
    }
    
    const emailContent = emailData.text || emailData.html;
    const parsedProposal = await parseVendorEmail(emailContent, {
      title: rfp.title,
      budget: rfp.budget,
      items: rfp.items,
      deliveryDays: rfp.deliveryDays,
      paymentTerms: rfp.paymentTerms,
      warrantyMonths: rfp.warrantyMonths,
    });
    
    const proposal = await prisma.proposal.upsert({
      where: { rfpId_vendorId: { rfpId, vendorId: vendor.id } },
      update: {
        rawEmail: emailContent,
        rawSubject: emailData.subject,
        parsedData: parsedProposal,
        totalPrice: parsedProposal.totalPrice,
        unitPrices: parsedProposal.unitPrices,
        deliveryDays: parsedProposal.deliveryDays,
        warranty: parsedProposal.warranty,
        paymentTerms: parsedProposal.paymentTerms,
        receivedAt: new Date(),
      },
      create: {
        rfpId,
        vendorId: vendor.id,
        rawEmail: emailContent,
        rawSubject: emailData.subject,
        parsedData: parsedProposal,
        totalPrice: parsedProposal.totalPrice,
        unitPrices: parsedProposal.unitPrices,
        deliveryDays: parsedProposal.deliveryDays,
        warranty: parsedProposal.warranty,
        paymentTerms: parsedProposal.paymentTerms,
      }
    });
    
    console.log('✅ Proposal saved:', proposal.id);
    // Emit socket.io event to all clients
    const io = req.app.get('io');
    io.emit('proposal-received', { proposalId: proposal.id, rfpId, vendorId: vendor.id });
    res.status(200).json({ message: 'Proposal received', proposalId: proposal.id });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).json({ message: 'Error processing email' });
  }
});

// POST /api/webhooks/simulate-response - For testing without real email
router.post('/simulate-response', async (req, res, next) => {
  try {
    const { rfpId, vendorId, emailContent } = req.body;
    
    if (!rfpId || !vendorId || !emailContent) {
      return res.status(400).json({ error: { message: 'rfpId, vendorId, and emailContent required' } });
    }
    
    const rfp = await prisma.rFP.findUnique({
      where: { id: rfpId },
      include: { items: true }
    });
    
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    
    if (!rfp || !vendor) {
      return res.status(404).json({ error: { message: 'RFP or Vendor not found' } });
    }
    
    const parsedProposal = await parseVendorEmail(emailContent, {
      title: rfp.title,
      budget: rfp.budget,
      items: rfp.items,
      deliveryDays: rfp.deliveryDays,
      paymentTerms: rfp.paymentTerms,
      warrantyMonths: rfp.warrantyMonths,
    });
    
    const proposal = await prisma.proposal.upsert({
      where: { rfpId_vendorId: { rfpId, vendorId } },
      update: {
        rawEmail: emailContent,
        rawSubject: `Re: RFP - ${rfp.title}`,
        parsedData: parsedProposal,
        totalPrice: parsedProposal.totalPrice,
        unitPrices: parsedProposal.unitPrices,
        deliveryDays: parsedProposal.deliveryDays,
        warranty: parsedProposal.warranty,
        paymentTerms: parsedProposal.paymentTerms,
        receivedAt: new Date(),
      },
      create: {
        rfpId,
        vendorId,
        rawEmail: emailContent,
        rawSubject: `Re: RFP - ${rfp.title}`,
        parsedData: parsedProposal,
        totalPrice: parsedProposal.totalPrice,
        unitPrices: parsedProposal.unitPrices,
        deliveryDays: parsedProposal.deliveryDays,
        warranty: parsedProposal.warranty,
        paymentTerms: parsedProposal.paymentTerms,
      },
      include: { vendor: true }
    });
    
    res.status(201).json({ message: 'Simulated response processed', proposal });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
