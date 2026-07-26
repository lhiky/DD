CREATE TABLE IF NOT EXISTS tenant_branding (
  tenant_id text PRIMARY KEY,
  organization_name text NOT NULL DEFAULT '',
  report_title text NOT NULL DEFAULT 'Software Supply Chain Evidence Report',
  primary_color text NOT NULL DEFAULT '#4f46e5',
  logo_data_url text,
  support_email text NOT NULL DEFAULT '',
  report_disclaimer text NOT NULL DEFAULT 'This report summarizes stored and user-declared evidence. It does not independently certify legal or regulatory compliance.',
  updated_by text NOT NULL,
  updated_at timestamp DEFAULT now()
);

ALTER TABLE tenant_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_branding FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_branding_tenant_isolation ON tenant_branding;
CREATE POLICY tenant_branding_tenant_isolation ON tenant_branding
  USING (tenant_id = current_setting('app.current_tenant', true))
  WITH CHECK (tenant_id = current_setting('app.current_tenant', true));

GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_branding TO spr_api;

ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_demo integer NOT NULL DEFAULT 0;
