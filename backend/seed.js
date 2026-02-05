import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const realNames = [
  "Liam Smith", "Olivia Johnson", "Noah Williams", "Emma Brown", "Oliver Jones",
  "Charlotte Garcia", "Elijah Miller", "Amelia Davis", "James Rodriguez", "Sophia Martinez",
  "William Hernandez", "Isabella Lopez", "Benjamin Gonzalez", "Ava Wilson", "Lucas Anderson",
  "Mia Thomas", "Henry Taylor", "Evelyn Moore", "Theodore Jackson", "Harper Martin",
  "Jack Lee", "Luna Perez", "Levi Thompson", "Camila White", "Alexander Harris",
  "Gianna Sanchez", "Jackson Clark", "Elizabeth Ramirez", "Mateo Lewis", "Eleanor Robinson",
  "Daniel Walker", "Ella Young", "Michael Allen", "Abigail King", "Mason Wright",
  "Sofia Scott", "Sebastian Torres", "Avery Nguyen", "Ethan Hill", "Scarlett Flores",
  "Logan Green", "Emily Adams", "Owen Nelson", "Aria Baker", "Samuel Hall",
  "Penelope Rivera", "Jacob Campbell", "Chloe Mitchell", "Asher Carter", "Layla Roberts",
  "Aiden Gomez", "Mila Phillips", "Joseph Evans", "Nora Turner", "John Diaz",
  "Hazel Parker", "David Cruz", "Madison Edwards", "Wyatt Collins", "Ellie Reyes",
  "Matthew Stewart", "Lily Morris", "Luke Morales", "Nova Murphy", "Julian Cook",
  "Violet Rogers", "Dylan Gutierrez", "Grace Ortiz", "Grayson Morgan", "Willow Cooper",
  "Isaac Peterson", "Aurora Bailey", "Jayden Reed", "Riley Kelly", "Gabriel Howard",
  "Zoey Ramos", "Anthony Kim", "Willow Cox", "Dylan Ward", "Florence Richardson",
  "Leo Watson", "Hannah Brooks", "Lincoln Chavez", "Lillian Wood", "Ezra James",
  "Addison Bennett", "Hudson Gray", "Aubrey Mendoza", "Charles Wallace", "Stella Black",
  "Caleb Coleman", "Natalie Ruiz", "Isaiah Hughes", "Zoe Price", "Ryan Sanders",
  "Leah Patel", "Nathan Myers", "Audrey Long", "Adrian Ross", "Samantha Foster"
];

async function main() {
  const password = "password123";
  // We hash it ONCE here so all users get the exact same working hash
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log(`🌱 Seeding 100 users with password: '${password}'...`);

  let successCount = 0;

  for (const fullName of realNames) {
    // Generate email: Liam Smith -> liam.smith@example.com
    const email = fullName.toLowerCase().replace(' ', '.') + '@example.com';
    
    // Check if user exists to prevent crashes
    const exists = await prisma.users.findUnique({
      where: { email: email }
    });

    if (!exists) {
      await prisma.users.create({
        data: {
          name: fullName,
          email: email,
          password: hashedPassword,
        },
      });
      successCount++;
      // Optional: Print progress every 10 users to keep console clean
      if (successCount % 10 === 0) console.log(`Processed ${successCount} users...`);
    } else {
      console.log(`⚠️ User ${email} already exists.`);
    }
  }

  console.log(`\n✅ Finished! Added ${successCount} new users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });