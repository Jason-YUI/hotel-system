import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

type MemberLevel = "普通" | "银卡" | "金卡" | "钻石";
type Gender = "男" | "女" | "其他";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getMemberLevel = (totalSpent: number): MemberLevel => {
  if (totalSpent >= 30000) return "钻石";
  if (totalSpent >= 10000) return "金卡";
  if (totalSpent >= 3000) return "银卡";
  return "普通";
};

// ─── Routes ────────────────────────────────────────────────────────────────────

const router = Router();

// GET /api/guests - Get all guests
router.get("/", async (_req: Request, res: Response) => {
  try {
    const guests = await prisma.guest.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform to frontend format with member level calculated
    const transformed = guests.map((g) => ({
      id: g.id,
      name: g.name,
      phone: g.phone || "",
      email: g.email || "",
      idCard: g.idCard || "",
      gender: (g.address || "其他") as Gender, // Use address as placeholder for gender
      address: g.address || "",
      memberLevel: getMemberLevel(0), // Will be calculated based on orders
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
    const guest = await prisma.guest.findUnique({
      where: { id },
    });
    if (!guest) {
      return res.status(404).json({ error: "Guest not found" });
    }
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

    // Check for duplicate idCard
    if (idCard) {
      const existing = await prisma.guest.findUnique({
        where: { idCard },
      });
      if (existing) {
        return res.status(400).json({ error: "ID card already registered" });
      }
    }

    const guest = await prisma.guest.create({
      data: {
        name,
        phone,
        email,
        idCard,
        address,
      },
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
    await prisma.guest.delete({
      where: { id },
    });
    res.json({ message: "Guest deleted successfully" });
  } catch (error) {
    console.error("[Guests] Delete error:", error);
    res.status(500).json({ error: "Failed to delete guest" });
  }
});

// Seed sample guests
router.post("/seed", async (_req: Request, res: Response) => {
  try {
    const existingCount = await prisma.guest.count();
    if (existingCount > 0) {
      return res.json({ message: "Guests already exist", count: existingCount });
    }

    const guests = await prisma.guest.createMany({
      data: [
        { name: "张三", phone: "13800138001", email: "zhangsan@example.com", idCard: "110101199001011234", address: "北京市朝阳区" },
        { name: "李四", phone: "13900139002", email: "lisi@example.com", idCard: "310101198503022345", address: "上海市浦东新区" },
        { name: "王五", phone: "13700137003", email: "wangwu@example.com", idCard: "440301197812063456", address: "广州市天河区" },
        { name: "赵六", phone: "13600136004", email: "zhaoliu@example.com", idCard: "510105200101014567", address: "成都市武侯区" },
      ],
    });

    res.json({ message: "Guests seeded", count: guests.count });
  } catch (error) {
    console.error("[Guests] Seed error:", error);
    res.status(500).json({ error: "Failed to seed guests" });
  }
});

export default router;