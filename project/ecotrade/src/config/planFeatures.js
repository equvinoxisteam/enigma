export const PLAN_TYPES = {
  BUYER_FREE: 'BUYER_FREE',
  FREE: 'FREE',
  STANDARD: 'STANDARD',
  PRO: 'PRO',
  ENTERPRISE: 'ENTERPRISE'
};

export const FEATURE_KEYS = {
  RFQ_CREATE: 'RFQ_CREATE',
  RFQ_POOL_VIEW: 'RFQ_POOL_VIEW',
  RFQ_RESPOND: 'RFQ_RESPOND',
  INVITATION_SEND: 'INVITATION_SEND',
  INVITATION_RESPOND: 'INVITATION_RESPOND',
  CHAT_ACCESS: 'CHAT_ACCESS',
  MFR_DISCOVERY: 'MFR_DISCOVERY',
  CAPACITY_DISPLAY: 'CAPACITY_DISPLAY',
  VERIFIED_BADGE: 'VERIFIED_BADGE',
  DOCUMENTS_DISPLAY: 'DOCUMENTS_DISPLAY',
  CONCIERGE_DEALS: 'CONCIERGE_DEALS',
  AI_SEARCH: 'AI_SEARCH',
  AI_SEARCH_LIMITED: 'AI_SEARCH_LIMITED',
  RFQ_REQUEST: 'RFQ_REQUEST',
  TOP_PLACEMENT: 'TOP_PLACEMENT',
  CORPORATE_RFQS: 'CORPORATE_RFQS'
};

export const PLAN_RFQ_REQUEST_LIMITS = {
  [PLAN_TYPES.FREE]: 0,
  [PLAN_TYPES.STANDARD]: 20,
  [PLAN_TYPES.PRO]: 40,
  [PLAN_TYPES.ENTERPRISE]: null
};

export const PLAN_FEATURES = {
  [PLAN_TYPES.BUYER_FREE]: {
    [FEATURE_KEYS.RFQ_CREATE]: true,
    [FEATURE_KEYS.MFR_DISCOVERY]: true,
    [FEATURE_KEYS.INVITATION_SEND]: true,
    [FEATURE_KEYS.CHAT_ACCESS]: true,
    [FEATURE_KEYS.AI_SEARCH]: true
  },
  [PLAN_TYPES.FREE]: {
    [FEATURE_KEYS.RFQ_POOL_VIEW]: true,
    [FEATURE_KEYS.AI_SEARCH_LIMITED]: true,
    [FEATURE_KEYS.CHAT_ACCESS]: true,
    [FEATURE_KEYS.RFQ_RESPOND]: false,
    [FEATURE_KEYS.INVITATION_RESPOND]: true
  },
  [PLAN_TYPES.STANDARD]: {
    [FEATURE_KEYS.RFQ_POOL_VIEW]: true,
    [FEATURE_KEYS.AI_SEARCH]: true,
    [FEATURE_KEYS.CHAT_ACCESS]: true,
    [FEATURE_KEYS.RFQ_RESPOND]: true,
    [FEATURE_KEYS.RFQ_REQUEST]: true,
    [FEATURE_KEYS.INVITATION_RESPOND]: true,
    [FEATURE_KEYS.CAPACITY_DISPLAY]: true,
    [FEATURE_KEYS.DOCUMENTS_DISPLAY]: true
  },
  [PLAN_TYPES.PRO]: {
    [FEATURE_KEYS.RFQ_POOL_VIEW]: true,
    [FEATURE_KEYS.AI_SEARCH]: true,
    [FEATURE_KEYS.CHAT_ACCESS]: true,
    [FEATURE_KEYS.RFQ_RESPOND]: true,
    [FEATURE_KEYS.RFQ_REQUEST]: true,
    [FEATURE_KEYS.INVITATION_RESPOND]: true,
    [FEATURE_KEYS.CAPACITY_DISPLAY]: true,
    [FEATURE_KEYS.VERIFIED_BADGE]: true,
    [FEATURE_KEYS.DOCUMENTS_DISPLAY]: true
  },
  [PLAN_TYPES.ENTERPRISE]: {
    [FEATURE_KEYS.RFQ_POOL_VIEW]: true,
    [FEATURE_KEYS.AI_SEARCH]: true,
    [FEATURE_KEYS.CHAT_ACCESS]: true,
    [FEATURE_KEYS.RFQ_RESPOND]: true,
    [FEATURE_KEYS.RFQ_REQUEST]: true,
    [FEATURE_KEYS.INVITATION_RESPOND]: true,
    [FEATURE_KEYS.CAPACITY_DISPLAY]: true,
    [FEATURE_KEYS.VERIFIED_BADGE]: true,
    [FEATURE_KEYS.DOCUMENTS_DISPLAY]: true,
    [FEATURE_KEYS.CONCIERGE_DEALS]: true,
    [FEATURE_KEYS.TOP_PLACEMENT]: true,
    [FEATURE_KEYS.CORPORATE_RFQS]: true
  }
};

export const getEffectivePlanType = (user) => {
  if (!user) return PLAN_TYPES.FREE;
  if (user.userType === 'BUYER') return PLAN_TYPES.BUYER_FREE;
  const directPlan = user.planType || user.subscription?.planType;
  return directPlan || PLAN_TYPES.FREE;
};

export const getRfqRequestLimit = (user) => {
  if (!user || user.userType === 'BUYER') return null;
  const plan = getEffectivePlanType(user);
  if (plan === PLAN_TYPES.BUYER_FREE) return null;
  return PLAN_RFQ_REQUEST_LIMITS[plan] ?? 0;
};

export const hasFeature = (user, featureKey) => {
  if (!user) return false;

  if (user.userType !== 'BUYER' && user.subscription?.status === 'PAUSED') {
    const allowedWhenPaused = [FEATURE_KEYS.RFQ_POOL_VIEW, FEATURE_KEYS.CHAT_ACCESS];
    if (!allowedWhenPaused.includes(featureKey)) return false;
  }

  if (user.userType !== 'BUYER' && user.subscription?.status === 'DEACTIVATED') {
    return false;
  }

  const planType = getEffectivePlanType(user);
  const planHasFeature = Boolean(PLAN_FEATURES[planType]?.[featureKey]);

  if (user.userType === 'HYBRID') {
    const buyerHasFeature = Boolean(PLAN_FEATURES[PLAN_TYPES.BUYER_FREE]?.[featureKey]);
    return planHasFeature || buyerHasFeature;
  }

  return planHasFeature;
};

export const hasFullAISearch = (user) => hasFeature(user, FEATURE_KEYS.AI_SEARCH);

export const canUseAI = (user) =>
  hasFeature(user, FEATURE_KEYS.AI_SEARCH) || hasFeature(user, FEATURE_KEYS.AI_SEARCH_LIMITED);

export const formatRfqLimit = (limit) => {
  if (limit === null) return 'Unlimited';
  if (limit === 0) return 'View only';
  return `${limit} RFQs/year`;
};
