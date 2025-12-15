// server.js - Update Venue Model
const Venue = mongoose.model('Venue', {
  venueId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  nameC: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  region: { type: String }, // <--- NEW FIELD for robust filtering
  address: { type: String },
  description: { type: String },
  events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  likes: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});