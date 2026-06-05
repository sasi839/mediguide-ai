import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../index';
import { requireRole } from '../middleware/rbac';
import { Role } from '../types/role';

const router = Router();

// --- DOCTOR ENDPOINTS ---

// Update Doctor Profile
router.put('/profile', authenticate, requireRole([Role.DOCTOR]), async (req: any, res, next) => {
  try {
    const { name, age, qualifications, nearestLocation } = req.body;
    const doctor = await prisma.doctor.update({
      where: { userId: req.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(age !== undefined && { age: parseInt(age) }),
        ...(qualifications !== undefined && { qualifications }),
        ...(nearestLocation !== undefined && { nearestLocation }),
      }
    });
    res.json({ doctor });
  } catch (error) {
    next(error);
  }
});

// Get Doctor Profile
router.get('/profile', authenticate, requireRole([Role.DOCTOR]), async (req: any, res, next) => {
  try {
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
    if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });
    res.json({ doctor });
  } catch (error) {
    next(error);
  }
});

// Get Availability
router.get('/availability', authenticate, requireRole([Role.DOCTOR]), async (req: any, res, next) => {
  try {
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
    if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

    const availability = await prisma.doctorAvailability.findMany({ where: { doctorId: doctor.id }});
    res.json({ availability });
  } catch (error) {
    next(error);
  }
});

// Set Availability (expects array of day/times)
router.post('/availability', authenticate, requireRole([Role.DOCTOR]), async (req: any, res, next) => {
  try {
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
    if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

    const { availability } = req.body; // { dayOfWeek: number, startTime: string, endTime: string }[]

    // Clear existing and replace
    await prisma.doctorAvailability.deleteMany({ where: { doctorId: doctor.id }});
    const created = await Promise.all(availability.map((a: any) => 
      prisma.doctorAvailability.create({
        data: { doctorId: doctor.id, dayOfWeek: a.dayOfWeek, startTime: a.startTime, endTime: a.endTime }
      })
    ));

    res.json({ availability: created });
  } catch (error) {
    next(error);
  }
});

// Get Doctor Appointments
router.get('/appointments', authenticate, requireRole([Role.DOCTOR]), async (req: any, res, next) => {
  try {
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
    if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

    const appointments = await prisma.appointment.findMany({ 
      where: { doctorId: doctor.id },
      include: { profile: true },
      orderBy: { scheduledAt: 'asc' }
    });
    res.json({ appointments });
  } catch (error) {
    next(error);
  }
});

// Accept Appointment
router.put('/appointments/:id/accept', authenticate, requireRole([Role.DOCTOR]), async (req: any, res, next) => {
  try {
    const { id } = req.params;
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment || appointment.doctorId !== doctor.id) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 1); // Mock: schedule for tomorrow
    scheduledDate.setHours(10, 0, 0, 0);

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: 'CONFIRMED', scheduledAt: scheduledDate }
    });
    res.json({ appointment: updated });
  } catch (error) {
    next(error);
  }
});

// Update Appointment Status
router.put('/appointments/:id/status', authenticate, requireRole([Role.DOCTOR]), async (req: any, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // CONFIRMED or REJECTED

    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
    if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

    const appointment = await prisma.appointment.update({
      where: { id, doctorId: doctor.id },
      data: { status }
    });

    res.json({ appointment });
  } catch (error) {
    next(error);
  }
});

// --- PATIENT/PUBLIC ENDPOINTS ---

// Get patient's booked appointments
router.get('/my-appointments', authenticate, requireRole([Role.OWNER, Role.MEMBER]), async (req: any, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    
    // Find all profiles this user can access
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

    const appointments = await prisma.appointment.findMany({
      where: { profileId: { in: profileIds } },
      include: {
        doctor: { include: { user: { select: { email: true } } } },
        profile: true
      },
      orderBy: { scheduledAt: 'desc' }
    });

    res.json({ appointments });
  } catch (error) {
    next(error);
  }
});

// Get all doctors with availability and ratings
router.get('/list', authenticate, async (req: any, res, next) => {
  try {
    const doctors = await prisma.doctor.findMany({
      include: {
        user: { select: { email: true } },
        availability: true,
        ratings: true
      }
    });
    
    // Calculate average rating dynamically
    const docsWithRatings = doctors.map(doc => ({
      ...doc,
      avgRating: doc.ratings.length ? (doc.ratings.reduce((a, b) => a + b.rating, 0) / doc.ratings.length) : null
    }));

    res.json({ doctors: docsWithRatings });
  } catch (error) {
    next(error);
  }
});

// Book an appointment
router.post('/book', authenticate, requireRole([Role.OWNER]), async (req: any, res, next) => {
  try {
    const { doctorId, profileId, scheduledAt, notes } = req.body;
    const appointment = await prisma.appointment.create({
      data: {
        doctorId,
        profileId,
        scheduledAt: new Date(scheduledAt),
        status: "PENDING",
        notes
      }
    });
    res.json({ appointment });
  } catch (error) {
    next(error);
  }
});

// Rate a doctor
router.post('/rate', authenticate, requireRole([Role.OWNER]), async (req: any, res, next) => {
  try {
    const { doctorId, rating, review } = req.body;
    const result = await prisma.doctorRating.create({
      data: {
        doctorId,
        patientId: req.user.id,
        rating: parseInt(rating),
        review
      }
    });
    res.json({ rating: result });
  } catch (error) {
    next(error);
  }
});

export default router;
