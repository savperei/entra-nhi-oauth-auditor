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
  thresholds: { critical: number; high: number; medium: number; low: number };
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
      <pre className="p-3.5 rounded bg-[#172622] text-[#E8EBE9] border border-[#283C35] font-mono text-xs overflow-x-auto">
        {code}
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy code to clipboard"
        className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded text-[11px] font-mono bg-[#283C35] text-[#A7C4B5] hover:bg-[#147D68] hover:text-white transition-colors"
      >
        {copied ? 'Copied ✓' : 'Copy'}
      </button>
    </div>
  );
}

export const SetupConfig: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'status' | 'connect' | 'detection'>('status');
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);

  useEffect(() => {
    let active = true;
    const fetchConfigData = async () => {
      setHealthLoading(true);
      try {
        const [h, c, r] = await Promise.all([
          getHealth().catch(() => null),
          getConfig().catch(() => null),
          getRules().catch(() => []),
        ]);
        if (!active) return;
        setHealth(h);
        setConfig(c);
        setRules(r);
      } catch (e) {
        console.error('Error fetching setup data', e);
      } finally {
        if (active) setHealthLoading(false);
      }
    };
    fetchConfigData();
    return () => { active = false; };
  }, []);

  const formatTimestamp = (ts: string | null | undefined): string => {
    if (!ts) return 'No audit has run yet. Select Run Audit to generate results.';
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
        <h1 className="text-2xl font-bold tracking-tight text-[#202824] dark:text-[#E8EBE9]">
          Setup &amp; Configuration
        </h1>
        <p className="text-xs sm:text-sm text-[#66736C] dark:text-[#95A69E] mt-1">
          Inspect connection status, learn how to connect your Microsoft Entra ID tenant, or examine detection settings.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#DCE2DB] dark:border-[#283C35] gap-2 overflow-x-auto" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'status'}
          onClick={() => setActiveTab('status')}
          className={`py-2 px-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap focus:outline-none ${
            activeTab === 'status'
              ? 'border-[#147D68] dark:border-[#2DD4BF] text-[#147D68] dark:text-[#2DD4BF] font-semibold'
              : 'border-transparent text-[#66736C] dark:text-[#95A69E] hover:text-[#202824] dark:hover:text-[#E8EBE9]'
          }`}
        >
          Connection status
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'connect'}
          onClick={() => setActiveTab('connect')}
          className={`py-2 px-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap focus:outline-none ${
            activeTab === 'connect'
              ? 'border-[#147D68] dark:border-[#2DD4BF] text-[#147D68] dark:text-[#2DD4BF] font-semibold'
              : 'border-transparent text-[#66736C] dark:text-[#95A69E] hover:text-[#202824] dark:hover:text-[#E8EBE9]'
          }`}
        >
          Connect your environment
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'detection'}
          onClick={() => setActiveTab('detection')}
          className={`py-2 px-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap focus:outline-none ${
            activeTab === 'detection'
              ? 'border-[#147D68] dark:border-[#2DD4BF] text-[#147D68] dark:text-[#2DD4BF] font-semibold'
              : 'border-transparent text-[#66736C] dark:text-[#95A69E] hover:text-[#202824] dark:hover:text-[#E8EBE9]'
          }`}
        >
          Detection settings
        </button>
      </div>

      {/* TAB 1: Connection status */}
      {activeTab === 'status' && (
        <div className="space-y-4">
          <div className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[#202824] dark:text-[#E8EBE9]">
                  Auditor Environment Status
                </h2>
                <p className="text-xs text-[#66736C] dark:text-[#95A69E] mt-0.5">
                  Real-time status of backend API connectivity and data source mode.
                </p>
              </div>
              <div>
                {config?.mode === 'live' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-[#F0FDF4] text-[#39856A] border border-[#A7C4B5]/40 dark:bg-[#142A22] dark:border-[#283C35] dark:text-[#2DD4BF]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#39856A]" />
                    Live Entra ID data
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-[#FEF7EE] text-[#D77928] border border-[#D77928]/30 dark:bg-[#2A2016] dark:text-[#E58B3C]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D77928]" />
                    Synthetic demo data
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-[#ECEBE4] dark:border-[#283C35] pt-4">
              {/* API Status */}
              <div className="p-3 bg-[#F5F4EF] dark:bg-[#111B18] rounded border border-[#DCE2DB] dark:border-[#283C35]">
                <span className="text-[11px] text-[#66736C] dark:text-[#95A69E] block">API status</span>
                {healthLoading ? (
                  <span className="text-xs text-[#66736C] mt-1 block">Checking API...</span>
                ) : health && health.status === 'ok' ? (
                  <span className="text-xs font-semibold text-[#39856A] dark:text-[#4AA484] flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#39856A]" />
                    API reachable
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-[#C74444] dark:text-[#E05A5A] flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C74444]" />
                    API unavailable
                  </span>
                )}
              </div>

              {/* Data mode */}
              <div className="p-3 bg-[#F5F4EF] dark:bg-[#111B18] rounded border border-[#DCE2DB] dark:border-[#283C35]">
                <span className="text-[11px] text-[#66736C] dark:text-[#95A69E] block">Data mode</span>
                <span className="text-xs font-semibold text-[#202824] dark:text-[#E8EBE9] mt-1 block">
                  {config?.mode === 'live' ? 'Live Entra ID tenant' : 'Synthetic demonstration'}
                </span>
              </div>

              {/* Last audit */}
              <div className="p-3 bg-[#F5F4EF] dark:bg-[#111B18] rounded border border-[#DCE2DB] dark:border-[#283C35]">
                <span className="text-[11px] text-[#66736C] dark:text-[#95A69E] block">Last audit</span>
                <span className="text-xs font-semibold text-[#202824] dark:text-[#E8EBE9] mt-1 block leading-tight">
                  {formatTimestamp(config?.last_audit_at)}
                </span>
              </div>
            </div>

            {/* Data mode explanation */}
            <div className="text-xs text-[#66736C] dark:text-[#95A69E] leading-relaxed pt-1 border-t border-[#ECEBE4] dark:border-[#283C35]">
              {config?.mode === 'live' ? (
                <p>
                  The auditor is connected to your Microsoft Entra ID tenant and collects real identities, permissions, and credential records via Microsoft Graph.
                </p>
              ) : (
                <p>
                  The application is currently analysing demonstration identities and is not connected to a live Entra ID tenant. Synthetic mode allows safe exploration of detection rules and scoring without requiring tenant administrator credentials.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Connect your environment */}
      {activeTab === 'connect' && (
        <div className="space-y-6">
          {/* Demo-mode callout: exact required text, restrained note styling */}
          <div className="p-3 rounded border border-[#DCE2DB] dark:border-[#283C35] bg-[#F5F4EF] dark:bg-[#111B18] text-xs text-[#66736C] dark:text-[#95A69E] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#147D68] dark:text-[#2DD4BF] shrink-0" />
            <span>The demo runs on synthetic data, so none of these values are needed to try the tool.</span>
          </div>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg p-5 shadow-xs">
              <h2 className="text-xs font-bold text-[#147D68] dark:text-[#2DD4BF] uppercase tracking-wider mb-1">
                Step 1: Understand where the data comes from
              </h2>
              <p className="text-xs text-[#66736C] dark:text-[#95A69E] leading-relaxed">
                The auditor reads identity and permission information from Microsoft Entra ID through the Microsoft Graph API when configured for live mode.
              </p>
              <p className="text-xs text-[#66736C] dark:text-[#95A69E] leading-relaxed mt-2">
                Legacy applications such as CRM systems can appear as app registrations or service principals in Entra ID. Connecting Entra ID helps reveal the permissions and credentials associated with those identities.
              </p>
              <p className="text-xs text-[#66736C] dark:text-[#95A69E] leading-relaxed mt-2">
                Clarify that the auditor does not automatically discover every legacy application's internal users, database permissions or local credentials. Its visibility depends on what is represented in Entra ID and what the configured APIs return.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg p-5 shadow-xs">
              <h2 className="text-xs font-bold text-[#147D68] dark:text-[#2DD4BF] uppercase tracking-wider mb-1">
                Step 2: Register the auditor application
              </h2>
              <ol className="list-decimal list-inside text-xs text-[#66736C] dark:text-[#95A69E] space-y-1.5 leading-relaxed mt-2">
                <li>Open the Microsoft Entra admin centre.</li>
                <li>Select Microsoft Entra ID.</li>
                <li>Open App registrations.</li>
                <li>Select New registration.</li>
                <li>Give the application a clear name, such as <code className="font-mono bg-[#ECEBE4] dark:bg-[#111B18] px-1 py-0.5 rounded">NHI OAuth Auditor</code>.</li>
                <li>Select the appropriate supported account type for the organisation.</li>
                <li>Register the application.</li>
                <li>Record the tenant ID and application/client ID.</li>
                <li>Create a client secret under Certificates &amp; secrets only if required by your client credentials grant flow.</li>
                <li>Store the secret securely.</li>
              </ol>
            </div>

            {/* Step 3 */}
            <div className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg p-5 space-y-3 shadow-xs">
              <h2 className="text-xs font-bold text-[#147D68] dark:text-[#2DD4BF] uppercase tracking-wider mb-1">
                Step 3: Explain Microsoft Graph permissions
              </h2>
              <p className="text-xs text-[#66736C] dark:text-[#95A69E] mb-3 leading-relaxed">
                The product is intended to be read-only and never requires write permissions. The following Application permissions require administrator consent:
              </p>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded border border-[#DCE2DB] dark:border-[#283C35] bg-[#F5F4EF]/60 dark:bg-[#111B18]/60">
                  <div className="font-mono font-semibold text-[#202824] dark:text-[#E8EBE9]">Application.Read.All</div>
                  <div className="text-[11px] text-[#66736C] dark:text-[#95A69E] mt-0.5">
                    Reads application and service-principal information, allowing discovery of non-human identities, credentials, and attached API permissions.
                  </div>
                </div>
                <div className="p-3 rounded border border-[#DCE2DB] dark:border-[#283C35] bg-[#F5F4EF]/60 dark:bg-[#111B18]/60">
                  <div className="font-mono font-semibold text-[#202824] dark:text-[#E8EBE9]">Directory.Read.All</div>
                  <div className="text-[11px] text-[#66736C] dark:text-[#95A69E] mt-0.5">
                    Reads relevant directory objects and relationships, including publisher domain verification and tenant directory metadata.
                  </div>
                </div>
                <div className="p-3 rounded border border-[#DCE2DB] dark:border-[#283C35] bg-[#F5F4EF]/60 dark:bg-[#111B18]/60">
                  <div className="font-mono font-semibold text-[#202824] dark:text-[#E8EBE9]">AuditLog.Read.All</div>
                  <div className="text-[11px] text-[#66736C] dark:text-[#95A69E] mt-0.5">
                    Reads audit-log information where used by the application, such as recent service principal sign-in activity and inactive accounts.
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <span className="text-[11px] text-[#66736C] dark:text-[#95A69E] block mb-1">Permission names:</span>
                <CopyableCode code={`Application.Read.All
Directory.Read.All
AuditLog.Read.All`} />
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg p-5 space-y-3 shadow-xs">
              <h2 className="text-xs font-bold text-[#147D68] dark:text-[#2DD4BF] uppercase tracking-wider mb-1">
                Step 4: Configure environment variables
              </h2>
              <p className="text-xs text-[#66736C] dark:text-[#95A69E] leading-relaxed">
                Environment variables belong in <code className="font-mono bg-[#ECEBE4] dark:bg-[#111B18] px-1 py-0.5 rounded">backend/.env</code>. This file is excluded by <code className="font-mono">.gitignore</code> and must never be committed to source control.
              </p>

              <div className="overflow-x-auto border border-[#DCE2DB] dark:border-[#283C35] rounded">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#ECEBE4] dark:bg-[#111B18] text-[#66736C] dark:text-[#95A69E] text-[11px] font-semibold border-b border-[#DCE2DB] dark:border-[#283C35]">
                    <tr>
                      <th className="py-2.5 px-3">Variable</th>
                      <th className="py-2.5 px-3">What it means</th>
                      <th className="py-2.5 px-3">Where to find it</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECEBE4] dark:divide-[#283C35] text-[#202824] dark:text-[#E8EBE9]">
                    <tr>
                      <td className="py-2.5 px-3 font-mono text-[11px]">AZURE_TENANT_ID</td>
                      <td className="py-2.5 px-3">The organisation's Entra tenant identifier</td>
                      <td className="py-2.5 px-3 text-[#66736C] dark:text-[#95A69E]">Entra tenant overview</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono text-[11px]">AZURE_CLIENT_ID</td>
                      <td className="py-2.5 px-3">The auditor application's client ID</td>
                      <td className="py-2.5 px-3 text-[#66736C] dark:text-[#95A69E]">App registration overview</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono text-[11px]">AZURE_CLIENT_SECRET</td>
                      <td className="py-2.5 px-3">The application secret, if required by the implemented authentication flow</td>
                      <td className="py-2.5 px-3 text-[#66736C] dark:text-[#95A69E]">App registration certificate and secrets</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono text-[11px]">USE_SYNTHETIC_DATA</td>
                      <td className="py-2.5 px-3">Controls whether demonstration data is used</td>
                      <td className="py-2.5 px-3 text-[#66736C] dark:text-[#95A69E]">Backend environment configuration (set to "false" for live mode)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <span className="text-[11px] text-[#66736C] dark:text-[#95A69E] block mb-1">Illustrative .env template (not real credentials):</span>
                <CopyableCode
                  code={`AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-secret
USE_SYNTHETIC_DATA=false`}
                />
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg p-5 shadow-xs">
              <h2 className="text-xs font-bold text-[#147D68] dark:text-[#2DD4BF] uppercase tracking-wider mb-1">
                Step 5: Restart and run an audit
              </h2>
              <ol className="list-decimal list-inside text-xs text-[#66736C] dark:text-[#95A69E] space-y-1.5 leading-relaxed mt-2 mb-3">
                <li>Save the environment configuration in <code className="font-mono">backend/.env</code>.</li>
                <li>Restart the backend service.</li>
                <li>Verify the API health status on the Connection status tab.</li>
                <li>Confirm the actual data mode indicates live Entra ID data.</li>
                <li>Run an audit by selecting the Run Audit button in the top bar.</li>
                <li>Open the <Link to="/identities" className="text-[#147D68] dark:text-[#2DD4BF] underline font-medium">Identities</Link> and <Link to="/findings" className="text-[#147D68] dark:text-[#2DD4BF] underline font-medium">Findings</Link> pages.</li>
                <li>Review the resulting scores and remediation guidance.</li>
              </ol>
              <CopyableCode code={`cd backend
uvicorn src.api.main:app --reload --port 8000`} />
            </div>

            {/* Auditing a legacy CRM panel */}
            <div className="bg-[#FFFFFF] dark:bg-[#182622] border-l-4 border-l-[#147D68] border border-[#DCE2DB] dark:border-[#283C35] rounded-r-lg p-5 shadow-xs">
              <h2 className="text-sm font-semibold text-[#202824] dark:text-[#E8EBE9] mb-1">
                Auditing a legacy CRM
              </h2>
              <p className="text-xs text-[#66736C] dark:text-[#95A69E] leading-relaxed mb-3">
                Legacy CRM connectors (such as Salesforce sync accounts, older Dynamics integrations, or custom customer database tools) often hold high privileges. To audit a legacy CRM:
              </p>
              <ul className="list-disc list-inside text-xs text-[#66736C] dark:text-[#95A69E] space-y-1.5">
                <li>Search for the CRM by its name on the <Link to="/identities" className="text-[#147D68] dark:text-[#2DD4BF] underline font-medium">Identities page</Link>.</li>
                <li>Identify its associated app registration or service principal.</li>
                <li>Review the permissions granted to it.</li>
                <li>Look for expiring or old secrets and certificates.</li>
                <li>Review high-risk permissions and organisation-wide OAuth consent.</li>
                <li>Check publisher verification and identity status where available.</li>
                <li>Follow the findings and remediation guidance to decide what an administrator should review.</li>
              </ul>
              <p className="text-[11px] text-[#97A8A0] mt-3 italic">
                Note: An application's appearance in Entra ID does not automatically mean its entire internal CRM environment has been audited; visibility reflects the Entra ID identity object and what the configured APIs return.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Detection settings */}
      {activeTab === 'detection' && (
        <div className="space-y-5">
          <div className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg p-5 shadow-xs">
            <h2 className="text-sm font-semibold text-[#202824] dark:text-[#E8EBE9] mb-1">
              Detection settings (Read-only)
            </h2>
            <p className="text-xs text-[#66736C] dark:text-[#95A69E] leading-relaxed">
              Rules are defined in <code className="font-mono text-[#147D68] dark:text-[#2DD4BF] bg-[#ECEBE4] dark:bg-[#111B18] px-1 py-0.5 rounded">rules/default_rules.yaml</code>. An administrator can modify point values, add new rules, or adjust severity by editing that file and restarting the backend service.
            </p>
          </div>

          {/* Config Summary Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg shadow-xs">
              <span className="text-[11px] text-[#66736C] dark:text-[#95A69E] block">Current data mode</span>
              <span className="text-xs font-semibold text-[#202824] dark:text-[#E8EBE9] mt-1 block capitalize font-mono">
                {config?.mode || 'synthetic'}
              </span>
            </div>
            <div className="p-4 bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg shadow-xs">
              <span className="text-[11px] text-[#66736C] dark:text-[#95A69E] block">Rules file path</span>
              <span className="text-xs font-semibold text-[#202824] dark:text-[#E8EBE9] mt-1 block font-mono truncate">
                {config?.rules_file || 'rules/default_rules.yaml'}
              </span>
            </div>
          </div>

          {/* Effective Risk Thresholds */}
          <div className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg p-5 shadow-xs">
            <h3 className="text-xs font-semibold text-[#202824] dark:text-[#E8EBE9] uppercase tracking-wider text-[11px] mb-3">
              Effective Risk Thresholds
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 rounded border border-[#DCE2DB] dark:border-[#283C35] bg-[#F5F4EF]/60 dark:bg-[#111B18]/60">
                <RiskBadge level="Low" />
                <div className="text-[11px] font-mono text-[#66736C] dark:text-[#95A69E] mt-1.5 font-semibold">
                  {config?.thresholds?.low ?? 1} – {(config?.thresholds?.medium ?? 25) - 1} pts
                </div>
              </div>
              <div className="p-3 rounded border border-[#DCE2DB] dark:border-[#283C35] bg-[#F5F4EF]/60 dark:bg-[#111B18]/60">
                <RiskBadge level="Medium" />
                <div className="text-[11px] font-mono text-[#66736C] dark:text-[#95A69E] mt-1.5 font-semibold">
                  {config?.thresholds?.medium ?? 25} – {(config?.thresholds?.high ?? 50) - 1} pts
                </div>
              </div>
              <div className="p-3 rounded border border-[#DCE2DB] dark:border-[#283C35] bg-[#F5F4EF]/60 dark:bg-[#111B18]/60">
                <RiskBadge level="High" />
                <div className="text-[11px] font-mono text-[#66736C] dark:text-[#95A69E] mt-1.5 font-semibold">
                  {config?.thresholds?.high ?? 50} – {(config?.thresholds?.critical ?? 80) - 1} pts
                </div>
              </div>
              <div className="p-3 rounded border border-[#DCE2DB] dark:border-[#283C35] bg-[#F5F4EF]/60 dark:bg-[#111B18]/60">
                <RiskBadge level="Critical" />
                <div className="text-[11px] font-mono text-[#66736C] dark:text-[#95A69E] mt-1.5 font-semibold">
                  {config?.thresholds?.critical ?? 80}+ pts
                </div>
              </div>
            </div>
          </div>

          {/* Active Rules Catalog */}
          <div className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg overflow-hidden shadow-xs">
            <div className="px-4 py-3 border-b border-[#ECEBE4] dark:border-[#283C35] flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[#202824] dark:text-[#E8EBE9] uppercase tracking-wider text-[11px]">
                Configured Rules ({rules.length})
              </h3>
              <span className="text-[11px] text-[#66736C] dark:text-[#A7C4B5] font-mono">rules/default_rules.yaml</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#ECEBE4] dark:bg-[#111B18] text-[#66736C] dark:text-[#95A69E] text-[11px] font-semibold border-b border-[#DCE2DB] dark:border-[#283C35]">
                  <tr>
                    <th className="py-2.5 px-3.5">Rule ID</th>
                    <th className="py-2.5 px-3.5">Name</th>
                    <th className="py-2.5 px-3.5">Severity</th>
                    <th className="py-2.5 px-3.5 text-right">Points</th>
                    <th className="py-2.5 px-3.5">Remediation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECEBE4] dark:divide-[#283C35] text-[#202824] dark:text-[#E8EBE9]">
                  {rules.map((r) => (
                    <tr key={r.id} className="hover:bg-[#ECEBE4]/50 dark:hover:bg-[#111B18]/60 transition-colors">
                      <td className="py-2 px-3.5 font-mono text-[11px] text-[#66736C] dark:text-[#A7C4B5]">{r.id}</td>
                      <td className="py-2 px-3.5 font-medium">{r.name}</td>
                      <td className="py-2 px-3.5"><RiskBadge level={r.severity} /></td>
                      <td className="py-2 px-3.5 text-right font-mono font-bold text-[#D77928]">+{r.score}</td>
                      <td className="py-2 px-3.5 text-[#66736C] dark:text-[#95A69E] text-[11px] leading-relaxed">{r.remediation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* High-Risk Permissions List */}
          <div className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg p-5 shadow-xs">
            <h3 className="text-xs font-semibold text-[#202824] dark:text-[#E8EBE9] uppercase tracking-wider text-[11px] mb-2">
              High-Risk Permission Scopes (Flagged by PERM_001)
            </h3>
            <p className="text-xs text-[#66736C] dark:text-[#95A69E] mb-3 leading-relaxed">
              When an application permission matches any scope in this list, rule PERM_001 fires (+50 points):
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
                  className="px-2 py-0.5 rounded font-mono text-[11px] bg-[#FDF2F2] text-[#C74444] border border-[#C74444]/30 dark:bg-[#202F2A] dark:text-[#E05A5A]"
                >
                  {perm}
                </span>
              ))}
            </div>
          </div>

          {/* Illustrative Rule YAML Example */}
          <div className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg p-5 shadow-xs">
            <h3 className="text-xs font-semibold text-[#202824] dark:text-[#E8EBE9] uppercase tracking-wider text-[11px] mb-1">
              Adding or Editing Rules in default_rules.yaml
            </h3>
            <p className="text-xs text-[#66736C] dark:text-[#95A69E] mb-3 leading-relaxed">
              Rules contain an identifier, human name, severity, score addition, and recommended remediation. Example schema structure:
            </p>
            <CopyableCode
              code={`rules:
  - id: CUSTOM_001
    name: "Custom security check description"
    severity: HIGH
    score: 30
    remediation: "Investigate and adjust identity permissions"`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SetupConfig;
