import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.static('public'));
app.use(cors());
app.use(express.json());

app.disable('x-powered-by');

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// MongoDB setup
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

const buttonStateSchema = new mongoose.Schema({
  state: { type: String, enum: ['on', 'off'], required: true },
  timestamp: { type: Date, default: Date.now }
});

const ButtonState = mongoose.model('ButtonState', buttonStateSchema);

// Basic route
app.get('/', (req, res) => {
  res.send('✅ Relay Control Server is running!');
});

// Get most recent relay state
app.get('/state', async (req, res) => {
  try {
    const latest = await ButtonState.findOne().sort({ timestamp: -1 });
    if (!latest) {
      return res.json({ state: 'unknown' });
    }
    res.json({ state: latest.state });
  } catch (err) {
    console.error('❌ Error fetching state:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Arduino sends relay state
app.get('/button', async (req, res) => {
  const state = req.query.state?.toLowerCase();

  if (!state || !['on', 'off'].includes(state)) {
    return res.status(400).json({ error: 'Valid state (on/off) is required' });
  }

  try {
    const buttonState = new ButtonState({ state });
    await buttonState.save();
    console.log(`📥 GET: Relay state set to "${state}"`);
    res.json({ state });
  } catch (err) {
    console.error('❌ Error saving state:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Web interface sends relay state
app.post('/button', async (req, res) => {
  const { state } = req.body;

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

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
