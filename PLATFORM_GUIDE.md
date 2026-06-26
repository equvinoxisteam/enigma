# Enigma — Platform Guide
**Manufacturing procurement · Live at [enigma.equvinoxis.com](https://enigma.equvinoxis.com)**

> Internal + onboarding document. **Do not commit real API keys or passwords to GitHub.**

---

## 1. Production health check (verified)

| Service | URL | Status |
|---------|-----|--------|
| Frontend | https://enigma.equvinoxis.com | ✅ HTTP 200 |
| Backend API | https://api.enigma.equvinoxis.com | ✅ Running |
| Health endpoint | `/api/health` | ✅ `status: OK`, `environment: production` |
| MongoDB | Atlas `…/enigma` | ✅ Connected (users load) |
| File storage | AWS S3 `indianet-equvinoxis/enigma/` | ✅ `storage: s3` |
| Admin bootstrap | `ADMIN_EMAIL` + `ADMIN_PASSWORD` | ✅ `adminConfigured: true` |
| Admin login | `/api/auth/login` | ✅ Returns `isAdmin: true` + JWT |
| Admin API | `/api/admin/stats` | ✅ Works with admin token |
| CORS | `enigma.equvinoxis.com` | ✅ `Access-Control-Allow-Origin` set |
| Email (Gmail OAuth) | Registration / verify / reset | ✅ Configured (test by registering a user) |
| Razorpay | Shop orders (legacy e‑commerce) | ✅ Keys in env; **plan upgrades use admin approval, not Razorpay** |

**You can onboard people today:** register → verify email → login → create RFQ (buyer) or browse pool (manufacturer).

---

## 2. What problem Enigma solves

### The pain
- Buyers (OEMs, startups, procurement teams) struggle to find **qualified manufacturers** for CNC, sheet metal, 3D printing, etc.
- RFQs are scattered across email, WhatsApp, and Excel — no audit trail, no NDA control, no match scoring.
- Manufacturers waste time on unqualified leads and cannot showcase capabilities to the right buyers.
- Traditional marketplaces are either **B2C parts catalogs** or **expensive enterprise ERP** — nothing built for **RFQ → bid → production** workflow.

### Enigma’s answer
- **One RFQ pool** with STL/CAD upload, technology & material filters, and AI-assisted matching.
- **Role-based access:** Buyers publish RFQs free; manufacturers bid based on subscription tier.
- **Trust layer:** certifications, verified badges (Pro+), NDA gating, in-platform chat & production status.
- **India-first pricing** in INR with admin-controlled upgrades (no payment friction during sales calls).

---

## 3. How it works — user journeys

### A. Buyer (free forever)
1. Go to **Role selection** → **Buyer**
2. Register → verify email (link sent via Gmail)
3. **Dashboard** → **Start RFQ** → upload STL + specs + NDA
4. RFQ goes to **OPEN_FOR_REQUESTS** in the pool
5. Manufacturers request/bid → buyer reviews profiles & match scores
6. **Accept supplier** → chat, production updates, shipping, rating

### B. Manufacturer (subscription-based)
1. Register as **Manufacturer** (capabilities, materials, certifications)
2. **Free plan:** browse RFQ pool **view-only** (no requests)
3. **Pricing** → request Standard / Pro / Enterprise upgrade
4. **Admin approves** → plan activates immediately
5. Send RFQ requests (limits: 20 / 40 / unlimited per year)
6. Win jobs → **Accepted RFQs** → production & logistics

### C. Hybrid (buyer + manufacturer)
- Buyer features: **always free** (unlimited RFQ publishing)
- Manufacturer features: same paid tiers as pure manufacturers
- One account for companies that both source and produce

### D. Admin
- Login at `/login` with `ADMIN_EMAIL` / `ADMIN_PASSWORD` (from Railway env)
- Auto-bootstraps admin user on first login (`isAdmin: true`, Enterprise plan)
- Open **`/admin`** → Overview, Upgrade Requests, Manage Users

---

## 4. Pricing & plans

| Plan | Price (INR/yr) | RFQ requests | Key features |
|------|----------------|--------------|--------------|
| **Buyer** | Free | N/A (publish unlimited RFQs) | Create RFQs, invite manufacturers, AI search, chat |
| **Free** | ₹0 | 0 (view only) | Anonymous profile, limited AI (2 results), pool browse |
| **Standard** | ₹3,42,000 | 20 / year | Full profile, capacity, docs, full AI, send requests |
| **Pro** | ₹5,22,000 | 40 / year | Verified badge, high search rank, STL AI search |
| **Enterprise** | ₹15,75,000 | Unlimited | #1 placement, corporate RFQs, concierge support |

### How upgrades work
1. User clicks **Request Upgrade** on `/pricing`
2. Request appears in **Admin → Upgrade Requests**
3. Admin approves → `activatePlan()` runs (1-year period, usage counter resets)
4. Downgrades: admin schedules with **24-hour grace period**

### Where users see their plan
- **Dashboard** — plan banner + RFQ usage (manufacturers)
- **Settings → Subscription** — plan, limits, upgrade link
- **RFQ Pool** — banner if view-only or limit reached

---

## 5. Comparison with alternatives

| Capability | Enigma | Thomasnet / IndiaMART | Xometry / Hubs | Email + Excel |
|------------|--------|------------------------|----------------|---------------|
| RFQ workflow end-to-end | ✅ | ❌ listings only | ✅ instant quote | ❌ manual |
| CAD/STL upload & preview | ✅ | ❌ | ✅ | ❌ |
| Manufacturer match scoring | ✅ | ❌ | ⚠️ automated only | ❌ |
| NDA / file gating by plan | ✅ | ❌ | ⚠️ limited | ❌ |
| India INR annual plans | ✅ | ⚠️ ads | ❌ USD | — |
| AI search (natural language) | ✅ | ❌ | ⚠️ | ❌ |
| Admin-approved B2B upgrades | ✅ | N/A | self-serve | N/A |
| Production status & chat | ✅ | ❌ | ⚠️ | ❌ |

**Positioning:** *“LinkedIn + RFQ workflow for Indian manufacturing — not a parts shop, not a $100k ERP.”*

---

## 6. Marketing plan (90-day outline)

### Phase 1 — Launch (Weeks 1–4)
- **ICP:** Tier-2/3 CNC & fabrication shops (Pune, Bangalore, Chennai, Ahmedabad) + OEM buyers in automotive & industrial
- **Message:** “Stop chasing RFQs on WhatsApp — get matched buyers with CAD files attached.”
- **Channels:** LinkedIn posts, WhatsApp manufacturer groups, Equvinoxis network
- **Offer:** First 10 Standard manufacturers — **extended trial** (admin upgrade) in exchange for case study
- **Content:** 2-min demo video: Register → Pool → Request RFQ

### Phase 2 — Proof (Weeks 5–8)
- Publish **3 success stories** (buyer posted RFQ → manufacturer won job)
- Google Ads: “CNC RFQ India”, “contract manufacturing RFQ”
- Webinar: “How to digitize supplier discovery” with live platform demo
- Email drip to registered free manufacturers: upgrade benefits

### Phase 3 — Scale (Weeks 9–12)
- **Enterprise** outreach to large buyers (multi-RFQ tenders)
- Partner with **industrial associations** (CII, FICCI local chapters)
- SEO: Help center + RFQ glossary pages
- Referral: buyer invites manufacturer → both get onboarding call

### KPIs to track
- Registrations (buyer vs manufacturer)
- RFQs published / week
- Manufacturer upgrade requests → approval rate
- RFQ requests sent / accepted / in production
- Time to first bid on new RFQ

---

## 7. Admin operations guide

### Access
| Item | Value |
|------|--------|
| URL | https://enigma.equvinoxis.com/admin |
| Login | https://enigma.equvinoxis.com/login |
| Credentials | Railway env: `ADMIN_EMAIL`, `ADMIN_PASSWORD` |

### Admin panel tabs

#### Overview
- Total users, manufacturers, buyers, hybrid accounts
- Pending upgrade requests count

#### Upgrade Requests
1. User submits from **Pricing** page
2. Review company name, message, GST note
3. **Approve** → select plan (Standard / Pro / Enterprise)
4. **Reject** → user stays on current plan

#### Manage Users
- Search/filter all non-admin users
- **Set plan** — immediate upgrade or scheduled downgrade (24h buffer)
- **Pause / Deactivate / Reactivate** subscription
- **Toggle verified badge** (Pro/Enterprise)
- **Change user type** (Buyer / Manufacturer / Hybrid)
- **Activate manufacturer** status

### Common admin tasks

| Task | Steps |
|------|--------|
| Onboard paid manufacturer | Users → find user → set plan Standard/Pro/Enterprise → Activate |
| Fix “can’t send RFQ requests” | Check plan is not FREE; check `subscription.status` is ACTIVE; check annual limit |
| Reset admin password | Update `ADMIN_PASSWORD` in Railway → redeploy → login once (auto-updates hash) |
| Corporate RFQ access | Enterprise plan only — upgrade user to Enterprise |
| User can’t login | Check email verified; use Forgot Password; check not DEACTIVATED |

### API endpoints (admin)
```
GET  /api/admin/stats
GET  /api/admin/users
GET  /api/admin/upgrade-requests?status=PENDING
PUT  /api/admin/upgrade-requests/:id/approve
PUT  /api/admin/upgrade-requests/:id/reject
PUT  /api/admin/users/:id/upgrade
PUT  /api/admin/users/:id/subscription
PUT  /api/admin/users/:id/status
```

---

## 8. Onboarding checklist (for your team)

### Before inviting users
- [ ] Railway backend + frontend deployed and on custom domains
- [ ] `MONGODB_URI` ends with `/enigma`
- [ ] `S3_FOLDER_PREFIX=enigma`
- [ ] `FRONTEND_URL`, `API_URL`, `CORS_ORIGINS` match live domains (no quotes in Railway)
- [ ] `VITE_BACKEND_URL` on frontend service → **redeploy after change**
- [ ] Test admin login → `/admin` loads
- [ ] Test registration → email received → verify → login

### Per new manufacturer
1. Send link: `https://enigma.equvinoxis.com/register?role=MANUFACTURER`
2. Ask them to complete profile (technologies, materials, certs)
3. If paid: collect GST/PO → admin approve plan on platform
4. Confirm they see RFQ pool and can **Submit Request** (not view-only)

### Per new buyer
1. Link: `https://enigma.equvinoxis.com/register?role=BUYER`
2. No payment needed
3. Walk through **Start RFQ** + STL upload

---

## 9. Environment variables (reference)

Set in **Railway → backend service**. Use values from your secure vault — **never commit to Git**.

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Atlas connection, database name `enigma` |
| `JWT_SECRET` / `JWT_EXPIRE` | Auth tokens |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Admin bootstrap login |
| `FRONTEND_URL` / `CLIENT_URL` | Email links, redirects |
| `API_URL` | File URLs, API base |
| `CORS_ORIGINS` | Comma-separated frontend origins |
| `AWS_*` / `S3_FOLDER_PREFIX` | Uploads (STL, PDF, images) |
| `GMAIL_*` | Transactional email |
| `RAZORPAY_*` | Legacy shop checkout only |
| `APP_NAME` / `SUPPORT_EMAIL` | Branding in emails |

**Frontend service (Railway):**
```
VITE_BACKEND_URL=https://api.enigma.equvinoxis.com
```

---

## 10. Security reminders

- Rotate AWS, Gmail, Razorpay, and JWT secrets if they were ever pasted in chat or docs.
- Keep `ADMIN_PASSWORD` strong; only share with operators.
- MongoDB Atlas: restrict IP access to Railway egress if possible.
- GitHub: never push `.env` or this guide with real secrets filled in.

---

## 11. Support contacts

- **Platform support:** info@equvinoxis.com  
- **GitHub (manufacturing):** https://github.com/equvinoxisteam/enigma  
- **GitHub (pharma):** https://github.com/equvinoxisteam/enigma_pharma  

---

*Last verified: June 2026 — API health, admin login, admin stats, CORS, frontend reachability.*
