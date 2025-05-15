import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet';
import PacklistManager from '../packlist/PacklistManager';

interface PacklistSheetProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const PacklistSheet: React.FC<PacklistSheetProps> = ({ open, setOpen }) => {
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="max-w-lg w-full">
        <SheetHeader>
          <SheetTitle>Globale Packliste</SheetTitle>
        </SheetHeader>
        <PacklistManager />
      </SheetContent>
    </Sheet>
  );
};

export default PacklistSheet; 