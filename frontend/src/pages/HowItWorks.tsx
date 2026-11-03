import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRules, getConfig, getFindings } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';

interface Rule {
  id: string;
  name: string;
  severity: string;
  score: number;
  remediation: string;
}

interface Config {
  thresholds: { critical: number; high: number; medium: number; low: number; none?: number };
  high_risk_permissions: string[];
  mode: string;
  version: string;
  last_audit_at: string | null;
}

const AUDIT_STEPS = [
  {
    num: '1',
    label: 'Collect',
    in: 'Entra ID tenant data: service principals, app registrations, managed identities',
    out: 'Raw identity objects with credentials, permissions, and OAuth grants',
    desc: 'Connects to Microsoft Graph API in read-only mode to retrieve all non-human identity records, credentials, and grant objects. In demo mode, uses synthetic tenant data.',
  },
  {
    num: '2',
    label: 'Normalise',
    in: 'Varying Graph API schemas across identity types',
    out: 'Uniform NHI data models with structured permissions and credentials',
    desc: 'Translates different Entra ID response shapes into a single canonical model, calculating expiry days and permission types.',
  },
  {
    num: '3',
    label: 'Analyse',
    in: 'Normalised identities and active rules configuration',
    out: 'Rule matches for credential status, permission blast radius, and publisher verification',
    desc: 'Evaluates each identity against 8 risk rules, checking for unverified vendors, AllPrincipals grants, and expiring secrets.',
  },
  {
    num: '4',
    label: 'Score',
    in: 'Triggered rule point values per identity',
    out: 'Calculated risk score and assigned risk level (Low, Medium, High, Critical)',
    desc: 'Sums triggered rule points and maps the total against severity thresholds to determine overall identity risk level.',
  },
  {
    num: '5',
    label: 'Report',
    in: 'All evaluated identities, risk scores, and evidence findings',
    out: 'Interactive dashboard, filtered identity inventory, and downloadable reports',
    desc: 'Surfaces actionable remediation steps, high-risk items, and audit artifacts in JSON and HTML formats.',
  },
];

const GLOSSARY = [
  {
    term: 'Service Principal',
    def: 'The local representation of an application within your specific Microsoft Entra ID tenant. It governs what the app can actually do in your directory.',
    link: '/identities',
    linkText: 'View identities',
  },
  {
    term: 'App Registration',
    def: 'The global blueprint and definition of an application across Microsoft Entra ID, where client credentials, identifiers, and redirect URIs are configured.',
    link: '/identities',
    linkText: 'View identities',
  },
  {
    term: 'Managed Identity',
    def: 'An automatically provisioned Entra identity for Azure cloud resources (e.g. VMs, Functions) that eliminates the need to manually store or rotate credentials.',
    link: '/identities',
    linkText: 'View identities',
  },
  {
    term: 'OAuth Grant',
    def: 'An authorisation delegating specific scopes to an application, either on behalf of an individual user (Principal) or tenant-wide (AllPrincipals).',
    link: '/findings',
    linkText: 'View grant findings',
  },
  {
    term: 'Credential',
    def: 'A password secret string or X.509 certificate used by an application to authenticate. Expired or unexpiring credentials present serious security risks.',
    link: '/identities',
    linkText: 'Inspect credentials',
  },
  {
    term: 'Verified Publisher',
    def: 'An organisation whose identity has been verified by Microsoft using the Microsoft Partner Network. Unverified publishers pose higher supply-chain risks.',
    link: '/setup',
    linkText: 'Check setup',
  },
  {
    term: 'AllPrincipals consent',
    def: 'An administrator-granted permission that applies to every single account in the organisation, giving the app tenant-wide access without user consent.',
    link: '/findings',
    linkText: 'View findings',
  },
];

const WHY_CHECKS = [
  {
    title: 'Expiring credentials',
    desc: 'Secrets and certificates approaching expiry cause sudden production outages when they fail. Passwords without expiry or lingering past expiry can remain exposed to attackers undetected for months.',
  },
  {
    title: 'High-risk permissions',
    desc: 'Privileges like Directory.ReadWrite.All or Mail.ReadWrite give broad access across the entire tenant. If an application holding them is compromised, the blast radius impacts all tenant users and resources.',
  },
  {
    title: 'Org-wide (AllPrincipals) consent',
    desc: 'When an admin consents on behalf of all principals, every current and future employee is automatically in scope. If the third-party vendor suffers a breach, your whole organisation is exposed.',
  },
  {
    title: 'Unverified publishers',
    desc: 'Anyone can build an Azure application and request permissions. Without Microsoft publisher verification, there is no verified company identity behind the integration, heightening supply-chain risks.',
  },
  {
    title: 'Disabled identities that still hold access',
    desc: 'When an account or service principal is disabled, active OAuth grants and permissions may remain intact. If the identity is accidentally re-enabled or bypassed, excessive privileges immediately reactivate.',
  },
];

export const HowItWorks: React.FC = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [workedExample, setWorkedExample] = useState<{
    name: string;
    findings: { rule_id: string; rule_name: string; score: number }[];
    total: number;
    level: string;
    isReal: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchAll = async () => {
      try {
        const [rulesData, configData] = await Promise.all([getRules(), getConfig()]);
        if (!active) return;
        setRules(rulesData);
        setConfig(configData);

        // Fetch findings to compute live worked example
        try {
          const findingsData = await getFindings();
          if (active && findingsData && findingsData.length > 0) {
            const rulesMap: Record<string, number> = {};
            rulesData.forEach((r: Rule) => { rulesMap[r.id] = r.score; });

            // Group by identity
            const grouped: Record<string, { name: string; findings: typeof findingsData }> = {};
            findingsData.forEach((f) => {
              const idKey = f.identity_id || f.identity_name || 'unknown';
              if (!grouped[idKey]) {
                grouped[idKey] = { name: f.identity_name || 'Unnamed Identity', findings: [] };
              }
              grouped[idKey].findings.push(f);
            });

            // Find highest risk identity
            let topIdentity: any = null;
            let topScore = -1;

            Object.values(grouped).forEach((group) => {
              let score = 0;
              group.findings.forEach((f) => {
                score += rulesMap[f.rule_id] || 20;
              });
              if (score > topScore) {
                topScore = score;
                topIdentity = {
                  name: group.name,
                  findings: group.findings.map((f) => ({
                    rule_id: f.rule_id,
                    rule_name: f.rule_name || f.title || f.rule_id,
                    score: rulesMap[f.rule_id] || 20,
                  })),
                  total: score,
                  level: score >= (configData?.thresholds?.critical ?? 80) ? 'Critical' : score >= (configData?.thresholds?.high ?? 50) ? 'High' : score >= (configData?.thresholds?.medium ?? 25) ? 'Medium' : 'Low',
                  isReal: true,
                };
              }
            });

            if (topIdentity) {
              setWorkedExample(topIdentity);
            }
          }
        } catch {
          // Fall back to sample
        }
      } catch (err) {
        console.error('Failed to load rules/config', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchAll();
    return () => { active = false; };
  }, []);

  const thresholds = config?.thresholds ?? {
    critical: 80,
    high: 50,
    medium: 25,
    low: 1,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-16">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#202824] dark:text-[#E8EBE9]">
          How it works
        </h1>
        <p className="text-xs sm:text-sm text-[#66736C] dark:text-[#95A69E] mt-1">
          A guide to non-human identity auditing, detection rules, and risk scoring methodology.
        </p>
      </div>

      {/* SECTION 1: What this tool does */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#66736C] dark:text-[#A7C4B5]">
          What this tool does
        </h2>
        <div className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg p-5 text-xs sm:text-sm text-[#202824] dark:text-[#E8EBE9] space-y-2.5 leading-relaxed shadow-xs">
          <p>
            It finds non-human identities, including applications, services, and automation accounts operating in your directory.
          </p>
          <p>
            It checks for excessive permissions, risky OAuth access, expiring or old credentials, unverified publishers, and other security risks supported by the actual rules.
          </p>
          <p>
            It is read-only and does not modify identities, permissions, credentials, or tenant configuration.
          </p>
        </div>
      </section>

      {/* SECTION 2: The five steps behind every audit (Connected Horizontal Flow) */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#66736C] dark:text-[#A7C4B5]">
            The five steps behind every audit
          </h2>
          <p className="text-xs text-[#66736C] dark:text-[#95A69E] mt-0.5">
            How data flows through the audit pipeline from initial collection to final reporting.
          </p>
        </div>

        {/* Process Flow: Connected sequence */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative">
          {AUDIT_STEPS.map((step, idx) => (
            <div
              key={step.num}
              className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg p-4 flex flex-col justify-between shadow-xs relative"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#147D68] text-white text-xs font-bold font-mono flex items-center justify-center shrink-0">
                    {step.num}
                  </span>
                  {idx < AUDIT_STEPS.length - 1 && (
                    <span className="hidden sm:inline-block text-[#A7C4B5] dark:text-[#147D68] text-xs font-bold font-mono">
                      &rarr;
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-xs text-[#202824] dark:text-[#E8EBE9] mb-1">
                  {step.label}
                </h3>
                <p className="text-[11px] text-[#66736C] dark:text-[#95A69E] leading-relaxed mb-3">
                  {step.desc}
                </p>
              </div>

              <div className="border-t border-[#ECEBE4] dark:border-[#283C35] pt-2.5 text-[10px] space-y-1 font-mono">
                <div>
                  <span className="font-semibold text-[#66736C] dark:text-[#95A69E]">In: </span>
                  <span className="text-[#202824] dark:text-[#E8EBE9]">{step.in}</span>
                </div>
                <div>
                  <span className="font-semibold text-[#66736C] dark:text-[#95A69E]">Out: </span>
                  <span className="text-[#202824] dark:text-[#E8EBE9]">{step.out}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: How a risk score is calculated */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#66736C] dark:text-[#A7C4B5]">
            How a risk score is calculated
          </h2>
          <p className="text-xs text-[#66736C] dark:text-[#95A69E] mt-0.5 leading-relaxed">
            Every triggered rule contributes its configured points according to the actual scoring implementation. Those points are combined to calculate the identity's total score, which determines its risk level.
          </p>
        </div>

        {/* Thresholds Scale */}
        <div className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg p-5 shadow-xs">
          <h3 className="text-xs font-semibold text-[#202824] dark:text-[#E8EBE9] mb-3 uppercase tracking-wider text-[11px]">
            Severity Score Thresholds
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
            <div className="p-3 rounded border border-[#DCE2DB] dark:border-[#283C35] bg-[#F5F4EF]/60 dark:bg-[#111B18]/60">
              <RiskBadge level="None" />
              <div className="text-[11px] font-mono text-[#66736C] dark:text-[#95A69E] mt-1.5 font-semibold">0 points</div>
            </div>
            <div className="p-3 rounded border border-[#DCE2DB] dark:border-[#283C35] bg-[#F5F4EF]/60 dark:bg-[#111B18]/60">
              <RiskBadge level="Low" />
              <div className="text-[11px] font-mono text-[#66736C] dark:text-[#95A69E] mt-1.5 font-semibold">
                {thresholds.low} – {thresholds.medium - 1} points
              </div>
            </div>
            <div className="p-3 rounded border border-[#DCE2DB] dark:border-[#283C35] bg-[#F5F4EF]/60 dark:bg-[#111B18]/60">
              <RiskBadge level="Medium" />
              <div className="text-[11px] font-mono text-[#66736C] dark:text-[#95A69E] mt-1.5 font-semibold">
                {thresholds.medium} – {thresholds.high - 1} points
              </div>
            </div>
            <div className="p-3 rounded border border-[#DCE2DB] dark:border-[#283C35] bg-[#F5F4EF]/60 dark:bg-[#111B18]/60">
              <RiskBadge level="High" />
              <div className="text-[11px] font-mono text-[#66736C] dark:text-[#95A69E] mt-1.5 font-semibold">
                {thresholds.high} – {thresholds.critical - 1} points
              </div>
            </div>
            <div className="p-3 rounded border border-[#DCE2DB] dark:border-[#283C35] bg-[#F5F4EF]/60 dark:bg-[#111B18]/60 col-span-2 sm:col-span-1">
              <RiskBadge level="Critical" />
              <div className="text-[11px] font-mono text-[#66736C] dark:text-[#95A69E] mt-1.5 font-semibold">
                {thresholds.critical}+ points
              </div>
            </div>
          </div>
        </div>

        {/* Live Rules Table */}
        <div className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg overflow-hidden shadow-xs">
          <div className="px-4 py-3 border-b border-[#ECEBE4] dark:border-[#283C35] flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[#202824] dark:text-[#E8EBE9] uppercase tracking-wider text-[11px]">
              Live Detection Rules ({rules.length} Active in Engine)
            </h3>
            <span className="text-[11px] font-mono text-[#66736C] dark:text-[#A7C4B5]">
              rules/default_rules.yaml
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#ECEBE4] dark:bg-[#111B18] text-[#66736C] dark:text-[#95A69E] text-[11px] font-semibold border-b border-[#DCE2DB] dark:border-[#283C35]">
                <tr>
                  <th className="py-2.5 px-3.5">Rule ID</th>
                  <th className="py-2.5 px-3.5">What it checks</th>
                  <th className="py-2.5 px-3.5">Severity</th>
                  <th className="py-2.5 px-3.5 text-right">Points</th>
                  <th className="py-2.5 px-3.5">How to fix it</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEBE4] dark:divide-[#283C35] text-[#202824] dark:text-[#E8EBE9]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-[#66736C]">
                      Loading detection rules from backend...
                    </td>
                  </tr>
                ) : rules.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-[#66736C]">
                      No rules loaded.
                    </td>
                  </tr>
                ) : (
                  rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-[#ECEBE4]/50 dark:hover:bg-[#111B18]/60 transition-colors">
                      <td className="py-2.5 px-3.5 font-mono text-[11px] text-[#66736C] dark:text-[#A7C4B5] whitespace-nowrap">
                        {rule.id}
                      </td>
                      <td className="py-2.5 px-3.5 font-medium">
                        {rule.name}
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <RiskBadge level={rule.severity} />
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold text-[#D77928]">
                        +{rule.score}
                      </td>
                      <td className="py-2.5 px-3.5 text-[#66736C] dark:text-[#95A69E] text-[11px] leading-relaxed">
                        {rule.remediation}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Worked Example */}
        <div className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-[#202824] dark:text-[#E8EBE9] uppercase tracking-wider text-[11px]">
              Worked Example: How a Score is Built
            </h3>
            <span className="text-[11px] font-mono text-[#66736C] dark:text-[#95A69E]">
              {workedExample?.isReal ? 'Live Audit Result' : 'Illustrative Sample'}
            </span>
          </div>

          {workedExample ? (
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#202824] dark:text-[#E8EBE9]">
                <span>{workedExample.name}</span>
                <RiskBadge level={workedExample.level} />
              </div>

              <div className="border border-[#DCE2DB] dark:border-[#283C35] rounded p-3.5 bg-[#F5F4EF] dark:bg-[#111B18] space-y-2 font-mono text-[11px]">
                {workedExample.findings.map((f, i) => (
                  <div key={i} className="flex justify-between items-center text-[#202824] dark:text-[#E8EBE9]">
                    <span>
                      {f.rule_id} ({f.rule_name})
                    </span>
                    <span className="font-semibold text-[#D77928]">+{f.score} pts</span>
                  </div>
                ))}
                <div className="border-t border-[#DCE2DB] dark:border-[#283C35] pt-2 mt-2 flex justify-between items-center font-bold text-xs text-[#202824] dark:text-[#E8EBE9]">
                  <span>Total Calculated Score</span>
                  <span>{workedExample.total} pts &rarr; {workedExample.level}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#202824] dark:text-[#E8EBE9]">
                <span>Legacy CRM Connector (Illustrative Sample)</span>
                <RiskBadge level="Critical" />
              </div>
              <div className="border border-[#DCE2DB] dark:border-[#283C35] rounded p-3.5 bg-[#F5F4EF] dark:bg-[#111B18] space-y-2 font-mono text-[11px]">
                <div className="flex justify-between items-center text-[#202824] dark:text-[#E8EBE9]">
                  <span>CRED_002 (Credential expiring within 14 days)</span>
                  <span className="font-semibold text-[#D77928]">+45 pts</span>
                </div>
                <div className="flex justify-between items-center text-[#202824] dark:text-[#E8EBE9]">
                  <span>PERM_001 (High-risk application permission)</span>
                  <span className="font-semibold text-[#D77928]">+50 pts</span>
                </div>
                <div className="border-t border-[#DCE2DB] dark:border-[#283C35] pt-2 mt-2 flex justify-between items-center font-bold text-xs text-[#C74444]">
                  <span>Total Score</span>
                  <span>95 &rarr; Critical (Score &ge; 80)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 4: Why these checks matter */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#66736C] dark:text-[#A7C4B5]">
          Why these checks matter
        </h2>
        <div className="grid grid-cols-1 gap-2.5">
          {WHY_CHECKS.map((item) => (
            <div
              key={item.title}
              className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg p-4 shadow-xs"
            >
              <h3 className="text-xs font-semibold text-[#202824] dark:text-[#E8EBE9] mb-1">
                {item.title}
              </h3>
              <p className="text-xs text-[#66736C] dark:text-[#95A69E] leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5: Glossary */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#66736C] dark:text-[#A7C4B5]">
          Glossary
        </h2>
        <div className="bg-[#FFFFFF] dark:bg-[#182622] border border-[#DCE2DB] dark:border-[#283C35] rounded-lg divide-y divide-[#ECEBE4] dark:divide-[#283C35] shadow-xs">
          {GLOSSARY.map((entry) => (
            <div key={entry.term} className="p-4 text-xs flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <div>
                <span className="font-semibold text-[#202824] dark:text-[#E8EBE9] block mb-0.5">
                  {entry.term}
                </span>
                <span className="text-[#66736C] dark:text-[#95A69E] leading-relaxed">
                  {entry.def}
                </span>
              </div>
              {entry.link && (
                <Link
                  to={entry.link}
                  className="text-[#147D68] dark:text-[#2DD4BF] hover:underline whitespace-nowrap text-[11px] font-semibold shrink-0"
                >
                  {entry.linkText} &rarr;
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;
