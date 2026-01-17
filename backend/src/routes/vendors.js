const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');

const router = express.Router();

const createVendorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// GET /api/vendors
router.get('/', async (req, res, next) => {
  try {
    const vendors = await prisma.vendor.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { proposals: true, rfpVendors: true } }
      }
    });
    res.json(vendors);
  } catch (error) {
    next(error);
  }
});

// GET /api/vendors/:id
router.get('/:id', async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: req.params.id },
      include: {
        proposals: { include: { rfp: true } },
        rfpVendors: { include: { rfp: true } }
      }
    });
    if (!vendor) {
      return res.status(404).json({ error: { message: 'Vendor not found' } });
    }
    res.json(vendor);
  } catch (error) {
    next(error);
  }
});

// POST /api/vendors
router.post('/', async (req, res, next) => {
  try {
    const data = createVendorSchema.parse(req.body);
    const existing = await prisma.vendor.findUnique({ where: { email: data.email } });
    if (existing) {
      return res.status(400).json({ error: { message: 'Vendor with this email already exists' } });
    }
    const vendor = await prisma.vendor.create({ data });
    res.status(201).json(vendor);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: { message: 'Validation error', details: error.errors } });
    }
    next(error);
  }
});

// PUT /api/vendors/:id
router.put('/:id', async (req, res, next) => {
  try {
    const data = createVendorSchema.partial().parse(req.body);
    const vendor = await prisma.vendor.update({
      where: { id: req.params.id },
      data,
    });
    res.json(vendor);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: { message: 'Vendor not found' } });
    }
    next(error);
  }
});

// DELETE /api/vendors/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.vendor.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: { message: 'Vendor not found' } });
    }
    next(error);
  }
});

module.exports = router;
