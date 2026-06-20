const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const razorpay = require('../config/razorpay');
const mongoose = require('mongoose');
const crypto = require('crypto');
const emailService = require('../emailService/EmailService');
const { PLAN_TYPES } = require('../config/planFeatures');
const { activatePlan } = require('../utils/subscriptionUtils');

// @desc    Create Razorpay order
// @route   POST /api/orders/create-razorpay-order
const createRazorpayOrder = async (req, res) => {
  try {
    console.log('=== Creating Razorpay Order ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user._id);

    // Check if Razorpay is configured
    if (!razorpay) {
      console.error('Razorpay not configured - missing environment variables');
      return res.status(500).json({ 
        message: 'Payment gateway not configured. Please contact administrator.',
        type: 'RAZORPAY_NOT_CONFIGURED'
      });
    }

    const { amount } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      console.log('Invalid amount:', amount);
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // Ensure amount is in paise (integer)
    const amountInPaise = Math.round(amount);
    console.log('Amount in paise:', amountInPaise);

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay credentials missing');
      return res.status(500).json({ 
        message: 'Payment gateway credentials not configured',
        type: 'CONFIGURATION_ERROR'
      });
    }

    // Validate amount range (Razorpay minimum is 100 paise = ₹1)
    if (amountInPaise < 100) {
      console.error('Amount too small:', amountInPaise);
      return res.status(400).json({ 
        message: 'Minimum order amount is ₹1.00',
        type: 'AMOUNT_ERROR'
      });
    }

    // Validate amount range (Razorpay maximum is 15,00,000 paise = ₹15,000)
    if (amountInPaise > 50000000) { 
      console.error('Amount too large:', amountInPaise);
      return res.status(400).json({ 
        message: 'Maximum order amount is ₹15,000.00',
        type: 'AMOUNT_ERROR'
      });
    }

    const orderOptions = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
        notes: {
        userId: req.user._id.toString(),
        timestamp: new Date().toISOString(),
        app: 'Reeown'
      }
    };

    console.log('Creating Razorpay order with options:', orderOptions);

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create(orderOptions);
    
    console.log('Razorpay order created successfully:', razorpayOrder.id);

    res.status(200).json({
      success: true,
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
        status: razorpayOrder.status
      }
    });
  } catch (error) {
    console.error('=== Razorpay Order Creation Error ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    
    // More specific error handling
    if (error.statusCode) {
      console.error('Razorpay API Error:', error.statusCode, error.error);
      return res.status(error.statusCode).json({ 
        message: 'Payment gateway error. Please try again.', 
        error: error.error?.description || error.message,
        code: error.error?.code,
        type: 'RAZORPAY_API_ERROR'
      });
    }

    // Handle specific Razorpay errors
    if (error.message.includes('Invalid key')) {
      return res.status(500).json({
        message: 'Payment gateway configuration error. Please contact support.',
        error: 'Invalid Razorpay credentials',
        type: 'CONFIGURATION_ERROR'
      });
    }

    if (error.message.includes('amount')) {
      return res.status(400).json({
        message: 'Invalid payment amount. Please check your order total.',
        error: error.message,
        type: 'AMOUNT_ERROR'
      });
    }

    res.status(500).json({ 
      message: 'Payment processing failed. Please try again or contact support.', 
      error: error.message,
      type: 'UNKNOWN_ERROR'
    });
  }
};

// @desc    Verify payment and create order
// @route   POST /api/orders/verify-payment
const verifyPayment = async (req, res) => {
  try {
    console.log('=== Verifying Payment ===');
    console.log('Request body keys:', Object.keys(req.body));

    const {
      items,
      shippingAddress,
      total,
      paymentMethod,
      paymentDetails
    } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items are required' });
    }

    if (!shippingAddress) {
      return res.status(400).json({ message: 'Shipping address is required' });
    }

    if (!paymentDetails) {
      return res.status(400).json({ message: 'Payment details are required' });
    }

    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    } = paymentDetails;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Incomplete payment details' });
    }

    // Check if Razorpay is configured
    if (!razorpay) {
      console.error('Razorpay not configured during payment verification');
      return res.status(500).json({ 
        message: 'Payment gateway not configured. Please contact administrator.',
        error: 'RAZORPAY_NOT_CONFIGURED'
      });
    }
    // Verify Razorpay signature
    let expectedSignature;
    try {
      expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');
    } catch (signatureError) {
      console.error('Error generating signature:', signatureError);
      return res.status(500).json({ 
        message: 'Payment verification failed - signature generation error',
        error: 'SIGNATURE_GENERATION_ERROR'
      });
    }

    console.log('Expected signature:', expectedSignature);
    console.log('Received signature:', razorpay_signature);

    if (expectedSignature !== razorpay_signature) {
      console.error('Signature verification failed');
      console.error('Expected:', expectedSignature);
      console.error('Received:', razorpay_signature);
      return res.status(400).json({ message: 'Payment verification failed - Invalid signature' });
    }

    console.log('Signature verified successfully');

    // Additional verification: Fetch payment details from Razorpay
    try {
      const payment = await razorpay.payments.fetch(razorpay_payment_id);
      console.log('Payment status from Razorpay:', payment.status);
      
      if (payment.status !== 'captured' && payment.status !== 'authorized') {
        console.error('Payment not successful on Razorpay side:', payment.status);
        return res.status(400).json({ 
          message: 'Payment not completed successfully. Please try again.',
          error: 'PAYMENT_NOT_CAPTURED'
        });
      }

      // Verify amount matches
      const expectedAmount = Math.round(total * 100); // Convert to paise
      if (payment.amount !== expectedAmount) {
        console.error('Amount mismatch:', { expected: expectedAmount, received: payment.amount });
        return res.status(400).json({ 
          message: 'Payment amount mismatch. Please contact support.',
          error: 'AMOUNT_MISMATCH'
        });
      }
    } catch (paymentFetchError) {
      console.error('Error fetching payment from Razorpay:', paymentFetchError);
      // Continue with order creation as signature verification passed
      console.log('Continuing with order creation despite payment fetch error');
    }
    // Validate and calculate total
    let calculatedTotal = 0;
    const validatedItems = [];

    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.product)) {
        return res.status(400).json({ message: `Invalid product ID: ${item.product}` });
      }

      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.product}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }

      const price = product.discountPrice || product.price;
      calculatedTotal += price * item.quantity;

      validatedItems.push({
        product: item.product,
        quantity: item.quantity,
        price
      });
    }

   
     const shipping = 0;
     const tax = 0; 
    const finalTotal = calculatedTotal;   

    console.log('Total calculation:', {
      subtotal: calculatedTotal,
      shipping,
      tax,
      finalTotal,
      providedTotal: total
    });

    // Allow for small rounding differences (up to ₹2)
    if (Math.abs(finalTotal - total) > 2) {
      return res.status(400).json({ 
        message: 'Total amount mismatch',
        calculated: finalTotal,
        provided: total
      });
    }

    // Generate orderId manually as fallback
    const orderId = await Order.generateOrderId();
    console.log('Generated orderId:', orderId);

    // Create order with manual orderId
const order = new Order({
  orderId: orderId, 
  user: req.user._id,
  items: validatedItems,
  total: finalTotal,
  shippingAddress,
  paymentMethod,
  paymentStatus: 'completed',
  paymentId: razorpay_payment_id,
  orderStatus: 'processing',
  statusHistory: [{
    status: 'processing',
    timestamp: new Date(),
    updatedBy: req.user._id
  }]
});

    const createdOrder = await order.save();
    console.log('Order created with ID:', createdOrder.orderId);

    // Update product stock
    for (const item of validatedItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } }
      );
    }

    console.log('Product stock updated');

    // Populate order for response
    const populatedOrder = await Order.findById(createdOrder._id)
      .populate('user', 'name email')
      .populate('items.product', 'name image price');

    console.log('Order verification completed successfully');

    // Send emails
    try {
      console.log('=== Sending Order Emails ===');
      await emailService.sendOrderConfirmationEmail(populatedOrder, req.user);
      console.log('Order confirmation email sent to customer');
      await emailService.sendOrderNotificationToAdmin(populatedOrder, req.user);
      console.log('Order notification email sent to admin');
    } catch (emailError) {
      console.error('Error sending order emails:', emailError);
      // Don't fail the order creation if email fails
      console.log('Order created successfully despite email error');
    }

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error('=== Payment Verification Error ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    
    // Provide more specific error responses
    if (error.message.includes('signature')) {
      return res.status(400).json({ 
        message: 'Payment verification failed. Please try again or contact support.',
        error: 'SIGNATURE_VERIFICATION_FAILED'
      });
    }

    if (error.message.includes('stock')) {
      return res.status(400).json({ 
        message: 'Some items are out of stock. Please update your cart.',
        error: 'INSUFFICIENT_STOCK'
      });
    }

    res.status(500).json({ 
      message: 'Order processing failed. Please contact support if payment was deducted.', 
      error: error.message,
      type: 'ORDER_PROCESSING_ERROR'
    });
  }
};

// @desc    Verify subscription payment
// @route   POST /api/orders/verify-subscription
const verifySubscription = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planName, amount } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Incomplete payment details' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed - Invalid signature' });
    }

    const normalizedPlanName = String(planName || '').trim().toUpperCase();
    const planNameMap = {
      STANDARD: PLAN_TYPES.STANDARD,
      PRO: PLAN_TYPES.PRO,
      ENTERPRISE: PLAN_TYPES.ENTERPRISE
    };

    const planType = planNameMap[normalizedPlanName];
    if (!planType) {
      return res.status(400).json({ message: 'Invalid subscription plan' });
    }

    const updatedUser = await User.findById(req.user._id);
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    activatePlan(updatedUser, planType);
    updatedUser.subscription.amountPaid = Number(amount || 0) / 100;
    updatedUser.subscription.lastPaymentId = razorpay_payment_id;
    updatedUser.subscription.lastOrderId = razorpay_order_id;
    await updatedUser.save();

    res.status(200).json({
      success: true,
      message: 'Subscription successfully verified',
      data: {
        userType: updatedUser.userType,
        subscription: updatedUser.subscription
      }
    });
  } catch (error) {
    console.error('Subscription Verification Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createOrder = async (req, res) => {
  const { items, shippingAddress, paymentMethod } = req.body;

  try {
    console.log('=== Creating Order (Legacy) ===');
    
    let total = 0;
    const products = [];

    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.product)) {
        return res.status(400).json({ message: `Invalid product ID: ${item.product}` });
      }

      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.product}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }

      const price = product.discountPrice || product.price;
      total += price * item.quantity;

      products.push({
        product: item.product,
        quantity: item.quantity,
        price
      });
    }

    // Create Razorpay Order
    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: total * 100, // Razorpay uses paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`
      });
    } catch (err) {
      console.error('Razorpay order creation failed:', err);
      return res.status(500).json({ message: 'Razorpay order creation failed', error: err.message });
    }

    const order = new Order({
      user: req.user._id,
      items: products,
      total,
      shippingAddress,
      paymentMethod,
      paymentId: razorpayOrder.id
    });

    const createdOrder = await order.save();
    console.log('Order created with ID:', createdOrder.orderId);

    res.status(201).json({
      order: createdOrder,
      razorpayOrder
    });
  } catch (err) {
    console.error('Order creation failed:', err);
    res.status(500).json({ message: 'Order creation failed', error: err.message });
  }
};

// @desc    Get order by ID (now supports both orderId and _id)
// @route   GET /api/orders/:id
const getOrderById = async (req, res) => {
  try {
    console.log('=== Get Order By ID ===');
    console.log('Request params ID:', req.params.id);
    console.log('User ID:', req.user._id);

    let order;

    // First try by MongoDB ObjectId
    if (/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      console.log('Searching by MongoDB _id');
      order = await Order.findById(req.params.id)
        .populate('user', 'name email')
        .populate('items.product', 'name image price images')
        .populate('statusHistory.updatedBy', 'name email');
    }

    // If not found, try by orderId field
    if (!order) {
      console.log('Searching by orderId field');
      order = await Order.findOne({ orderId: req.params.id })
        .populate('user', 'name email')
        .populate('items.product', 'name image price images')
        .populate('statusHistory.updatedBy', 'name email');
    }

    if (!order) {
      console.log('Order not found');
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log('Order found:', order.orderId);
    console.log('Order user:', order.user?._id);
    console.log('Requesting user:', req.user._id);

    // Security: Verify the order belongs to the user (unless admin)
    if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      console.log('Unauthorized access attempt');
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name image');
    
    res.json(orders);
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
const updateOrderToPaid = async (req, res) => {
  try {
    let order;
    if (/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      order = await Order.findById(req.params.id);
    }
    if (!order) {
      order = await Order.findOne({ orderId: req.params.id });
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Verify payment with Razorpay
    const payment = await razorpay.payments.fetch(req.body.paymentId);
    
    if (payment.status === 'captured' && 
        payment.order_id === order.paymentId && 
        payment.amount === order.total * 100) {
      
      // Update product stock
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        product.stock -= item.quantity;
        await product.save();
      }
      
      order.paymentStatus = 'completed';
      order.paymentId = req.body.paymentId;
      const updatedOrder = await order.save();
      
      res.json(updatedOrder);
    } else {
      res.status(400).json({ message: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Update order to paid error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
const getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // --- Build the query object dynamically ---
    const query = {};

    // Handle status filtering
    if (req.query.status && req.query.status !== 'all') {
      query.orderStatus = req.query.status;
    }

    // Handle search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');

      const matchingUsers = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
      }).select('_id');
      const userIds = matchingUsers.map(user => user._id);

      query.$or = [
        { orderId: searchRegex },
        { 'shippingAddress.fullName': searchRegex },
        { user: { $in: userIds } }, 
      ];
    }
    // --- End of query building ---

    const [orders, totalOrders] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email')
        .populate('items.product', 'name image') 
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query)
    ]);

    res.json({
      orders,
      totalOrders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id
const updateOrderStatus = async (req, res) => {
  try {
    console.log('=== Updating Order Status ===');
    console.log('Order ID:', req.params.id);
    console.log('Request body:', req.body);
    console.log('Admin user:', req.user._id);

    let order;
    if (/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      order = await Order.findById(req.params.id);
    }
    if (!order) {
      order = await Order.findOne({ orderId: req.params.id });
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Store the old status for comparison and email notification
    const oldStatus = order.orderStatus;
    const newStatus = req.body.status;
    
    console.log('Status change:', oldStatus, '->', newStatus);
    
    // Update order fields
    order.lastUpdatedBy = req.user._id;
    order.orderStatus = newStatus;
    order.lastStatusUpdate = new Date();
    
    // Add admin notes if provided
    if (req.body.adminNotes) {
      order.adminNotes = req.body.adminNotes;
    }
    
    // Add to status history with notification tracking
    order.statusHistory.push({
      status: newStatus,
      timestamp: new Date(),
      updatedBy: req.user._id,
      notificationSent: false,
      customerNotified: false,
      notes: req.body.adminNotes || ''
    });
    
    const updatedOrder = await order.save();
    console.log('Order saved successfully');
    
    // Populate the order for response and email
    const populatedOrder = await Order.findById(updatedOrder._id)
      .populate('statusHistory.updatedBy', 'name email')
      .populate('user', 'name email')
      .populate('items.product', 'name image price');
    
    console.log('Order populated successfully');
    
    // Send email notification to customer if status actually changed
    let notificationSent = false;
    let notificationError = null;
    
    if (oldStatus !== newStatus && populatedOrder.user) {
      try {
        console.log('Sending status update email to customer:', populatedOrder.user.email);
        await emailService.sendOrderStatusUpdateEmail(
          populatedOrder, 
          populatedOrder.user, 
          newStatus, 
          oldStatus
        );
        notificationSent = true;
        console.log('Status update email sent successfully');
        
        // Update the latest status history entry to mark notification as sent
        const latestStatusEntry = populatedOrder.statusHistory[populatedOrder.statusHistory.length - 1];
        latestStatusEntry.notificationSent = true;
        latestStatusEntry.customerNotified = true;
        
        // Add to status notifications log
        populatedOrder.statusNotifications.push({
          status: newStatus,
          sentAt: new Date(),
          method: 'email',
          success: true
        });
        
        await populatedOrder.save();
        console.log('Notification status updated in database');
        
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
        notificationError = emailError.message;
        
        // Update the latest status history entry to mark notification as failed
        const latestStatusEntry = populatedOrder.statusHistory[populatedOrder.statusHistory.length - 1];
        latestStatusEntry.notificationSent = false;
        latestStatusEntry.customerNotified = false;
        
        // Add to status notifications log
        populatedOrder.statusNotifications.push({
          status: newStatus,
          sentAt: new Date(),
          method: 'email',
          success: false,
          errorMessage: emailError.message
        });
        
        await populatedOrder.save();
      }
    }
    
    // Re-populate after notification updates
    const finalOrder = await Order.findById(updatedOrder._id)
      .populate('statusHistory.updatedBy', 'name email')
      .populate('user', 'name email')
      .populate('items.product', 'name image price');
    
    console.log('=== Order Status Update Complete ===');
    
    res.json({
      order: finalOrder,
      notificationSent,
      notificationError,
      message: notificationSent 
        ? `Order status updated to ${newStatus}. Customer has been notified via email.`
        : notificationError 
          ? `Order status updated to ${newStatus}. Email notification failed: ${notificationError}`
          : `Order status updated to ${newStatus}.`
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyPayment,
  createOrder,
  getOrderById,
  getMyOrders,
  updateOrderToPaid,
  getOrders,
  updateOrderStatus,
  verifySubscription
};