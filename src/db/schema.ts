/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// 1. Users Table (for Auth with RBAC role and multi-tenant mapping)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth string UID
  email: text('email').notNull(),
  tenantId: text('tenant_id').notNull().default('tenant-default'), // Default tenant_id
  role: text('role').notNull().default('Admin'), // RBAC Roles: Owner, Admin, Technician, Viewer, Client
  companyName: text('company_name'),
  roleTitle: text('role_title'),
  numTechnicians: integer('num_technicians'),
  clientCount: integer('client_count'),
  primaryUseCase: text('primary_use_case'),
  onboarded: integer('onboarded').default(0), // 0 = false, 1 = true
  mfaEnabled: integer('mfa_enabled').default(0), // 0 = false, 1 = true
  mfaSecret: text('mfa_secret'),
  invitedBy: text('invited_by'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Clients Table (with tenant_id isolation)
export const clients = pgTable('clients', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().default('tenant-default'), // Tenant isolation key
  name: text('name').notNull(),
  domain: text('domain').notNull(),
  industry: text('industry').notNull(),
  trustScore: integer('trust_score').notNull().default(85),
  riskLevel: text('risk_level').notNull().default('Medium'),
  avatarColor: text('avatar_color').notNull().default('indigo'),
  subscriptionTier: text('subscription_tier').notNull().default('Standard'),
  joinedDate: text('joined_date').notNull(),
  teamCount: integer('team_count').notNull().default(1),
  passportCount: integer('passport_count').notNull().default(0),
  criticalRisksCount: integer('critical_risks_count').notNull().default(0),
  complianceProgress: integer('compliance_progress').notNull().default(0),
  softwareInventory: text('software_inventory').notNull().default('[]'), // JSON stringified array
  complianceStatus: text('compliance_status').notNull().default('[]'), // JSON stringified array
  teamMembers: text('team_members').notNull().default('[]'), // JSON stringified array
  activityTimeline: text('activity_timeline').notNull().default('[]'), // JSON stringified array
});

// 3. Passports Table (with tenant_id isolation)
export const passports = pgTable('passports', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().default('tenant-default'), // Tenant isolation key
  name: text('name').notNull(),
  version: text('version').notNull(),
  publisher: text('publisher').notNull(),
  category: text('category').notNull(),
  overallScore: integer('overall_score').notNull().default(80),
  securityScore: integer('security_score').notNull().default(80),
  complianceScore: integer('compliance_score').notNull().default(80),
  vendorReputationScore: integer('vendor_reputation_score').notNull().default(80),
  releaseDate: text('release_date').notNull(),
  fileHash: text('file_hash').notNull(),
  licenseType: text('license_type').notNull(),
  aiSummary: text('ai_summary').notNull().default(''),
  sbom: text('sbom').notNull().default('[]'), // JSON stringified component array
  evidence: text('evidence').notNull().default('[]'), // JSON stringified evidence array
  vulnerabilities: text('vulnerabilities').notNull().default('[]'), // JSON stringified vulnerability array
  timeline: text('timeline').notNull().default('[]'), // JSON stringified timeline events
});

// 4. Scans Table (with tenant_id isolation)
export const scans = pgTable('scans', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().default('tenant-default'),
  targetName: text('target_name').notNull(),
  scanType: text('scan_type').notNull(),
  triggeredBy: text('triggered_by').notNull(),
  status: text('status').notNull().default('Success'),
  durationMs: integer('duration_ms').notNull().default(120),
  findingsCount: integer('findings_count'),
  timestamp: text('timestamp').notNull(),
  clientName: text('client_name').notNull(),
});

// 5. Alerts Table (with tenant_id isolation)
export const alerts = pgTable('alerts', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().default('tenant-default'),
  title: text('title').notNull(),
  severity: text('severity').notNull(),
  category: text('category').notNull(),
  clientName: text('client_name').notNull(),
  description: text('description').notNull(),
  timestamp: text('timestamp').notNull(),
  status: text('status').notNull().default('Active'),
});

// 6. Integrations Table (with tenant_id isolation)
export const integrations = pgTable('integrations', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().default('tenant-default'),
  name: text('name').notNull(),
  category: text('category').notNull(),
  icon: text('icon').notNull(),
  connected: integer('connected').notNull().default(0), // 0=false, 1=true
  description: text('description').notNull(),
  apiKeyHint: text('api_key_hint').notNull().default(''),
  lastSyncDate: text('last_sync_date').notNull(),
});

// 7. Billing Table (with tenant_id isolation and Stripe tracking)
export const billing = pgTable('billing', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().default('tenant-default'),
  clientName: text('client_name').notNull(),
  activePassportsCount: integer('active_passports_count').notNull().default(0),
  pricePerPassport: integer('price_per_passport').notNull().default(45),
  extraFees: integer('extra_fees').notNull().default(0),
  billingCycle: text('billing_cycle').notNull().default('Monthly'),
  totalAmount: integer('total_amount').notNull().default(0),
  status: text('status').notNull().default('Pending'), // Paid, Pending, Overdue
  stripeSessionId: text('stripe_session_id'), // Associated Stripe checkout session ID
});

// 8. Compliance Schedules Table (with tenant_id isolation)
export const complianceSchedules = pgTable('compliance_schedules', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().default('tenant-default'),
  clientId: text('client_id').notNull(),
  frequency: text('frequency').notNull(), // Daily, Weekly, Monthly
  targetEmail: text('target_email').notNull(),
  lastAuditAt: text('last_audit_at'),
  nextAuditAt: text('next_audit_at'),
  status: text('status').notNull().default('Active'),
  createdAt: text('created_at').notNull(),
});

// 9. Pilot Organizations Table
export const pilotOrganizations = pgTable('pilot_organizations', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().default('tenant-default'),
  name: text('name').notNull(),
  industry: text('industry').notNull(),
  website: text('website'),
  size: text('size'), // e.g. 50-200 employees
  status: text('status').notNull().default('Prospect'), // Prospect, Applied, Under Review, Approved, Active Pilot, Completed, Converted, Declined
  engagementScore: integer('engagement_score').notNull().default(50),
  conversionProbability: integer('conversion_probability').notNull().default(50),
  createdAt: timestamp('created_at').defaultNow(),
});

// 10. Pilot Contacts Table
export const pilotContacts = pgTable('pilot_contacts', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().default('tenant-default'),
  orgId: text('org_id').notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  roleTitle: text('role_title'),
  phone: text('phone'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 11. Pilot Applications Table
export const pilotApplications = pgTable('pilot_applications', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().default('tenant-default'),
  orgId: text('org_id').notNull(),
  submittedAt: text('submitted_at').notNull(),
  mainChallenges: text('main_challenges').notNull(),
  currentTools: text('current_tools').notNull(),
  pilotType: text('pilot_type').notNull(), // MSP partner, Software company, Enterprise customer
  status: text('status').notNull().default('Applied'),
});

// 12. Pilot Projects Table
export const pilotProjects = pgTable('pilot_projects', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().default('tenant-default'),
  orgId: text('org_id').notNull(),
  name: text('name').notNull(),
  status: text('status').notNull().default('Planning'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 13. Pilot Software Assets Table
export const pilotSoftwareAssets = pgTable('pilot_software_assets', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().default('tenant-default'),
  orgId: text('org_id').notNull(),
  name: text('name').notNull(),
  vendor: text('vendor').notNull(),
  version: text('version').notNull(),
  dependenciesCount: integer('dependencies_count').notNull().default(0),
  riskLevel: text('risk_level').notNull().default('Low'),
  trustScore: integer('trust_score').notNull().default(100),
  createdAt: timestamp('created_at').defaultNow(),
});

// 14. Pilot Passport Reports Table
export const pilotPassportReports = pgTable('pilot_passport_reports', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().default('tenant-default'),
  orgId: text('org_id').notNull(),
  assetId: text('asset_id').notNull(),
  reportType: text('report_type').notNull(), // e.g. 'NIST Mapping', 'Risk Assessment'
  reportPath: text('report_path').notNull(),
  generatedAt: text('generated_at').notNull(),
});

// 15. Pilot Feedback Items Table
export const pilotFeedbackItems = pgTable('pilot_feedback_items', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().default('tenant-default'),
  orgId: text('org_id').notNull(),
  contactName: text('contact_name').notNull(),
  comment: text('comment').notNull(),
  rating: integer('rating').notNull().default(5),
  submittedAt: text('submitted_at').notNull(),
});

// 16. Pilot Meetings Table
export const pilotMeetings = pgTable('pilot_meetings', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().default('tenant-default'),
  orgId: text('org_id').notNull(),
  title: text('title').notNull(),
  scheduledAt: text('scheduled_at').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 17. Pilot Feature Requests Table
export const pilotFeatureRequests = pgTable('pilot_feature_requests', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().default('tenant-default'),
  orgId: text('org_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('Suggested'), // Suggested, Under Review, Planned, Completed
  createdAt: timestamp('created_at').defaultNow(),
});

// 18. Pilot Conversion Tracking Table
export const pilotConversionTracking = pgTable('pilot_conversion_tracking', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().default('tenant-default'),
  orgId: text('org_id').notNull(),
  convertedAt: text('converted_at'),
  dealValue: integer('deal_value').notNull().default(0),
  previousStatus: text('previous_status'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 19. Agent Jobs Table (AI Agent System Async Jobs)
export const agentJobs = pgTable('agent_jobs', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().default('tenant-default'),
  agentId: text('agent_id').notNull(), // e.g. 'identity-ai', 'security-ai'
  passportId: text('passport_id').notNull(),
  jobType: text('job_type').notNull(), // e.g. 'compliance_scan', 'vulnerability_remediation'
  status: text('status').notNull().default('Pending'), // Pending, Running, Completed, Failed
  progress: integer('progress').notNull().default(0),
  result: text('result'), // JSON stringified result or summary
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 20. Agent Logs Table
export const agentLogs = pgTable('agent_logs', {
  id: serial('id').primaryKey(),
  jobId: text('job_id').notNull(),
  agentId: text('agent_id').notNull(),
  message: text('message').notNull(),
  level: text('level').notNull().default('Info'), // Info, Warning, Error
  timestamp: timestamp('timestamp').defaultNow(),
});

// 21. Scan Schedules Table
export const scanSchedules = pgTable('scan_schedules', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().default('tenant-default'),
  assetId: text('asset_id').notNull(),
  assetHostName: text('asset_host_name').notNull(),
  assetType: text('asset_type').notNull(),
  clientName: text('client_name').notNull(),
  frequency: text('frequency').notNull(),
  scanType: text('scan_type').notNull(),
  status: text('status').notNull().default('Active'),
  lastRunAt: text('last_run_at'),
  nextRunAt: text('next_run_at').notNull(),
  createdAt: text('created_at').notNull(),
});

// 22. Evidence Items Table (Traceable pieces of cryptographic and audit proof)
export const evidenceItems = pgTable('evidence_items', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().default('tenant-default'),
  assetId: text('asset_id').notNull(), // Links to passports.id
  name: text('name').notNull(),
  type: text('type').notNull(), // Signature, Audit Report, Build Log, Security Scan, Attestation
  verified: integer('verified').notNull().default(0), // 0=false, 1=true
  signer: text('signer').notNull(),
  timestamp: text('timestamp').notNull(),
  hash: text('hash').notNull(),
  rawContent: text('raw_content').notNull().default(''), // Collected raw data payload
  engineId: text('engine_id').notNull(), // e.g. identity-ai, code-ai, dependency-ai
  verificationFailureReason: text('verification_failure_reason'),
});

// 23. Scan Findings Table (Granular findings detected during scanning)
export const scanFindings = pgTable('scan_findings', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().default('tenant-default'),
  assetId: text('asset_id').notNull(), // Links to passports.id
  jobId: text('job_id').notNull(), // Links to agent_jobs.id
  severity: text('severity').notNull(), // Critical, High, Medium, Low
  category: text('category').notNull(), // Vulnerability, Compliance Gap, Signature Failure, Policy Violation
  title: text('title').notNull(),
  description: text('description').notNull(),
  component: text('component'),
  fixedVersion: text('fixed_version'),
  status: text('status').notNull().default('Open'), // Open, Mitigated, Resolved, Snoozed
  detectedAt: text('detected_at').notNull(),
  engineId: text('engine_id').notNull(), // Module that discovered it
});

// 24. Cryptographic Tamper-Proof Audit Trail Table (Postgres-persisted Ledger blocks)
export const auditTrail = pgTable('audit_trail', {
  id: serial('id').primaryKey(),
  tenantId: text('tenant_id').notNull().default('tenant-default'),
  action: text('action').notNull(),
  timestamp: text('timestamp').notNull(),
  actor: text('actor').notNull(),
  payload: text('payload').notNull(),
  previousHash: text('previous_hash').notNull(),
  currentHash: text('current_hash').notNull(),
});

// Additional developer productivity tables from requested GraphQL schema
export const appUsers = pgTable('app_users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  githubUsername: text('github_username'),
  bio: text('bio'),
});

export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  ownerId: integer('owner_id').notNull().references(() => appUsers.id),
  githubUrl: text('github_url'),
  description: text('description'),
});

export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  status: text('status').notNull().default('Open'),
  projectId: text('project_id').notNull().references(() => projects.id),
  description: text('description'),
  dueDate: timestamp('due_date'),
});

export const snippets = pgTable('snippets', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  language: text('language').notNull(),
  content: text('content').notNull(),
  creatorId: integer('creator_id').notNull().references(() => appUsers.id),
  description: text('description'),
  tags: text('tags'),
});

export const workSessions = pgTable('work_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => appUsers.id),
  lastActiveAt: timestamp('last_active_at').notNull(),
  activeFilePath: text('active_file_path'),
  activeBranch: text('active_branch'),
});

export const appUserRelations = relations(appUsers, ({ many }) => ({
  projects: many(projects),
  snippets: many(snippets),
  workSessions: many(workSessions),
}));

export const projectRelations = relations(projects, ({ one, many }) => ({
  owner: one(appUsers, {
    fields: [projects.ownerId],
    references: [appUsers.id],
  }),
  tasks: many(tasks),
}));

export const taskRelations = relations(tasks, ({ one }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
}));

export const snippetRelations = relations(snippets, ({ one }) => ({
  creator: one(appUsers, {
    fields: [snippets.creatorId],
    references: [appUsers.id],
  }),
}));

export const workSessionRelations = relations(workSessions, ({ one }) => ({
  user: one(appUsers, {
    fields: [workSessions.userId],
    references: [appUsers.id],
  }),
}));


