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

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// MongoDB schema/model for button state
const buttonStateSchema = new mongoose.Schema({
  state: {
    type: String,
    enum: ['on', 'off'],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const ButtonState = mongoose.model('ButtonState', buttonStateSchema);

// Root test route
app.get('/', (req, res) => {
  res.send('✅ Relay Control Server is running!');
});

// GET route for Arduino or testing
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

// POST route for web interface or API usage
app.post('/button', async (req, res) => {
  const { state } = req.body;

  if (!state || !['on', 'off'].includes(state.toLowerCase())) {
    return res.status(400).json({ error: 'Valid state (on/off) is required' });
  }

  try {
    const buttonState = new ButtonState({ state: state.toLowerCase() });
    await buttonState.save();

    console.log(`📥 POST: Relay state set to "${state.toLowerCase()}"`);
    res.json({ state: state.toLowerCase() });
  } catch (err) {
    console.error('❌ Error saving state:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
