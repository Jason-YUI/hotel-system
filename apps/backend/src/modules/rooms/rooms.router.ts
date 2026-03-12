import { Router, Request, Response } from "express";
import prisma from "../../lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

type RoomStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "CLEANING" | "MAINTENANCE";

// ─── Routes ────────────────────────────────────────────────────────────────────

const router = Router();

// GET /api/rooms - Get all rooms
router.get("/", async (_req: Request, res: Response) => {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        roomType: true,
      },
      orderBy: {
        number: "asc",
      },
    });

    // Transform to frontend format
    const statusMap: Record<string, string> = {
      AVAILABLE: "可用",
      OCCUPIED: "已入住",
      RESERVED: "已预订",
      CLEANING: "清洁中",
      MAINTENANCE: "维修中",
    };

    const transformed = rooms.map((r) => ({
      id: r.id,
      number: r.number,
      type: r.roomType.name,
      floor: r.floor,
      status: statusMap[r.status] || r.status,
      price: r.roomType.price,
      capacity: r.roomType.capacity,
      amenities: JSON.parse(r.roomType.amenities || "[]"),
    }));

    res.json(transformed);
  } catch (error) {
    console.error("[Rooms] Get all error:", error);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

// GET /api/rooms/types - Get all room types
router.get("/meta/types", async (_req: Request, res: Response) => {
  try {
    const types = await prisma.roomType.findMany({
      orderBy: { price: "asc" },
    });
    res.json(types);
  } catch (error) {
    console.error("[Rooms] Get types error:", error);
    res.status(500).json({ error: "Failed to fetch room types" });
  }
});

// GET /api/rooms/:id - Get single room
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const room = await prisma.room.findUnique({
      where: { id },
      include: { roomType: true },
    });
    if (!room) return res.status(404).json({ error: "Room not found" });
    res.json(room);
  } catch (error) {
    console.error("[Rooms] Get one error:", error);
    res.status(500).json({ error: "Failed to fetch room" });
  }
});

// POST /api/rooms - Create room
router.post("/", async (req: Request, res: Response) => {
  try {
    const { number, floor, status, roomTypeId, type, price, capacity, amenities } = req.body;

    let actualRoomTypeId = roomTypeId;
    if (!actualRoomTypeId && type) {
      const existingType = await prisma.roomType.findFirst({ where: { name: type } });
      if (existingType) {
        actualRoomTypeId = existingType.id;
      } else {
        const newType = await prisma.roomType.create({
          data: {
            name: type,
            price: price || 280,
            capacity: capacity || 2,
            amenities: JSON.stringify(amenities || []),
          },
        });
        actualRoomTypeId = newType.id;
      }
    }

    const existing = await prisma.room.findUnique({ where: { number } });
    if (existing) {
      return res.status(400).json({ error: `Room number ${number} already exists` });
    }

    const room = await prisma.room.create({
      data: {
        number,
        floor: floor || 1,
        status: status || "AVAILABLE",
        roomTypeId: actualRoomTypeId,
      },
      include: { roomType: true },
    });
    res.status(201).json(room);
  } catch (error) {
    console.error("[Rooms] Create error:", error);
    res.status(500).json({ error: "Failed to create room" });
  }
});

// PUT /api/rooms/:id - Update room
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { number, floor, status, roomTypeId } = req.body;

    const room = await prisma.room.update({
      where: { id },
      data: {
        ...(number && { number }),
        ...(floor && { floor }),
        ...(status && { status }),
        ...(roomTypeId && { roomTypeId }),
      },
      include: { roomType: true },
    });
    res.json(room);
  } catch (error) {
    console.error("[Rooms] Update error:", error);
    res.status(500).json({ error: "Failed to update room" });
  }
});

// DELETE /api/rooms/:id - Delete room
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.room.delete({ where: { id } });
    res.json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("[Rooms] Delete error:", error);
    res.status(500).json({ error: "Failed to delete room" });
  }
});

// PATCH /api/rooms/:id/status - Update room status
router.patch("/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const statusMap: Record<string, string> = {
      "可用": "AVAILABLE",
      "已入住": "OCCUPIED",
      "已预订": "RESERVED",
      "清洁中": "CLEANING",
      "维修中": "MAINTENANCE",
    };

    const dbStatus = statusMap[status] || status;
    if (!["AVAILABLE", "OCCUPIED", "RESERVED", "CLEANING", "MAINTENANCE"].includes(dbStatus)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const room = await prisma.room.update({
      where: { id },
      data: { status: dbStatus },
      include: { roomType: true },
    });
    res.json(room);
  } catch (error) {
    console.error("[Rooms] Update status error:", error);
    res.status(500).json({ error: "Failed to update room status" });
  }
});

export default router;