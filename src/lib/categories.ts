import "reflect-metadata";
import { initializeDatabase, getRepository } from "@/lib/database";
import { Category } from "@/entities/Category";

export async function getEnabledCategories() {
  await initializeDatabase();
  const categoryRepository = getRepository(Category);
  return categoryRepository.find({
    where: { isActive: true },
    order: { name: "ASC" },
  });
}
