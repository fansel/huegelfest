import React from 'react';
import { Camera, CameraOff } from 'lucide-react';
import { FormStep } from './FormComponents';
import type { StepProps } from './types';

export function PhotosStep({ form, setForm }: StepProps) {
  return (
    <FormStep>
      <div className="flex flex-col gap-2 w-full items-center mb-2">
        <Camera className="inline-block w-7 h-7 text-[#ff9900]" />
        <span className="text-sm text-[#460b6c]/80 text-center">Ist es für dich in Ordnung, wenn auf dem Festival Fotos und Videos gemacht werden, die im Anschluss mit allen Teilnehmenden geteilt werden?</span>
      </div>
      
      <div className="flex flex-col gap-2 w-full items-center">
        <label className="block font-medium text-[#460b6c] text-lg w-full text-center flex items-center justify-center gap-2">
          Fotos und Videos
        </label>
        <div className="w-full flex flex-col gap-2 justify-center pb-2 items-center">
          <label
            className={`flex items-center justify-center gap-2 cursor-pointer select-none text-base px-4 py-2 rounded-lg border transition-all min-w-[120px] max-w-[200px]
              ${form.allowsPhotos ? 'border-[#ff9900] bg-[#ff9900]/10 shadow-sm' : 'border-gray-300 bg-white'}`}
          >
            <input
              type="radio"
              name="allowsPhotos"
              value="ja"
              checked={form.allowsPhotos}
              onChange={() => setForm(f => ({ ...f, allowsPhotos: true }))}
              className="sr-only"
            />
            <Camera size={16} className="text-[#ff9900]" />
            <span>Ja</span>
          </label>
          
          <label
            className={`flex items-center justify-center gap-2 cursor-pointer select-none text-base px-4 py-2 rounded-lg border transition-all min-w-[120px] max-w-[200px]
              ${!form.allowsPhotos ? 'border-[#ff9900] bg-[#ff9900]/10 shadow-sm' : 'border-gray-300 bg-white'}`}
          >
            <input
              type="radio"
              name="allowsPhotos"
              value="nein"
              checked={!form.allowsPhotos}
              onChange={() => setForm(f => ({ ...f, allowsPhotos: false }))}
              className="sr-only"
            />
            <CameraOff size={16} className="text-[#ff9900]" />
            <span>Nein</span>
          </label>
        </div>
      </div>
    </FormStep>
  );
} 