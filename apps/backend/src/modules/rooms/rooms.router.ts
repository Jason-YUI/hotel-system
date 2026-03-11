import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

type RoomStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "CLEANING" | "MAINTENANCE";

interface RoomInput {
  number: string;
  floor: number;
  status: RoomStatus;
  roomTypeId: string;
}

interface RoomTypeInput {
  name: string;
  price: number;
  capacity: number;
  beds?: number;
  amenities?: string[];
  description?: string;
}

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
    res.json(rooms);
  } catch (error) {
    console.error("[Rooms] Get all error:", error);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

// GET /api/rooms/:id - Get single room
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        roomType: true,
      },
    });
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
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

    // If roomTypeId not provided but type provided, create or find room type
    let actualRoomTypeId = roomTypeId;
    if (!actualRoomTypeId && type) {
      const existingType = await prisma.roomType.findFirst({
        where: { name: type },
      });
      if (existingType) {
        actualRoomTypeId = existingType.id;
      } else {
        const newType = await prisma.roomType.create({
          data: {
            name: type,
            price: price || 280,
            capacity: capacity || 2,
            amenities: amenities || [],
          },
        });
        actualRoomTypeId = newType.id;
      }
    }

    // Check if room number already exists
    const existing = await prisma.room.findUnique({
      where: { number },
    });
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
      include: {
        roomType: true,
      },
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
      include: {
        roomType: true,
      },
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
    await prisma.room.delete({
      where: { id },
    });
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

    if (!["AVAILABLE", "OCCUPIED", "RESERVED", "CLEANING", "MAINTENANCE"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const room = await prisma.room.update({
      where: { id },
      data: { status },
      include: {
        roomType: true,
      },
    });
    res.json(room);
  } catch (error) {
    console.error("[Rooms] Update status error:", error);
    res.status(500).json({ error: "Failed to update room status" });
  }
});

// GET /api/rooms/types - Get all room types
router.get("/meta/types", async (_req: Request, res: Response) => {
  try {
    const types = await prisma.roomType.findMany({
      orderBy: {
        price: "asc",
      },
    });
    res.json(types);
  } catch (error) {
    console.error("[Rooms] Get types error:", error);
    res.status(500).json({ error: "Failed to fetch room types" });
  }
});

// POST /api/rooms/types - Create room type
router.post("/meta/types", async (req: Request, res: Response) => {
  try {
    const { name, price, capacity, beds, amenities, description } = req.body as RoomTypeInput;

    const roomType = await prisma.roomType.create({
      data: {
        name,
        price,
        capacity,
        beds: beds || 1,
        amenities: amenities || [],
        description,
      },
    });
    res.status(201).json(roomType);
  } catch (error) {
    console.error("[Rooms] Create type error:", error);
    res.status(500).json({ error: "Failed to create room type" });
  }
});

// Seed initial room types if none exist
router.post("/meta/seed", async (_req: Request, res: Response) => {
  try {
    const existingTypes = await prisma.roomType.count();
    if (existingTypes > 0) {
      return res.json({ message: "Room types already exist", count: existingTypes });
    }

    const roomTypes = await prisma.roomType.createMany({
      data: [
        { name: "标准间", price: 280, capacity: 2, beds: 1, amenities: ["WiFi", "空调", "电视"], description: "经济实惠的标准客房" },
        { name: "豪华间", price: 480, capacity: 2, beds: 1, amenities: ["WiFi", "空调", "电视", "浴缸"], description: "升级版豪华客房" },
        { name: "套房", price: 680, capacity: 4, beds: 2, amenities: ["WiFi", "空调", "电视", "浴缸", "客厅", "迷你吧"], description: "宽敞舒适的套房" },
        { name: "总统套房", price: 1280, capacity: 6, beds: 3, amenities: ["WiFi", "空调", "电视", "浴缸", "客厅", "迷你吧", "私人管家"], description: "顶级豪华总统套房" },
      ],
    });

    // Create sample rooms
    const types = await prisma.roomType.findMany();
    const rooms = await prisma.room.createMany({
      data: [
        { number: "101", floor: 1, status: "AVAILABLE", roomTypeId: types[0].id },
        { number: "102", floor: 1, status: "OCCUPIED", roomTypeId: types[0].id },
        { number: "201", floor: 2, status: "CLEANING", roomTypeId: types[1].id },
        { number: "202", floor: 2, status: "AVAILABLE", roomTypeId: types[1].id },
        { number: "301", floor: 3, status: "MAINTENANCE", roomTypeId: types[2].id },
        { number: "302", floor: 3, status: "RESERVED", roomTypeId: types[2].id },
        { number: "401", floor: 4, status: "AVAILABLE", roomTypeId: types[3].id },
      ],
    });

    res.json({
      message: "Seed data created",
      roomTypes: roomTypes.count,
      rooms: rooms.count,
    });
  } catch (error) {
    console.error("[Rooms] Seed error:", error);
    res.status(500).json({ error: "Failed to seed data" });
  }
});

export default router;