import { Router, Request, Response } from "express";
import prisma from "../../lib/prisma";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getMemberLevel = (_totalSpent: number): string => {
  // 简化版，实际应根据消费计算
  return "普通";
};

// ─── Routes ────────────────────────────────────────────────────────────────────

const router = Router();

// GET /api/guests - Get all guests
router.get("/", async (_req: Request, res: Response) => {
  try {
    const guests = await prisma.guest.findMany({
      orderBy: { createdAt: "desc" },
    });

    const transformed = guests.map((g) => ({
      id: g.id,
      name: g.name,
      phone: g.phone || "",
      email: g.email || "",
      idCard: g.idCard || "",
      gender: "其他" as const,
      address: g.address || "",
      memberLevel: getMemberLevel(0),
      totalStays: 0,
      totalSpent: 0,
      createdAt: g.createdAt.toISOString().split("T")[0],
      lastStayDate: "—",
    }));

    res.json(transformed);
  } catch (error) {
    console.error("[Guests] Get all error:", error);
    res.status(500).json({ error: "Failed to fetch guests" });
  }
});

// GET /api/guests/:id - Get single guest
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const guest = await prisma.guest.findUnique({ where: { id } });
    if (!guest) return res.status(404).json({ error: "Guest not found" });
    res.json(guest);
  } catch (error) {
    console.error("[Guests] Get one error:", error);
    res.status(500).json({ error: "Failed to fetch guest" });
  }
});

// POST /api/guests - Create guest
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, phone, email, idCard, address } = req.body;

    if (idCard) {
      const existing = await prisma.guest.findUnique({ where: { idCard } });
      if (existing) {
        return res.status(400).json({ error: "ID card already registered" });
      }
    }

    const guest = await prisma.guest.create({
      data: { name, phone, email, idCard, address },
    });
    res.status(201).json(guest);
  } catch (error) {
    console.error("[Guests] Create error:", error);
    res.status(500).json({ error: "Failed to create guest" });
  }
});

// PUT /api/guests/:id - Update guest
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phone, email, idCard, address } = req.body;

    const guest = await prisma.guest.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(idCard !== undefined && { idCard }),
        ...(address !== undefined && { address }),
      },
    });
    res.json(guest);
  } catch (error) {
    console.error("[Guests] Update error:", error);
    res.status(500).json({ error: "Failed to update guest" });
  }
});

// DELETE /api/guests/:id - Delete guest
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.guest.delete({ where: { id } });
    res.json({ message: "Guest deleted successfully" });
  } catch (error) {
    console.error("[Guests] Delete error:", error);
    res.status(500).json({ error: "Failed to delete guest" });
  }
});

export default router;