const mongoose = require('mongoose');

const rfqSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: [
      'DRAFT',
      'OPEN_FOR_REQUESTS',
      'REQUESTS_PENDING',
      'SUPPLIER_SELECTED',
      'IN_PRODUCTION',
      'SHIPPED',
      'DELIVERED',
      'CLOSED',
      'EXPIRED',
      'CANCELLED'
    ],
    default: 'DRAFT'
  },
  
  // Workpieces
  workpieces: [{
    mainFile: {
      type: String, // STL file URL
      required: true
    },
    extraFiles: [{
      type: String // Additional file URLs
    }],
    partType: {
      type: String, // e.g., Gear, Pipe, Bracket, etc.
      trim: true
    },
    dimensions: {
      length: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
      diameter: { type: Number, default: 0 }
    },
    technology: {
      type: String,
      enum: ['CNC', '3D_PRINTING', 'SHEET_METAL', 'DIE_CASTING', 'INJECTION_MOLDING', 'STAMPING', 'WELDING', 'ASSEMBLY', 'TURNING', 'MILLING', 'OTHER'],
      required: true
    },
    material: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  
  // Requirements
  preferredCurrency: {
    type: String,
    default: 'USD'
  },
  rfqDeadline: {
    type: Date,
    required: true
  },
  acceptanceDeadline: {
    type: Date
  },
  partTrackingId: {
    type: String
  },
  requestJustification: {
    type: String
  },
  targetDeliveryDate: {
    type: Date
  },
  shippingTerms: {
    type: String, // Incoterms
    default: 'FOB'
  },
  country: {
    type: String,
    required: true
  },
  region: {
    type: String
  },
  communicationLanguage: {
    type: String,
    default: 'English'
  },
  requiredCertificates: [{
    type: String,
    enum: ['ISO_9001', 'ISO_13485', 'AS9100', 'IATF_16949', 'ROHS', 'OTHER']
  }],
  notes: {
    type: String
  },
  isCorporateRFQ: {
    type: Boolean,
    default: false
  },

  // NDA
  ndaFile: {
    type: String // NDA file URL, only visible to selected manufacturer
  },
  
  // Selected Manufacturer
  selectedManufacturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  selectedManufacturerRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ManufacturerRequest'
  },
  
  // Production & Logistics
  productionStatus: {
    type: String,
    enum: ['NOT_STARTED', 'QUALITY_CHECK', 'READY_TO_SHIP', 'SHIPPED'],
    default: 'NOT_STARTED'
  },
  trackingInfo: {
    trackingId: String,
    carrier: String,
    shippingDate: Date
  },
  shippingDocs: [{
    type: { type: String }, // 'label', 'invoice', etc.
    url: String
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  closedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for search
rfqSchema.index({ buyerId: 1, status: 1 });
rfqSchema.index({ status: 1, createdAt: -1 });
rfqSchema.index({ 'workpieces.technology': 1 });
rfqSchema.index({ 'workpieces.material': 1 });
rfqSchema.index({ 'workpieces.partType': 1 });
rfqSchema.index({ country: 1, region: 1 });
rfqSchema.index({ title: 'text', description: 'text' }); // Text search index

module.exports = mongoose.model('RFQ', rfqSchema);

