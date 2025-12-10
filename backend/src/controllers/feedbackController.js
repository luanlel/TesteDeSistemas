// backend/src/controllers/feedbackController.js
import { db } from "../config/firebase-admin.js";

/**
 * GET /api/feedbacks
 * (admin)
 */
export async function getAllFeedbacks(req, res, next) {
  try {
    const snap = await db.collection("feedbacks").orderBy("timestamp", "desc").get();
    const feedbacks = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(feedbacks);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/feedbacks
 * (usuário logado)
 */
export async function createFeedback(req, res, next) {
  try {
    const data = req.body;

    if (!data.mensagem || !data.userEmail) {
      return res.status(400).json({
        error: "Mensagem e userEmail são obrigatórios.",
      });
    }

    const docRef = await db.collection("feedbacks").add({
      ...data,
      status: "novo",
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({ id: docRef.id, ...data });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/feedbacks/:id/status
 */
export async function updateFeedbackStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await db.collection("feedbacks").doc(id).update({
      status,
      atualizadoEm: new Date().toISOString(),
    });

    res.json({ message: "Status atualizado com sucesso." });
  } catch (err) {
    next(err);
  }
}
