import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const dummyDestinations = [
  { title: "Kuta Beach", address: "Kuta, Badung Regency, Bali", lat: -8.7184, lon: 115.1684, price: 0 },
  { title: "Mount Bromo", address: "Bromo Tengger Semeru National Park, East Java", lat: -7.9425, lon: 112.953, price: 220000 },
  { title: "Borobudur Temple", address: "Jl. Badrawati, Borobudur, Magelang, Central Java", lat: -7.6079, lon: 110.2038, price: 350000 },
  { title: "Komodo Island", address: "Komodo National Park, East Nusa Tenggara", lat: -8.5428, lon: 119.4939, price: 150000 },
  { title: "Raja Ampat Islands", address: "Raja Ampat Regency, West Papua", lat: -0.5562, lon: 130.518, price: 500000 },
  { title: "Lake Toba", address: "North Sumatra", lat: 2.61, lon: 98.83, price: 10000 },
  { title: "Ubud Monkey Forest", address: "Jl. Monkey Forest, Ubud, Bali", lat: -8.5188, lon: 115.2612, price: 80000 },
  { title: "Taman Mini Indonesia Indah", address: "East Jakarta, DKI Jakarta", lat: -6.3025, lon: 106.895, price: 25000 },
  { title: "Ijen Crater", address: "Banyuwangi Regency, East Java", lat: -8.0583, lon: 114.2425, price: 100000 },
  { title: "Gili Trawangan", address: "North Lombok, West Nusa Tenggara", lat: -8.3506, lon: 116.039, price: 0 },
  { title: "Prambanan Temple", address: "Jl. Raya Solo - Yogyakarta No.16, Sleman, Yogyakarta", lat: -7.752, lon: 110.4914, price: 350000 },
  { title: "Harau Valley", address: "Lima Puluh Kota Regency, West Sumatra", lat: -0.0967, lon: 100.6433, price: 15000 },
  { title: "Yogyakarta Palace (Keraton)", address: "Jl. Rotowijayan Blok No. 1, Yogyakarta City", lat: -7.8053, lon: 110.3644, price: 15000 },
  { title: "Tana Toraja", address: "South Sulawesi", lat: -2.9715, lon: 119.897, price: 20000 },
  { title: "Bukit Lawang", address: "Langkat, North Sumatra", lat: 3.553, lon: 98.136, price: 10000 },
  { title: "Pink Beach", address: "Komodo National Park, East Nusa Tenggara", lat: -8.6917, lon: 119.648, price: 50000 },
  { title: "Mount Rinjani", address: "Mount Rinjani National Park, Lombok", lat: -8.4116, lon: 116.467, price: 150000 },
  { title: "Old Town Jakarta (Kota Tua)", address: "West Jakarta, DKI Jakarta", lat: -6.1352, lon: 106.813, price: 0 },
  { title: "Nusa Penida", address: "Klungkung Regency, Bali", lat: -8.7369, lon: 115.557, price: 25000 },
  { title: "Jodipan Colorful Village", address: "Jodipan, Malang City, East Java", lat: -7.9866, lon: 112.633, price: 5000 },
];

async function main() {
  console.log("🌱 Start seeding...");
  console.log("🗑️ Deleting existing data...");
  await prisma.user.deleteMany();
  await prisma.destination.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.like.deleteMany();
  await prisma.tradition.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.gallery.deleteMany();
  await prisma.image.deleteMany();

  console.log("seeding users...");
  await prisma.user.createMany({
    data: [
      { username: "admin", password: await bcrypt.hash("11111111", 10), role: "ADMIN" },
      { username: "user", password: await bcrypt.hash("11111111", 10), role: "USER" },
    ],
  });

  console.log("📚 Seeding categories...");
  const createdCategories = await prisma.category.createManyAndReturn({
    data: [
      { name: "Beach", slug: "beach" },
      { name: "Mountain", slug: "mountain" },
      { name: "Historical Site", slug: "historical-site" },
      { name: "Nature Reserve", slug: "nature-reserve" },
      { name: "Urban Tourism", slug: "urban-tourism" },
    ],
  });

  console.log("🏷️ Seeding tags...");
  const createdTags = await prisma.tag.createManyAndReturn({
    data: [
      { name: "Popular", slug: "popular" },
      { name: "Family Friendly", slug: "family-friendly" },
      { name: "Instagrammable", slug: "instagrammable" },
      { name: "Adventure", slug: "adventure" },
      { name: "Hidden Gem", slug: "hidden-gem" },
    ],
  });

  console.log("📍 Seeding destinations...");
  for (const dest of dummyDestinations) {
    const slug = dest.title
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");

    const randomCategory = createdCategories[Math.floor(Math.random() * createdCategories.length)];
    const randomTag1 = createdTags[Math.floor(Math.random() * createdTags.length)];
    const randomTag2 = createdTags[Math.floor(Math.random() * createdTags.length)];

    await prisma.destination.create({
      data: {
        title: dest.title,
        slug: slug,
        content: `This is a description for ${dest.title}. Enjoy the beautiful scenery and an unforgettable experience at one of the best destinations in Indonesia. Explore the unique culture and nature it has to offer.`,
        address: dest.address,
        latitude: dest.lat,
        longitude: dest.lon,
        price: dest.price,
        mapUrl: `https://www.google.com/maps?q=$${dest.lat},${dest.lon}`,
        category: {
          connect: { id: randomCategory.id },
        },
        tags: {
          connect: [{ id: randomTag1.id }, ...(randomTag1.id !== randomTag2.id ? [{ id: randomTag2.id }] : [])],
        },
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    console.log("✅ Seeding finished.");
    await prisma.$disconnect();
  });
