require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const RFQ = require('../models/RFQ');
const ManufacturerRequest = require('../models/ManufacturerRequest');
const Invitation = require('../models/Invitation');
const Chat = require('../models/Chat');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const buyer = await User.findOne({ email: 'buyer.e2e@example.com' });
  const seller = await User.findOne({ email: 'seller.e2e@example.com' });
  const hybrid = await User.findOne({ email: 'hybrid.e2e@example.com' });
  if (!buyer || !seller || !hybrid) {
    throw new Error('E2E users missing. Run user seed first.');
  }

  const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const openRfq = await RFQ.findOneAndUpdate(
    { title: 'E2E Open RFQ', buyerId: buyer._id },
    {
      title: 'E2E Open RFQ',
      description: 'Open RFQ for pool and requests',
      buyerId: buyer._id,
      status: 'OPEN_FOR_REQUESTS',
      country: 'India',
      region: 'Maharashtra',
      rfqDeadline: deadline,
      workpieces: [{
        mainFile: '/uploads/e2e-open.step',
        partType: 'Bracket',
        dimensions: { length: 10, width: 5, height: 3, diameter: 0 },
        technology: 'CNC',
        material: 'Aluminum',
        quantity: 25
      }]
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const selectedRfq = await RFQ.findOneAndUpdate(
    { title: 'E2E Selected RFQ', buyerId: buyer._id },
    {
      title: 'E2E Selected RFQ',
      description: 'Selected RFQ for accepted and chat',
      buyerId: buyer._id,
      status: 'SUPPLIER_SELECTED',
      country: 'India',
      region: 'Karnataka',
      rfqDeadline: deadline,
      workpieces: [{
        mainFile: '/uploads/e2e-selected.step',
        partType: 'Gear',
        dimensions: { length: 0, width: 0, height: 0, diameter: 8 },
        technology: 'CNC',
        material: 'Steel',
        quantity: 100
      }]
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const sellerRequest = await ManufacturerRequest.findOneAndUpdate(
    { rfqId: selectedRfq._id, manufacturerId: seller._id },
    {
      rfqId: selectedRfq._id,
      manufacturerId: seller._id,
      status: 'ACCEPTED',
      message: 'We can deliver quickly',
      proposedLeadTime: 15,
      technologyMatch: true,
      materialMatch: true,
      matchScore: 85,
      respondedAt: new Date()
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  selectedRfq.selectedManufacturerId = seller._id;
  selectedRfq.selectedManufacturerRequestId = sellerRequest._id;
  await selectedRfq.save();

  await Invitation.findOneAndUpdate(
    { rfqId: openRfq._id, manufacturerId: seller._id },
    {
      rfqId: openRfq._id,
      buyerId: buyer._id,
      manufacturerId: seller._id,
      message: 'Please review this RFQ',
      status: 'PENDING'
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Invitation.findOneAndUpdate(
    { rfqId: openRfq._id, manufacturerId: hybrid._id },
    {
      rfqId: openRfq._id,
      buyerId: buyer._id,
      manufacturerId: hybrid._id,
      message: 'Hybrid partner invitation',
      status: 'PENDING'
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Chat.findOneAndUpdate(
    { rfqId: selectedRfq._id, senderId: buyer._id, message: 'E2E seed message from buyer' },
    {
      rfqId: selectedRfq._id,
      senderId: buyer._id,
      message: 'E2E seed message from buyer',
      read: false
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log('ui-e2e-data-seeded');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
