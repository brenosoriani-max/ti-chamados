-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: helpdesk_contec
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `backup_logs`
--

DROP TABLE IF EXISTS `backup_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `backup_logs` (
  `id` varchar(36) NOT NULL,
  `triggeredById` varchar(36) DEFAULT NULL,
  `status` enum('SUCESSO','ERRO','EM_ANDAMENTO') NOT NULL DEFAULT 'EM_ANDAMENTO',
  `filePath` varchar(500) DEFAULT NULL,
  `fileSizeBytes` bigint DEFAULT NULL,
  `errorMessage` text,
  `durationMs` int DEFAULT NULL,
  `backupType` varchar(50) DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `backup_logs`
--

LOCK TABLES `backup_logs` WRITE;
/*!40000 ALTER TABLE `backup_logs` DISABLE KEYS */;
INSERT INTO `backup_logs` VALUES ('7aad1db0-530d-4eba-b18e-f01fdcae7bba','f1f192ec-17f0-453a-99b6-0128f6bc6cab','SUCESSO','/backups/backup_2026-10-29T17-31-55-927Z.sql',31231,NULL,228,'manual','2026-10-29 13:31:55.920671');
/*!40000 ALTER TABLE `backup_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` varchar(36) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text,
  `isActive` tinyint NOT NULL DEFAULT '1',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_8b0be371d28245da6e4f4b6187` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES ('64f408e2-763a-11f1-8a05-0a002700000f','Sistemas & Softwares','Chamados sobre mau funcionamento, erros ou instalações de aplicativos e ERP.',1,'2026-07-02 14:20:59.000000','2026-07-02 14:20:59.000000',NULL),('64f40e17-763a-11f1-8a05-0a002700000f','Hardware & Equipamentos','Problemas físicos em computadores, monitores, mouse, headsets ou impressoras.',1,'2026-07-02 14:20:59.000000','2026-07-02 14:20:59.000000',NULL),('64f4184f-763a-11f1-8a05-0a002700000f','Redes & Conectividade','Instabilidades com conexão Wi-Fi, cabo de rede, internet e VPN.',1,'2026-07-02 14:20:59.000000','2026-07-02 14:20:59.000000',NULL),('64f41998-763a-11f1-8a05-0a002700000f','Acessos & Segurança','Alteração de credenciais, liberação de pastas ou liberação de crachás.',1,'2026-07-02 14:20:59.000000','2026-07-02 14:20:59.000000',NULL);
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipments`
--

DROP TABLE IF EXISTS `equipments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipments` (
  `id` varchar(36) NOT NULL,
  `patrimony` varchar(100) DEFAULT NULL,
  `machineName` varchar(255) NOT NULL,
  `hostname` varchar(255) NOT NULL,
  `ipAddress` varchar(45) NOT NULL,
  `currentUser` varchar(255) DEFAULT NULL,
  `operatingSystem` varchar(100) NOT NULL,
  `windowsVersion` varchar(50) DEFAULT NULL,
  `processor` varchar(255) DEFAULT NULL,
  `ramGb` int DEFAULT NULL,
  `diskSpaceGb` int DEFAULT NULL,
  `lastUpdateAt` timestamp NULL DEFAULT NULL,
  `lastCommunication` timestamp NULL DEFAULT NULL,
  `isOnline` tinyint NOT NULL DEFAULT '0',
  `status` varchar(100) DEFAULT NULL,
  `departmentId` varchar(255) DEFAULT NULL,
  `responsibleUserId` varchar(255) DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_ab6b219ad48d052b9817179c1a` (`patrimony`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipments`
--

LOCK TABLES `equipments` WRITE;
/*!40000 ALTER TABLE `equipments` DISABLE KEYS */;
/*!40000 ALTER TABLE `equipments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `knowledge_articles`
--

DROP TABLE IF EXISTS `knowledge_articles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `knowledge_articles` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` longtext NOT NULL,
  `tags` varchar(255) DEFAULT NULL,
  `categoryId` varchar(36) DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `attachmentName` varchar(255) DEFAULT NULL,
  `attachmentUrl` text,
  `isQuickReply` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `FK_0225a5d7b5f6e406b187b40ab23` (`categoryId`),
  CONSTRAINT `FK_0225a5d7b5f6e406b187b40ab23` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `knowledge_articles`
--

LOCK TABLES `knowledge_articles` WRITE;
/*!40000 ALTER TABLE `knowledge_articles` DISABLE KEYS */;
INSERT INTO `knowledge_articles` VALUES ('1e9b556a-5ad4-4c30-8c53-02d3751c4d63','Como desvirar o mouse','Para desvirar o mouse, basta pegar ele e desvirar','senha','64f41998-763a-11f1-8a05-0a002700000f','2026-10-29 11:49:52.925108','2026-10-29 12:10:13.000000',NULL,NULL,1);
/*!40000 ALTER TABLE `knowledge_articles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `type` enum('EMAIL','INTERNA') NOT NULL DEFAULT 'INTERNA',
  `title` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `readAt` timestamp NULL DEFAULT NULL,
  `ticketId` varchar(255) DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_692a909ee0fa9383e7859f9b406` (`userId`),
  CONSTRAINT `FK_692a909ee0fa9383e7859f9b406` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessoes_remotas`
--

DROP TABLE IF EXISTS `sessoes_remotas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessoes_remotas` (
  `id` varchar(36) NOT NULL,
  `terminalId` varchar(36) NOT NULL,
  `usuarioId` varchar(36) NOT NULL,
  `status` enum('AGUARDANDO','CONECTANDO','ATIVA','ENCERRADA') NOT NULL DEFAULT 'AGUARDANDO',
  `iniciadaEm` timestamp NULL DEFAULT NULL,
  `encerradaEm` timestamp NULL DEFAULT NULL,
  `logs` longtext,
  `signaling` longtext,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_cafbe3a90f9ff6057fa8fb5fe6` (`createdAt`),
  KEY `IDX_d913db50aff0e7c864ed8ddd1f` (`usuarioId`),
  KEY `IDX_fde2e5c816a4c2bcc3d4d31594` (`terminalId`,`status`),
  CONSTRAINT `FK_3ce22dcd21c4fca61927d511c7b` FOREIGN KEY (`terminalId`) REFERENCES `terminals` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_d913db50aff0e7c864ed8ddd1fe` FOREIGN KEY (`usuarioId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessoes_remotas`
--

LOCK TABLES `sessoes_remotas` WRITE;
/*!40000 ALTER TABLE `sessoes_remotas` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessoes_remotas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `slas`
--

DROP TABLE IF EXISTS `slas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `slas` (
  `id` varchar(36) NOT NULL,
  `priority` enum('BAIXA','MEDIA','ALTA','CRITICA') NOT NULL,
  `responseHours` int NOT NULL,
  `solutionHours` int NOT NULL,
  `isActive` tinyint NOT NULL DEFAULT '1',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_4f5ec78476c942bfd9263f1a98` (`priority`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `slas`
--

LOCK TABLES `slas` WRITE;
/*!40000 ALTER TABLE `slas` DISABLE KEYS */;
/*!40000 ALTER TABLE `slas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subcategories`
--

DROP TABLE IF EXISTS `subcategories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subcategories` (
  `id` varchar(36) NOT NULL,
  `name` varchar(191) NOT NULL,
  `categoryId` varchar(36) NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_45aa12007713728e241d091775` (`name`,`categoryId`),
  KEY `FK_d1fe096726c3c5b8a500950e448` (`categoryId`),
  CONSTRAINT `FK_d1fe096726c3c5b8a500950e448` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subcategories`
--

LOCK TABLES `subcategories` WRITE;
/*!40000 ALTER TABLE `subcategories` DISABLE KEYS */;
/*!40000 ALTER TABLE `subcategories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `terminals`
--

DROP TABLE IF EXISTS `terminals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `terminals` (
  `id` varchar(36) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `descricao` text,
  `identificador` varchar(191) NOT NULL,
  `token` varchar(191) NOT NULL,
  `empresaId` varchar(255) DEFAULT NULL,
  `status` enum('ONLINE','OFFLINE') NOT NULL DEFAULT 'OFFLINE',
  `ultimaConexao` timestamp NULL DEFAULT NULL,
  `sistemaOperacional` varchar(255) DEFAULT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `versaoAgente` varchar(50) DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `hostname` varchar(255) DEFAULT NULL,
  `windowsVersion` varchar(100) DEFAULT NULL,
  `arquitetura` varchar(50) DEFAULT NULL,
  `memoriaRamGb` int DEFAULT NULL,
  `processador` varchar(255) DEFAULT NULL,
  `usuarioLogado` varchar(255) DEFAULT NULL,
  `resolucaoTela` varchar(50) DEFAULT NULL,
  `quantidadeMonitores` int DEFAULT NULL,
  `userId` varchar(36) DEFAULT NULL,
  `equipmentUuid` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_7499b9d529c0f6264c7220819b` (`identificador`),
  UNIQUE KEY `IDX_38fd17b9df4c45a3a7b71ea545` (`token`),
  UNIQUE KEY `IDX_8f513af44ea9749c61418c8672` (`equipmentUuid`),
  UNIQUE KEY `UQ_terminals_userId` (`userId`),
  KEY `IDX_40f92f0ac52aa36028e4ef0478` (`ultimaConexao`),
  KEY `IDX_4c6fb31b5ed107bb086e38a664` (`empresaId`),
  KEY `IDX_3f5842f6680155605e9f9decb2` (`status`),
  KEY `IDX_e49693a313eb6dc5f021f3434c` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `terminals`
--

LOCK TABLES `terminals` WRITE;
/*!40000 ALTER TABLE `terminals` DISABLE KEYS */;
INSERT INTO `terminals` VALUES ('3cd7ccd7-4d6c-48c7-bfea-69918606d368','Admin',NULL,'user:f1f192ec-17f0-453a-99b6-0128f6bc6cab','b281cb1f461575511ffc33778810769a5df817dc9902432f36c2e8a1ff2266f2',NULL,'OFFLINE','2026-10-30 12:05:26','Windows 10/11','127.0.0.1','web-session','2026-10-29 10:10:16.517918','2026-10-30 08:07:24.000000','admin@helpdesk.com.br',NULL,NULL,NULL,NULL,'Admin',NULL,NULL,'f1f192ec-17f0-453a-99b6-0128f6bc6cab','f1f192ec-17f0-453a-99b6-0128f6bc6cab'),('b983f08c-f3d2-4062-bb87-b2cb37b81bca','BRENO SORIANI',NULL,'user:78fe3be7-eaaf-45eb-bd2c-f7a6f0ac476a','ecc056f00dce480a39c126b49d04982f3dcf6cfb95240b1edacf26cb07eb189a',NULL,'OFFLINE','2026-10-29 14:18:22','Windows 10/11','127.0.0.1','web-session','2026-10-29 10:01:47.928057','2026-10-29 10:19:41.000000','breno.soriani@gmail.com',NULL,NULL,NULL,NULL,'BRENO SORIANI',NULL,NULL,'78fe3be7-eaaf-45eb-bd2c-f7a6f0ac476a','78fe3be7-eaaf-45eb-bd2c-f7a6f0ac476a'),('e1c20c7e-24c5-4a2d-9588-3478c40f93e9','cliente teste',NULL,'user:b85ac5cb-b009-4d62-9ea9-53547aa7cca6','7416978d740ec07a37d12bf10bec01a9c55c2222fe24cc28739abbec52f44749',NULL,'OFFLINE','2026-10-29 15:55:12','Windows 10/11','127.0.0.1','web-session','2026-10-29 11:52:44.196204','2026-10-29 11:56:42.000000','cliente@gmail.com',NULL,NULL,NULL,NULL,'cliente teste',NULL,NULL,'b85ac5cb-b009-4d62-9ea9-53547aa7cca6','b85ac5cb-b009-4d62-9ea9-53547aa7cca6');
/*!40000 ALTER TABLE `terminals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_attachments`
--

DROP TABLE IF EXISTS `ticket_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_attachments` (
  `id` varchar(36) NOT NULL,
  `ticketId` varchar(36) NOT NULL,
  `messageId` varchar(36) DEFAULT NULL,
  `fileName` varchar(255) NOT NULL,
  `fileUrl` text NOT NULL,
  `fileType` varchar(100) DEFAULT NULL,
  `fileSize` int DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_56b2e0448dbbd5e8d50c96fe910` (`ticketId`),
  KEY `FK_1cbd0f66c8c1204ede050af4243` (`messageId`),
  CONSTRAINT `FK_1cbd0f66c8c1204ede050af4243` FOREIGN KEY (`messageId`) REFERENCES `ticket_messages` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK_56b2e0448dbbd5e8d50c96fe910` FOREIGN KEY (`ticketId`) REFERENCES `tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_attachments`
--

LOCK TABLES `ticket_attachments` WRITE;
/*!40000 ALTER TABLE `ticket_attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `ticket_attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_histories`
--

DROP TABLE IF EXISTS `ticket_histories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_histories` (
  `id` varchar(36) NOT NULL,
  `ticketId` varchar(36) NOT NULL,
  `actorId` varchar(36) DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `fromValue` text,
  `toValue` text,
  `metadata` text,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_24b8784515a580ad4766b8b7772` (`ticketId`),
  KEY `FK_10130e975dca6390b4f1d4e5e8e` (`actorId`),
  CONSTRAINT `FK_10130e975dca6390b4f1d4e5e8e` FOREIGN KEY (`actorId`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK_24b8784515a580ad4766b8b7772` FOREIGN KEY (`ticketId`) REFERENCES `tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_histories`
--

LOCK TABLES `ticket_histories` WRITE;
/*!40000 ALTER TABLE `ticket_histories` DISABLE KEYS */;
INSERT INTO `ticket_histories` VALUES ('01881842-2255-45b7-8e3c-b604504ed848','cb8a1d95-6f91-4d2e-a8dd-ad2d152e065e','f1f192ec-17f0-453a-99b6-0128f6bc6cab','COMENTARIO',NULL,'público',NULL,'2026-10-29 11:58:24.289703'),('0a63fd74-6202-4ab0-8811-fc22d97c2afd','51b83982-1f77-4184-9a0a-8da9d321afde','f1f192ec-17f0-453a-99b6-0128f6bc6cab','FINALIZACAO','ABERTO','RESOLVIDO','dsfgchdfgchv','2026-10-29 11:48:53.728614'),('2b1f0ef0-8d52-441f-9cf8-41fd49981f61','d803868d-dfde-4ee0-b303-0c8d1b556b5c','78fe3be7-eaaf-45eb-bd2c-f7a6f0ac476a','TROCA_RESPONSAVEL','78fe3be7-eaaf-45eb-bd2c-f7a6f0ac476a','f1f192ec-17f0-453a-99b6-0128f6bc6cab','Vc que manja','2026-10-29 10:14:57.665641'),('39dee61b-a368-4874-ba9c-8422cb3f808b','51b83982-1f77-4184-9a0a-8da9d321afde','78fe3be7-eaaf-45eb-bd2c-f7a6f0ac476a','TROCA_RESPONSAVEL','Nenhum','78fe3be7-eaaf-45eb-bd2c-f7a6f0ac476a',NULL,'2026-10-29 10:18:26.890508'),('47bd2fee-2964-4eda-be72-42045b766cc8','d803868d-dfde-4ee0-b303-0c8d1b556b5c','f1f192ec-17f0-453a-99b6-0128f6bc6cab','CRIACAO',NULL,'ABERTO',NULL,'2026-10-29 10:10:40.496700'),('5d261648-19bb-4d08-9291-20b797adbb1d','51b83982-1f77-4184-9a0a-8da9d321afde','78fe3be7-eaaf-45eb-bd2c-f7a6f0ac476a','FINALIZACAO','RESOLVIDO','RESOLVIDO','Arroz e feijao com farofa','2026-10-29 10:20:56.024057'),('5e6141cf-815b-4a86-81da-de4484c193a7','cb8a1d95-6f91-4d2e-a8dd-ad2d152e065e','f1f192ec-17f0-453a-99b6-0128f6bc6cab','TROCA_RESPONSAVEL','Nenhum','f1f192ec-17f0-453a-99b6-0128f6bc6cab',NULL,'2026-10-29 11:55:56.658443'),('5ea68ce2-3633-494e-9f90-d1a8565fa626','d803868d-dfde-4ee0-b303-0c8d1b556b5c','78fe3be7-eaaf-45eb-bd2c-f7a6f0ac476a','COMENTARIO',NULL,'público',NULL,'2026-10-29 10:11:24.298524'),('646846de-1e3a-4c59-9083-e26cb32a9bc9','51b83982-1f77-4184-9a0a-8da9d321afde','f1f192ec-17f0-453a-99b6-0128f6bc6cab','CRIACAO',NULL,'ABERTO',NULL,'2026-10-29 10:18:07.116967'),('75b5eb16-3a44-4433-a1d3-d64782f85fe3','cb8a1d95-6f91-4d2e-a8dd-ad2d152e065e','f1f192ec-17f0-453a-99b6-0128f6bc6cab','COMENTARIO',NULL,'público',NULL,'2026-10-29 11:56:13.386301'),('821076d5-8a93-4aed-b0fe-7beb85285556','cb8a1d95-6f91-4d2e-a8dd-ad2d152e065e','f1f192ec-17f0-453a-99b6-0128f6bc6cab','COMENTARIO',NULL,'público',NULL,'2026-10-29 12:11:30.081395'),('8c17cc1b-7425-4b0d-8407-4c1d9240f38d','d803868d-dfde-4ee0-b303-0c8d1b556b5c','78fe3be7-eaaf-45eb-bd2c-f7a6f0ac476a','TROCA_RESPONSAVEL','Nenhum','78fe3be7-eaaf-45eb-bd2c-f7a6f0ac476a',NULL,'2026-10-29 10:12:20.140090'),('c092bb64-20cf-419e-9e57-a031d317f567','cb8a1d95-6f91-4d2e-a8dd-ad2d152e065e','b85ac5cb-b009-4d62-9ea9-53547aa7cca6','CRIACAO',NULL,'ABERTO',NULL,'2026-10-29 11:55:37.488914'),('ce5787ee-2d6a-4d18-89b1-6aa64326969e','51b83982-1f77-4184-9a0a-8da9d321afde','f1f192ec-17f0-453a-99b6-0128f6bc6cab','MUDANCA_STATUS','RESOLVIDO','ABERTO',NULL,'2026-10-29 11:48:40.615782'),('eaec2931-5c31-4618-8518-b9f2d69eacba','1d7a0987-c75b-497f-9a38-c22d5b338e30','f1f192ec-17f0-453a-99b6-0128f6bc6cab','ALTERACAO',NULL,'ARQUIVADO',NULL,'2026-10-29 10:29:30.672273'),('f03902cf-4680-4a93-ba46-f27c51da9778','cb8a1d95-6f91-4d2e-a8dd-ad2d152e065e','f1f192ec-17f0-453a-99b6-0128f6bc6cab','COMENTARIO',NULL,'público',NULL,'2026-10-29 12:16:43.800097'),('fee6ce3d-6c12-4256-bf0c-36d64de960bf','1d7a0987-c75b-497f-9a38-c22d5b338e30','f1f192ec-17f0-453a-99b6-0128f6bc6cab','CRIACAO',NULL,'ABERTO',NULL,'2026-10-29 10:29:17.170683');
/*!40000 ALTER TABLE `ticket_histories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_messages`
--

DROP TABLE IF EXISTS `ticket_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_messages` (
  `id` varchar(36) NOT NULL,
  `ticketId` varchar(36) NOT NULL,
  `authorId` varchar(36) NOT NULL,
  `body` text NOT NULL,
  `isInternal` tinyint NOT NULL DEFAULT '0',
  `editedAt` timestamp NULL DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_b01e2a35417efbe04c10828266f` (`ticketId`),
  KEY `FK_20732d6c17c639f3f155b26cf8b` (`authorId`),
  CONSTRAINT `FK_20732d6c17c639f3f155b26cf8b` FOREIGN KEY (`authorId`) REFERENCES `users` (`id`),
  CONSTRAINT `FK_b01e2a35417efbe04c10828266f` FOREIGN KEY (`ticketId`) REFERENCES `tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_messages`
--

LOCK TABLES `ticket_messages` WRITE;
/*!40000 ALTER TABLE `ticket_messages` DISABLE KEYS */;
INSERT INTO `ticket_messages` VALUES ('14b3a6dd-4c64-4fbc-8f8a-1474f63411fe','d803868d-dfde-4ee0-b303-0c8d1b556b5c','78fe3be7-eaaf-45eb-bd2c-f7a6f0ac476a','olá',0,NULL,'2026-10-29 10:11:24.285584','2026-10-29 10:11:24.285584'),('424029dc-d476-46a3-881a-7cc1d3c10538','cb8a1d95-6f91-4d2e-a8dd-ad2d152e065e','f1f192ec-17f0-453a-99b6-0128f6bc6cab','Para desvirar o mouse, basta pegar ele e desvirar',0,NULL,'2026-10-29 12:16:43.786089','2026-10-29 12:16:43.786089'),('5e758d1e-cd4a-453e-9475-37793fc8a60a','cb8a1d95-6f91-4d2e-a8dd-ad2d152e065e','f1f192ec-17f0-453a-99b6-0128f6bc6cab','Para desvirar o mouse, basta pegar ele e desvirar',0,NULL,'2026-10-29 11:56:13.373423','2026-10-29 11:56:13.373423'),('aba2a700-129f-4b28-ad6d-facb813e6cdb','cb8a1d95-6f91-4d2e-a8dd-ad2d152e065e','f1f192ec-17f0-453a-99b6-0128f6bc6cab','as´dm',0,NULL,'2026-10-29 12:11:30.064973','2026-10-29 12:11:30.064973'),('cf633dd5-bde7-4811-9720-b4af968a6eb6','cb8a1d95-6f91-4d2e-a8dd-ad2d152e065e','f1f192ec-17f0-453a-99b6-0128f6bc6cab','papoi',0,NULL,'2026-10-29 11:58:24.279344','2026-10-29 11:58:24.279344');
/*!40000 ALTER TABLE `ticket_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tickets`
--

DROP TABLE IF EXISTS `tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tickets` (
  `id` varchar(36) NOT NULL,
  `protocolo` varchar(100) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descricao` text NOT NULL,
  `status` enum('ABERTO','EM_ANALISE','EM_ATENDIMENTO','AGUARDANDO_CLIENTE','RESOLVIDO','ENCERRADO','CANCELADO') NOT NULL DEFAULT 'ABERTO',
  `prioridade` enum('BAIXA','MEDIA','ALTA','CRITICA') NOT NULL DEFAULT 'MEDIA',
  `clienteId` varchar(36) NOT NULL,
  `responsavelId` varchar(36) DEFAULT NULL,
  `categoryId` varchar(36) NOT NULL,
  `subCategoryId` varchar(36) DEFAULT NULL,
  `equipe` varchar(255) DEFAULT NULL,
  `dataAbertura` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dataFechamento` timestamp NULL DEFAULT NULL,
  `isArchived` tinyint NOT NULL DEFAULT '0',
  `creatorIp` varchar(45) DEFAULT NULL,
  `slaDueAt` timestamp NULL DEFAULT NULL,
  `responseDueAt` timestamp NULL DEFAULT NULL,
  `firstResponseAt` timestamp NULL DEFAULT NULL,
  `resolvedAt` timestamp NULL DEFAULT NULL,
  `closedAt` timestamp NULL DEFAULT NULL,
  `equipmentId` varchar(36) DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deletedAt` datetime(6) DEFAULT NULL,
  `conclusaoAtendimento` text,
  `transferredFromUserId` varchar(36) DEFAULT NULL,
  `transferredToUserId` varchar(36) DEFAULT NULL,
  `transferReason` varchar(255) DEFAULT NULL,
  `backupNotes` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_54584f0dfe1cf010821a01725c` (`protocolo`),
  KEY `IDX_8a5aef5ed4de9ae4c02321160a` (`updatedAt`),
  KEY `IDX_d5bd0a7022ef1790abcef251da` (`slaDueAt`),
  KEY `IDX_e2335351aeecd15cbbc344d304` (`responsavelId`),
  KEY `IDX_5ae93ec8509933d81023f2734e` (`clienteId`),
  KEY `IDX_d71e3fd5134463351cd251f812` (`isArchived`),
  KEY `IDX_f7505f191cca0587e9b69cbcb3` (`status`,`prioridade`),
  KEY `FK_f47458a36c743b14e0371b70a6e` (`categoryId`),
  KEY `FK_3fce680f7d7a60d2ce9c89c7c88` (`subCategoryId`),
  KEY `FK_83a052f42656461753353138ff2` (`equipmentId`),
  CONSTRAINT `FK_3fce680f7d7a60d2ce9c89c7c88` FOREIGN KEY (`subCategoryId`) REFERENCES `subcategories` (`id`),
  CONSTRAINT `FK_5ae93ec8509933d81023f2734ef` FOREIGN KEY (`clienteId`) REFERENCES `users` (`id`),
  CONSTRAINT `FK_83a052f42656461753353138ff2` FOREIGN KEY (`equipmentId`) REFERENCES `equipments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK_e2335351aeecd15cbbc344d304a` FOREIGN KEY (`responsavelId`) REFERENCES `users` (`id`),
  CONSTRAINT `FK_f47458a36c743b14e0371b70a6e` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tickets`
--

LOCK TABLES `tickets` WRITE;
/*!40000 ALTER TABLE `tickets` DISABLE KEYS */;
INSERT INTO `tickets` VALUES ('1d7a0987-c75b-497f-9a38-c22d5b338e30','HD-000003','padjkbwkpbskbkpsdvjb','posfjbnaónsóóasn','ABERTO','MEDIA','f1f192ec-17f0-453a-99b6-0128f6bc6cab',NULL,'64f41998-763a-11f1-8a05-0a002700000f',NULL,NULL,'2026-10-29 14:29:17',NULL,1,'127.0.0.1','2026-10-30 14:29:17','2026-10-29 22:29:17',NULL,NULL,NULL,NULL,'2026-10-29 10:29:17.160792','2026-10-29 10:29:30.000000',NULL,NULL,NULL,NULL,NULL,NULL),('51b83982-1f77-4184-9a0a-8da9d321afde','HD-000002','POAHo´snosjncf','dgtcfgvhkplopiiutyfryguyiook','RESOLVIDO','MEDIA','f1f192ec-17f0-453a-99b6-0128f6bc6cab','78fe3be7-eaaf-45eb-bd2c-f7a6f0ac476a','64f408e2-763a-11f1-8a05-0a002700000f',NULL,NULL,'2026-10-29 14:18:07',NULL,0,'127.0.0.1','2026-10-30 14:18:07','2026-10-29 22:18:07',NULL,'2026-10-29 15:48:54',NULL,NULL,'2026-10-29 10:18:07.111001','2026-10-29 11:48:53.720000',NULL,'dsfgchdfgchv',NULL,NULL,NULL,NULL),('cb8a1d95-6f91-4d2e-a8dd-ad2d152e065e','HD-000004','Nao consigo desvirar o mouse','cara me ajuda, como mexe nessa bomba','EM_ATENDIMENTO','MEDIA','b85ac5cb-b009-4d62-9ea9-53547aa7cca6','f1f192ec-17f0-453a-99b6-0128f6bc6cab','64f40e17-763a-11f1-8a05-0a002700000f',NULL,NULL,'2026-10-29 15:55:37',NULL,0,'127.0.0.1','2026-10-30 15:55:37','2026-10-29 23:55:37',NULL,NULL,NULL,NULL,'2026-10-29 11:55:37.483456','2026-10-29 12:16:43.789000',NULL,NULL,NULL,NULL,NULL,NULL),('d803868d-dfde-4ee0-b303-0c8d1b556b5c','HD-000001','Quero comer','Gostaria de ir almoçar agora, mas nao deu o horario','RESOLVIDO','CRITICA','f1f192ec-17f0-453a-99b6-0128f6bc6cab','f1f192ec-17f0-453a-99b6-0128f6bc6cab','64f41998-763a-11f1-8a05-0a002700000f',NULL,NULL,'2026-10-29 14:10:40',NULL,0,'127.0.0.1','2026-10-29 18:10:40','2026-10-29 15:10:40',NULL,'2026-10-29 14:15:23',NULL,NULL,'2026-10-29 10:10:40.486660','2026-10-29 10:15:22.660000',NULL,'Fui mlk, chapei no coco','78fe3be7-eaaf-45eb-bd2c-f7a6f0ac476a','f1f192ec-17f0-453a-99b6-0128f6bc6cab','Vc que manja',NULL);
/*!40000 ALTER TABLE `tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(191) NOT NULL,
  `passwordHash` varchar(255) NOT NULL,
  `role` enum('ADMIN','TECNICO','CLIENTE') NOT NULL DEFAULT 'CLIENTE',
  `avatarUrl` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `isActive` tinyint NOT NULL DEFAULT '1',
  `lastIp` varchar(45) DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_97672ac88f789774dd47f7c8be` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('3d1f726e-f247-41c3-a20f-ca821edc6328','Adley Nogueira','adley.nogueira@contec.com.br','$2b$10$gdDdhn.Y.1AZunTyKrDUQOPTh8ih2ulzcjQ0iAPZf2get8yaG9jde','CLIENTE',NULL,NULL,NULL,1,'10.0.0.74','2026-10-28 09:55:02.260113','2026-10-28 09:55:02.260113',NULL),('78fe3be7-eaaf-45eb-bd2c-f7a6f0ac476a','BRENO SORIANI','breno.soriani@gmail.com','$2b$10$NpgrQET1CcEAy5OcfNiRw.ZlvYGDV28xOLLq5xRfIwIuKgoepgPa.','TECNICO',NULL,NULL,NULL,1,'127.0.0.1','2026-10-29 10:01:47.912431','2026-10-29 10:01:59.000000',NULL),('b85ac5cb-b009-4d62-9ea9-53547aa7cca6','cliente teste','cliente@gmail.com','$2b$10$Xgz7bc1wod.QzUt8ES7nWOuZfzGYUqOwWfJSk7qgnPyn.5YhuW/nu','CLIENTE',NULL,NULL,NULL,1,'127.0.0.1','2026-10-29 11:52:44.186104','2026-10-29 11:55:05.000000',NULL),('f1f192ec-17f0-453a-99b6-0128f6bc6cab','Admin','admin@helpdesk.com.br','$2b$10$5SxucFjPWk9N33H1iWQineglowVxw3R/zPVAnGABGL7kUo01CPAFy','ADMIN',NULL,NULL,NULL,1,'127.0.0.1','2026-10-15 12:16:53.927380','2026-10-19 11:38:49.000000',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'helpdesk_contec'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-30  9:09:46
