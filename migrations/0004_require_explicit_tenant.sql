BEGIN;

-- Tenant-bearing writes must provide their tenant explicitly. An implicit
-- shared tenant is a cross-tenant failure mode, not a safe fallback.
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'users',
    'clients',
    'passports',
    'scans',
    'alerts',
    'integrations',
    'billing',
    'compliance_schedules',
    'scan_schedules',
    'audit_trail',
    'evidence_items',
    'scan_findings',
    'agent_jobs',
    'pilot_organizations',
    'pilot_contacts',
    'pilot_applications',
    'pilot_projects',
    'pilot_software_assets',
    'pilot_passport_reports',
    'pilot_feedback_items',
    'pilot_meetings',
    'pilot_feature_requests',
    'pilot_conversion_tracking',
    'repository_connections',
    'repository_scan_sources',
    'partner_profiles',
    'partner_applications',
    'referral_events',
    'commissions',
    'payout_requests',
    'webhook_events'
  ]
  LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN tenant_id DROP DEFAULT', table_name);
    END IF;
  END LOOP;
END
$$;

COMMIT;
