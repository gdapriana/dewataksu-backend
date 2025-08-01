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

const dummyTraditions = [
  { title: "Ngaben Ceremony", content: "A traditional cremation ceremony in Bali, considered a sacred duty to release the soul of the deceased to the afterlife." },
  { title: "Galungan and Kuningan", content: "A major Balinese holiday celebrating the victory of dharma (good) over adharma (evil), where ancestors are believed to visit the earth." },
  { title: "Nyepi Day (Day of Silence)", content: "The Balinese New Year, a day of complete silence, fasting, and meditation for self-reflection across the entire island." },
  {
    title: "Kecak Dance",
    content: "A form of Balinese Hindu dance and music drama performed by a circle of a hundred or more performers wearing checked cloths around their waists, famous for its 'chak-chak' chant.",
  },
  { title: "Barong Dance", content: "A traditional Balinese dance that narrates the eternal battle between the good spirit Barong and the evil queen Rangda." },
  { title: "Canang Sari", content: "Daily offerings made by Balinese Hindus to thank the Sang Hyang Widhi Wasa in praise and prayer, seen everywhere in Bali." },
  { title: "Omed-omedan", content: "Known as the 'kissing festival,' a unique ceremony held the day after Nyepi in Sesetan, Denpasar, to strengthen community bonds." },
];

const dummyStories = [
  {
    title: "My Spiritual Journey in the Heart of Ubud",
    content: "Discovering the serene rice paddies and the tranquil yoga studios of Ubud was a life-changing experience. This is my story of finding peace and 'taksu' in Bali's cultural capital.",
  },
  {
    title: "A Culinary Tour of Seminyak's Best Warungs",
    content: "From babi guling to sate lilit, I ate my way through Seminyak. Here are the must-visit local eateries that will give you a true taste of Balinese cuisine without breaking the bank.",
  },
  {
    title: "Surfing the Legendary Waves of Uluwatu",
    content: "The cliffs, the temple, the sunset, and of course, the waves. Surfing in Uluwatu is not just a sport, it's a spiritual experience. A guide for beginners and pros alike.",
  },
  {
    title: "Chasing Waterfalls in Northern Bali",
    content: "Forget the crowded south for a day and head north. I'll share my itinerary for visiting the most breathtaking waterfalls, including Sekumpul and Gitgit.",
  },
  {
    title: "Nusa Penida in 3 Days: An Adventurer's Itinerary",
    content: "Kelingking Beach, Angel's Billabong, Broken Beach... Nusa Penida is an island of rugged beauty and incredible views. Here is how to conquer it in just three days.",
  },
];

async function main() {
  console.log("🌱 Start seeding...");
  console.log("🗑️ Deleting existing data...");
  await prisma.activityLog.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.gallery.deleteMany();
  await prisma.story.deleteMany();
  await prisma.tradition.deleteMany();
  await prisma.destination.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.image.deleteMany();
  await prisma.user.deleteMany();

  console.log("👤 Seeding users...");
  await prisma.user.createMany({
    data: [
      { username: "admin", password: await bcrypt.hash("11111111", 10), role: "ADMIN" },
      { username: "user_1", password: await bcrypt.hash("11111111", 10), role: "USER" },
      { username: "user_2", password: await bcrypt.hash("11111111", 10), role: "USER" },
    ],
  });

  const adminUser = await prisma.user.findUnique({ where: { username: "admin" } });
  const regularUser1 = await prisma.user.findUnique({ where: { username: "user_1" } });
  const regularUser2 = await prisma.user.findUnique({ where: { username: "user_2" } });

  if (!adminUser || !regularUser1 || !regularUser2) {
    throw new Error("Default users could not be created or found.");
  }

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
        category: {
          connect: { id: randomCategory.id },
        },
        tags: {
          connect: [{ id: randomTag1.id }, ...(randomTag1.id !== randomTag2.id ? [{ id: randomTag2.id }] : [])],
        },
      },
    });
  }

  console.log("🎭 Seeding traditions...");
  for (const tradition of dummyTraditions) {
    const slug = tradition.title
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");
    await prisma.tradition.create({
      data: {
        title: tradition.title,
        slug: slug,
        content: tradition.content,
      },
    });
  }

  console.log("📝 Seeding stories...");
  const userIds = [adminUser.id, regularUser1.id, regularUser2.id];
  for (const story of dummyStories) {
    const slug = story.title
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");
    const randomAuthorId = userIds[Math.floor(Math.random() * userIds.length)];

    await prisma.story.create({
      data: {
        title: story.title,
        slug: slug,
        content: story.content,
        isPublished: true,
        authorId: randomAuthorId,
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
