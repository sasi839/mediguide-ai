import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../index';

const router = Router();

// --- FAMILY GROUP MECHANICS ---

router.get('/group', authenticate, async (req: any, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { familyGroup: { include: { members: true } } }
    });
    
    if (!user?.familyGroup) {
      return res.json({ group: null });
    }

    res.json({ group: user.familyGroup });
  } catch (error) {
    next(error);
  }
});

router.post('/group/create', authenticate, async (req: any, res, next) => {
  try {
    const { name } = req.body;
    
    let inviteCode = "";
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      // Ensure it's exactly 6 characters (sometimes random ends early)
      inviteCode = inviteCode.padEnd(6, 'X');
      const existing = await prisma.familyGroup.findUnique({ where: { inviteCode } });
      if (!existing) isUnique = true;
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ message: "Could not generate a unique invite code. Please try again." });
    }

    const group = await prisma.familyGroup.create({
      data: {
        name,
        adminId: req.user.id,
        inviteCode,
        members: { connect: [{ id: req.user.id }] }
      }
    });

    res.json({ group });
  } catch (error) {
    next(error);
  }
});

router.post('/group/join', authenticate, async (req: any, res, next) => {
  try {
    const { inviteCode } = req.body;

    const group = await prisma.familyGroup.findUnique({ where: { inviteCode } });
    if (!group) return res.status(404).json({ message: "Invalid invite code" });

    const updatedGroup = await prisma.familyGroup.update({
      where: { id: group.id },
      data: {
        members: { connect: [{ id: req.user.id }] }
      },
      include: { members: true }
    });

    res.json({ group: updatedGroup });
  } catch (error) {
    next(error);
  }
});

// --- EXISTING PROFILE MECHANICS ---

// Get all family profiles for the logged-in user's group
router.get('/', authenticate, async (req: any, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    let ownerIds = [req.user.id];

    if (user?.familyGroupId) {
      const group = await prisma.familyGroup.findUnique({
        where: { id: user.familyGroupId },
        include: { members: true }
      });
      if (group) {
        ownerIds = group.members.map(m => m.id);
      }
    }

    const profiles = await prisma.familyProfile.findMany({ 
      where: { ownerId: { in: ownerIds } },
      include: {
        members: true,
        emergencyContacts: true,
        _count: {
          select: { medicalRecords: true, prescriptions: true }
        }
      }
    });
    res.json({ profiles });
  } catch (error) {
    next(error);
  }
});

// Create a new family profile
router.post('/', authenticate, async (req: any, res, next) => {
  try {
    const { name, age, gender, bloodGroup, allergies, chronicConditions, medicalHistory, mobileNumber } = req.body;
    
    const profile = await prisma.familyProfile.create({
      data: {
        ownerId: req.user.id,
        name,
        age: parseInt(age),
        gender,
        bloodGroup,
        allergies: allergies ? JSON.stringify(allergies) : null,
        chronicConditions: chronicConditions ? JSON.stringify(chronicConditions) : null,
        medicalHistory,
        mobileNumber
      }
    });

    await prisma.auditLog.create({
      data: { actorId: req.user.id, action: 'CREATE_FAMILY_PROFILE', target: profile.id }
    });

    res.status(201).json({ profile });
  } catch (error) {
    next(error);
  }
});

// Update a family profile
router.put('/:profileId', authenticate, async (req: any, res, next) => {
  try {
    const { profileId } = req.params;
    const { age, gender, mobileNumber } = req.body;
    
    const profile = await prisma.familyProfile.update({
      where: { id: profileId },
      data: {
        ...(age !== undefined && { age: parseInt(age) }),
        ...(gender !== undefined && { gender }),
        ...(mobileNumber !== undefined && { mobileNumber }),
      }
    });

    res.json({ profile });
  } catch (error) {
    next(error);
  }
});

// Add emergency contact to a profile
router.post('/:profileId/emergency-contact', authenticate, async (req: any, res, next) => {
  try {
    const { profileId } = req.params;
    const { name, phone, relation } = req.body;

    const contact = await prisma.emergencyContact.create({
      data: {
        profileId,
        name,
        phone,
        relation
      }
    });

    res.status(201).json({ contact });
  } catch (error) {
    next(error);
  }
});

export default router;
