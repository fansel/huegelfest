import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { ClipboardList } from 'lucide-react';
import PacklistManager from '../packlist/PacklistManager';

interface PacklistSheetProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const PacklistSheet: React.FC<PacklistSheetProps> = ({ open, setOpen }) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-5xl max-h-[90vh] bg-gradient-to-br from-[#460b6c] via-[#460b6c]/95 to-[#460b6c]/90 border-2 border-[#ff9900]/30 overflow-hidden">
        <DialogHeader className="border-b border-[#ff9900]/20 pb-4">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-[#ff9900]">
            <div className="p-2 bg-[#ff9900]/20 rounded-full">
              <ClipboardList className="w-6 h-6 text-[#ff9900]" />
            </div>
            Globale Packliste
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto pr-4" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          <PacklistManager />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PacklistSheet; 