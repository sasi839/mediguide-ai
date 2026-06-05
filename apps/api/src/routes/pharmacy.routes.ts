import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../index';
import { requireRole } from '../middleware/rbac';
import { Role } from '../types/role';

const router = Router();

// Get stock
router.get('/stock', authenticate, requireRole([Role.PHARMACY]), async (req: any, res, next) => {
  try {
    const pharmacy = await prisma.pharmacy.findUnique({ where: { userId: req.user.id } });
    if (!pharmacy) return res.status(404).json({ message: "Pharmacy profile not found" });

    const stocks = await prisma.pharmacyStock.findMany({
      where: { pharmacyId: pharmacy.id }
    });
    res.json({ stocks });
  } catch (error) {
    next(error);
  }
});

// Update or add stock
router.post('/stock', authenticate, requireRole([Role.PHARMACY]), async (req: any, res, next) => {
  try {
    const pharmacy = await prisma.pharmacy.findUnique({ where: { userId: req.user.id } });
    if (!pharmacy) return res.status(404).json({ message: "Pharmacy profile not found" });

    const { medicineName, quantity, price } = req.body;
    
    // Check if exists
    const existing = await prisma.pharmacyStock.findFirst({
      where: { pharmacyId: pharmacy.id, medicineName }
    });

    let stock;
    if (existing) {
      stock = await prisma.pharmacyStock.update({
        where: { id: existing.id },
        data: { quantity: parseInt(quantity), price: parseFloat(price), lastUpdated: new Date() }
      });
    } else {
      stock = await prisma.pharmacyStock.create({
        data: { pharmacyId: pharmacy.id, medicineName, quantity: parseInt(quantity), price: parseFloat(price) }
      });
    }

    res.json({ stock });
  } catch (error) {
    next(error);
  }
});

// Get Profile
router.get('/profile', authenticate, requireRole([Role.PHARMACY]), async (req: any, res, next) => {
  try {
    const pharmacy = await prisma.pharmacy.findUnique({ where: { userId: req.user.id } });
    if (!pharmacy) return res.status(404).json({ message: "Pharmacy not found" });
    res.json({ pharmacy });
  } catch (error) {
    next(error);
  }
});

// Update Profile
router.put('/profile', authenticate, requireRole([Role.PHARMACY]), async (req: any, res, next) => {
  try {
    const { name, bio, address } = req.body;
    const pharmacy = await prisma.pharmacy.update({
      where: { userId: req.user.id },
      data: { name, bio, address }
    });
    res.json({ pharmacy });
  } catch (error) {
    next(error);
  }
});

// Get Pharmacy Orders
router.get('/orders', authenticate, requireRole([Role.PHARMACY]), async (req: any, res, next) => {
  try {
    const pharmacy = await prisma.pharmacy.findUnique({ where: { userId: req.user.id } });
    if (!pharmacy) return res.status(404).json({ message: "Pharmacy not found" });

    const orders = await prisma.pharmacyOrder.findMany({
      where: { pharmacyId: pharmacy.id },
      include: { patient: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ orders });
  } catch (error) {
    next(error);
  }
});

// Update Pharmacy Order Status
router.put('/order-status/:id', authenticate, requireRole([Role.PHARMACY]), async (req: any, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const pharmacy = await prisma.pharmacy.findUnique({ where: { userId: req.user.id } });
    if (!pharmacy) return res.status(404).json({ message: "Pharmacy not found" });

    const order = await prisma.pharmacyOrder.findUnique({ where: { id } });
    if (!order || order.pharmacyId !== pharmacy.id) {
      return res.status(404).json({ message: "Order not found" });
    }

    const updated = await prisma.pharmacyOrder.update({
      where: { id },
      data: { status }
    });

    res.json({ order: updated });
  } catch (error) {
    next(error);
  }
});

// --- PATIENT ENDPOINTS ---

// Get all pharmacies
router.get('/list', authenticate, async (req: any, res, next) => {
  try {
    const pharmacies = await prisma.pharmacy.findMany({
      include: { stocks: true, ratings: true }
    });

    const parsedPharmacies = pharmacies.map(p => ({
      ...p,
      avgRating: p.ratings.length ? (p.ratings.reduce((a, b) => a + b.rating, 0) / p.ratings.length) : null
    }));

    res.json({ pharmacies: parsedPharmacies });
  } catch (error) {
    next(error);
  }
});

// Place an order
router.post('/order', authenticate, requireRole([Role.OWNER]), async (req: any, res, next) => {
  try {
    const { pharmacyId, medicineName, quantity, deliveryAddress } = req.body;
    
    const result = await prisma.$transaction(async (tx) => {
      const stock = await tx.pharmacyStock.findFirst({
        where: { pharmacyId, medicineName }
      });

      if (!stock || stock.quantity < quantity) {
        throw new Error("Insufficient stock");
      }

      await tx.pharmacyStock.update({
        where: { id: stock.id },
        data: { quantity: stock.quantity - quantity }
      });

      const order = await tx.pharmacyOrder.create({
        data: {
          pharmacyId,
          patientId: req.user.id,
          medicineName,
          quantity,
          totalPrice: stock.price * quantity,
          deliveryAddress,
          status: "PENDING"
        }
      });

      return order;
    });

    res.json({ order: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get patient orders
router.get('/my-orders', authenticate, requireRole([Role.OWNER]), async (req: any, res, next) => {
  try {
    const orders = await prisma.pharmacyOrder.findMany({
      where: { patientId: req.user.id },
      include: { pharmacy: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ orders });
  } catch (error) {
    next(error);
  }
});

// Rate a pharmacy
router.post('/rate', authenticate, requireRole([Role.OWNER]), async (req: any, res, next) => {
  try {
    const { pharmacyId, rating, review } = req.body;
    const result = await prisma.pharmacyRating.create({
      data: {
        pharmacyId,
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
