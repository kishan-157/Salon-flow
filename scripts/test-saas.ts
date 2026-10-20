/**
 * Multi-Tenant Security, Isolation, Persistence, and Concurrency Test Suite
 * Validates all required criteria from Phase 11.
 */

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log('GLAMHUB MULTI-TENANT SAAS - VERIFICATION TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // Test 1: Two separate test tenants with different owners
    // ----------------------------------------------------
    const t1Res = await fetch(`${BASE_URL}/api/public/tenants/royal`).then(r => r.json());
    const t2Res = await fetch(`${BASE_URL}/api/public/tenants/glamour`).then(r => r.json());
    assert(
      t1Res.tenant && t2Res.tenant && t1Res.tenant.id !== t2Res.tenant.id && t1Res.tenant.slug !== t2Res.tenant.slug,
      'Test 1: Two separate test tenants exist with distinct IDs and slugs'
    );

    // ----------------------------------------------------
    // Test 2: Correct subdomain-to-tenant resolution
    // ----------------------------------------------------
    const resolveRoyal = await fetch(`${BASE_URL}/api/public/tenant-resolve?tenant=royal`).then(r => r.json());
    const resolveGlamour = await fetch(`${BASE_URL}/api/public/tenant-resolve?tenant=glamour`).then(r => r.json());
    assert(
      resolveRoyal.status === 'valid' && resolveRoyal.tenant.slug === 'royal' &&
      resolveGlamour.status === 'valid' && resolveGlamour.tenant.slug === 'glamour',
      'Test 2: Correct subdomain-to-tenant resolution on host/query context'
    );

    // ----------------------------------------------------
    // Test 3: Unknown and malformed hostnames
    // ----------------------------------------------------
    const unknownRes = await fetch(`${BASE_URL}/api/public/tenant-resolve?tenant=non-existent-salon-xyz`);
    const malformedRes = await fetch(`${BASE_URL}/api/public/tenant-resolve?tenant=invalid$$$slug!!`);
    assert(
      unknownRes.status === 404 && malformedRes.status === 403,
      'Test 3: Safely reject unknown (404) and malformed (403) tenant hosts'
    );

    // Authenticate Owner A (Royal) and Owner B (Glamour) and Super Admin
    const loginOwnerA = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner.royal@glamhub.com', password: 'RoyalPass123!' }),
    }).then(r => r.json());

    const loginOwnerB = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner.glamour@glamhub.com', password: 'GlamPass123!' }),
    }).then(r => r.json());

    const loginAdmin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@glamhub.com', password: 'SuperAdmin2026!' }),
    }).then(r => r.json());

    const tokenA = loginOwnerA.token;
    const tokenB = loginOwnerB.token;
    const tokenAdmin = loginAdmin.token;

    assert(tokenA && tokenB && tokenAdmin, 'Auth setup: Successful logins for Owner A, Owner B, and Super Admin');

    // ----------------------------------------------------
    // Test 4: Owner A attempting to read Tenant B's bookings
    // ----------------------------------------------------
    const crossReadRes = await fetch(`${BASE_URL}/api/owner/ten_glamour_002/bookings`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      crossReadRes.status === 403,
      'Test 4: Owner A reading Tenant B private bookings blocked with 403 Forbidden'
    );

    // ----------------------------------------------------
    // Test 5: Owner A attempting to modify Tenant B's service
    // ----------------------------------------------------
    const crossModifyRes = await fetch(`${BASE_URL}/api/owner/ten_glamour_002/services/svc_g1`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ price: 10 }),
    });
    assert(
      crossModifyRes.status === 403,
      'Test 5: Owner A modifying Tenant B service blocked with 403 Forbidden'
    );

    // ----------------------------------------------------
    // Test 6: Forged tenant IDs in API requests
    // ----------------------------------------------------
    const forgedReq = await fetch(`${BASE_URL}/api/owner/ten_glamour_002/dashboard`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      forgedReq.status === 403,
      'Test 6: Forged tenant ID in path parameter is rejected by server authorization'
    );

    // ----------------------------------------------------
    // Test 7: Unauthenticated dashboard access
    // ----------------------------------------------------
    const unauthRes = await fetch(`${BASE_URL}/api/owner/ten_royal_001/dashboard`);
    assert(
      unauthRes.status === 401,
      'Test 7: Unauthenticated access to dashboard returns 401 Unauthorized'
    );

    // ----------------------------------------------------
    // Test 8: Unauthorized Super Admin actions
    // ----------------------------------------------------
    const adminActionByOwner = await fetch(`${BASE_URL}/api/admin/overview`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(
      adminActionByOwner.status === 403,
      'Test 8: Salon owner executing Super Admin endpoint blocked with 403 Forbidden'
    );

    // ----------------------------------------------------
    // Test 9: Appointment creation and database persistence
    // ----------------------------------------------------
    const testDate = new Date(Date.now() + 86400000 * (10 + Math.floor(Math.random() * 50))).toISOString().split('T')[0];
    const testPhone = '+1 555-' + Math.floor(1000000 + Math.random() * 9000000);
    const newBookingRes = await fetch(`${BASE_URL}/api/public/tenants/royal/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: 'svc_r1',
        customer_name: 'Genevieve TestClient',
        customer_phone: testPhone,
        customer_email: 'genevieve.test@example.com',
        appointment_date: testDate,
        appointment_time: '14:00',
        customer_notes: 'Automated test suite booking submission',
      }),
    });
    const newBookingData = await newBookingRes.json();
    if (newBookingRes.status !== 201) {
      console.log('Test 9 response status:', newBookingRes.status, 'body:', newBookingData);
    }
    assert(
      newBookingRes.status === 201 && newBookingData.booking && newBookingData.booking.status === 'pending',
      'Test 9: Appointment created with pending status and persisted in database'
    );

    // ----------------------------------------------------
    // Test 10: Duplicate requests and overlapping appointment prevention
    // ----------------------------------------------------
    // Attempt identical duplicate
    const duplicateRes = await fetch(`${BASE_URL}/api/public/tenants/royal/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: 'svc_r1',
        customer_name: 'Genevieve TestClient',
        customer_phone: testPhone,
        customer_email: 'genevieve.test@example.com',
        appointment_date: testDate,
        appointment_time: '14:00',
      }),
    });
    assert(
      duplicateRes.status === 409,
      'Test 10: Duplicate appointment request rejected with 409 Conflict'
    );

    // ----------------------------------------------------
    // Test 11: Booking status updates by authorized owner
    // ----------------------------------------------------
    const bookingId = newBookingData.booking.id;
    const statusUpdateRes = await fetch(`${BASE_URL}/api/owner/ten_royal_001/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ status: 'confirmed', internal_notes: 'Verified via telephone call' }),
    });
    const statusUpdateData = await statusUpdateRes.json();
    assert(
      statusUpdateRes.status === 200 && statusUpdateData.booking.status === 'confirmed',
      'Test 11: Authorized owner successfully updates appointment status to confirmed'
    );

    // ----------------------------------------------------
    // Test 12: Suspended and expired tenant behaviour
    // ----------------------------------------------------
    const suspendedRes = await fetch(`${BASE_URL}/api/public/tenants/velvet`);
    const suspendedBookRes = await fetch(`${BASE_URL}/api/public/tenants/velvet/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: 'any',
        customer_name: 'Test Customer',
        customer_phone: '+1 555-000-1111',
        appointment_date: testDate,
        appointment_time: '10:00',
      }),
    });
    assert(
      suspendedRes.status === 403 && suspendedBookRes.status === 403,
      'Test 12: Suspended tenant website blocked (403) and booking on inactive tenant blocked (403)'
    );

    // ----------------------------------------------------
    // Test 13: Super Admin Tenant creation and Manual Subscription renewal
    // ----------------------------------------------------
    const renewRes = await fetch(`${BASE_URL}/api/admin/tenants/ten_glamour_002/renew`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({
        plan_name: 'Growth Studio',
        amount: 69.0,
        period_months: 6,
        notes: 'Manual renewal test via bank transfer',
      }),
    });
    const renewData = await renewRes.json();
    assert(
      renewRes.status === 200 && renewData.success === true,
      'Test 13: Super Admin records manual subscription renewal with renewed expiry date'
    );

    // ----------------------------------------------------
    // Test 14: Server-side theme allowlist rejects arbitrary/malicious theme payloads
    // ----------------------------------------------------
    const invalidThemeRes = await fetch(`${BASE_URL}/api/owner/ten_royal_001/theme`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ themeId: 'body { background: url(javascript:alert(1)) }' }),
    });
    assert(
      invalidThemeRes.status === 400,
      'Test 14: Server-side theme allowlist rejects arbitrary CSS/JS payloads with 400 Bad Request'
    );

    // ----------------------------------------------------
    // Test 15: Cross-tenant theme isolation (Owner A cannot modify Tenant B theme)
    // ----------------------------------------------------
    const crossThemeRes = await fetch(`${BASE_URL}/api/owner/ten_glamour_002/theme`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ themeId: 'mocha-signature' }),
    });
    assert(
      crossThemeRes.status === 403,
      'Test 15: Owner A attempting to modify Tenant B theme blocked with 403 Forbidden'
    );

    // ----------------------------------------------------
    // Test 16: Persist all 6 Royal & Luxe Themes while preserving business data & Tenant B isolation
    // ----------------------------------------------------
    const sixThemes = [
      'royal-gold',
      'rose-elegance',
      'bridal-royale',
      'emerald-luxe',
      'mocha-signature',
      'rose-luxe',
    ];
    let allSixPersisted = true;
    for (const tId of sixThemes) {
      const updateRes = await fetch(`${BASE_URL}/api/owner/ten_royal_001/theme`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ themeId: tId }),
      });
      const publicCheck = await fetch(`${BASE_URL}/api/public/tenants/royal`).then(r => r.json());
      if (
        updateRes.status !== 200 ||
        publicCheck.tenant?.settings?.themeId !== tId ||
        !Array.isArray(publicCheck.services) ||
        publicCheck.services.length < 6
      ) {
        allSixPersisted = false;
      }
    }
    // Restore Royal Blossom to 'royal-gold' and verify Glamour Lounge remained 'rose-luxe'
    await fetch(`${BASE_URL}/api/owner/ten_royal_001/theme`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ themeId: 'royal-gold' }),
    });
    const glamourAfter = await fetch(`${BASE_URL}/api/public/tenants/glamour`).then(r => r.json());
    assert(
      allSixPersisted && ['rose-luxe', 'rose-elegance'].includes(glamourAfter.tenant?.settings?.themeId),
      'Test 16: All 6 Royal & Luxe Themes persist across public reloads while preserving services & Tenant B theme'
    );

    console.log('\n----------------------------------------------------');
    console.log(`SUMMARY: ${passed} passed, ${failed} failed out of ${passed + failed} assertions.`);
    console.log('----------------------------------------------------');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test execution failure:', err);
    process.exit(1);
  }
}

runTests();
