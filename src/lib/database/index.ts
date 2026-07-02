import "reflect-metadata";
import { AppDataSource } from "./data-source";
import type { EntityTarget, ObjectLiteral, Repository } from "typeorm";

let isInitialized = false;

export async function initializeDatabase() {
  if (isInitialized) return AppDataSource;

  if (!AppDataSource.isInitialized) {
    try {
      await AppDataSource.initialize();
      isInitialized = true;
      console.log("Database connection initialized");
    } catch (error) {
      console.error("Error initializing database connection:", error);
      throw error;
    }
  }

  return AppDataSource;
}

export function getRepository<T extends ObjectLiteral>(entity: EntityTarget<T>): Repository<T> {
  if (!AppDataSource.isInitialized) {
    throw new Error("Database not initialized. Call initializeDatabase() first.");
  }
  return AppDataSource.getRepository(entity);
}

export { AppDataSource };
