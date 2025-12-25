import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // =============================================================
  // 1. Upsert default Admin User
  // =============================================================
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@comfyclaude.com" },
    update: {},
    create: {
      email: "admin@comfyclaude.com",
      name: "Admin",
    },
  });
  console.log(`✓ Admin user: ${adminUser.email} (ID: ${adminUser.id})`);

  // =============================================================
  // 2. Create default Project - "ComfyUI Sandbox"
  // =============================================================
  const defaultProject = await prisma.project.upsert({
    where: {
      id: "default-project-comfyui-sandbox",
    },
    update: {},
    create: {
      id: "default-project-comfyui-sandbox",
      name: "ComfyUI Sandbox",
      description: "Default project for learning and experimenting with ComfyUI workflows on RunComfy cloud infrastructure.",
      status: "ACTIVE",
      userId: adminUser.id,
    },
  });
  console.log(`✓ Default project: ${defaultProject.name} (ID: ${defaultProject.id})`);

  // =============================================================
  // 3. Create sample Snippets (The Vault)
  // =============================================================
  const snippets = [
    {
      trigger: "/help",
      content: "I am ready to help you optimize RunComfy workflows on Linux servers. I can assist with:\n- ComfyUI node configuration\n- Workflow debugging\n- Performance optimization\n- Cloud deployment strategies\n\nWhat would you like to work on?",
      type: "PROMPT" as const,
      tags: ["general", "help"],
    },
    {
      trigger: "/skin",
      content: "For realistic skin rendering in ComfyUI, use these settings:\n1. Enable 'DetailerForEach' with face model\n2. Set denoise to 0.3-0.4 for subtle refinement\n3. Use 'RealisticVision' or 'Photon' checkpoint\n4. Add 'FaceDetailer' node after main generation\n5. Consider using ADetailer extension for automatic face detection",
      type: "FIX" as const,
      tags: ["comfyui", "skin", "realistic"],
    },
    {
      trigger: "/workflow-template",
      content: "Here's a basic ComfyUI workflow template for RunComfy:\n```json\n{\n  \"nodes\": [\n    {\"class_type\": \"KSampler\", \"inputs\": {\"steps\": 20, \"cfg\": 7}},\n    {\"class_type\": \"VAEDecode\"},\n    {\"class_type\": \"SaveImage\"}\n  ]\n}\n```",
      type: "CODE" as const,
      tags: ["comfyui", "workflow", "template"],
    },
  ];

  for (const snippet of snippets) {
    const created = await prisma.snippet.upsert({
      where: {
        userId_trigger: {
          userId: adminUser.id,
          trigger: snippet.trigger,
        },
      },
      update: {
        content: snippet.content,
        type: snippet.type,
        tags: snippet.tags,
      },
      create: {
        trigger: snippet.trigger,
        content: snippet.content,
        type: snippet.type,
        tags: snippet.tags,
        userId: adminUser.id,
      },
    });
    console.log(`✓ Snippet: ${created.trigger} (${created.type})`);
  }

  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
