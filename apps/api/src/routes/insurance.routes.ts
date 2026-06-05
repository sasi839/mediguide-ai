import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../index';
import { requireRole } from '../middleware/rbac';
import { Role } from '../types/role';

const router = Router();

// Get insurance dashboard stats
router.get('/stats', authenticate, requireRole([Role.INSURANCE]), async (req: any, res, next) => {
  try {
    const provider = await prisma.insuranceProvider.findUnique({
      where: { userId: req.user.id },
      include: { plans: { include: { subscribers: true } } }
    });

    if (!provider) return res.status(404).json({ message: "Insurance Provider not found" });

    let totalSubscribers = 0;
    let monthlyRevenue = 0;

    provider.plans.forEach(plan => {
      const activeSubs = plan.subscribers.filter(sub => sub.status === "ACTIVE").length;
      totalSubscribers += activeSubs;
      monthlyRevenue += activeSubs * plan.price;
    });

    res.json({
      activePolicies: provider.plans.filter(p => p.status === "ACTIVE").length,
      totalSubscribers,
      monthlyRevenue,
      newLeads: Math.floor(totalSubscribers * 0.1), // Mock leads for now
      claimsProcessing: Math.floor(totalSubscribers * 0.05) // Mock claims for now
    });
  } catch (error) {
    next(error);
  }
});

// Get all plans for provider
router.get('/plans', authenticate, requireRole([Role.INSURANCE]), async (req: any, res, next) => {
  try {
    const provider = await prisma.insuranceProvider.findUnique({ where: { userId: req.user.id } });
    if (!provider) return res.status(404).json({ message: "Provider not found" });

    const plans = await prisma.insurancePlan.findMany({
      where: { providerId: provider.id },
      include: { 
        subscribers: {
          include: { patient: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const parsedPlans = plans.map(plan => ({
      ...plan,
      totalSubscribers: plan.subscribers.filter(s => s.status === "ACTIVE").length
    }));

    res.json({ plans: parsedPlans });
  } catch (error) {
    next(error);
  }
});

// Create new plan
router.post('/plans', authenticate, requireRole([Role.INSURANCE]), async (req: any, res, next) => {
  try {
    const { name, price, description } = req.body;
    
    const provider = await prisma.insuranceProvider.findUnique({ where: { userId: req.user.id } });
    if (!provider) return res.status(404).json({ message: "Provider not found" });

    const plan = await prisma.insurancePlan.create({
      data: {
        providerId: provider.id,
        name,
        price: parseFloat(price),
        description
      }
    });

    res.json({ plan });
  } catch (error) {
    next(error);
  }
});

// Get Provider Profile
router.get('/profile', authenticate, requireRole([Role.INSURANCE]), async (req: any, res, next) => {
  try {
    const provider = await prisma.insuranceProvider.findUnique({ where: { userId: req.user.id } });
    if (!provider) return res.status(404).json({ message: "Insurance Provider not found" });
    res.json({ provider });
  } catch (error) {
    next(error);
  }
});

// Update Provider Profile
router.put('/profile', authenticate, requireRole([Role.INSURANCE]), async (req: any, res, next) => {
  try {
    const { adminName, adminAge, bio, supportContact } = req.body;
    const provider = await prisma.insuranceProvider.update({
      where: { userId: req.user.id },
      data: {
        ...(adminName !== undefined && { adminName }),
        ...(adminAge !== undefined && { adminAge: parseInt(adminAge) }),
        ...(bio !== undefined && { bio }),
        ...(supportContact !== undefined && { supportContact }),
      }
    });
    res.json({ provider });
  } catch (error) {
    next(error);
  }
});

// --- PATIENT ENDPOINTS ---

// Get all available public plans
router.get('/list', authenticate, async (req: any, res, next) => {
  try {
    const plans = await prisma.insurancePlan.findMany({
      where: { status: "ACTIVE" },
      include: { 
        provider: true,
        subscribers: {
          where: { patientId: req.user.id, status: "ACTIVE" }
        }
      }
    });

    const parsedPlans = plans.map(p => ({
      ...p,
      isSubscribed: p.subscribers.length > 0
    }));

    res.json({ plans: parsedPlans });
  } catch (error) {
    next(error);
  }
});

// Subscribe to a plan
router.post('/subscribe', authenticate, requireRole([Role.OWNER, Role.MEMBER]), async (req: any, res, next) => {
  try {
    const { planId } = req.body;

    const existing = await prisma.insuranceSubscriber.findFirst({
      where: { planId, patientId: req.user.id, status: "ACTIVE" }
    });

    if (existing) {
      return res.status(400).json({ error: "Already subscribed to this plan" });
    }

    const sub = await prisma.insuranceSubscriber.create({
      data: {
        planId,
        patientId: req.user.id
      }
    });

    res.json({ subscriber: sub });
  } catch (error) {
    next(error);
  }
});

export default router;
