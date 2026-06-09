# Enigma Launch Checklist - Phase 2 (Role + Plan Gating)

## Scope covered
- Role enforcement for Buyer / Manufacturer / Hybrid
- Plan-based feature gating on backend routes
- Frontend role-route protection for dashboard tabs
- Subscription persistence hook after Razorpay verification

## Role capability matrix

| Capability | Buyer | Manufacturer (Seller) | Hybrid |
|---|---|---|---|
| Create RFQ | Yes | No | Yes |
| View RFQ Pool | No | Yes | Yes |
| Request RFQ | No | Yes | Yes |
| Invite Manufacturers | Yes | No | Yes |
| Respond to Invitations | No | Yes | Yes |
| Manufacturer Discovery | Yes | No | Yes |
| RFQ Chat (participant only) | Yes | Yes | Yes |
| Accepted RFQs tab | No | Yes | Yes |
| Manufacturer tabs | No | Yes | Yes |
| Buyer tabs | Yes | No | Yes |

## Plan feature matrix (Manufacturer + Hybrid side)

| Feature | Free | Standard | Pro | Enterprise |
|---|---|---|---|---|
| RFQ pool view | Yes | Yes | Yes | Yes |
| RFQ response | Yes | Yes | Yes | Yes |
| Invitation response | Yes | Yes | Yes | Yes |
| Chat access | Yes | Yes | Yes | Yes |
| Capacity display | No | Yes | Yes | Yes |
| Video/slides visibility | No | No | Yes | Yes |
| Verified badge | No | No | Yes | Yes |
| Concierge deals | No | No | No | Yes |

Buyer plan is always `BUYER_FREE` and includes RFQ creation, manufacturer discovery, invitation sending, and chat participation.

## Route-level enforcement (implemented)
- `/api/rfqs`
  - Create RFQ: Buyer/Hybrid + `RFQ_CREATE`
  - Pool + Request RFQ: Manufacturer/Hybrid + plan features
  - Accept/Reject/Update/Delete RFQ: Buyer/Hybrid
- `/api/invitations`
  - List/respond invitations: Manufacturer/Hybrid
  - Create invitation: Buyer/Hybrid + `INVITATION_SEND`
- `/api/chat`
  - All chat endpoints require `CHAT_ACCESS`
- `/api/search`
  - RFQ search: Manufacturer/Hybrid + `RFQ_POOL_VIEW`
  - Manufacturer search: Buyer/Hybrid + `MFR_DISCOVERY`

## Frontend route guards (implemented)
- Manufacturer/Hybrid only:
  - `/rfqs-pool`, `/rfqs-pool/:id`, `/accepted-rfqs`, `/accepted-rfqs/:id`, `/invitations`, `/analytics`
- Buyer/Hybrid only:
  - `/start-rfq`, `/manufacturers-pool`, `/my-manufacturers`
- Unauthorized direct URL access redirects to `/dashboard`.

## Integration fixes (implemented)
- Mounted missing backend routes in `server.js` so tabs/APIs are reachable.
- Added user `subscription` schema and persisted updates in `/api/orders/verify-subscription`.
- Added effective plan info in auth responses.
- Fixed Hybrid `getMyRFQs` query to include both buyer and manufacturer side.
- Fixed invitation accept flow to avoid duplicate manufacturer requests.

## Verification evidence

### Automated checks (PASS)
- Frontend production build (`vite build`) passes.
- Changed files have no linter diagnostics.
- Backend modified modules load without syntax errors.
- Role/plan API matrix script passes:
  - `node scripts/qaRoleMatrix.js`
  - Result: `Total: 15, Passed: 15, Failed: 0`

### Manual browser E2E (PENDING)
- Full per-role click-through for every tab/page is not yet captured in this file.
- Recommended final pre-launch manual pass:
  1. Login as Buyer, verify all buyer tabs and blocked manufacturer tabs.
  2. Login as Manufacturer, verify all manufacturer tabs and blocked buyer tabs.
  3. Login as Hybrid, verify both tab groups.
  4. Validate RFQ -> request -> accept -> chat -> status update flow.
  5. Validate invitation create/respond flow.
  6. Validate pricing -> subscription verify -> plan feature unlock.

## Release gate
- **Backend policy gate:** PASS
- **Frontend role-route gate:** PASS
- **Plan persistence gate:** PASS
- **Full browser E2E run evidence:** PENDING (needs final manual QA cycle)
