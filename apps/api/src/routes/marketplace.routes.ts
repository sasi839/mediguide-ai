import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../index';

const router = Router();

// Get all verified doctors
router.get('/doctors', authenticate, async (req: any, res, next) => {
  try {
    const { specialty, location } = req.query;
    
    // In a real app, location filtering would use PostGIS or Google Maps API radius search
    const doctors = await prisma.doctor.findMany({
      where: {
        isVerified: true,
        ...(specialty && { specialty: String(specialty) }),
      },
      include: {
        user: { select: { email: true } }
      }
    });

    res.json({ doctors });
  } catch (error) {
    next(error);
  }
});

// Book an appointment
router.post('/appointments', authenticate, async (req: any, res, next) => {
  try {
    const { doctorId, profileId, scheduledAt, notes } = req.body;

    const appointment = await prisma.appointment.create({
      data: {
        doctorId,
        profileId,
        scheduledAt: new Date(scheduledAt),
        status: 'PENDING',
        notes
      }
    });

    await prisma.auditLog.create({
      data: { actorId: req.user.id, action: 'BOOK_APPOINTMENT', target: appointment.id }
    });

    res.status(201).json({ appointment });
  } catch (error) {
    next(error);
  }
});

// Get all verified pharmacies
router.get('/pharmacies', authenticate, async (req: any, res, next) => {
  try {
    const pharmacies = await prisma.pharmacy.findMany({
      where: { isVerified: true }
    });
    res.json({ pharmacies });
  } catch (error) {
    next(error);
  }
});

// Get all verified insurance plans
router.get('/insurance', authenticate, async (req: any, res, next) => {
  try {
    const plans = await prisma.insurancePolicy.findMany({
      include: {
        provider: {
          select: { companyName: true, isVerified: true }
        }
      }
    });
    // Filter out unverified providers
    const verifiedPlans = plans.filter(p => p.provider.isVerified);
    
    res.json({ plans: verifiedPlans });
  } catch (error) {
    next(error);
  }
});

export default router;
