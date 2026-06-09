import React, { useState , useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, MapPin, User, Phone, Mail, ShoppingBag, ArrowLeft, CircleAlert as AlertCircle, Loader as Loader2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { orderAPI } from '../api/orderAPI';
import { initiateRazorpayPayment } from '../lib/razorpay';
import Button from '../components/ui/Button';
import { countries } from '../data/countries';

const CheckoutPage = () => {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phoneNumber || '',
    address: user?.address || '',
    city: user?.city || '', 
    state: user?.state || '',
    pincode: user?.zipCode || '',
    country: user?.country || 'India',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [showProcessingOverlay, setShowProcessingOverlay] = useState(false);
  const [errors, setErrors] = useState({});
  const [paymentError, setPaymentError] = useState('');

  const subtotal = cart.subtotal || 0;
  const total = subtotal; 

  useEffect(() => {
    if (user) {
      setShippingAddress((prev) => ({
        ...prev,
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phoneNumber || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.zipCode || '',
        country: user.country || 'India',
      }));
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!shippingAddress.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!shippingAddress.email.trim()) newErrors.email = 'Email is required';
    if (!shippingAddress.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!shippingAddress.address.trim()) newErrors.address = 'Address is required';
    if (!shippingAddress.city.trim()) newErrors.city = 'City is required';
    if (!shippingAddress.state.trim()) newErrors.state = 'State is required';
    if (!shippingAddress.pincode.trim()) newErrors.pincode = 'Pincode is required';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (shippingAddress.email && !emailRegex.test(shippingAddress.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    const phoneRegex = /^\d{7,15}$/;
    if (shippingAddress.phone && !phoneRegex.test(shippingAddress.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    const pincodeRegex = /^[1-9][0-9]{5}$/;
    if (shippingAddress.pincode && !pincodeRegex.test(shippingAddress.pincode)) {
      newErrors.pincode = 'Please enter a valid 6-digit pincode';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    setPaymentError('');

    try {
      // Validate cart and total
      if (!cart.items || cart.items.length === 0) {
        throw new Error('Your cart is empty. Please add items before checkout.');
      }

      if (total <= 0) {
        throw new Error('Invalid order total. Please refresh and try again.');
      }

      // Prepare order data
      const orderData = {
        items: cart.items.map(item => ({
          product: item.product.id || item.product._id,
          quantity: item.quantity,
          price: item.product.discountPrice || item.product.price
        })),
        shippingAddress,
        total,
        paymentMethod: 'razorpay'
      };

      console.log('Initiating payment for total:', total);
      console.log('User details:', {
        name: shippingAddress.fullName,
        email: shippingAddress.email,
        contact: shippingAddress.phone
      });
      // Initiate Razorpay payment
      await initiateRazorpayPayment(
        total,
        {
          name: shippingAddress.fullName,
          email: shippingAddress.email,
          contact: shippingAddress.phone,
        },
        async (paymentResponse) => {
          try {
            // Show processing overlay after Razorpay modal closes
            setShowProcessingOverlay(true);
            
            console.log('Payment successful, verifying...', paymentResponse);

            // Verify payment and create order
            const verificationData = {
              ...orderData,
              paymentDetails: {
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_signature: paymentResponse.razorpay_signature
              }
            };

            const order = await orderAPI.verifyPayment(verificationData, user.token);

            console.log('Order created successfully:', order.orderId);

            clearCart();
            
            navigate('/order-success', {
              state: {
                orderId: order.orderId, 
                paymentId: paymentResponse.razorpay_payment_id,
                order: order
              },
            });
          } catch (error) {
            console.error('Order verification failed:', error);
            setPaymentError(`Payment successful but order verification failed: ${error.message}. Please contact support with payment ID: ${paymentResponse.razorpay_payment_id}`);
            setShowProcessingOverlay(false);
            setIsProcessing(false);
          }
        },
        (error) => {
          console.error('Payment failed:', error);
          // Provide more specific error messages
          let errorMessage = 'Payment failed. Please try again.';
          
          if (error.includes('cancelled')) {
            errorMessage = 'Payment was cancelled. You can try again when ready.';
          } else if (error.includes('network')) {
            errorMessage = 'Network error. Please check your internet connection and try again.';
          } else if (error.includes('timeout')) {
            errorMessage = 'Payment timed out. Please try again.';
          } else if (error.includes('insufficient')) {
            errorMessage = 'Insufficient funds. Please check your account balance.';
          } else if (error.includes('declined')) {
            errorMessage = 'Payment declined by bank. Please try a different payment method.';
          } else if (error.includes('configuration')) {
            errorMessage = 'Payment gateway not configured. Please contact support.';
          }
          
          setPaymentError(errorMessage);
          setIsProcessing(false);
        }
      );
    } catch (error) {
      console.error('Payment initiation failed:', error);
      setPaymentError(`Failed to initiate payment: ${error.message}`);
      setIsProcessing(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen pt-20 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8 mt-12 text-center">
            <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-8">Add some products to your cart before checkout.</p>
            <Button 
              variant="primary"
              onClick={() => navigate('/products')}
              leftIcon={<ShoppingBag className="h-5 w-5" />}
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen pt-20 pb-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="py-8">
            <button
              onClick={() => navigate('/cart')}
              className="flex items-center text-green-700 hover:text-[#335077] font-semibold mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Cart
            </button>
            <h1 className="text-3xl font-bold">Checkout</h1>
            {/* Shipping / Promotions banner */}
            <div className="mt-3 max-w-4xl">
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg p-3 text-sm">
                <strong>Free shipping:</strong> Free shipping on all certified refurbished devices across India.
                <span className="ml-3 text-gray-600">EMI available on products above ₹1,500.</span>
              </div>
            </div>
          </div>

          {paymentError && (
            <div className="mb-6 max-w-4xl mx-auto">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-red-800 font-medium">Payment Error</h3>
                  <p className="text-red-700 text-sm mt-1">{paymentError}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Shipping Information */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-center mb-6">
                  <MapPin className="h-6 w-6 text-green-700 mr-2" />
                  <h2 className="text-xl font-semibold">Shipping Address</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        name="fullName"
                        value={shippingAddress.fullName}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.fullName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your full name"
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <div className="relative">
                      <Mail className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        name="email"
                        value={shippingAddress.email}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your email"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        name="phone"
                        value={shippingAddress.phone}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="10-digit mobile number"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={shippingAddress.pincode}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.pincode ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="6-digit pincode"
                    />
                    {errors.pincode && (
                      <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={shippingAddress.address}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="House no, Building, Street, Area"
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={shippingAddress.city}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.city ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter city"
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={shippingAddress.state}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.state ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter state"
                    />
                    {errors.state && (
                      <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country *
                    </label>
                    <select
                      name="country"
                      value={shippingAddress.country}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {countries.map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6">
                  {cart.items.map((item) => (
                    <div key={item.product.id || item.product._id} className="flex items-center space-x-3">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-16 h-16 object-contain rounded border"
                        onClick={() => navigate(`/product/${item.product.id || item.product._id}`)}
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-sm line-clamp-2">{item.product.name}</h3>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        {/* EMI eligibility */}
                        {((item.product.discountPrice || item.product.price) || 0) >= 1500 && (
                          <p className="text-xs text-amber-600 font-medium mt-1">EMI available</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ₹{(((item.product.discountPrice || item.product.price) || 0) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal (GST included)</span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">Free</span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={handlePayment}
                    disabled={isProcessing}
                    leftIcon={<CreditCard className="h-5 w-5" />}
                  >
                    {isProcessing ? 'Processing...' : 'Pay with Razorpay'}
                  </Button>
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    Secure payment powered by Razorpay
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Overlay */}
      {showProcessingOverlay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <div className="mb-6">
              <Loader2 className="h-12 w-12 text-green-600 mx-auto animate-spin" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Processing Your Order</h3>
            <p className="text-gray-600">Please wait while we process your payment and create your order...</p>
          </div>
        </div>
      )}
    </>
  );
};

export default CheckoutPage;