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
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Define a schema for button state
const buttonStateSchema = new mongoose.Schema({
  state: { type: String, enum: ['on', 'off'], required: true }
});

const ButtonState = mongoose.model('ButtonState', buttonStateSchema);

// API endpoint to control the relay
app.get('/button', async (req, res) => {
  const state = req.query.state; // Get the state from the query parameter
  if (state) {
    // Save the state to the database
    const buttonState = new ButtonState({ state });
    await buttonState.save();

    // Optionally, log the state
    console.log(`Relay state is: ${state}`);

    res.send({ state: state });  // Return the state back to the Arduino
  } else {
    res.status(400).send({ error: 'State is required' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
