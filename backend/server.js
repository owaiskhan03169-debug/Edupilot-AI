import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './src/routes/authRoutes.js';
import orchestrationRoutes from './src/routes/orchestrationRoutes.js';
import classroomRoutes from './src/routes/classroomRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/edupilot')
  .then(() => console.log('Connected to MongoDB successfully!'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/orchestration', orchestrationRoutes);
app.use('/api/classroom', classroomRoutes);

app.get('/', (req, res) => {
  res.send('EduPilot Core Backend is running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
