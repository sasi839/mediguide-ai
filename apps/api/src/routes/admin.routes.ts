import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { prisma } from '../index';
import { Role } from '../types/role';

const router = Router();

// Middleware ensuring only Super Admin can access these routes
router.use(authenticate);
router.use(requireRole([Role.SUPER_ADMIN]));

// Get all users for admin table
router.get('/users', async (req: any, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        doctorProfile: { select: { isVerified: true } },
        pharmacyProfile: { select: { isVerified: true } },
        insuranceProfile: { select: { isVerified: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Flatten verification status for the frontend
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      verified: user.role === 'DOCTOR' ? user.doctorProfile?.isVerified :
                user.role === 'PHARMACY' ? user.pharmacyProfile?.isVerified :
                user.role === 'INSURANCE' ? user.insuranceProfile?.isVerified : true
    }));

    res.json({ users: formattedUsers });
  } catch (error) {
    next(error);
  }
});

// Verify a specific role profile
router.post('/verify', async (req: any, res, next) => {
  try {
    const { userId, role } = req.body;

    if (role === 'DOCTOR') {
      await prisma.doctor.update({ where: { userId }, data: { isVerified: true } });
    } else if (role === 'PHARMACY') {
      await prisma.pharmacy.update({ where: { userId }, data: { isVerified: true } });
    } else if (role === 'INSURANCE') {
      await prisma.insuranceProvider.update({ where: { userId }, data: { isVerified: true } });
    }

    await prisma.auditLog.create({
      data: { actorId: req.user.id, action: 'ADMIN_VERIFY_USER', target: userId }
    });

    res.json({ message: 'User verified successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
