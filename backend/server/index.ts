import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {errorHandler} from './middleware/errorHandler';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import projectRoutes from './routes/projects';
import bidRoutes from './routes/bids';
import contractRoutes from './routes/contracts';
import paymentRoutes from './routes/payments';
import gigRoutes from './routes/gigs';
import skillRoutes from './routes/skills';
import sellers from './routes/sellers';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Request body:', req.body);
  next();
});

app.get('/', (req, res) => {
  res.send('Hello World');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/sellers', sellers);

// Error handling middleware
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 