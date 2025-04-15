import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Define a schema for button state
const buttonStateSchema = new mongoose.Schema({
  state: { type: String, enum: ['on', 'off'], required: true },
  timestamp: { type: Date, default: Date.now }
});

const ButtonState = mongoose.model('ButtonState', buttonStateSchema);

// Root route
app.get('/', (req, res) => {
  res.send('✅ Relay Control Server is running!');
});

// GET route to set relay state (for testing/demo)
app.get('/button', async (req, res) => {
  const state = req.query.state?.toLowerCase();

  if (!state || !['on', 'off'].includes(state)) {
    return res.status(400).send({ error: 'Valid state (on/off) is required' });
  }

  try {
    const buttonState = new ButtonState({ state });
    await buttonState.save();

    console.log(`Relay state set to: ${state}`);
    res.send({ state });
  } catch (err) {
    console.error('Error saving state:', err);
    res.status(500).send({ error: 'Internal server error' });
  }
});

// POST route (preferred RESTful way)
app.post('/button', async (req, res) => {
  const { state } = req.body;

  if (!state || !['on', 'off'].includes(state.toLowerCase())) {
    return res.status(400).send({ error: 'Valid state (on/off) is required' });
  }

  try {
    const buttonState = new ButtonState({ state: state.toLowerCase() });
    await buttonState.save();

    console.log(`Relay state set to: ${state}`);
    res.send({ state });
  } catch (err) {
    console.error('Error saving state:', err);
    res.status(500).send({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
