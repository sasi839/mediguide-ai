import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../index';
import multer from 'multer';
import path from 'path';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'rx-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Wave 2: Prescription Scanner (OCR + LLM Mock Pipeline)
router.post('/upload-prescription', authenticate, upload.single('prescription'), async (req: any, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    let targetProfileId = req.body.profileId;
    if (!targetProfileId) {
      const profile = await prisma.familyProfile.findFirst({
        where: { ownerId: req.user.id }
      });
      if (!profile) return res.status(400).json({ error: "No family profile found" });
      targetProfileId = profile.id;
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    // 1. Google Vision API Fallback Mock (Extract Text from Image)
    const extractedText = `
      Patient: John Doe
      Rx: Lisinopril/Hydrochlorothiazide 20/12.5mg, 1 pill every morning
      Rx: Atorvastatin 40mg, 1 pill at night
      Note: Avoid potassium supplements. May cause dizziness.
    `;

    // 2. OpenAI / Gemini Prompt Mock (Structured parsing)
    const aiSummary = "Treatment for Hypertension and High Cholesterol. Lisinopril/HCTZ is a composite medication combining an ACE inhibitor and a diuretic. Take with water in the morning. Avoid potassium-rich diets and supplements due to hyperkalemia risk.";
    
    const parsedMedicines = [
      { 
        name: "Lisinopril / Hydrochlorothiazide 20/12.5mg", 
        dosage: "1 pill", 
        frequency: "Once daily", 
        timing: "08:00 AM", 
        sideEffects: ["Dizziness", "Dehydration", "Cough (ACE inhibitor effect)"] 
      },
      { 
        name: "Atorvastatin 40mg", 
        dosage: "1 pill", 
        frequency: "Once daily", 
        timing: "09:00 PM", 
        sideEffects: ["Muscle ache", "Interaction with Grapefruit"] 
      }
    ];

    // 3. Save to Database
    const prescription = await prisma.prescription.create({
      data: {
        profileId: targetProfileId,
        fileUrl,
        aiSummary,
        medicines: {
          create: parsedMedicines.map(med => ({
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            timing: med.timing,
            sideEffects: med.sideEffects.join(', ')
          }))
        }
      },
      include: { medicines: true }
    });

    await prisma.auditLog.create({
      data: { actorId: req.user.id, action: 'AI_PRESCRIPTION_SCAN', target: prescription.id }
    });

    res.status(201).json({ prescription });
  } catch (error) {
    next(error);
  }
});

// GET user prescriptions for the frontend
router.get('/prescriptions', authenticate, async (req: any, res, next) => {
  try {
    let targetProfileId = req.query.profileId;
    
    if (!targetProfileId) {
      const profile = await prisma.familyProfile.findFirst({
        where: { ownerId: req.user.id }
      });
      if (!profile) return res.json({ medicines: [], prescriptions: [] });
      targetProfileId = profile.id;
    }

    // Get all medicines for user
    const prescriptions = await prisma.prescription.findMany({
      where: { profileId: targetProfileId as string },
      include: { medicines: { include: { reminders: true } } },
      orderBy: { issuedAt: 'desc' }
    });

    const formattedMedicines = prescriptions.flatMap(p => 
      p.medicines.map(m => ({
        id: m.id,
        name: m.name,
        dosage: m.dosage,
        time: m.timing || "08:00 AM", // using timing as mock time
        status: "pending",
        warning: m.sideEffects ? m.sideEffects : false
      }))
    );

    res.json({ medicines: formattedMedicines, prescriptions });
  } catch (error) {
    next(error);
  }
});

// Wave 3: Chatbot & Symptom Analyzer
router.post('/chat', authenticate, async (req: any, res, next) => {
  try {
    const { query } = req.body;
    
    // OpenAI Prompt Simulation
    let severity = "Mild";
    let explanation = "Based on your symptoms, this appears to be a general viral response.";
    let recommendation = "Rest and hydrate. Consult a doctor if symptoms persist.";

    if (query.toLowerCase().includes('fever') && query.toLowerCase().includes('pain')) {
      severity = "Moderate";
      explanation = "Fever combined with pain could indicate a bacterial infection or severe inflammation.";
      recommendation = "Schedule a consultation with a general physician within 24 hours.";
    }

    if (query.toLowerCase().includes('chest') || query.toLowerCase().includes('breath')) {
      severity = "Urgent";
      explanation = "Chest pain and shortness of breath are critical emergency symptoms.";
      recommendation = "Call emergency services or visit the nearest ER immediately.";
    }

    await prisma.auditLog.create({
      data: { actorId: req.user.id, action: 'AI_SYMPTOM_ANALYSIS', target: 'chatbot_session' }
    });

    res.json({ severity, explanation, recommendation });
  } catch (error) {
    next(error);
  }
});

export default router;
