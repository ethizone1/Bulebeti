const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  restaurantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Restaurant',
    required: true
  },
  
  // Basic Info
  title: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Live Music', 'Food Discount', 'Holiday Special', 'Buffet Night', 'Cultural Event', 'Private Event', 'New Menu Launch', 'Happy Hour', 'Other'],
    default: 'Other'
  },
  description: { type: String },
  restaurantNameField: { type: String }, // optional, for display
  branchLocation: { type: String },
  
  // Date & Time
  startDate: { type: String },
  endDate: { type: String },
  startTime: { type: String },
  endTime: { type: String },
  isRepeat: { type: Boolean, default: false },
  
  // Location
  address: { type: String },
  city: { type: String },
  area: { type: String },
  mapLink: { type: String },
  indoorOutdoor: { type: String, enum: ['Indoor', 'Outdoor', 'Both'], default: 'Indoor' },
  
  // Images
  eventImage: { type: String },
  posterImage: { type: String },
  bannerImage: { type: String },
  
  // Ticketing/Pricing
  isFree: { type: Boolean, default: true },
  price: { type: String },
  currency: { type: String, default: 'ETB' },
  bookingRequired: { type: Boolean, default: false },
  maxGuests: { type: String },
  
  // Offers
  specialMenu: { type: Boolean, default: false },
  menuItems: { type: String },
  discountPercent: { type: String },
  specialOfferDesc: { type: String },
  
  // Contact
  contactName: { type: String },
  contactPhone: { type: String },
  contactEmail: { type: String },
  whatsappLink: { type: String },
  reservationLink: { type: String },
  
  // Status
  status: {
    type: String,
    enum: ['Draft', 'Active', 'Closed', 'Cancelled', 'Completed'],
    default: 'Active'
  },
  
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Event', eventSchema);
