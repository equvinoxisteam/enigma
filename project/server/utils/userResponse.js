const { getEffectivePlanType } = require('../config/planFeatures');

const calculateProfileCompleteness = (user) => {
  if (user.userType === 'MANUFACTURER' || user.userType === 'HYBRID') {
    let score = 0;
    if (Array.isArray(user.manufacturingTypes) && user.manufacturingTypes.length > 0) score += 20;
    const dims = user.maxDimensions;
    if (dims && typeof dims === 'object' && (dims.height > 0 || dims.width > 0 || dims.length > 0)) score += 20;
    if (Array.isArray(user.facilityPhotos) && user.facilityPhotos.length > 0) score += 15;
    if (Array.isArray(user.primaryMaterials) && user.primaryMaterials.length > 0) score += 15;
    if (Array.isArray(user.certifications) && user.certifications.length > 0) score += 15;
    if (user.gstNumber) score += 15;
    return score;
  }
  return 100;
};

const formatUserResponse = (user, token = null) => {
  const profileImage = user.companyLogo || user.profileImage || '';
  const payload = {
    _id: user._id,
    title: user.title || '',
    fullName: user.fullName || user.companyName || '',
    email: user.email,
    userType: user.userType,
    companyName: user.companyName || '',
    companyLogo: user.companyLogo || '',
    companyBanner: user.companyBanner || '',
    description: user.description || '',
    facilityPhotos: user.facilityPhotos || [],
    companyPresentationUrl: user.companyPresentationUrl || '',
    companyBrochurePdfUrl: user.companyBrochurePdfUrl || '',
    companyProfilePdfUrl: user.companyProfilePdfUrl || '',
    profileImage,
    website: user.website || '',
    phoneNumber: user.phoneNumber || '',
    address: user.address || '',
    city: user.city || '',
    state: user.state || '',
    zipCode: user.zipCode || '',
    country: user.country || 'India',
    gstNumber: user.gstNumber || '',
    isEmailVerified: user.isEmailVerified,
    status: user.status,
    manufacturerStatus: user.manufacturerStatus,
    profileCompleteness: calculateProfileCompleteness(user),
    manufacturingTypes: user.manufacturingTypes || [],
    certifications: user.certifications || [],
    yearsInBusiness: user.yearsInBusiness || 0,
    companySize: user.companySize || '',
    buyerSettings: user.buyerSettings || {},
    manufacturerSettings: user.manufacturerSettings || {},
    subscription: user.subscription || null,
    effectivePlanType: getEffectivePlanType(user),
    isAdmin: user.isAdmin || false
  };

  if (token) payload.token = token;
  return payload;
};

module.exports = { formatUserResponse, calculateProfileCompleteness };
