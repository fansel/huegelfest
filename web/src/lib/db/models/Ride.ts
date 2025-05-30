import mongoose from 'mongoose';

const rideSchema = new mongoose.Schema({
  driver: { type: String, required: true },
  direction: { type: String, enum: ['hinfahrt', 'rückfahrt'], required: true, default: 'hinfahrt' },
  start: { type: String, required: true },
  destination: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  seats: { type: Number, required: true },
  contact: { type: String, required: true },
  passengers: [{
    name: { type: String, required: true },
    contact: { type: String }
  }]
}, { timestamps: true });

export const Ride = mongoose.models.Ride || mongoose.model('Ride', rideSchema); 