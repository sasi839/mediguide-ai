import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../index';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure Multer storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Get all records for user's accessible profiles
router.get('/list', authenticate, async (req: any, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
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

    const profiles = await prisma.familyProfile.findMany({ where: { ownerId: { in: ownerIds } } });
    const profileIds = profiles.map(p => p.id);

    const records = await prisma.medicalRecord.findMany({
      where: { profileId: { in: profileIds } },
      orderBy: { uploadedAt: 'desc' }
    });

    res.json({ records });
  } catch (error) {
    next(error);
  }
});

// Upload a real file
router.post('/upload', authenticate, upload.single('document'), async (req: any, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { title, isPrivate } = req.body;

    // By default, attach to the user's personal profile
    const profile = await prisma.familyProfile.findFirst({
      where: { ownerId: req.user.id }
    });

    if (!profile) {
      return res.status(400).json({ error: "No family profile found to attach document" });
    }

    // Convert file buffer to Base64 string for Vercel compatibility
    const base64File = req.file.buffer.toString('base64');
    const fileUrl = `data:${req.file.mimetype};base64,${base64File}`;

    const record = await prisma.medicalRecord.create({
      data: {
        profileId: profile.id,
        title: title || req.file.originalname,
        fileUrl: fileUrl,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        isPrivate: isPrivate === 'true',
      }
    });

    await prisma.auditLog.create({
      data: { actorId: req.user.id, action: 'UPLOAD_MEDICAL_RECORD', target: record.id }
    });

    res.status(201).json({ record });
  } catch (error) {
    next(error);
  }
});

export default router;
