import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import familyRoutes from './routes/family.routes';
import recordsRoutes from './routes/records.routes';
import aiRoutes from './routes/ai.routes';
import marketplaceRoutes from './routes/marketplace.routes';
import adminRoutes from './routes/admin.routes';
import pharmacyRoutes from './routes/pharmacy.routes';
import doctorRoutes from './routes/doctor.routes';
import insuranceRoutes from './routes/insurance.routes';
import { errorHandler } from './middleware/errorHandler';
import { PrismaClient } from '@prisma/client';

import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 4000;

// Phase 8: Security Middleware
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

// Removed static uploads for Vercel compatibility

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/insurance', insuranceRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'MediGuide API is running' });
});

// Global Error Handler
app.use(errorHandler);

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 MediGuide API running on http://localhost:${PORT}`);
  });
}

// Export for Vercel Serverless
export default app;
