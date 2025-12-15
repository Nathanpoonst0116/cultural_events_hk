const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cors = require('cors');
const xml2js = require('xml2js');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(session({
  secret: 'csci2720-project-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // For development
}));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/cultural_events');

// Data Models
const User = mongoose.model('User', {
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Venue' }],
  createdAt: { type: Date, default: Date.now }
});

const Venue = mongoose.model('Venue', {
  venueId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  nameC: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  region: { type: String },
  address: { type: String },
  description: { type: String },
  events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  // CHANGED: Store array of user IDs instead of number
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastUpdated: { type: Date, default: Date.now }
});

const Event = mongoose.model('Event', {
  eventId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  titleC: { type: String },
  venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
  description: { type: String },
  presenter: { type: String },
  dateTime: { type: String },
  category: { type: String },
  price: { type: String },
  url: { type: String },
  // CHANGED: Store array of user IDs instead of number
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastUpdated: { type: Date, default: Date.now }
});
const Comment = mongoose.model('Comment', {
  venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Authentication Middleware
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
}

function isAdmin(req, res, next) {
  if (req.session.isAdmin) {
    next();
  } else {
    res.status(403).json({ error: 'Not authorized' });
  }
}

// API Routes

// Authentication
// server.js - Update Login Route
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // FIXED: Run import/update every time, not just when empty
    console.log("User login detected. Synchronizing data...");
    // We don't await this to keep login fast, or you can await if you prefer strict sync
    importDataFromXML().catch(err => console.error("Background import failed:", err));
    
    req.session.userId = user._id;
    req.session.username = user.username;
    req.session.isAdmin = user.isAdmin;
    
    res.json({ 
      message: 'Login successful', 
      user: { username: user.username, isAdmin: user.isAdmin, userId: user._id } // Send ID for frontend checks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logout successful' });
});

app.get('/api/session', (req, res) => {
  if (req.session.userId) {
    res.json({ 
      loggedIn: true, 
      username: req.session.username, 
      isAdmin: req.session.isAdmin 
    });
  } else {
    res.json({ loggedIn: false });
  }
});

// Venues
app.get('/api/venues', async (req, res) => {
  try {
    const { search, area, distance, lat, lng } = req.query;
    let query = {};
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    let venues = await Venue.find(query).populate('events');
    
    // Filter by distance if coordinates provided
    if (lat && lng && distance) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const maxDistance = parseFloat(distance);
      
      venues = venues.filter(venue => {
        if (!venue.latitude || !venue.longitude) return false;
        const dist = calculateDistance(userLat, userLng, venue.latitude, venue.longitude);
        return dist <= maxDistance;
      });
    }
    
    res.json(venues);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch venues' });
  }
});

app.get('/api/venues/:id', async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id).populate('events');
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }
    res.json(venue);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch venue' });
  }
});

// Events
app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find().populate('venue');
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.get('/api/events/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('venue');
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Comments
app.get('/api/venues/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ venue: req.params.id })
      .populate('user', 'username')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

app.post('/api/venues/:id/comments', isAuthenticated, async (req, res) => {
  try {
    const { content } = req.body;
    const comment = new Comment({
      venue: req.params.id,
      user: req.session.userId,
      content
    });
    await comment.save();
    await comment.populate('user', 'username');
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Favorites
app.post('/api/venues/:id/favorite', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const venueId = req.params.id;
    
    if (!user.favorites.includes(venueId)) {
      user.favorites.push(venueId);
      await user.save();
    }
    
    res.json({ message: 'Added to favorites' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

app.delete('/api/venues/:id/favorite', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    user.favorites = user.favorites.filter(fav => fav.toString() !== req.params.id);
    await user.save();
    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

app.get('/api/favorites', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).populate('favorites');
    res.json(user.favorites);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// Likes
// UPDATE Event Like Route
app.post('/api/events/:id/like', isAuthenticated, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    const userId = req.session.userId;
    
    const index = event.likes.indexOf(userId);
    let liked = false;

    if (index === -1) {
      event.likes.push(userId); // Add like
      liked = true;
    } else {
      event.likes.splice(index, 1); // Remove like
      liked = false;
    }
    
    await event.save();
    res.json({ likes: event.likes.length, isLiked: liked });
  } catch (error) {
    res.status(500).json({ error: 'Failed to like event' });
  }
});

// UPDATE Venue Like Route
app.post('/api/venues/:id/like', isAuthenticated, async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    const userId = req.session.userId;
    
    const index = venue.likes.indexOf(userId);
    let liked = false;

    if (index === -1) {
      venue.likes.push(userId); // Add like
      liked = true;
    } else {
      venue.likes.splice(index, 1); // Remove like
      liked = false;
    }
    
    await venue.save();
    res.json({ likes: venue.likes.length, isLiked: liked });
  } catch (error) {
    res.status(500).json({ error: 'Failed to like venue' });
  }
});

// Admin CRUD operations
app.post('/api/admin/users', isAdmin, async (req, res) => {
  try {
    const { username, password, isAdmin = false } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, isAdmin });
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.get('/api/admin/users', isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.put('/api/admin/users/:id', isAdmin, async (req, res) => {
  try {
    const { username, password, isAdmin } = req.body;
    const updateData = { username, isAdmin };
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/admin/users/:id', isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.post('/api/admin/events', isAdmin, async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event' });
  }
});

app.put('/api/admin/events/:id', isAdmin, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event' });
  }
});

app.delete('/api/admin/events/:id', isAdmin, async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Data import endpoint
app.post('/api/import-data', async (req, res) => {
  try {
    await importDataFromXML();
    res.json({ message: 'Data imported successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to import data' });
  }
});

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Import data from XML files
// REPLACE the importDataFromXML function
async function importDataFromXML() {
  try {
    console.log('Starting data synchronization...');
    
    // Parse venues
    const venuesData = fs.readFileSync('./venues.xml', 'utf8');
    const venuesResult = await xml2js.parseStringPromise(venuesData);
    const venuesXML = venuesResult.venues.venue;
    
    // Sample coordinates map (same as before)
    const sampleCoordinates = {
      '100': { lat: 22.4475, lng: 114.1699, region: 'newterritories' },
      '101': { lat: 22.4439, lng: 114.0195, region: 'newterritories' },
      '102': { lat: 22.3193, lng: 114.1884, region: 'kowloon' },
      '103': { lat: 22.2783, lng: 114.1747, region: 'hongkong' },
      '104': { lat: 22.3408, lng: 114.2095, region: 'hongkong' },
      '105': { lat: 22.2994, lng: 114.1719, region: 'kowloon' },
      '106': { lat: 22.3371, lng: 114.1558, region: 'kowloon' },
      '107': { lat: 22.3247, lng: 114.1975, region: 'kowloon' },
      '108': { lat: 22.3845, lng: 114.1168, region: 'newterritories' },
      '109': { lat: 22.3763, lng: 114.1779, region: 'kowloon' }
    };

    // 1. Upsert Venues
    const venueMap = {}; // To store internal _id for event linking
    
    for (const vXML of venuesXML) {
      const venueId = vXML.$.id;
      // Only process the specific IDs we want (or logic from original code)
      if (!sampleCoordinates[venueId]) continue; 

      const venueName = vXML.venuee[0] || vXML.venuec[0];
      const venueNameC = vXML.venuec[0];
      const { lat, lng, region } = sampleCoordinates[venueId];

      // Update if exists, Insert if new
      const venueDoc = await Venue.findOneAndUpdate(
        { venueId: venueId },
        {
          name: venueName,
          nameC: venueNameC,
          latitude: lat,
          longitude: lng,
          region: region,
          address: `${venueName}, Hong Kong`,
          lastUpdated: Date.now()
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      venueMap[venueId] = venueDoc._id;
    }

    // 2. Upsert Events
    const eventsData = fs.readFileSync('./events.xml', 'utf8');
    const eventsResult = await xml2js.parseStringPromise(eventsData);
    const eventsXML = eventsResult.events.event;

    for (const eXML of eventsXML) {
      const venueId = eXML.venueid[0];
      if (!venueMap[venueId]) continue; // Skip if venue not in our list

      const title = eXML.titlee[0] || eXML.titlec[0] || 'Untitled';
      const description = eXML.desce[0] || 'No description';
      const dateTime = eXML.predateE[0] || 'TBA';
      
      const eventDoc = await Event.findOneAndUpdate(
        { eventId: eXML.$.id },
        {
          title,
          venue: venueMap[venueId],
          description,
          dateTime,
          presenter: 'Cultural Services Department',
          lastUpdated: Date.now()
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Link event to venue (ensure uniqueness)
      await Venue.findByIdAndUpdate(venueMap[venueId], {
        $addToSet: { events: eventDoc._id }
      });
    }
    
    console.log(`Data synchronization completed.`);
  } catch (error) {
    console.error('Error importing data:', error);
  }
}

// Initialize database with demo users
async function initializeDatabase() {
  try {
    console.log('Initializing database with demo users...');
    
    const demoUsers = [
      { username: 'user', password: 'user123', isAdmin: false },
      { username: 'admin', password: 'admin123', isAdmin: true }
    ];

    for (const userData of demoUsers) {
      const existingUser = await User.findOne({ username: userData.username });
      
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = new User({
          username: userData.username,
          password: hashedPassword,
          isAdmin: userData.isAdmin
        });
        
        await user.save();
        console.log(`Created ${userData.isAdmin ? 'admin' : 'user'}: ${userData.username}`);
      } else {
        console.log(`User ${userData.username} already exists`);
      }
    }
    
    console.log('Database initialization completed');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Serve the main HTML file for all routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  // Initialize database on startup
  await initializeDatabase();
});

module.exports = app;