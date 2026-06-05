import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';
import { Role } from '../types/role';

const router = Router();

// Sign Up
router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, role, name } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = Object.values(Role).includes(role) ? role : Role.MEMBER;

    // We use a transaction to create User + Specific Profile
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: userRole,
        },
      });

      if (userRole === 'OWNER') {
        await tx.familyProfile.create({
          data: {
            ownerId: user.id,
            name: name || "Primary Profile",
            age: 0,
            gender: "Not Specified",
          }
        });
      } else if (userRole === 'DOCTOR') {
        await tx.doctor.create({
          data: {
            userId: user.id,
            specialty: "Not Specified",
            isVerified: false
          }
        });
      } else if (userRole === 'PHARMACY') {
        await tx.pharmacy.create({
          data: {
            userId: user.id,
            name: name || "Pharmacy Profile",
            address: "Not Specified",
            isVerified: false
          }
        });
      } else if (userRole === 'INSURANCE') {
        await tx.insuranceProvider.create({
          data: {
            userId: user.id,
            companyName: name || "Insurance Profile",
            isVerified: false
          }
        });
      }

      await tx.auditLog.create({
        data: { actorId: user.id, action: 'USER_SIGNUP_WITH_ROLE', target: user.id }
      });

      return user;
    });

    res.status(201).json({ user: { id: result.id, email: result.email, role: result.role } });
  } catch (error) {
    next(error);
  }
});

// Sign In
router.post('/signin', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'fallback', { expiresIn: '7d' });

    await prisma.auditLog.create({
      data: { actorId: user.id, action: 'USER_LOGIN', target: user.id }
    });

    res.status(200).json({ user: { id: user.id, email: user.email, role: user.role }, token });
  } catch (error) {
    next(error);
  }
});

// Get Current User (Protected)
router.get('/me', authenticate, async (req: any, res, next) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    next(error);
  }
});

export default router;
