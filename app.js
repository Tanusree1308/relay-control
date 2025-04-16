import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(express.static('public'));  // Serve static files
app.use(cors());  // Enable CORS for all domains
app.use(express.json());  // Parse JSON body

// Disable the 'X-Powered-By' header
app.disable('x-powered-by');

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Define schema for button state
const buttonStateSchema = new mongoose.Schema({
  state: { type: String, enum: ['on', 'off'], required: true },
  timestamp: { type: Date, default: Date.now }
});

// Create the ButtonState model from the schema
const ButtonState = mongoose.model('ButtonState', buttonStateSchema);

// Root route for testing the server
app.get('/', (req, res) => {
  res.send('✅ Relay Control Server is running!');
});

// GET route for Arduino or testing with query parameter
app.get('/button', async (req, res) => {
  const state = req.query.state?.toLowerCase();
  console.log(`Received request to set state to: ${state}`);

  if (!state || !['on', 'off'].includes(state)) {
    return res.status(400).json({ error: 'Valid state (on/off) is required' });
  }

  try {
    const buttonState = new ButtonState({ state });
    await buttonState.save();

    console.log(`Relay state set to "${state}" in the database`);
    res.json({ state });
  } catch (err) {
    console.error('❌ Error saving state:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST route for the web interface or API usage
app.post('/button', async (req, res) => {
  const { state } = req.body;
  console.log('Received request body:', req.body);  // Log the entire request body

  // Validate the state value
  if (!state || !['on', 'off'].includes(state.toLowerCase())) {
    return res.status(400).json({ error: 'Valid state (on/off) is required' });
  }

  try {
    const buttonState = new ButtonState({ state: state.toLowerCase() });
    await buttonState.save();

    console.log(`📥 POST: Relay state set to "${state}"`);
    res.json({ state });
  } catch (err) {
    console.error('❌ Error saving state:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
