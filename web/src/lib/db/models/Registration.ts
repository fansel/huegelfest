import mongoose, { Schema, Document } from 'mongoose';

export interface IRegistration extends Document {
  name: string;
  days: number[];
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
  canStaySober: boolean;
  wantsAwareness: boolean;
  programContribution: string;
  hasConcreteIdea: boolean;
  wantsKitchenHelp: boolean;
  allergies: string;
  allowsPhotos: boolean;
  contactType: 'phone' | 'telegram' | 'none';
  contactInfo: string;
}

const RegistrationSchema = new Schema<IRegistration>({
  name: { type: String, required: true },
  days: { type: [Number], required: true },
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
  canStaySober: { type: Boolean, default: false },
  wantsAwareness: { type: Boolean, default: false },
  programContribution: { type: String, default: '' },
  hasConcreteIdea: { type: Boolean, default: false },
  wantsKitchenHelp: { type: Boolean, default: false },
  allergies: { type: String, default: '' },
  allowsPhotos: { type: Boolean, default: true },
  contactType: { type: String, enum: ['phone', 'telegram', 'none'], default: 'none' },
  contactInfo: { type: String, default: '' }
});

let Registration: mongoose.Model<IRegistration>;
if (mongoose.models.Registration) {
  Registration = mongoose.model<IRegistration>('Registration');
} else {
  Registration = mongoose.model<IRegistration>('Registration', RegistrationSchema);
}

export { Registration }; 