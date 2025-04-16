import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(cors());
app.use(express.json());
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB error:", err));

const buttonStateSchema = new mongoose.Schema({
  state: { type: String, enum: ['on', 'off'], required: true },
  timestamp: { type: Date, default: Date.now }
});

const ButtonState = mongoose.model('ButtonState', buttonStateSchema);

app.get('/', (req, res) => {
  res.send('✅ Relay Control Server is running!');
});

app.get('/button', async (req, res) => {
  const state = req.query.state?.toLowerCase();
  if (!state || !['on', 'off'].includes(state)) {
    return res.status(400).json({ error: 'Valid state (on/off) is required' });
  }

  try {
    const newState = new ButtonState({ state });
    await newState.save();
    console.log(`📥 GET: Relay state set to "${state}"`);
    res.json({ state });
  } catch (err) {
    console.error('❌ Error saving state:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/button', async (req, res) => {
  const { state } = req.body;
  if (!state || !['on', 'off'].includes(state.toLowerCase())) {
    return res.status(400).json({ error: 'Valid state (on/off) is required' });
  }

  try {
    const newState = new ButtonState({ state: state.toLowerCase() });
    await newState.save();
    console.log(`📥 POST: Relay state set to "${state}"`);
    res.json({ state });
  } catch (err) {
    console.error('❌ Error saving state:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ New route for ESP32 to get the latest state
app.get('/last-state', async (req, res) => {
  try {
    const latest = await ButtonState.findOne().sort({ timestamp: -1 });
    if (latest) {
      res.json({ state: latest.state });
    } else {
      res.json({ state: 'off' }); // default if nothing found
    }
  } catch (err) {
    console.error('❌ Error fetching last state:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
