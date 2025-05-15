import mongoose, { Schema, Document } from 'mongoose';

export interface IRegistration extends Document {
  name: string;
  days: number[];
  priceOption: 'full' | 'reduced' | 'free';
  isMedic: boolean;
  hasCar: boolean;
  equipment: string;
  concerns: string;
  wantsToContribute: boolean;
  wantsToOfferWorkshop: string;
  sleepingPreference: 'bed' | 'tent' | 'car';
  createdAt: Date;
  paid: boolean;
  checkedIn: boolean;
}

const RegistrationSchema = new Schema<IRegistration>({
  name: { type: String, required: true },
  days: { type: [Number], required: true },
  priceOption: { type: String, enum: ['full', 'reduced', 'free'], required: true },
  isMedic: { type: Boolean, required: true },
  hasCar: { type: Boolean, required: true },
  equipment: { type: String, default: '' },
  concerns: { type: String, default: '' },
  wantsToContribute: { type: Boolean, required: true },
  wantsToOfferWorkshop: { type: String, default: '' },
  sleepingPreference: { type: String, enum: ['bed', 'tent', 'car'], required: true },
  createdAt: { type: Date, default: Date.now },
  paid: { type: Boolean, default: false },
  checkedIn: { type: Boolean, default: false },
});

let Registration: mongoose.Model<IRegistration>;
if (mongoose.models.Registration) {
  Registration = mongoose.model<IRegistration>('Registration');
} else {
  Registration = mongoose.model<IRegistration>('Registration', RegistrationSchema);
}

export { Registration }; 