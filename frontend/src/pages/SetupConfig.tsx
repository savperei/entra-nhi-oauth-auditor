import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getHealth, getConfig, getRules } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';

interface HealthData {
  status: string;
  mode?: string;
  [key: string]: any;
}

interface ConfigData {
  mode: string;
  version: string;
  rules_file: string;
  last_audit_at: string | null;
  thresholds: { critical: number; high: number; medium: number; low: number; none: number };
  high_risk_permissions: string[];
}

interface Rule {
  id: string;
  name: string;
  severity: string;
  score: number;
  remediation: string;
}

function CopyableCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="p-3 rounded bg-[#F4F4F5] dark:bg-[#0F172A] border border-[#E4E4E7] dark:border-[#334155] font-mono text-xs text-[#18181B] dark:text-[#E2E8F0] overflow-x-auto">
        {code}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 px-2 py-0.5 rounded text-[11px] font-mono bg-[#E4E4E7] dark:bg-[#334155] text-[#18181B] dark:text-[#F1F5F9] hover:bg-[#D4D4D8] dark:hover:bg-[#475569] transition-colors"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}

export const SetupConfig: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'status' | 'connect' | 'detection'>('status');
  const [health, setHealth] = useState<HealthData | null>(null);
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);

  useEffect(() => {
    let active = true;
    const fetchConfigData = async () => {
      try {
        const [h, c, r] = await Promise.all([
          getHealth().catch(() => ({ status: 'ok', mode: 'synthetic_data' })),
          getConfig().catch(() => null),
          getRules().catch(() => []),
        ]);
        if (!active) return;
        setHealth(h);
        setConfig(c);
        setRules(r);
      } catch (e) {
        console.error('Error fetching setup data', e);
      }
    };
    fetchConfigData();
    return () => { active = false; };
  }, []);

  const formatTimestamp = (ts: string | null | undefined): string => {
    if (!ts) return 'Never';
    try {
      const date = new Date(ts);
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return ts;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#18181B] dark:text-[#F1F5F9]">
          Setup & Configuration
        </h1>
        <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#94A3B8] mt-1">
          Inspect connection status, learn how to connect your Microsoft Entra ID tenant, or examine detection settings.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E4E4E7] dark:border-[#334155] gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('status')}
          className={`py-2 px-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'status'
              ? 'border-[#2563EB] text-[#2563EB] font-semibold'
              : 'border-transparent text-[#71717A] dark:text-[#94A3B8] hover:text-[#18181B] dark:hover:text-[#F1F5F9]'
          }`}
        >
          Connection Status
        </button>
        <button
          onClick={() => setActiveTab('connect')}
          className={`py-2 px-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'connect'
              ? 'border-[#2563EB] text-[#2563EB] font-semibold'
              : 'border-transparent text-[#71717A] dark:text-[#94A3B8] hover:text-[#18181B] dark:hover:text-[#F1F5F9]'
          }`}
        >
          Connect Your Environment
        </button>
        <button
          onClick={() => setActiveTab('detection')}
          className={`py-2 px-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'detection'
              ? 'border-[#2563EB] text-[#2563EB] font-semibold'
              : 'border-transparent text-[#71717A] dark:text-[#94A3B8] hover:text-[#18181B] dark:hover:text-[#F1F5F9]'
          }`}
        >
          Detection Settings
        </button>
      </div>

      {/* TAB 1: Connection status */}
      {activeTab === 'status' && (
        <div className="space-y-4">
          <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E4E4E7] dark:border-[#334155] rounded-lg p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[#18181B] dark:text-[#F1F5F9]">
                  Auditor Environment Status
                </h2>
                <p className="text-xs text-[#71717A] dark:text-[#94A3B8] mt-0.5">
                  Currently operating in simulated safe demo mode with zero production dependencies.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-[#FEF3C7] dark:bg-[#78350F]/40 text-[#92400E] dark:text-[#FDE68A] border border-[#FCD34D] dark:border-[#B45309]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-pulse" />
                Synthetic Demo Data
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-[#E4E4E7] dark:border-[#334155] pt-4">
              <div className="p-3 bg-[#F4F4F5] dark:bg-[#0F172A] rounded border border-[#E4E4E7] dark:border-[#334155]">
                <span className="text-[11px] text-[#71717A] dark:text-[#94A3B8] block">API Health</span>
                <span className="text-sm font-semibold text-[#16A34A] flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                  {health?.status === 'ok' ? 'Healthy (200 OK)' : 'Online'}
                </span>
              </div>
              <div className="p-3 bg-[#F4F4F5] dark:bg-[#0F172A] rounded border border-[#E4E4E7] dark:border-[#334155]">
                <span className="text-[11px] text-[#71717A] dark:text-[#94A3B8] block">Current Mode</span>
                <span className="text-sm font-semibold text-[#18181B] dark:text-[#F1F5F9] mt-0.5 block">
                  Synthetic Tenant
                </span>
              </div>
              <div className="p-3 bg-[#F4F4F5] dark:bg-[#0F172A] rounded border border-[#E4E4E7] dark:border-[#334155]">
                <span className="text-[11px] text-[#71717A] dark:text-[#94A3B8] block">Last Pipeline Audit</span>
                <span className="text-xs font-semibold text-[#18181B] dark:text-[#F1F5F9] mt-1 block">
                  {formatTimestamp(config?.last_audit_at)}
                </span>
              </div>
            </div>

            <div className="text-xs text-[#71717A] dark:text-[#94A3B8] leading-relaxed pt-1">
              Synthetic mode simulates realistic enterprise workloads (including CRM integrations, HR synchronizers, and backup daemons) without requiring Azure credentials or tenant admin privileges.
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Connect your environment */}
      {activeTab === 'connect' && (
        <div className="space-y-6">
          {/* Demo Callout */}
          <div className="p-3.5 rounded-lg border border-[#FCD34D] bg-[#FEF3C7] dark:bg-[#78350F]/20 dark:border-[#B45309] text-xs text-[#92400E] dark:text-[#FDE68A] flex items-start gap-2.5">
            <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <span className="font-semibold">Demo Notice: </span>
              The demo runs entirely on synthetic data, so none of these values or Azure privileges are needed to try the tool right now.
            </div>
          </div>

          {/* Guide Steps */}
          <div className="space-y-4">
            {/* Step a */}
            <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E4E4E7] dark:border-[#334155] rounded-lg p-4 sm:p-5">
              <h2 className="text-xs font-bold text-[#2563EB] uppercase tracking-wider mb-1">
                Step 1: Understand the Data Source
              </h2>
              <p className="text-xs text-[#71717A] dark:text-[#94A3B8] leading-relaxed">
                The auditor reads identities directly from Microsoft Entra ID through the read-only Microsoft Graph API. Legacy systems such as an on-premise or cloud CRM appear in the audit as app registrations or service principals, so connecting Entra ID is what brings the CRM's access and credentials into clear view.
              </p>
            </div>

            {/* Step b */}
            <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E4E4E7] dark:border-[#334155] rounded-lg p-4 sm:p-5">
              <h2 className="text-xs font-bold text-[#2563EB] uppercase tracking-wider mb-1">
                Step 2: Create an App Registration
              </h2>
              <ol className="list-decimal list-inside text-xs text-[#71717A] dark:text-[#94A3B8] space-y-1.5 leading-relaxed">
                <li>Sign in to the <strong className="text-[#18181B] dark:text-[#F1F5F9]">Microsoft Entra admin center</strong> (portal.azure.com).</li>
                <li>Navigate to <strong className="text-[#18181B] dark:text-[#F1F5F9]">Identity &gt; Applications &gt; App registrations</strong> and click <strong className="text-[#18181B] dark:text-[#F1F5F9]">New registration</strong>.</li>
                <li>Name the application (e.g. <code className="font-mono bg-[#F4F4F5] dark:bg-[#0F172A] px-1 py-0.5 rounded">Entra-NHI-Auditor</code>) and leave account types as single tenant.</li>
                <li>Under <strong className="text-[#18181B] dark:text-[#F1F5F9]">Certificates & secrets</strong>, create a new client secret and copy its value.</li>
              </ol>
            </div>

            {/* Step c */}
            <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E4E4E7] dark:border-[#334155] rounded-lg p-4 sm:p-5">
              <h2 className="text-xs font-bold text-[#2563EB] uppercase tracking-wider mb-1">
                Step 3: Grant Read-Only Graph Permissions
              </h2>
              <p className="text-xs text-[#71717A] dark:text-[#94A3B8] mb-3">
                In <strong className="text-[#18181B] dark:text-[#F1F5F9]">API permissions &gt; Add a permission &gt; Microsoft Graph &gt; Application permissions</strong>, select and grant admin consent for:
              </p>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded border border-[#E4E4E7] dark:border-[#334155] bg-[#F4F4F5]/50 dark:bg-[#0F172A]/50">
                  <div className="font-mono font-semibold text-[#18181B] dark:text-[#F1F5F9]">Application.Read.All</div>
                  <div className="text-[11px] text-[#71717A] dark:text-[#94A3B8] mt-0.5">Allows discovery of all app registrations and service principals in the tenant.</div>
                </div>
                <div className="p-2.5 rounded border border-[#E4E4E7] dark:border-[#334155] bg-[#F4F4F5]/50 dark:bg-[#0F172A]/50">
                  <div className="font-mono font-semibold text-[#18181B] dark:text-[#F1F5F9]">Directory.Read.All</div>
                  <div className="text-[11px] text-[#71717A] dark:text-[#94A3B8] mt-0.5">Allows reading tenant directory metadata, publisher domain verification, and role assignments.</div>
                </div>
                <div className="p-2.5 rounded border border-[#E4E4E7] dark:border-[#334155] bg-[#F4F4F5]/50 dark:bg-[#0F172A]/50">
                  <div className="font-mono font-semibold text-[#18181B] dark:text-[#F1F5F9]">AuditLog.Read.All</div>
                  <div className="text-[11px] text-[#71717A] dark:text-[#94A3B8] mt-0.5">Allows auditing of sign-in timestamps and inactive service principal detection.</div>
                </div>
              </div>
            </div>

            {/* Step d */}
            <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E4E4E7] dark:border-[#334155] rounded-lg p-4 sm:p-5 space-y-3">
              <h2 className="text-xs font-bold text-[#2563EB] uppercase tracking-wider mb-1">
                Step 4: Set Environment Variables
              </h2>
              <p className="text-xs text-[#71717A] dark:text-[#94A3B8]">
                Populate your configuration in <code className="font-mono bg-[#F4F4F5] dark:bg-[#0F172A] px-1 py-0.5 rounded">backend/.env</code>:
              </p>

              <div className="overflow-x-auto border border-[#E4E4E7] dark:border-[#334155] rounded">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F4F4F5] dark:bg-[#0F172A] text-[#71717A] dark:text-[#94A3B8] text-[11px] font-semibold">
                    <tr>
                      <th className="py-2 px-3">Variable</th>
                      <th className="py-2 px-3">What it is</th>
                      <th className="py-2 px-3">Where to find it</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E4E7] dark:divide-[#334155] text-[#18181B] dark:text-[#F1F5F9]">
                    <tr>
                      <td className="py-2 px-3 font-mono text-[11px]">AZURE_TENANT_ID</td>
                      <td className="py-2 px-3">Directory (tenant) ID</td>
                      <td className="py-2 px-3 text-[#71717A] dark:text-[#94A3B8]">Entra Overview blade</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-[11px]">AZURE_CLIENT_ID</td>
                      <td className="py-2 px-3">Application (client) ID</td>
                      <td className="py-2 px-3 text-[#71717A] dark:text-[#94A3B8]">App registration Overview blade</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-[11px]">AZURE_CLIENT_SECRET</td>
                      <td className="py-2 px-3">Client secret value</td>
                      <td className="py-2 px-3 text-[#71717A] dark:text-[#94A3B8]">Certificates & secrets blade</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono text-[11px]">USE_SYNTHETIC_DATA</td>
                      <td className="py-2 px-3">Switch mode to live</td>
                      <td className="py-2 px-3 text-[#71717A] dark:text-[#94A3B8]">Set to "false" to query Entra</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <CopyableCode
                code={`# backend/.env
AZURE_TENANT_ID=00000000-0000-0000-0000-000000000000
AZURE_CLIENT_ID=00000000-0000-0000-0000-000000000000
AZURE_CLIENT_SECRET=your_client_secret_here
USE_SYNTHETIC_DATA=false`}
              />
            </div>

            {/* Step e */}
            <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E4E4E7] dark:border-[#334155] rounded-lg p-4 sm:p-5">
              <h2 className="text-xs font-bold text-[#2563EB] uppercase tracking-wider mb-1">
                Step 5: Restart Backend & Execute Scan
              </h2>
              <p className="text-xs text-[#71717A] dark:text-[#94A3B8] leading-relaxed mb-3">
                Restart your FastAPI backend server and click <strong className="text-[#18181B] dark:text-[#F1F5F9]">Run Audit</strong> in the top header. The pipeline will query Microsoft Graph and refresh your dashboard.
              </p>
              <CopyableCode code={`uvicorn src.api.main:app --reload --port 8000`} />
            </div>

            {/* Legacy CRM Panel */}
            <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border-l-4 border-l-[#2563EB] border border-[#E4E4E7] dark:border-[#334155] rounded-r-lg p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-[#18181B] dark:text-[#F1F5F9] mb-1">
                How to Inspect a Legacy CRM Integration
              </h2>
              <p className="text-xs text-[#71717A] dark:text-[#94A3B8] leading-relaxed mb-2">
                Legacy systems (like older Salesforce integrations, Microsoft Dynamics connectors, or custom CRM sync scripts) frequently operate under high privileges with little ongoing monitoring.
              </p>
              <ul className="list-disc list-inside text-xs text-[#71717A] dark:text-[#94A3B8] space-y-1">
                <li>Go to the <Link to="/identities" className="text-[#2563EB] underline font-medium">Identities</Link> tab and search for your CRM's name.</li>
                <li>Check its <strong className="text-[#18181B] dark:text-[#F1F5F9]">Credentials</strong>: Look out for secrets with no expiry or certificates expiring in under 14 days.</li>
                <li>Check its <strong className="text-[#18181B] dark:text-[#F1F5F9]">Permissions</strong>: Verify if it holds broad tenant-wide permissions like <code className="font-mono text-[11px]">User.ReadWrite.All</code> that can be scoped down.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Detection settings */}
      {activeTab === 'detection' && (
        <div className="space-y-6">
          <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E4E4E7] dark:border-[#334155] rounded-lg p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-[#18181B] dark:text-[#F1F5F9] mb-1">
              Detection Rules Architecture
            </h2>
            <p className="text-xs text-[#71717A] dark:text-[#94A3B8] leading-relaxed">
              Rules are declarative and stored in <code className="font-mono text-[#2563EB] bg-[#F4F4F5] dark:bg-[#0F172A] px-1 py-0.5 rounded">backend/rules/default_rules.yaml</code>. You can customize existing point weights or append custom detection checks without writing Python code.
            </p>
          </div>

          {/* Read-only Rules */}
          <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E4E4E7] dark:border-[#334155] rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E4E4E7] dark:border-[#334155] flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[#18181B] dark:text-[#F1F5F9] uppercase tracking-wider text-[11px]">
                Active Rules ({rules.length})
              </h3>
              <span className="text-[11px] text-[#71717A] dark:text-[#94A3B8]">Read-only</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F4F5] dark:bg-[#0F172A] text-[#71717A] dark:text-[#94A3B8] text-[11px] font-semibold border-b border-[#E4E4E7] dark:border-[#334155]">
                  <tr>
                    <th className="py-2.5 px-3">Rule ID</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E7] dark:divide-[#334155] text-[#18181B] dark:text-[#F1F5F9]">
                  {rules.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 px-3 font-mono text-[11px] text-[#71717A] dark:text-[#94A3B8]">{r.id}</td>
                      <td className="py-2 px-3 font-medium">{r.name}</td>
                      <td className="py-2 px-3"><RiskBadge level={r.severity} /></td>
                      <td className="py-2 px-3 text-right font-mono font-semibold">+{r.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* High-Risk Permissions List */}
          <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E4E4E7] dark:border-[#334155] rounded-lg p-4 sm:p-5">
            <h3 className="text-xs font-semibold text-[#18181B] dark:text-[#F1F5F9] uppercase tracking-wider text-[11px] mb-2">
              High-Risk Permission Scopes (Flagged by PERM_001)
            </h3>
            <p className="text-xs text-[#71717A] dark:text-[#94A3B8] mb-3">
              Application permissions with tenant-wide blast radius:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(config?.high_risk_permissions || [
                'Directory.ReadWrite.All',
                'Application.ReadWrite.All',
                'RoleManagement.ReadWrite.Directory',
                'Mail.ReadWrite',
                'Files.ReadWrite.All',
                'User.ReadWrite.All',
                'Group.ReadWrite.All',
              ]).map((perm) => (
                <span
                  key={perm}
                  className="px-2 py-0.5 rounded font-mono text-[11px] bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] dark:bg-[#7F1D1D]/30 dark:border-[#991B1B] dark:text-[#FCA5A5]"
                >
                  {perm}
                </span>
              ))}
            </div>
          </div>

          {/* Example of adding a rule */}
          <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E4E4E7] dark:border-[#334155] rounded-lg p-4 sm:p-5">
            <h3 className="text-xs font-semibold text-[#18181B] dark:text-[#F1F5F9] uppercase tracking-wider text-[11px] mb-1">
              Example: Adding a Custom Rule in default_rules.yaml
            </h3>
            <p className="text-xs text-[#71717A] dark:text-[#94A3B8] mb-3 leading-relaxed">
              To add a check for inactive service principals, append the following block to your rules YAML:
            </p>
            <CopyableCode
              code={`  - id: ACT_001
    name: "Inactive identity for over 90 days"
    severity: MEDIUM
    score: 25
    remediation: "Disable or archive unused service principal"`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SetupConfig;

