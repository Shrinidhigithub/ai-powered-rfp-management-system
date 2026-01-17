const express = require('express');
const prisma = require('../lib/prisma');
const { compareProposals } = require('../services/groq');

const router = express.Router();

// GET /api/proposals
router.get('/', async (req, res, next) => {
  try {
    const { rfpId } = req.query;
    const where = rfpId ? { rfpId } : {};
    
    const proposals = await prisma.proposal.findMany({
      where,
      orderBy: { receivedAt: 'desc' },
      include: { vendor: true, rfp: true }
    });
    res.json(proposals);
  } catch (error) {
    next(error);
  }
});

// GET /api/proposals/:id
router.get('/:id', async (req, res, next) => {
  try {
    const proposal = await prisma.proposal.findUnique({
      where: { id: req.params.id },
      include: { vendor: true, rfp: { include: { items: true } } }
    });
    if (!proposal) {
      return res.status(404).json({ error: { message: 'Proposal not found' } });
    }
    res.json(proposal);
  } catch (error) {
    next(error);
  }
});

// GET /api/proposals/compare/:rfpId - Compare proposals for an RFP
router.get('/compare/:rfpId', async (req, res, next) => {
  try {
    const rfp = await prisma.rFP.findUnique({
      where: { id: req.params.rfpId },
      include: { items: true }
    });
    
    if (!rfp) {
      return res.status(404).json({ error: { message: 'RFP not found' } });
    }
    
    const proposals = await prisma.proposal.findMany({
      where: { rfpId: req.params.rfpId },
      include: { vendor: true }
    });
    
    if (proposals.length === 0) {
      return res.status(400).json({ error: { message: 'No proposals to compare' } });
    }
    
    if (proposals.length === 1) {
      return res.json({
        rfp,
        proposals,
        comparison: {
          evaluations: [{
            vendorId: proposals[0].vendorId,
            vendorName: proposals[0].vendor.name,
            score: proposals[0].aiScore || 75,
            strengths: ['Only proposal received'],
            weaknesses: ['No competition for comparison'],
            summary: 'Single proposal received. Review terms before awarding.'
          }],
          recommendation: {
            recommendedVendorId: proposals[0].vendorId,
            recommendedVendorName: proposals[0].vendor.name,
            reasoning: 'Only one proposal received.',
            comparisonMatrix: null
          }
        }
      });
    }
    
    const comparison = await compareProposals(rfp, proposals);
    
    for (const evaluation of comparison.evaluations) {
      await prisma.proposal.updateMany({
        where: { rfpId: req.params.rfpId, vendorId: evaluation.vendorId },
        data: {
          aiScore: evaluation.score,
          aiSummary: evaluation.summary,
          aiStrengths: evaluation.strengths,
          aiWeaknesses: evaluation.weaknesses
        }
      });
    }
    
    await prisma.rFP.update({
      where: { id: req.params.rfpId },
      data: { status: 'EVALUATING' }
    });
    
    res.json({ rfp, proposals, comparison });
  } catch (error) {
    next(error);
  }
});

// POST /api/proposals/:rfpId/award/:vendorId
router.post('/:rfpId/award/:vendorId', async (req, res, next) => {
  try {
    const { rfpId, vendorId } = req.params;
    
    const proposal = await prisma.proposal.findUnique({
      where: { rfpId_vendorId: { rfpId, vendorId } },
      include: { vendor: true }
    });
    
    if (!proposal) {
      return res.status(404).json({ error: { message: 'Proposal not found' } });
    }
    
    await prisma.rFP.update({
      where: { id: rfpId },
      data: { status: 'AWARDED' }
    });
    
    res.json({ message: `RFP awarded to ${proposal.vendor.name}`, proposal });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
