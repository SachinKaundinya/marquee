'use client';

import React from 'react';
import { X, Check, Tv, Sparkles } from 'lucide-react';
import { useMedia, ALL_SERVICES } from '@/context/MediaContext';
import { motion, AnimatePresence } from 'framer-motion';
import { drawerTransition, tapScale } from '@/tokens/motion';

export function ServicesModal() {
  const {
    isServicesModalOpen,
    closeServicesModal,
    subscribedServices,
    toggleSubscribedService,
    setSubscribedServices,
  } = useMedia();

  if (!isServicesModalOpen) return null;

  const handleSelectAll = () => {
    setSubscribedServices([...ALL_SERVICES]);
  };

  const handleClearAll = () => {
    setSubscribedServices([]);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          onClick={closeServicesModal}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 8 }}
          transition={drawerTransition}
          className="relative w-full max-w-lg rounded-2xl bg-[#14161B] border border-white/[0.08] shadow-[0_24px_64px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.06)] p-6 z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[#F3F4F6]">
                <Tv className="w-4 h-4 stroke-[1.5]" />
              </div>
              <div>
                <h3 className="text-base font-medium text-[#F3F4F6] tracking-tight">
                  My Streaming Subscriptions
                </h3>
                <p className="text-xs text-[#8E93A0]">
                  {subscribedServices.length} active service{subscribedServices.length === 1 ? '' : 's'} selected
                </p>
              </div>
            </div>

            <button
              onClick={closeServicesModal}
              className="p-1 rounded-lg text-[#8E93A0] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-[#8E93A0] leading-relaxed mb-4">
            Choose the providers you subscribe to. Marquee will badge titles with their source and unlock the &ldquo;Available on My Services&rdquo; filter so you know what you can stream right now.
          </p>

          {/* Quick Select Actions */}
          <div className="flex items-center justify-between pb-2 mb-3">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#8E93A0]">
              Select Subscriptions
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-[#8E93A0] hover:text-white transition-colors cursor-pointer"
              >
                Select All
              </button>
              <span className="text-[#636875]">•</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs text-[#8E93A0] hover:text-white transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Grid of Streaming Services */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 overflow-y-auto pr-1 mb-6 max-h-72">
            {ALL_SERVICES.map((service) => {
              const isSelected = subscribedServices.includes(service);

              return (
                <button
                  key={service}
                  type="button"
                  onClick={() => toggleSubscribedService(service)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white/10 text-white border-white/30 shadow-sm'
                      : 'bg-white/[0.02] text-[#8E93A0] border-white/[0.06] hover:bg-white/[0.05] hover:text-[#F3F4F6]'
                  }`}
                >
                  <span className="font-medium text-sm truncate mr-2">{service}</span>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-white text-black'
                        : 'border border-white/20 bg-white/[0.04]'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Save Action */}
          <div className="pt-2 border-t border-white/[0.08]">
            <motion.button
              whileTap={tapScale}
              onClick={closeServicesModal}
              className="w-full py-2.5 px-4 rounded-lg bg-[#F4F4F6] hover:bg-white text-[#0A0B0D] text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              Done
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
