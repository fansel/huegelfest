import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  value: {
    type: String,
    required: true,
    unique: true
  },
  label: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false,
    validate: {
      validator: function(this: { value: string }, v: boolean): boolean {
        // Nur die "Sonstiges"-Kategorie darf isDefault true sein
        return !v || this.value === 'other';
      },
      message: 'Nur die "Sonstiges"-Kategorie darf als Standard markiert sein'
    }
  }
}, {
  timestamps: true
});

// Prüfe, ob das Model bereits existiert
const Category = mongoose.models?.Category || mongoose.model('Category', categorySchema);

export default Category; 