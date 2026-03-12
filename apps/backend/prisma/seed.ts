import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create room types
  const existingTypes = await prisma.roomType.count();
  if (existingTypes === 0) {
    await prisma.roomType.createMany({
      data: [
        { name: "标准间", price: 280, capacity: 2, beds: 1, amenities: '["WiFi","空调","电视"]', description: "经济实惠的标准客房" },
        { name: "豪华间", price: 480, capacity: 2, beds: 1, amenities: '["WiFi","空调","电视","浴缸"]', description: "升级版豪华客房" },
        { name: "套房", price: 680, capacity: 4, beds: 2, amenities: '["WiFi","空调","电视","浴缸","客厅","迷你吧"]', description: "宽敞舒适的套房" },
        { name: "总统套房", price: 1280, capacity: 6, beds: 3, amenities: '["WiFi","空调","电视","浴缸","客厅","迷你吧","私人管家"]', description: "顶级豪华总统套房" },
      ],
    });
    console.log("Created room types");
  } else {
    console.log("Room types already exist");
  }

  // Get room types for creating rooms
  const types = await prisma.roomType.findMany();

  // Create rooms
  const existingRooms = await prisma.room.count();
  if (existingRooms === 0 && types.length > 0) {
    await prisma.room.createMany({
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
    console.log("Created rooms");
  } else {
    console.log("Rooms already exist");
  }

  // Create guests
  const existingGuests = await prisma.guest.count();
  if (existingGuests === 0) {
    await prisma.guest.createMany({
      data: [
        { name: "张三", phone: "13800138001", email: "zhangsan@example.com", idCard: "110101199001011234", address: "北京市朝阳区" },
        { name: "李四", phone: "13900139002", email: "lisi@example.com", idCard: "310101198503022345", address: "上海市浦东新区" },
        { name: "王五", phone: "13700137003", email: "wangwu@example.com", idCard: "440301197812063456", address: "广州市天河区" },
        { name: "赵六", phone: "13600136004", email: "zhaoliu@example.com", idCard: "510105200101014567", address: "成都市武侯区" },
      ],
    });
    console.log("Created guests");
  } else {
    console.log("Guests already exist");
  }

  // Create bookings
  const allGuests = await prisma.guest.findMany();
  const existingBookings = await prisma.booking.count();
  if (existingBookings === 0 && allGuests.length > 0 && types.length > 0) {
    await prisma.booking.createMany({
      data: [
        {
          guestId: allGuests[0].id,
          roomTypeId: types[0].id,
          checkInDate: new Date("2026-02-27"),
          checkOutDate: new Date("2026-02-28"),
          adults: 2,
          children: 0,
          status: "CONFIRMED",
          totalPrice: 560,
        },
        {
          guestId: allGuests[1].id,
          roomTypeId: types[1].id,
          checkInDate: new Date("2026-02-28"),
          checkOutDate: new Date("2026-03-02"),
          adults: 1,
          children: 1,
          status: "PENDING",
          totalPrice: 1920,
          specialRequests: "需要婴儿床",
        },
      ],
    });
    console.log("Created bookings");
  } else {
    console.log("Bookings already exist");
  }

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });