import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
  res.send('Relay Control API is running!');
});

// Connect to MongoDB using the URI from .env
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Define a schema for button state
const buttonStateSchema = new mongoose.Schema({
  state: { type: String, enum: ['on', 'off'], required: true }
});

const ButtonState = mongoose.model('ButtonState', buttonStateSchema);

// API endpoint to control the relay
app.post('/button', async (req, res) => {
  const { state } = req.body;
  const buttonState = new ButtonState({ state });
  await buttonState.save();

  res.status(201).send(buttonState);
});

// API endpoint to get the current state
app.get('/button', async (req, res) => {
  const state = await ButtonState.findOne().sort({ _id: -1 });
  res.send(state);
});

// Start the server on the specified port
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
