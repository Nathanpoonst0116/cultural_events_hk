/** 
I declare that the lab work here submitted is original
except for source material explicitly acknowledged, and that the same or closely related material has not been
previously submitted for another course.
I also acknowledge that I am aware of University policy and
regulations on honesty in academic work, and of the disciplinary
guidelines and procedures applicable to breaches of such
policy and regulations, as contained in the website. University Guideline on Academic Honesty:
https://www.cuhk.edu.hk/policy/academichonesty/

Group 12 
Group member: 
POON Shing Tsan				1155193858 
WONG San Ki Sunny			1155193541 
KUMARBEK UULU Chyngyz		1155190408 
LAM Ka Shing				1155194077 
YAM Tin Lam Lucas			1155234981 
Class/Section : CSCI2720
Date : 18-12-2025 
**/

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