// backend/src/controllers/productController.js
import { db } from "../config/firebase-admin.js";

/**
 * GET /api/products
 */
export async function getAllProducts(req, res, next) {
  try {
    const snap = await db.collection("produtos").get();
    const produtos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(produtos);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/products
 */
export async function createProduct(req, res, next) {
  try {
    const data = req.body;

    if (!data.nome || data.quantidade == null || data.preco == null) {
      return res.status(400).json({
        error: "Nome, quantidade e preço são obrigatórios.",
      });
    }

    const docRef = await db.collection("produtos").add({
      ...data,
      criadoEm: new Date().toISOString(),
    });

    res.status(201).json({ id: docRef.id, ...data });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/products/:id
 */
export async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const data = req.body;

    await db.collection("produtos").doc(id).update({
      ...data,
      atualizadoEm: new Date().toISOString(),
    });

    res.json({ message: "Produto atualizado com sucesso." });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/products/:id
 */
export async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;

    await db.collection("produtos").doc(id).delete();

    res.json({ message: "Produto removido com sucesso." });
  } catch (err) {
    next(err);
  }
}
