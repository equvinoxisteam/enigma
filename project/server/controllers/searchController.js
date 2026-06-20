const RFQ = require('../models/RFQ');
const User = require('../models/User');
const { hasFeature, FEATURE_KEYS } = require('../config/planFeatures');
const { sanitizePublicManufacturerProfile } = require('../utils/publicProfileUtils');

const PLAN_RANK_SWITCH = {
  $switch: {
    branches: [
      { case: { $eq: ['$subscription.planType', 'ENTERPRISE'] }, then: 100 },
      { case: { $eq: ['$subscription.planType', 'PRO'] }, then: 80 },
      { case: { $eq: ['$subscription.planType', 'STANDARD'] }, then: 60 },
      { case: { $eq: ['$subscription.planType', 'FREE'] }, then: 0 }
    ],
    default: 0
  }
};

// @desc    Search RFQs using MongoDB
// @route   GET /api/search/rfqs
// @access  Private
const searchRFQsController = async (req, res) => {
  try {
    const {
      keyword,
      partType,
      technologies,
      country,
      region,
      certifications,
      length,
      diameter,
      height,
      width,
      material,
      quantity,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = {
      status: { $in: ['OPEN_FOR_REQUESTS', 'REQUESTS_PENDING'] } // Only show open RFQs
    };

    // Text search on title and description
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }

    // Part type filter
    if (partType) {
      query['workpieces.partType'] = { $regex: partType, $options: 'i' };
    }

    // Technologies filter
    if (technologies) {
      const techArray = Array.isArray(technologies) ? technologies : [technologies];
      query['workpieces.technology'] = { $in: techArray };
    }

    // Country filter
    if (country) {
      query.country = { $regex: country, $options: 'i' };
    }

    // Region filter
    if (region) {
      query.region = { $regex: region, $options: 'i' };
    }

    // Certifications filter
    if (certifications) {
      const certArray = Array.isArray(certifications) ? certifications : [certifications];
      query.requiredCertificates = { $in: certArray };
    }

    // Dimension filters - use $elemMatch to ensure all conditions match on the same workpiece
    if (length || diameter || height || width) {
      const dimensionQuery = {};
      if (length) dimensionQuery['dimensions.length'] = { $lte: parseFloat(length) };
      if (diameter) dimensionQuery['dimensions.diameter'] = { $lte: parseFloat(diameter) };
      if (height) dimensionQuery['dimensions.height'] = { $lte: parseFloat(height) };
      if (width) dimensionQuery['dimensions.width'] = { $lte: parseFloat(width) };
      
      if (Object.keys(dimensionQuery).length > 0) {
        query['workpieces'] = { $elemMatch: dimensionQuery };
      }
    }

    // Material filter
    if (material) {
      query['workpieces.material'] = { $regex: material, $options: 'i' };
    }

    // Quantity filter
    if (quantity) {
      query['workpieces.quantity'] = { $gte: parseInt(quantity) };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const rfqs = await RFQ.find(query)
      .populate('buyerId', 'companyName country region industry')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await RFQ.countDocuments(query);

    res.json({
      success: true,
      data: rfqs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error in search RFQs controller:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error searching RFQs', 
      error: error.message 
    });
  }
};

// @desc    Search Manufacturers using MongoDB
// @route   GET /api/search/manufacturers
// @access  Private
const searchManufacturersController = async (req, res) => {
  try {
    const {
      keyword,
      partType,
      technologies,
      country,
      region,
      certifications,
      companySize,
      material,
      machinery,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = {
      userType: { $in: ['MANUFACTURER', 'HYBRID'] },
      manufacturerStatus: 'ACTIVE'
    };

    // Text search on company name and full name
    if (keyword) {
      query.$or = [
        { companyName: { $regex: keyword, $options: 'i' } },
        { fullName: { $regex: keyword, $options: 'i' } }
      ];
    }

    // Part type filter (in manufacturerSettings.partTypes)
    if (partType) {
      query['manufacturerSettings.partTypes'] = { $regex: partType, $options: 'i' };
    }

    // Technologies filter
    if (technologies) {
      const techArray = Array.isArray(technologies) ? technologies : [technologies];
      query['manufacturerSettings.technologies'] = { $in: techArray };
    }

    // Country filter
    if (country) {
      query.country = { $regex: country, $options: 'i' };
    }

    // Region filter
    if (region) {
      query.region = { $regex: region, $options: 'i' };
    }

    // Certifications filter
    if (certifications) {
      const certArray = Array.isArray(certifications) ? certifications : [certifications];
      query.certifications = { $in: certArray };
    }

    // Company size filter
    if (companySize) {
      query.companySize = { $regex: companySize, $options: 'i' };
    }

    // Material filter
    if (material) {
      query['manufacturerSettings.materials'] = { $regex: material, $options: 'i' };
    }

    // Machinery filter
    if (machinery) {
      query['manufacturerSettings.machinery'] = { $regex: machinery, $options: 'i' };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute aggregation for ranking and sorting
    const manufacturers = await User.aggregate([
      { $match: query },
      {
        $addFields: { planRank: PLAN_RANK_SWITCH }
      },
      { $sort: { planRank: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
      {
        $project: {
          password: 0,
          emailVerificationToken: 0,
          passwordResetToken: 0
        }
      }
    ]);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: manufacturers.map((m) => sanitizePublicManufacturerProfile(m)),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error in search Manufacturers controller:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error searching Manufacturers', 
      error: error.message 
    });
  }
};

// @desc    Get AI Recommendations for RFQs (based on manufacturer profile)
// @route   GET /api/search/recommendations
// @access  Private
const getRecommendationsController = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { userType, manufacturerSettings } = user;
    let query = {
      status: { $in: ['OPEN_FOR_REQUESTS', 'REQUESTS_PENDING'] }
    };

    // If manufacturer, recommend RFQs matching their skills
    if (userType === 'MANUFACTURER' || userType === 'HYBRID') {
      const { technologies, materials } = manufacturerSettings || {};
      
      const shouldMatch = [];
      if (technologies && technologies.length > 0) {
        shouldMatch.push({ 'workpieces.technology': { $in: technologies } });
      }
      if (materials && materials.length > 0) {
        shouldMatch.push({ 'workpieces.material': { $in: materials.map(m => new RegExp(m, 'i')) } });
      }

      if (shouldMatch.length > 0) {
        query.$or = shouldMatch;
      }
    }

    const isLimitedAI = !hasFeature(req.user, FEATURE_KEYS.AI_SEARCH)
      && hasFeature(req.user, FEATURE_KEYS.AI_SEARCH_LIMITED);
    const recLimit = isLimitedAI ? 2 : 6;

    if (!hasFeature(req.user, FEATURE_KEYS.CORPORATE_RFQS)) {
      query.isCorporateRFQ = { $ne: true };
    }

    const recommendations = await RFQ.find(query)
      .populate('buyerId', 'companyName country')
      .sort({ isCorporateRFQ: -1, createdAt: -1 })
      .limit(recLimit)
      .lean();

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error in recommendations controller:', error);
    res.status(500).json({ success: false, message: 'Error fetching recommendations' });
  }
};

// @desc    Universal AI Search across RFQs and Manufacturers
// @route   GET /api/search/ai
// @access  Private
const aiSearchController = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const isLimitedAI = !hasFeature(req.user, FEATURE_KEYS.AI_SEARCH)
      && hasFeature(req.user, FEATURE_KEYS.AI_SEARCH_LIMITED);
    const resultLimit = isLimitedAI ? 2 : 5;

    const normalizedQuery = query.toLowerCase();
    const techs = ['cnc', '3d printing', 'milling', 'turning', 'sheet metal', 'welding', 'assembly', 'injection molding'];
    const detectedTechs = techs.filter((t) => normalizedQuery.includes(t.toLowerCase()))
      .map((t) => t.toUpperCase().replace(' ', '_'));

    let rfqQuery = {
      status: { $in: ['OPEN_FOR_REQUESTS', 'REQUESTS_PENDING'] },
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    };
    if (detectedTechs.length > 0) {
      rfqQuery.$or.push({ 'workpieces.technology': { $in: detectedTechs } });
    }

    const rfqs = await RFQ.find(rfqQuery)
      .sort({ isCorporateRFQ: -1, createdAt: -1 })
      .limit(resultLimit)
      .lean();

    let mfrQuery = {
      userType: { $in: ['MANUFACTURER', 'HYBRID'] },
      manufacturerStatus: 'ACTIVE',
      $or: [
        { companyName: { $regex: query, $options: 'i' } },
        { 'manufacturerSettings.partTypes': { $regex: query, $options: 'i' } },
        { primaryMaterials: { $regex: query, $options: 'i' } }
      ]
    };
    if (detectedTechs.length > 0) {
      mfrQuery.$or.push({ 'manufacturerSettings.technologies': { $in: detectedTechs } });
      mfrQuery.$or.push({ manufacturingTypes: { $in: detectedTechs } });
    }

    const manufacturers = await User.aggregate([
      { $match: mfrQuery },
      { $addFields: { planRank: PLAN_RANK_SWITCH } },
      { $sort: { planRank: -1, createdAt: -1 } },
      { $limit: resultLimit },
      { $project: { password: 0 } }
    ]);

    res.json({
      success: true,
      data: {
        rfqs,
        manufacturers,
        isLimitedAI,
        suggestions: detectedTechs.length > 0
          ? `Showing results for ${detectedTechs.join(', ')} capabilities.`
          : isLimitedAI
            ? 'Limited AI matching on Free plan — upgrade for full results and STL model match.'
            : null
      }
    });
  } catch (error) {
    console.error('Error in AI search controller:', error);
    res.status(500).json({ success: false, message: 'AI search error' });
  }
};

module.exports = {
  searchRFQsController,
  searchManufacturersController,
  getRecommendationsController,
  aiSearchController
};
