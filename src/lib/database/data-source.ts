/**
 * DataSource para CLI do TypeORM (migrations).
 * Em runtime use `initializeDatabase` / `getRepository` de `./index`.
 */
export { AppDataSource, initializeDatabase, getRepository, getDataSource } from "./index";
