import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Find a user or create one
  let user = await prisma.user.findFirst({ where: { role: 'OWNER' } });
  if (!user) {
    console.log("No OWNER user found.");
    return;
  }

  console.log(`Using user: ${user.email} (ID: ${user.id})`);

  try {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const group = await prisma.familyGroup.create({
      data: {
        name: "Test Group",
        adminId: user.id,
        inviteCode,
        members: { connect: [{ id: user.id }] }
      }
    });

    console.log("Group created successfully:", group);
  } catch (error) {
    console.error("Error creating group:", error);
  }

  // Join group
  let user2 = await prisma.user.findFirst({ where: { role: 'MEMBER' } });
  if (user2) {
      try {
          const groupToJoin = await prisma.familyGroup.findFirst();
          if (groupToJoin) {
              const updatedGroup = await prisma.familyGroup.update({
                  where: { id: groupToJoin.id },
                  data: { members: { connect: [{ id: user2.id }] } },
                  include: { members: true }
              });
              console.log("Joined group successfully:", updatedGroup);
          }
      } catch (error) {
          console.error("Error joining group:", error);
      }
  }

}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
