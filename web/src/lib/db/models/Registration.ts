import mongoose, { Schema, Document } from 'mongoose';

export interface IRegistration extends Document {
  name: string;
  days: number[];
  priceOption: 'full' | 'reduced' | 'free';
  isMedic: boolean;
  travelType: 'zug' | 'auto' | 'fahrrad' | 'andere';
  equipment: string;
  concerns: string;
  wantsToOfferWorkshop: string;
  sleepingPreference: 'bed' | 'tent' | 'car';
  lineupContribution: string;
  createdAt: Date;
  paid: boolean;
  checkedIn: boolean;
}

const RegistrationSchema = new Schema<IRegistration>({
  name: { type: String, required: true },
  days: { type: [Number], required: true },
  priceOption: { type: String, enum: ['full', 'reduced', 'free'], required: true },
  isMedic: { type: Boolean, required: true },
  travelType: { type: String, enum: ['zug', 'auto', 'fahrrad', 'andere'], required: true },
  equipment: { type: String, default: '' },
  concerns: { type: String, default: '' },
  wantsToOfferWorkshop: { type: String, default: '' },
  sleepingPreference: { type: String, enum: ['bed', 'tent', 'car'], required: true },
  lineupContribution: { type: String, default: '' },
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