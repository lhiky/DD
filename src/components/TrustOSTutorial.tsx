/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Compass,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Cpu,
  Sparkles,
  Zap,
  Globe,
  FileCheck,
  ChevronRight,
  X,
  Lock,
  Play
} from 'lucide-react';

interface TrustOSTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string) => void;
  onInstallExtension: (id: string) => void;
  installedExtensions: string[];
}

export default function TrustOSTutorial({
  isOpen,
  onClose,
  onNavigateTab,
  onInstallExtension,
  installedExtensions
}: TrustOSTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to your Trust Operating System",
      badge: "Platform Overview",
      description: "Welcome to the Sovereign Trust-OS Platform. This command center is used by security teams, compliance officers, and executive officers to monitor software supply chain security, catalog dependencies, and enforce continuous security sign-off. The platform is structured around single-responsibility core tasks and modular extensions.",
      actionLabel: "Let's Begin the Tour",
      icon: ShieldCheck,
      action: () => {}
    },
    {
      title: "Pillar 1: Discover Technology",
      badge: "Core Operation 1/4",
      description: "Under the core operations, 'Continuous Scanner' acts as the primary sensory ingestion node. It continuously scans your network architectures, cloud platforms, and third-party SaaS hubs to catalog raw technologies.",
      actionLabel: "View Scanner",
      icon: Compass,
      action: () => {
        onNavigateTab('scans');
      }
    },
    {
      title: "Pillar 2: Classify Technology",
      badge: "Core Operation 2/4",
      description: "Once discovered, technology must be classified. Under 'Server Assets', the system maps items into environment boundaries (Production, Staging, Legacy), categorizes vendors, and assigns critical severity ratings.",
      actionLabel: "View Asset Classifier",
      icon: Layers,
      action: () => {
        onNavigateTab('assets');
      }
    },
    {
      title: "Pillar 3: Create Software Passports",
      badge: "Core Operation 3/4",
      description: "For every verified technology asset, SPR generates a cryptographic 'Software Passport'. A Passport acts as an immutable ledger containing licensing info, cryptographic signatures, and vulnerability profiles.",
      actionLabel: "View Software Passports",
      icon: FileCheck,
      action: () => {
        onNavigateTab('passports');
      }
    },
    {
      title: "Pillar 4: Build the Trust Graph",
      badge: "Core Operation 4/4",
      description: "The crown jewel of the core is the Trust Graph, rendered under the 'Trust OS Layer' tab. It renders an elegant 2D living topology modeling security nodes and key risk highlights, designed as a commanding executive center.",
      actionLabel: "View Trust Graph Center",
      icon: Globe,
      action: () => {
        onNavigateTab('trust-os');
      }
    },
    {
      title: "Everything Else is an Extension!",
      badge: "Extensible Design",
      description: "Instead of overwhelming users with bloated layouts, we treat secondary modules as plugins! Users install only what their organization requires. Try installing the 'AI Security Swarm' or 'SOC 2 Audit Engine' in our marketplace to instantly unlock capability dashboards in the active sidebar.",
      actionLabel: "Go to Extension Marketplace",
      icon: Cpu,
      action: () => {
        onNavigateTab('marketplace');
      }
    },
    {
      title: "SPR Compliance Advisor",
      badge: "Continuous Guidance",
      description: "Check out the bottom of the Trust Graph page to consult the SPR Advisor. Access instant remediation guidelines, look up detailed compliance mapping, and view active alerts for security risks resolved by the platform.",
      actionLabel: "Explore Command Center",
      icon: Sparkles,
      action: () => {
        onNavigateTab('trust-os');
      }
    }
  ];

  if (!isOpen) return null;

  const stepInfo = steps[currentStep];
  const StepIcon = stepInfo.icon;

  const handleNext = () => {
    stepInfo.action();
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevStep = steps[currentStep - 1];
      prevStep.action();
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
      <div className="bg-[#0c1224] border border-slate-800/90 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative overflow-hidden text-left animate-in fade-in zoom-in duration-250">
        
        {/* Glow background accent */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Header bar */}
        <div className="flex justify-between items-center border-b border-slate-800/60 pb-4.5 relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600/10 text-indigo-400 rounded-lg border border-indigo-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest leading-none">Interactive Guide</span>
              <h3 className="text-sm font-display font-black text-white mt-1 block leading-none">Trust-OS Platform Tour</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-[#111625] border border-slate-800 text-slate-400 hover:text-white rounded-xl cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Section */}
        <div className="my-6 space-y-4.5 relative z-10 min-h-[170px]">
          
          <div className="flex justify-between items-center">
            <span className="px-2.5 py-1 bg-indigo-600/10 border border-indigo-500/20 text-indigo-300 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider">
              {stepInfo.badge}
            </span>

            <span className="text-xs font-mono text-slate-400">
              {currentStep + 1} of {steps.length}
            </span>
          </div>

          <div className="flex gap-4 items-start pt-1">
            <div className="p-3.5 bg-[#111625] border border-slate-800 rounded-2xl text-indigo-400 shrink-0">
              <StepIcon className="w-6 h-6" />
            </div>
            <div className="space-y-2 text-left">
              <h4 className="text-base font-display font-black text-white tracking-tight">
                {stepInfo.title}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {stepInfo.description}
              </p>
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="flex justify-between items-center border-t border-slate-800/60 pt-5 mt-4 relative z-10">
          <div className="flex gap-1">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 w-4 rounded-full transition-all duration-200 ${
                  idx === currentStep ? 'bg-indigo-500 w-8' : idx < currentStep ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1.5 px-3.5 py-2 hover:bg-[#111625] border border-slate-800/80 rounded-xl text-slate-300 text-xs font-bold cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all shadow-md"
            >
              <span>{stepInfo.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
