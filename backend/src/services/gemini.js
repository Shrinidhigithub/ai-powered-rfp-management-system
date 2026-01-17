const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Use mock mode when API quota is exhausted
const USE_MOCK = process.env.USE_MOCK_AI === 'true';

/**
 * Mock response for natural language parsing
 */
function mockParseNaturalLanguageToRFP(userInput) {
  const lowerInput = userInput.toLowerCase();
  
  const budgetMatch = userInput.match(/\$?([\d,]+)/);
  const budget = budgetMatch ? parseInt(budgetMatch[1].replace(/,/g, '')) : 50000;
  
  const laptopQtyMatch = userInput.match(/(\d+)\s*laptops?/i);
  const monitorQtyMatch = userInput.match(/(\d+)\s*monitors?/i);
  
  const items = [];
  
  if (lowerInput.includes('laptop')) {
    items.push({
      name: 'Business Laptop',
      description: 'High-performance laptop for office use',
      quantity: laptopQtyMatch ? parseInt(laptopQtyMatch[1]) : 20,
      specifications: { RAM: '16GB', Storage: '512GB SSD', Processor: 'Intel Core i7' }
    });
  }
  
  if (lowerInput.includes('monitor')) {
    items.push({
      name: '27-inch Monitor',
      description: 'Professional display monitor',
      quantity: monitorQtyMatch ? parseInt(monitorQtyMatch[1]) : 15,
      specifications: { Size: '27 inch', Resolution: '4K UHD', Panel: 'IPS' }
    });
  }
  
  if (items.length === 0) {
    items.push({
      name: 'Office Equipment',
      description: 'General office equipment as specified',
      quantity: 10,
      specifications: { type: 'Standard' }
    });
  }
  
  return {
    title: 'Office IT Equipment Procurement',
    description: 'Procurement of office equipment for new office setup.',
    budget: budget,
    currency: 'USD',
    deliveryDays: 30,
    paymentTerms: 'Net 30',
    warrantyMonths: 12,
    items: items
  };
}

function mockParseVendorEmail(emailContent, rfpContext) {
  const basePrice = rfpContext.budget ? rfpContext.budget * 0.85 : 42500;
  return {
    totalPrice: basePrice,
    unitPrices: rfpContext.items?.map(item => ({
      itemName: item.name,
      unitPrice: item.name.toLowerCase().includes('laptop') ? 1200 : 350,
      quantity: item.quantity,
      totalPrice: item.name.toLowerCase().includes('laptop') ? item.quantity * 1200 : item.quantity * 350
    })) || [],
    deliveryDays: 25,
    warranty: '12 months comprehensive warranty',
    paymentTerms: 'Net 30',
    additionalNotes: 'Free shipping included.',
    isComplete: true
  };
}

function mockCompareProposals(rfp, proposals) {
  const evaluations = proposals.map((p, index) => ({
    vendorId: p.vendorId,
    vendorName: p.vendor?.name || `Vendor ${index + 1}`,
    score: 85 - (index * 5),
    strengths: ['Competitive pricing', 'Good warranty', 'Fast delivery'],
    weaknesses: [index === 0 ? 'Slightly higher price' : 'Limited support'],
    summary: `${p.vendor?.name || 'Vendor'} offers a solid proposal at $${(p.totalPrice || 0).toLocaleString()}.`
  }));
  
  return {
    evaluations,
    recommendation: {
      recommendedVendorId: evaluations[0].vendorId,
      recommendedVendorName: evaluations[0].vendorName,
      reasoning: `${evaluations[0].vendorName} offers the best combination of price, delivery, and warranty.`,
      comparisonMatrix: {
        headers: ['Factor', ...evaluations.map(e => e.vendorName)],
        rows: [
          ['Price', ...proposals.map(p => `$${(p.totalPrice || 0).toLocaleString()}`)],
          ['Delivery', ...proposals.map(p => `${p.deliveryDays || 30} days`)],
          ['Score', ...evaluations.map(e => `${e.score}/100`)]
        ]
      }
    }
  };
}

/**
 * Parse natural language input into structured RFP data
 */
async function parseNaturalLanguageToRFP(userInput) {
  if (USE_MOCK) {
    console.log('🔶 Using MOCK AI for parseNaturalLanguageToRFP');
    return mockParseNaturalLanguageToRFP(userInput);
  }

  const prompt = `You are an AI assistant that converts natural language procurement requests into structured RFP (Request for Proposal) data.

Extract the following information and return ONLY valid JSON (no markdown, no code blocks):
- title: A concise title for the RFP
- description: Brief description of what is being procured
- budget: Total budget as a number (null if not specified)
- currency: Currency code (default "USD")
- deliveryDays: Number of days for delivery (null if not specified)
- paymentTerms: Payment terms as string (e.g., "Net 30")
- warrantyMonths: Warranty period in months (null if not specified)
- items: Array of items, each with:
  - name: Item name
  - description: Item description
  - quantity: Number of units
  - specifications: Object with key-value pairs for specs

Be precise with numbers. If something is not mentioned, use null.

User request: ${userInput}

Return ONLY the JSON object, no other text:`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  // Clean up response - remove markdown code blocks if present
  const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  return JSON.parse(cleanedText);
}

/**
 * Parse vendor email response into structured proposal data
 */
async function parseVendorEmail(emailContent, rfpContext) {
  if (USE_MOCK) {
    console.log('🔶 Using MOCK AI for parseVendorEmail');
    return mockParseVendorEmail(emailContent, rfpContext);
  }

  const prompt = `You are an AI assistant that extracts structured proposal data from vendor email responses.

The original RFP requested:
${JSON.stringify(rfpContext, null, 2)}

Extract the following from the vendor's email and return ONLY valid JSON (no markdown, no code blocks):
- totalPrice: Total quoted price as a number (null if not clear)
- unitPrices: Array of {itemName, unitPrice, quantity, totalPrice} for each quoted item
- deliveryDays: Proposed delivery timeline in days (null if not specified)
- warranty: Warranty terms as string
- paymentTerms: Payment terms as string
- additionalNotes: Any other important terms or conditions
- isComplete: Boolean - does the response address all RFP requirements?

Be precise with numbers. Extract exactly what is stated.

Vendor email content:
${emailContent}

Return ONLY the JSON object, no other text:`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  return JSON.parse(cleanedText);
}

/**
 * Compare proposals and generate AI-assisted evaluation
 */
async function compareProposals(rfp, proposals) {
  if (USE_MOCK) {
    console.log('🔶 Using MOCK AI for compareProposals');
    return mockCompareProposals(rfp, proposals);
  }

  const context = {
    rfp: {
      title: rfp.title,
      budget: rfp.budget,
      deliveryDays: rfp.deliveryDays,
      items: rfp.items,
      paymentTerms: rfp.paymentTerms,
      warrantyMonths: rfp.warrantyMonths,
    },
    proposals: proposals.map(p => ({
      vendorId: p.vendorId,
      vendorName: p.vendor.name,
      totalPrice: p.totalPrice,
      deliveryDays: p.deliveryDays,
      warranty: p.warranty,
      paymentTerms: p.paymentTerms,
      unitPrices: p.unitPrices,
      parsedData: p.parsedData,
    }))
  };

  const prompt = `You are an AI assistant that helps evaluate and compare vendor proposals for an RFP.

Analyze each proposal and provide:
1. A score from 0-100 for each proposal based on:
   - Price competitiveness (40%)
   - Meeting RFP requirements (30%)
   - Delivery timeline (15%)
   - Warranty and terms (15%)

2. For each proposal, identify strengths, weaknesses, and a summary.

3. Provide an overall recommendation.

RFP and Proposals data:
${JSON.stringify(context, null, 2)}

Return ONLY valid JSON (no markdown, no code blocks) in this format:
{
  "evaluations": [
    {
      "vendorId": "...",
      "vendorName": "...",
      "score": 85,
      "strengths": ["..."],
      "weaknesses": ["..."],
      "summary": "..."
    }
  ],
  "recommendation": {
    "recommendedVendorId": "...",
    "recommendedVendorName": "...",
    "reasoning": "...",
    "comparisonMatrix": {
      "headers": ["Factor", "Vendor1", "Vendor2"],
      "rows": [["Price", "$X", "$Y"]]
    }
  }
}

Return ONLY the JSON object, no other text:`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  return JSON.parse(cleanedText);
}

module.exports = {
  parseNaturalLanguageToRFP,
  parseVendorEmail,
  compareProposals,
};
