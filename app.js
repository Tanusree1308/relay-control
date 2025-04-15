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
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true })
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

  // Optionally, if you're using a service to control hardware remotely,
  // you can trigger a command here. For example, send a request to a different service or 
  // trigger actions based on state. Since no serial port is used, this part is skipped.

  res.status(201).send(buttonState);
});

// API endpoint to get the current state
app.get('/button', async (req, res) => {
  const state = await ButtonState.findOne().sort({ _id: -1 });
  res.send(state);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
