# Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants

1. **Default-Deny Catch-All**: All unspecified paths (`/{document=**}`) deny all reads and writes unconditionally.
2. **Master Gate Relational Sync**: Every subcollection document under `/tenants/{tenantId}/...` (`services`, `gallery`, `bookings`) MUST verify parent tenant existence and confirm `get(/databases/$(database)/documents/tenants/$(tenantId)).data.ownerId == request.auth.uid` (or `isAdmin()`), ensuring instant revocation if tenant ownership changes.
3. **Verified Identity**: All writes require `isSignedIn() && request.auth.token.email_verified == true`.
4. **Bootstrapped & DB Admin**: `isAdmin()` requires `isSignedIn() && request.auth.token.email_verified == true` and either `exists(/databases/$(database)/documents/admins/$(request.auth.uid))` or `request.auth.token.email == 'ladanikishan8@gmail.com'`.
5. **Strict Blueprint Validation (`isValid[Entity]`)**: Every `create` and `update` call invokes `isValid[Entity](incoming())` checking exact key sets (`hasAll` and `hasOnly`), exact primitive types, regex patterns, and bounded string lengths.
6. **PII Isolation**: Customer PII in `/tenants/{tenantId}/bookings/{bookingId}` (`customerName`, `customerPhone`, `customerEmail`) is strictly isolated; `get` and `list` are only permitted when `resource.data.ownerId == request.auth.uid || isAdmin()`.
7. **Terminal State Locking**: Once a booking's `existing().status` reaches `'completed'` or `'cancelled'`, further updates are rejected unless `isAdmin()`.
8. **Temporal & Immutable Field Integrity**: `createdAt == request.time` on create; `updatedAt == request.time` on update; `tenantId`, `ownerId`, and `createdAt` are immutable across updates.

---

## 2. The "Dirty Dozen" Payloads (Adversarial Test Vectors)

1. **Payload 1 (Identity Spoofing on Tenant Create)**:
   ```json
   {
     "tenantId": "ten_royal_001",
     "slug": "royal",
     "name": "Royal Parlour",
     "ownerId": "spoofed_other_user_uid",
     "status": "active",
     "planId": "pro",
     "themeId": "royal-gold",
     "tagline": "Luxury",
     "heroTitle": "Royal",
     "heroSubtitle": "Bridal",
     "heroImageUrl": "https://example.com/hero.jpg",
     "aboutImageUrl": "https://example.com/about.jpg",
     "logoUrl": "https://example.com/logo.jpg"
   }
   ```
2. **Payload 2 (Shadow Field Injection on Tenant Update)**:
   ```json
   {
     "name": "Royal Parlour Updated",
     "isSuperVerified": true
   }
   ```
3. **Payload 3 (Unverified Email Admin Spoof)**:
   Auth context `{ uid: "attacker_1", token: { email: "ladanikishan8@gmail.com", email_verified: false } }` attempting to write `/tenants/ten_royal_001`.
4. **Payload 4 (ID Poisoning / Oversized Path ID)**:
   Path `/tenants/ten_royal_001/services/invalid$id!with@symbols` with valid service body.
5. **Payload 5 (Orphaned Subcollection Write / Master Gate Bypass)**:
   Creating `/tenants/non_existent_tenant/services/srv_01` where parent `/tenants/non_existent_tenant` does not exist.
6. **Payload 6 (Cross-Tenant Service Hijack)**:
   Owner of `ten_glamour_002` attempting to create or update `/tenants/ten_royal_001/services/srv_01`.
7. **Payload 7 (Value Poisoning on Whitelisted Update Field)**:
   Updating `themeId` on `/tenants/ten_royal_001` to `"invalid-hacked-theme"` (violating enum allowlist in `isValidTenantDoc`).
8. **Payload 8 (Immortal Field Mutation)**:
   Updating `ownerId` or `createdAt` on `/tenants/ten_royal_001` during an update operation.
9. **Payload 9 (Client Timestamp Forgery)**:
   Creating `/tenants/ten_royal_001/gallery/gal_01` with a past/future forged `createdAt` instead of `request.time`.
10. **Payload 10 (PII Blanket Read / Cross-Tenant Booking Scrape)**:
    Authenticated non-owner user executing `get` or `list` on `/tenants/ten_royal_001/bookings`.
11. **Payload 11 (Terminal State Unlocking Attack)**:
    Owner attempting to update a booking in `/tenants/ten_royal_001/bookings/bk_01` whose current status is already `'completed'` or `'cancelled'`.
12. **Payload 12 (Self-Assigned Admin Privilege Escalation)**:
    Non-admin user attempting to create `/admins/attacker_uid` to grant themselves platform admin rights.
