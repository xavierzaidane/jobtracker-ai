import { describe, it } from 'node:test';
import assert from 'node:assert';

// ==============================================================================
// RLS & Multi-User Security Policy Simulation & Penetration Test Suite
// Validates strict account-level isolation matching platform/supabase_schema.sql
// ==============================================================================

class MockPostgresRlsEngine {
  constructor() {
    this.applications = [];
    this.application_updates = [];
    this.triage_inbox = [];
    this.notifications = [];
  }

  // Simulates an authenticated query with RLS evaluation: auth.uid() = user_id
  selectApplications(sessionUser) {
    if (!sessionUser) {
      // Anon user with no auth -> blocked by RLS
      return [];
    }
    if (sessionUser.role === 'service_role') {
      return this.applications;
    }
    return this.applications.filter((row) => row.user_id === sessionUser.id);
  }

  insertApplication(sessionUser, row) {
    if (!sessionUser) throw new Error('RLS Violation: Anonymous users cannot insert applications');
    const userId = sessionUser.role === 'service_role' ? (row.user_id || sessionUser.id) : sessionUser.id;
    if (sessionUser.role !== 'service_role' && row.user_id && row.user_id !== sessionUser.id) {
      throw new Error('RLS Violation: Cannot insert row for another user');
    }
    const newRow = { ...row, id: row.id || `app-${Date.now()}-${Math.random()}`, user_id: userId };
    this.applications.push(newRow);
    return newRow;
  }

  updateApplication(sessionUser, id, updates) {
    if (!sessionUser) throw new Error('RLS Violation: Anonymous update blocked');
    const index = this.applications.findIndex((row) => row.id === id);
    if (index === -1) return null;
    
    // RLS Policy Check: auth.uid() = user_id
    if (sessionUser.role !== 'service_role' && this.applications[index].user_id !== sessionUser.id) {
      // Postgres RLS returns 0 rows updated rather than throwing, preventing cross-tenant write
      return null;
    }

    this.applications[index] = { ...this.applications[index], ...updates, updated_at: new Date().toISOString() };
    return this.applications[index];
  }

  deleteApplication(sessionUser, id) {
    if (!sessionUser) throw new Error('RLS Violation: Anonymous delete blocked');
    const index = this.applications.findIndex((row) => row.id === id);
    if (index === -1) return false;

    if (sessionUser.role !== 'service_role' && this.applications[index].user_id !== sessionUser.id) {
      // Blocked by RLS
      return false;
    }

    this.applications.splice(index, 1);
    return true;
  }

  // Simulates RPC upsert_job_application with hardened user resolution
  upsertJobApplicationRpc(sessionUser, params) {
    let resolvedUserId;
    if (!sessionUser) {
      throw new Error('Unauthorized: user_id could not be resolved from active session or parameters.');
    }
    if (sessionUser.role === 'authenticated') {
      // Strictly enforced: client cannot spoof p_user_id
      resolvedUserId = sessionUser.id;
    } else if (sessionUser.role === 'service_role') {
      resolvedUserId = params.p_user_id || sessionUser.id;
    } else {
      resolvedUserId = sessionUser.id;
    }

    if (!resolvedUserId) {
      throw new Error('Unauthorized: user_id could not be resolved');
    }

    // Match strictly within user scope
    let existing = null;
    if (params.p_thread_id) {
      existing = this.applications.find(
        (a) => a.user_id === resolvedUserId && a.thread_id === params.p_thread_id
      );
    }
    if (!existing && params.p_company && params.p_role) {
      existing = this.applications.find(
        (a) =>
          a.user_id === resolvedUserId &&
          a.company.toLowerCase() === params.p_company.toLowerCase().trim() &&
          a.role.toLowerCase() === params.p_role.toLowerCase().trim()
      );
    }

    if (existing) {
      existing.status = params.p_status;
      existing.summary = params.p_summary;
      return { action: 'updated', application: existing };
    } else {
      const created = {
        id: `app-${Date.now()}`,
        user_id: resolvedUserId,
        thread_id: params.p_thread_id,
        company: params.p_company,
        role: params.p_role,
        status: params.p_status,
        summary: params.p_summary,
        applied_date: params.p_email_date || new Date().toISOString(),
        latest_update_date: params.p_email_date || new Date().toISOString(),
      };
      this.applications.push(created);
      return { action: 'inserted', application: created };
    }
  }

  // Triage Inbox queries with RLS
  selectTriageInbox(sessionUser) {
    if (!sessionUser) return [];
    if (sessionUser.role === 'service_role') return this.triage_inbox;
    return this.triage_inbox.filter((row) => row.user_id === sessionUser.id);
  }

  insertTriageInbox(sessionUser, row) {
    if (!sessionUser) throw new Error('RLS Violation: Anonymous triage insert blocked');
    const userId = sessionUser.role === 'service_role' ? (row.user_id || sessionUser.id) : sessionUser.id;
    const item = { ...row, id: row.id || `trg-${Date.now()}`, user_id: userId, is_approved: false };
    this.triage_inbox.push(item);
    return item;
  }
}

describe('CareerOps Row Level Security (RLS) & Multi-User Isolation (3.1)', () => {
  const userA = { id: 'usr_alice_111', email: 'alice@example.com', role: 'authenticated' };
  const userB = { id: 'usr_bob_222', email: 'bob@example.com', role: 'authenticated' };
  const serviceWorker = { id: 'srv_n8n_000', role: 'service_role' };

  it('blocks unauthenticated/anonymous clients from accessing application data', () => {
    const db = new MockPostgresRlsEngine();
    db.insertApplication(userA, { company: 'Stripe', role: 'Staff Engineer', status: 'offer' });

    const anonRows = db.selectApplications(null);
    assert.strictEqual(anonRows.length, 0, 'Anonymous users should see 0 rows under RLS');
  });

  it('strictly isolates application reads so User B cannot see User A data', () => {
    const db = new MockPostgresRlsEngine();
    db.insertApplication(userA, { company: 'Stripe', role: 'Staff Engineer', status: 'offer' });
    db.insertApplication(userA, { company: 'Linear', role: 'Product Engineer', status: 'interview' });
    db.insertApplication(userB, { company: 'Google', role: 'Senior Engineer', status: 'applied' });

    const aliceApps = db.selectApplications(userA);
    const bobApps = db.selectApplications(userB);

    assert.strictEqual(aliceApps.length, 2, 'Alice should see exactly her 2 applications');
    assert.strictEqual(bobApps.length, 1, 'Bob should see exactly his 1 application');
    assert.ok(aliceApps.every((a) => a.user_id === userA.id), 'All of Alice apps must match Alice user_id');
    assert.ok(bobApps.every((b) => b.user_id === userB.id), 'All of Bob apps must match Bob user_id');
  });

  it('prevents cross-account data tampering (User B cannot UPDATE User A application)', () => {
    const db = new MockPostgresRlsEngine();
    const aliceApp = db.insertApplication(userA, { company: 'Vercel', role: 'Frontend Engineer', status: 'applied' });

    // Bob attempts to maliciously update Alice's application status to 'rejected'
    const updateResult = db.updateApplication(userB, aliceApp.id, { status: 'rejected' });
    assert.strictEqual(updateResult, null, 'Cross-user update must be rejected by RLS');

    // Verify Alice's application remains unchanged
    const aliceApps = db.selectApplications(userA);
    assert.strictEqual(aliceApps[0].status, 'applied', 'Alice application status must remain untouched');
  });

  it('prevents cross-account deletion (User B cannot DELETE User A application)', () => {
    const db = new MockPostgresRlsEngine();
    const aliceApp = db.insertApplication(userA, { company: 'Figma', role: 'Designer', status: 'interview' });

    // Bob attempts to delete Alice's application
    const deleteResult = db.deleteApplication(userB, aliceApp.id);
    assert.strictEqual(deleteResult, false, 'Cross-user delete must be blocked');

    // Verify Alice's application is still in database
    const aliceApps = db.selectApplications(userA);
    assert.strictEqual(aliceApps.length, 1, 'Alice application must still exist');
  });

  it('hardens upsert_job_application RPC against user spoofing', () => {
    const db = new MockPostgresRlsEngine();
    const aliceApp = db.insertApplication(userA, {
      thread_id: 'thread_stripe_123',
      company: 'Stripe',
      role: 'Staff Engineer',
      status: 'applied',
    });

    // Bob calls RPC attempting to overwrite Alice's thread_id with spoofed p_user_id
    const rpcResult = db.upsertJobApplicationRpc(userB, {
      p_thread_id: 'thread_stripe_123',
      p_company: 'Stripe',
      p_role: 'Staff Engineer',
      p_status: 'rejected',
      p_user_id: userA.id, // Malicious spoof attempt
    });

    // RPC must strictly bind to Bob's authenticated session, creating a new record for Bob rather than touching Alice
    assert.strictEqual(rpcResult.application.user_id, userB.id, 'RPC must bind strictly to calling auth.uid()');
    
    // Alice's application must still be intact with original status
    const aliceApps = db.selectApplications(userA);
    assert.strictEqual(aliceApps[0].status, 'applied', 'Alice application must not be modified by Bob RPC call');
  });

  it('allows service_role backend worker to manage and scope data accurately', () => {
    const db = new MockPostgresRlsEngine();
    
    // n8n worker ingestion on behalf of User A
    const rpcResult = db.upsertJobApplicationRpc(serviceWorker, {
      p_thread_id: 'thread_n8n_999',
      p_company: 'OpenAI',
      p_role: 'Research Engineer',
      p_status: 'interview',
      p_summary: 'Interview invite via n8n automation',
      p_user_id: userA.id,
    });

    assert.strictEqual(rpcResult.application.user_id, userA.id, 'Service worker can write on behalf of designated user');

    const aliceApps = db.selectApplications(userA);
    assert.strictEqual(aliceApps.length, 1);
    assert.strictEqual(aliceApps[0].company, 'OpenAI');
  });

  it('strictly isolates the dedicated triage_inbox table per user', () => {
    const db = new MockPostgresRlsEngine();
    db.insertTriageInbox(userA, { sender: 'recruiter@airbnb.com', subject: 'Interview Availability', detected_status: 'interview' });
    db.insertTriageInbox(userB, { sender: 'hr@netflix.com', subject: 'Application Status', detected_status: 'unparsed' });

    const aliceInbox = db.selectTriageInbox(userA);
    const bobInbox = db.selectTriageInbox(userB);

    assert.strictEqual(aliceInbox.length, 1);
    assert.strictEqual(aliceInbox[0].sender, 'recruiter@airbnb.com');
    assert.strictEqual(bobInbox.length, 1);
    assert.strictEqual(bobInbox[0].detected_status, 'unparsed');
  });
});
