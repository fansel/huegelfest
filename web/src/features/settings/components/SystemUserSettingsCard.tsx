import React from 'react';
import { Info } from 'lucide-react';
import { Tooltip } from '@/shared/components/ui/tooltip';
import { useDeviceContext } from '@/shared/contexts/DeviceContext';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog';
import { useState } from 'react';

interface SystemUserSettingsCardProps {
  icon: React.ReactNode;
  title: string;
  switchElement: React.ReactNode;
  info?: React.ReactNode;
  variant?: 'row' | 'tile';
  children?: React.ReactNode;
}

const SystemUserSettingsCard: React.FC<SystemUserSettingsCardProps> = ({ icon, title, switchElement, info, variant = 'row', children }) => {
  const { deviceType } = useDeviceContext();
  const isMobile = deviceType === 'mobile';
  const [open, setOpen] = useState(false);

  // Info-Icon für Mobile: Öffnet Dialog
  const InfoIconMobile = info ? (
    <>
      <span className="ml-1 cursor-pointer" onClick={() => setOpen(true)}>
        <Info className="w-5 h-5 text-[#ff9900]/80 hover:text-[#ff9900]" />
      </span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle className="text-[#ff9900]">Informationen</DialogTitle>
          <DialogDescription className="max-h-80 overflow-y-auto">
            {info}
          </DialogDescription>
          <button
            className="mt-4 px-4 py-2 rounded bg-[#ff9900] text-white font-semibold border border-[#ff9900]/30 hover:bg-[#460b6c] transition"
            onClick={() => setOpen(false)}
          >
            Schließen
          </button>
        </DialogContent>
      </Dialog>
    </>
  ) : null;

  if (variant === 'tile') {
    return (
      <div className="flex flex-col items-center justify-center border border-[#ff9900]/40 rounded-2xl aspect-square min-h-[180px] bg-transparent p-4">
        <div className="mb-2">{React.cloneElement(icon as React.ReactElement, { className: 'w-10 h-10 text-[#ff9900]' })}</div>
        <div className="text-[#ff9900] text-lg font-semibold text-center mb-2">{title}</div>
        <div className="flex items-center gap-2 mt-2">
          {switchElement}
          {info && (
            isMobile
              ? InfoIconMobile
              : (
                <Tooltip content={info} side="top" className="bg-[#2d0066] text-[#ff9900] border border-[#ff9900]/30 max-w-sm text-sm rounded-xl shadow-lg max-h-80 overflow-y-auto">
                  <span className="ml-1 cursor-pointer">
                    <Info className="w-5 h-5 text-[#ff9900]/80 hover:text-[#ff9900]" />
                  </span>
                </Tooltip>
              )
          )}
        </div>
        {children}
      </div>
    );
  }
  // row-Layout wie bisher
  return (
    <div className="flex items-center justify-between border border-[#ff9900]/40 rounded-2xl px-4 py-3 mb-1 min-h-[56px] bg-transparent">
      <div className="flex items-center gap-3">
        <div className="bg-[#460b6c]/60 rounded-full p-2 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-[#ff9900] text-base font-medium">{title}</span>
      </div>
      <div className="flex items-center gap-2 ml-4">
        {switchElement}
        {info && (
          isMobile
            ? InfoIconMobile
            : (
              <Tooltip content={info} side="top" className="bg-[#2d0066] text-[#ff9900] border border-[#ff9900]/30 max-w-sm text-sm rounded-xl shadow-lg max-h-80 overflow-y-auto">
                <span className="ml-1 cursor-pointer">
                  <Info className="w-5 h-5 text-[#ff9900]/80 hover:text-[#ff9900]" />
                </span>
              </Tooltip>
            )
        )}
      </div>
      {children}
    </div>
  );
};

export default SystemUserSettingsCard; 