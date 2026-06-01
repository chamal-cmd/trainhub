-- seed-tools.sql
-- Creates and seeds the tools table for the Software & Tools page

CREATE TABLE IF NOT EXISTS tools (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  emoji       TEXT NOT NULL DEFAULT '🔧',
  category    TEXT NOT NULL DEFAULT 'General',
  website_url TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Seed with tools relevant to a GP Bookkeeping team
INSERT INTO tools (name, description, emoji, category, website_url) VALUES
  (
    'Dext Prepare',
    'Automated data capture tool for receipts, invoices and bank statements. Used to extract and publish documents directly into Xero.',
    '🧾',
    'Data Capture',
    'https://dext.com'
  ),
  (
    'Xero',
    'Cloud-based accounting software used for managing client accounts, reconciliation, payroll and financial reporting.',
    '📊',
    'Accounting',
    'https://xero.com'
  ),
  (
    'Fathom',
    'Financial reporting and analysis tool that connects with Xero to generate beautiful management reports and KPI dashboards.',
    '📈',
    'Reporting',
    'https://fathomhq.com'
  ),
  (
    'Asana',
    'Project and task management platform used to organise client work, track deadlines and collaborate across the bookkeeping team.',
    '✅',
    'Project Management',
    'https://asana.com'
  ),
  (
    'Slack',
    'Team messaging platform used for day-to-day communication, client updates, and quick collaboration across pods.',
    '💬',
    'Communication',
    'https://slack.com'
  ),
  (
    'Microsoft 365',
    'Suite of productivity tools including Outlook, Word, Excel and Teams used for email, document creation and video meetings.',
    '🖥️',
    'Productivity',
    'https://microsoft.com/microsoft-365'
  ),
  (
    'Hiver',
    'Shared inbox and email collaboration tool built on Gmail, used to manage client emails and delegate tasks within the team.',
    '📩',
    'Communication',
    'https://hiverhq.com'
  ),
  (
    'Hubdoc',
    'Document fetching and collection tool that automatically pulls bills and bank statements from supplier portals into Xero.',
    '📂',
    'Data Capture',
    'https://hubdoc.com'
  ),
  (
    'Google Workspace',
    'Cloud productivity suite including Google Drive, Docs, Sheets and Meet used for document collaboration and storage.',
    '🔵',
    'Productivity',
    'https://workspace.google.com'
  ),
  (
    'QuickBooks',
    'Accounting software used for select clients who manage their bookkeeping outside of the Xero ecosystem.',
    '💰',
    'Accounting',
    'https://quickbooks.intuit.com'
  )
ON CONFLICT DO NOTHING;
