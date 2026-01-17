const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { parseNaturalLanguageToRFP } = require('../services/groq');
const { sendRFPEmail, getEmailMode } = require('../services/email');

const router = express.Router();

const createRFPSchema = z.object({
  rawInput: z.string().min(10, 'Please provide more details'),
});

const sendRFPSchema = z.object({
  vendorIds: z.array(z.string()).min(1, 'Select at least one vendor'),
});

// GET /api/rfps
router.get('/', async (req, res, next) => {
  try {
    const rfps = await prisma.rFP.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        _count: { select: { proposals: true, rfpVendors: true } }
      }
    });
    res.json(rfps);
  } catch (error) {
    next(error);
  }
});

// GET /api/rfps/:id
router.get('/:id', async (req, res, next) => {
  try {
    const rfp = await prisma.rFP.findUnique({
      where: { id: req.params.id },
      include: {
        items: true,
        rfpVendors: { include: { vendor: true } },
        proposals: { include: { vendor: true } }
      }
    });
    if (!rfp) {
      return res.status(404).json({ error: { message: 'RFP not found' } });
    }
    res.json(rfp);
  } catch (error) {
    next(error);
  }
});

// POST /api/rfps - Create RFP from natural language
router.post('/', async (req, res, next) => {
  try {
    const { rawInput } = createRFPSchema.parse(req.body);
    
    // Use AI to parse natural language
    const parsed = await parseNaturalLanguageToRFP(rawInput);
    
    const rfp = await prisma.rFP.create({
      data: {
        title: parsed.title,
        rawInput: rawInput,
        description: parsed.description,
        budget: parsed.budget,
        currency: parsed.currency || 'USD',
        deliveryDays: parsed.deliveryDays,
        paymentTerms: parsed.paymentTerms,
        warrantyMonths: parsed.warrantyMonths,
        status: 'DRAFT',
        items: {
          create: (parsed.items || []).map(item => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity || 1,
            specifications: item.specifications || {},
          }))
        }
      },
      include: { items: true }
    });
    
    res.status(201).json(rfp);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: { message: 'Validation error', details: error.errors } });
    }
    next(error);
  }
});

// POST /api/rfps/:id/send - Send RFP to vendors
router.post('/:id/send', async (req, res, next) => {
  try {
    const { vendorIds } = sendRFPSchema.parse(req.body);
    
    const rfp = await prisma.rFP.findUnique({
      where: { id: req.params.id },
      include: { items: true }
    });
    
    if (!rfp) {
      return res.status(404).json({ error: { message: 'RFP not found' } });
    }
    
    const vendors = await prisma.vendor.findMany({
      where: { id: { in: vendorIds } }
    });
    
    const results = [];
    const emailPreviewUrls = [];
    
    for (const vendor of vendors) {
      try {
        const emailResult = await sendRFPEmail(vendor, rfp);
        
        if (emailResult.previewUrl) {
          emailPreviewUrls.push({
            vendor: vendor.name,
            previewUrl: emailResult.previewUrl
          });
        }
        
        await prisma.rFPVendor.upsert({
          where: { rfpId_vendorId: { rfpId: rfp.id, vendorId: vendor.id } },
          update: { sentAt: new Date(), status: 'SENT' },
          create: { rfpId: rfp.id, vendorId: vendor.id, sentAt: new Date(), status: 'SENT' }
        });
        
        results.push({ vendorId: vendor.id, vendorName: vendor.name, status: 'sent', previewUrl: emailResult.previewUrl });
      } catch (emailError) {
        await prisma.rFPVendor.upsert({
          where: { rfpId_vendorId: { rfpId: rfp.id, vendorId: vendor.id } },
          update: { status: 'FAILED' },
          create: { rfpId: rfp.id, vendorId: vendor.id, status: 'FAILED' }
        });
        results.push({ vendorId: vendor.id, vendorName: vendor.name, status: 'failed', error: emailError.message });
      }
    }
    
    await prisma.rFP.update({
      where: { id: rfp.id },
      data: { status: 'SENT' }
    });

    const mode = getEmailMode();
    
    res.json({ 
      message: 'RFP sent to vendors', 
      results,
      emailMode: mode,
      emailPreviewUrls: emailPreviewUrls.length > 0 ? emailPreviewUrls : undefined,
      info: mode === 'gmail' 
        ? 'Emails delivered to real inboxes!' 
        : 'View sent emails at https://ethereal.email/login'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: { message: 'Validation error', details: error.errors } });
    }
    next(error);
  }
});

// DELETE /api/rfps/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.rFP.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: { message: 'RFP not found' } });
    }
    next(error);
  }
});

module.exports = router;
