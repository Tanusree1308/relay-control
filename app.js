import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
// Comment out SerialPort on Render deployment
// import { SerialPort } from 'serialport';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Resolve __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files (like index.html) from "public" folder
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));

// Mongoose schema
const buttonStateSchema = new mongoose.Schema({
  state: { type: String, enum: [' Turn On', ' Turn Off'], required: true }
});
const ButtonState = mongoose.model('ButtonState', buttonStateSchema);

// Serial port setup (won’t work on Render, just for local testing)
// const portName = 'COM3';
// const serialPort = new SerialPort({ path: portName, baudRate: 9600 });

// POST API to update state
app.post('/button', async (req, res) => {
  const { state } = req.body;
  const buttonState = new ButtonState({ state });
  await buttonState.save();

  // Local only: send to Arduino
  // if (serialPort && serialPort.write) {
  //   serialPort.write(state === 'on' ? '1' : '0');
  // }

  res.status(201).send(buttonState);
});

// GET API to retrieve latest state
app.get('/button', async (req, res) => {
  const state = await ButtonState.findOne().sort({ _id: -1 });
  res.send(state);
});

// Fallback route
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
