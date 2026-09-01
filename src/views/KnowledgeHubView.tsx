import React, { useState } from 'react';
import { 
  BookOpen, 
  ShieldCheck, 
  CheckCircle2, 
  Layers, 
  Swords, 
  FileText, 
  HelpCircle,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Calculator,
  Lock,
  Globe,
  Tag,
  Package,
  Clock,
  Radio,
  FileCheck2,
  Info
} from 'lucide-react';
import { EVOCHECK_MASTER_KNOWLEDGE, EVOCHECK_MASTER_SOURCES } from '../data/productKnowledge';
import { ProductClaim, CompetitorProduct, ProductSourceType } from '../types';

interface KnowledgeHubViewProps {
  knowledge?: any;
}

export const KnowledgeHubView: React.FC<KnowledgeHubViewProps> = ({ knowledge }) => {
  const [activeTab, setActiveTab] = useState<'specs' | 'pricing' | 'sources' | 'claims' | 'quarantined' | 'battlecards' | 'objections'>('specs');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');

  const kb = EVOCHECK_MASTER_KNOWLEDGE;
  const core = kb.core_specifications;
  const pricing = kb.pricing;

  const verifiedClaims: ProductClaim[] = knowledge?.claims || kb.verified_claims;
  const quarantinedClaims: ProductClaim[] = knowledge?.quarantinedClaims || kb.quarantined_claims;
  const competitorsList: CompetitorProduct[] = knowledge?.competitors || kb.competitors;
  const objectionList = kb.objection_guidelines;
  const sourcesRegistry = kb.sources_registry || EVOCHECK_MASTER_SOURCES;

  const filteredClaims = verifiedClaims.filter(claim => {
    if (sourceFilter === 'ALL') return true;
    return claim.source_type === sourceFilter;
  });

  const getSourceBadgeColor = (type: ProductSourceType) => {
    switch (type) {
      case 'OFFICIAL_COMPANY_WEBSITE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'OFFICIAL_PRODUCT_DOCUMENT':
      case 'OFFICIAL_TECHNICAL_DOSSIER':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'OFFICIAL_IFU':
      case 'OFFICIAL_IFU_LABEL':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REGULATORY_DOCUMENT':
      case 'DRAP_REGULATORY_RECORD':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'PROJECT_VERIFIED_INFORMATION':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getSourceLabel = (type: ProductSourceType) => {
    switch (type) {
      case 'OFFICIAL_COMPANY_WEBSITE':
        return 'Official Company Website';
      case 'OFFICIAL_PRODUCT_DOCUMENT':
      case 'OFFICIAL_TECHNICAL_DOSSIER':
        return 'Official Product Technical Dossier';
      case 'OFFICIAL_IFU':
      case 'OFFICIAL_IFU_LABEL':
        return 'Official Instructions for Use (IFU)';
      case 'REGULATORY_DOCUMENT':
      case 'DRAP_REGULATORY_RECORD':
        return 'DRAP Regulatory Document';
      case 'PROJECT_VERIFIED_INFORMATION':
        return 'Derived Metric (Calculated)';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-sky-50 text-[#0ea5e9] border border-sky-100">
              Master Knowledge Base {kb.version}
            </span>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              DRAP Approved Medical Device
            </span>
            <a 
              href="https://mypharmevo.pk/products/evocheck-premium-linx-cgm" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[10px] text-blue-700 font-semibold bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1 transition-colors"
            >
              <Globe className="w-3 h-3" />
              Official Website Synced
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
          <h2 className="text-xl font-bold text-[#0f172a] tracking-tight mt-1">
            {kb.product_name} Knowledge & Evidence Hub
          </h2>
          <p className="text-xs text-[#64748b]">
            Multi-Source Provenance System & Clinical Source of Truth for Medical Representatives
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-xs font-bold text-[#0f172a] bg-[#f8fafc] px-3 py-1.5 rounded-lg border border-[#e2e8f0]">
            MARD: <strong className="text-[#0ea5e9]">{core.mard.value}%</strong>
          </div>
          <div className="text-xs font-bold text-[#0f172a] bg-[#f8fafc] px-3 py-1.5 rounded-lg border border-[#e2e8f0]">
            Wear: <strong className="text-[#0ea5e9]">{core.wear_duration.value} Days</strong>
          </div>
          <div className="text-xs font-bold text-[#0f172a] bg-[#f8fafc] px-3 py-1.5 rounded-lg border border-[#e2e8f0]">
            Warranty: <strong className="text-emerald-700">{core.replacement_warranty.value} Days</strong>
          </div>
          <div className="text-xs font-bold text-[#0f172a] bg-[#f8fafc] px-3 py-1.5 rounded-lg border border-[#e2e8f0]">
            Ingress: <strong className="text-[#0ea5e9]">{core.water_resistance.value}</strong>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-[#e2e8f0] w-fit shadow-2xs overflow-x-auto max-w-full">
        <button
          onClick={() => setActiveTab('specs')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'specs' ? 'bg-[#0f172a] text-white shadow-xs' : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          Product Specs
        </button>
        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'pricing' ? 'bg-[#0f172a] text-white shadow-xs' : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          Pricing Tiers
        </button>
        <button
          onClick={() => setActiveTab('sources')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'sources' ? 'bg-[#0f172a] text-white shadow-xs' : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          Source Provenance ({sourcesRegistry.length})
        </button>
        <button
          onClick={() => setActiveTab('claims')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'claims' ? 'bg-[#0f172a] text-white shadow-xs' : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          Approved Claims ({verifiedClaims.length})
        </button>
        <button
          onClick={() => setActiveTab('quarantined')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'quarantined' ? 'bg-amber-800 text-white shadow-xs' : 'text-amber-800 hover:text-amber-950'
          }`}
        >
          Quarantined Claims ({quarantinedClaims.length})
        </button>
        <button
          onClick={() => setActiveTab('battlecards')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'battlecards' ? 'bg-[#0f172a] text-white shadow-xs' : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          Competitor Battlecards ({competitorsList.length})
        </button>
        <button
          onClick={() => setActiveTab('objections')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'objections' ? 'bg-[#0f172a] text-white shadow-xs' : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          Objection Handling ({objectionList.length})
        </button>
      </div>

      {/* Tab 1: Product Specs */}
      {activeTab === 'specs' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Accuracy Card */}
            <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-[#0ea5e9]">Accuracy & Precision</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {core.mard.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#0f172a]">{core.mard.value}% MARD</h3>
                <p className="text-xs text-[#64748b] leading-relaxed">
                  Mean Absolute Relative Difference (MARD) verified across sensor lifecycle. Verified Product Specification (do not characterize as clinical target).
                </p>
              </div>
              <div className="pt-2 border-t border-[#f1f5f9] text-[11px] text-[#334155] space-y-1">
                <div className="flex items-center justify-between text-[#64748b]">
                  <span>Status:</span>
                  <strong className="text-[#0f172a]">{core.mard.label}</strong>
                </div>
                <div className="flex items-center justify-between text-[#64748b]">
                  <span>Source:</span>
                  <span className="font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 text-[10px]">
                    Technical Dossier
                  </span>
                </div>
              </div>
            </div>

            {/* Wear Duration & Water Resistance */}
            <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-[#0ea5e9]">Wear & Water Ingress</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {core.wear_duration.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#0f172a]">{core.wear_duration.value} Continuous Days</h3>
                <p className="text-xs text-[#64748b] leading-relaxed">
                  Single sensor deployment provides up to 15 continuous days of wear. Rated <strong>{core.water_resistance.value}</strong> for ingress protection and water/sweat resistant for patient showers and exercise.
                </p>
              </div>
              <div className="pt-2 border-t border-[#f1f5f9] text-[11px] text-[#334155] space-y-1">
                <div className="flex items-center justify-between text-[#64748b]">
                  <span>Water Rating:</span>
                  <strong className="text-[#0f172a]">{core.water_resistance.value} (IEC 60529)</strong>
                </div>
                <div className="flex items-center justify-between text-[#64748b]">
                  <span>Sources:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">Website</span>
                    <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">Dossier</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Connectivity & Sampling Frequency */}
            <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-[#0ea5e9]">Connectivity & Telemetry</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {core.reading_interval.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#0f172a]">1-Minute Telemetry Stream</h3>
                <p className="text-xs text-[#64748b] leading-relaxed">
                  Continuous glucose readings transmitted via <strong>{core.connectivity.value}</strong> directly to smartphone app with no dedicated hardware reader required.
                </p>
              </div>
              <div className="pt-2 border-t border-[#f1f5f9] text-[11px] text-[#334155] space-y-1">
                <div className="flex items-center justify-between text-[#64748b]">
                  <span>Reader:</span>
                  <strong className="text-[#0f172a]">No Reader Required (Direct Mobile)</strong>
                </div>
                <div className="flex items-center justify-between text-[#64748b]">
                  <span>Protocol:</span>
                  <strong className="text-[#0f172a]">BLE Telemetry</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Sensor Wear vs Warranty Distinction Banner */}
          <div className="bg-gradient-to-r from-sky-50/60 to-emerald-50/60 p-5 rounded-2xl border border-sky-200 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-white border border-sky-200 text-[#0ea5e9] shrink-0 mt-0.5">
                <Info className="w-5 h-5" />
              </div>
              <div className="space-y-2 w-full">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-sm font-bold text-[#0f172a]">
                    Critical Distinction: 15-Day Sensor Wear Lifespan vs 12-Day Replacement Warranty
                  </h4>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Knowledge Rule
                  </span>
                </div>
                <p className="text-xs text-[#334155] leading-relaxed">
                  Medical representatives must maintain a clear distinction between sensor monitoring duration and the manufacturer replacement policy:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="bg-white p-3 rounded-xl border border-sky-100 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#0f172a]">
                      <Clock className="w-3.5 h-3.5 text-[#0ea5e9]" />
                      <span>Sensor Wear Duration: 15 Days</span>
                    </div>
                    <p className="text-[11px] text-[#64748b] mt-1">
                      Continuous operating lifecycle providing up to 15 days of glucose trend tracking per sensor.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Replacement Warranty: 12 Days</span>
                    </div>
                    <p className="text-[11px] text-[#64748b] mt-1">
                      Manufacturer replacement guarantee policy on official website for technical defect support.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Package Contents & Calibration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#0ea5e9]" />
                  <h4 className="text-sm font-bold text-[#0f172a]">Standard Packaging Pack</h4>
                </div>
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  Website Confirmed
                </span>
              </div>
              <p className="text-xs text-[#64748b]">
                Each official retail box contains everything needed for sensor deployment:
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {core.package_contents.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] text-xs font-semibold text-[#0f172a]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#0ea5e9]" />
                  <h4 className="text-sm font-bold text-[#0f172a]">Calibration & App Integration</h4>
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  Verified
                </span>
              </div>
              <p className="text-xs text-[#64748b]">
                Factory-calibrated sensor requires <strong>no routine finger-prick testing</strong>. Mobile app integration provides continuous glucose trend tracking with customizable alerts.
              </p>
              <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] text-xs text-[#334155] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[#64748b]">Routine Finger-Pricks:</span>
                  <strong className="text-emerald-700">None Required</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748b]">App Alerts:</span>
                  <strong className="text-[#0f172a]">High / Low Real-Time Insights</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Derived / Calculated Values Panel */}
          <div className="bg-[#f8fafc] p-5 rounded-2xl border border-[#e2e8f0] shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#0ea5e9]" />
              <h4 className="text-sm font-bold text-[#0f172a]">Derived Mathematical Telemetry Figures [CALCULATED_VALUE]</h4>
            </div>
            <p className="text-xs text-[#64748b]">
              These values are calculated from the verified 1-minute sampling interval and 15-day sensor lifespan. They are labeled as mathematical derivations and not independent manufacturer claims.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-white p-3.5 rounded-xl border border-[#e2e8f0]">
                <div className="flex items-center justify-between text-xs text-[#64748b]">
                  <span>Daily Theoretical Readings:</span>
                  <span className="text-[10px] font-mono bg-sky-50 text-[#0ea5e9] px-1.5 py-0.5 rounded">CALCULATED</span>
                </div>
                <p className="text-lg font-black text-[#0f172a] mt-1">~1,440 readings / day</p>
                <p className="text-[11px] text-[#64748b] font-mono mt-0.5">{core.daily_readings_calculated.formula}</p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#e2e8f0]">
                <div className="flex items-center justify-between text-xs text-[#64748b]">
                  <span>Total Sensor Readings:</span>
                  <span className="text-[10px] font-mono bg-sky-50 text-[#0ea5e9] px-1.5 py-0.5 rounded">CALCULATED</span>
                </div>
                <p className="text-lg font-black text-[#0f172a] mt-1">~21,600 readings / 15 days</p>
                <p className="text-[11px] text-[#64748b] font-mono mt-0.5">{core.sensor_readings_calculated.formula}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Pricing Tiers */}
      {activeTab === 'pricing' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Lock className="w-4 h-4 text-amber-700" />
              <span>Commercial Pricing Policy & Channels</span>
            </div>
            <p>
              To maintain regulatory and commercial compliance, separate pricing categories are established. Medical representatives must <strong>NEVER</strong> treat the internal distributor price as public patient retail price, and must quote official prices with proper provenance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category 1: Authorized Distributor Price */}
            <div className="bg-white p-5 rounded-2xl border-2 border-emerald-300 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Trade / Internal
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    AUTHORIZED
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#0f172a]">DISTRIBUTOR_PRICE</h3>
                <p className="text-xs text-[#64748b]">
                  Authorized internal trade & distributor price per EvoCheck Premium Linx sensor/unit.
                </p>

                <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] space-y-1.5 mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#64748b]">Classification:</span>
                    <span className="font-bold text-slate-800 text-[11px]">DISTRIBUTOR_PRICE</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-[#0f172a]">Distributor Rate:</span>
                    <span className="font-black text-emerald-700 text-base">PKR 12,900</span>
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold pt-1 border-t border-[#e2e8f0] flex items-center justify-between">
                    <span>Visibility: INTERNAL ONLY</span>
                    <span>Per Unit / 15 Days</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#f1f5f9] space-y-1.5">
                <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-0.5">
                  <div className="font-semibold text-slate-700">Source: COMPANY_FIELD_DATA</div>
                  <div className="text-[10px] text-slate-500">Doc: Company Distributor Schedule COM-EVO-2026-Q3</div>
                </div>
                <p className="text-[10px] text-amber-800 font-medium">
                  Do not quote to patients as official public selling price.
                </p>
              </div>
            </div>

            {/* Category 2: Public Retail Price */}
            <div className="bg-white p-5 rounded-2xl border-2 border-blue-200 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Direct-to-Consumer
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    20% OFF SALE
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#0f172a]">PUBLIC_RETAIL_PRICE</h3>
                <p className="text-xs text-[#64748b]">
                  Official direct consumer retail listing on MyPharmEvo web store.
                </p>

                <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] space-y-1 mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#64748b]">Regular Price:</span>
                    <span className="line-through text-[#94a3b8] font-bold">PKR 17,000</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-[#0f172a]">Current Sale Price:</span>
                    <span className="font-black text-blue-700 text-base">PKR 13,600</span>
                  </div>
                  <div className="text-[10px] text-blue-700 font-semibold pt-1 border-t border-[#e2e8f0] flex items-center justify-between">
                    <span>Visibility: PUBLIC</span>
                    <span>Status: WEB_VERIFIED</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#f1f5f9] space-y-2">
                <a
                  href="https://mypharmevo.pk/products/evocheck-premium-linx-cgm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  <span>View on MyPharmEvo.pk</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <p className="text-[10px] text-[#64748b] text-center">
                  Official public patient pricing for direct online purchases.
                </p>
              </div>
            </div>

            {/* Category 3: Institutional Price */}
            <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-2xs space-y-3 flex flex-col justify-between opacity-90">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-[#64748b] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Hospital / Tenders
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    Pending Config
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#0f172a]">INSTITUTIONAL_PRICE</h3>
                <p className="text-xs text-[#64748b]">
                  Institutional rate card for tertiary hospital procurement & endocrine departments.
                </p>

                <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] space-y-2 mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#64748b]">Configured Price:</span>
                    <span className="font-bold text-[#0f172a]">Not Configured</span>
                  </div>
                  <div className="text-[11px] text-amber-900 bg-amber-50 p-2 rounded border border-amber-200">
                    Institutional bulk contract pricing pending commercial committee authorization.
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#f1f5f9] text-[10px] text-[#64748b]">
                Status: <strong>NOT_CONFIGURED</strong>. Tender quotations require authorized sign-off.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Sources & Provenance Registry */}
      {activeTab === 'sources' && (
        <div className="space-y-4">
          <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl text-xs text-sky-950 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-[#0ea5e9]" />
              <span>Multi-Source Provenance Hierarchy & Authoritative Tiers</span>
            </div>
            <p>
              The MedRep AI system rigorously maintains provenance for every product claim. Claims are tied to specific verified source documents, distinguishing technical engineering records from commercial website features.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sourcesRegistry.map((src) => (
              <div key={src.id} className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-2xs space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getSourceBadgeColor(src.source_type)}`}>
                      {getSourceLabel(src.source_type)}
                    </span>
                    <span className="text-[10px] font-mono text-[#64748b] bg-[#f8fafc] px-2 py-0.5 rounded border border-[#e2e8f0]">
                      Rank #{src.provenance_rank}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#0f172a]">{src.title}</h3>
                  <p className="text-xs text-[#64748b] leading-relaxed">
                    {src.description}
                  </p>
                  {src.reference && (
                    <div className="text-[11px] text-[#334155] font-mono bg-[#f8fafc] p-2 rounded-lg border border-[#e2e8f0]">
                      <strong>Reference:</strong> {src.reference}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#f1f5f9] flex items-center justify-between text-xs text-[#64748b]">
                  <span>Last Verified: <strong>{src.last_verified}</strong></span>
                  {src.url && (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Approved Claims */}
      {activeTab === 'claims' && (
        <div className="space-y-4">
          {/* Source Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-[#64748b] whitespace-nowrap">Filter by Source:</span>
            {['ALL', 'OFFICIAL_COMPANY_WEBSITE', 'OFFICIAL_PRODUCT_DOCUMENT', 'OFFICIAL_IFU', 'REGULATORY_DOCUMENT', 'PROJECT_VERIFIED_INFORMATION'].map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => setSourceFilter(filterKey)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  sourceFilter === filterKey
                    ? 'bg-[#0f172a] text-white'
                    : 'bg-white text-[#64748b] border border-[#e2e8f0] hover:bg-[#f8fafc]'
                }`}
              >
                {filterKey === 'ALL' ? 'All Sources' : getSourceLabel(filterKey as ProductSourceType)}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredClaims.map((claim) => (
              <div
                key={claim.claim_id || (claim as any).id}
                className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-sky-50 text-[#0ea5e9] border border-sky-100">
                      {claim.claim_type || (claim as any).category}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getSourceBadgeColor(claim.source_type)}`}>
                      {getSourceLabel(claim.source_type)}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {claim.verification_status || 'VERIFIED'}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#64748b] font-mono">
                    {claim.claim_id || (claim as any).id}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-[#0f172a]">
                  "{claim.claim_text || (claim as any).claimText}"
                </h4>

                {claim.sources && claim.sources.length > 0 && (
                  <div className="p-2.5 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] text-[11px] space-y-1">
                    <span className="font-bold text-[#334155]">Multi-Source Verification:</span>
                    <ul className="space-y-1 text-[#64748b]">
                      {claim.sources.map((s, sIdx) => (
                        <li key={sIdx} className="flex items-center justify-between">
                          <span>• {s.source_title} {s.source_reference ? `(${s.source_reference})` : ''}</span>
                          {s.source_url && (
                            <a href={s.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-0.5">
                              <span>Link</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-2 border-t border-[#f1f5f9] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-[#64748b]">
                  <p>
                    <strong>Primary Document:</strong> {claim.source_document || (claim as any).clinicalSource || (claim as any).evidenceSource || claim.source_reference || claim.source_type}
                  </p>
                  <p className="text-[#94a3b8]">Review Date: {claim.review_date || claim.effective_date || (claim as any).effectiveDate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Quarantined Claims */}
      {activeTab === 'quarantined' && (
        <div className="space-y-3">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>Quarantined & Unverified Claims Guardrail</span>
            </div>
            <p>
              The following claims have been quarantined from active CRM and AI Coach generation because they lack direct, peer-reviewed clinical proof or official price verification. Medical representatives are strictly prohibited from using these claims.
            </p>
          </div>

          {quarantinedClaims.map((q) => (
            <div
              key={q.claim_id || (q as any).id}
              className="bg-white p-5 rounded-2xl border border-red-200 shadow-2xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                  QUARANTINED
                </span>
                <span className="text-[10px] text-[#64748b] font-mono">
                  {q.claim_id || (q as any).id}
                </span>
              </div>
              <h4 className="text-sm font-bold text-[#0f172a]">
                "{q.claim_text || (q as any).headline}"
              </h4>
              <div className="p-3 bg-[#fff7ed] border border-[#ffedd5] rounded-xl text-xs text-[#9a3412]">
                <strong>Quarantine Reason:</strong> {q.notes || (q as any).reason}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 6: Competitor Battlecards */}
      {activeTab === 'battlecards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {competitorsList.map((comp) => (
            <div
              key={comp.brand_name || (comp as any).brandName || (comp as any).name}
              className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-2xs space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Swords className="w-4 h-4 text-[#0ea5e9]" />
                  <h3 className="text-base font-bold text-[#0f172a]">{comp.brand_name || (comp as any).brandName || (comp as any).name}</h3>
                </div>
                <span className="text-[10px] font-bold text-[#64748b] uppercase">
                  {comp.manufacturer}
                </span>
              </div>

              <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-[#94a3b8] uppercase">Their Published MARD:</span>
                  <p className="font-bold text-[#0f172a]">{comp.claimed_mard || (comp as any).mardRating || (comp as any).mardClaim}%</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#94a3b8] uppercase">Their Wear Duration:</span>
                  <p className="font-bold text-[#0f172a]">{comp.wear_duration_days || (comp as any).wearDurationDays} Days</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  EvoCheck Verified Differentiators
                </span>
                <ul className="mt-1 space-y-1 text-xs text-[#334155] font-medium">
                  {(comp.approved_comparison_facts || (comp as any).approvedCounterArguments)?.map((arg: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{arg}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-red-50/60 border border-red-200 rounded-xl">
                <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">
                  Their Known Limitation
                </span>
                <ul className="mt-1 space-y-0.5 text-xs text-red-950 font-medium">
                  {(comp.weaknesses || (comp as any).keyWeaknesses)?.map((w: string, idx: number) => (
                    <li key={idx}>• {w}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 7: Objection Library */}
      {activeTab === 'objections' && (
        <div className="space-y-3">
          {objectionList.map((obj) => (
            <div
              key={obj.id}
              className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  Doctor Objection • {obj.category}
                </span>
                <span className="text-[10px] font-mono text-[#64748b]">{obj.id}</span>
              </div>
              <h4 className="text-sm font-bold text-[#0f172a]">
                "{obj.doctorStatement}"
              </h4>
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  Approved Compliant Response:
                </span>
                <p className="text-xs font-semibold text-emerald-950 leading-relaxed">
                  {obj.compliantResponse}
                </p>
              </div>
              <div className="p-2.5 bg-amber-50/50 border border-amber-200 rounded-lg text-xs text-amber-900">
                <strong>What NOT to say:</strong> {obj.what_not_to_say}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
