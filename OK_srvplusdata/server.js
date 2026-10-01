const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4100;

// Set EJS Template Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Parse incoming request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configure Express Session Management
app.use(
  session({
    secret: 'pulse-running-squad-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 hours duration
  })
);

// Mock User Database
const USERS = [
  { 
    id: 1, 
    email: 'user@pulse.run', 
    password: 'runner2026', 
    name: 'Alex Rivera', 
    role: 'member', 
    tier: 'Pro Athlete Member',
    stats: { weeklyKm: 68.4, pace: '3:52 /km', rank: '#2 Overall' } 
  },
  { 
    id: 2, 
    email: 'coach@pulse.run', 
    password: 'coach2026', 
    name: 'Sarah Jenkins', 
    role: 'coach', 
    tier: 'Head Coach',
    stats: { weeklyKm: 42.0, pace: '4:15 /km', rank: '#1 Coach' } 
  }
];

const newsData = [];
const adviceData = [];
const videoData = [];
const resultsData = [];
const coachesData = [];

// Authentication Guard Middleware
function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    // Redirect unauthenticated guests directly to login
    return res.redirect('/login');
  }
  next();
}

// Role-Based Authorization Middleware for Coaches/Admins
function requireCoach(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'coach') {
    return res.status(403).send('Access Denied: Coach privilege required.');
  }
  next();
}

// Global Context Middleware (Injects User to EJS templates)
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// Public Landing Page
app.get('/', (req, res) => {
  res.render('index', { user: req.session.user || null });
});

// Login Page GET Handler
app.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/member');
  }
  res.render('login', { error: null });
});

// Login POST Handler (Authenticates User)
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = USERS.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).render('login', { error: 'Invalid credentials. Please try user@pulse.run / runner2026' });
  }

  // Store user in session
  req.session.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tier: user.tier,
    stats: user.stats
  };

  res.redirect('/member');
});

// PROTECTED ROUTE: Member Portal Page
app.get('/member', requireAuth, (req, res) => {
  // Pass dynamic datasets to view template
  res.render('member', {
    user: req.session.user,
    news: newsData,
    advices: adviceData,
    videos: videoData,
    results: resultsData,
    coaches: coachesData,
    pageTitle: 'PULSE Member Portal'
  });
});

// Logout Route
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

app.listen(PORT, () => {
  console.log(`⚡ PULSE Running Express App running on http://localhost:${PORT}`);
});