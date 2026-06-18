-- Replace the legacy RDP/Shadow remote access module with Terminal/SessaoRemota.

DROP TABLE IF EXISTS `RemoteAccessLog`;
DROP TABLE IF EXISTS `remoteaccesslog`;
DROP TABLE IF EXISTS `RemoteSession`;
DROP TABLE IF EXISTS `remotesession`;

CREATE TABLE IF NOT EXISTS `Terminal` (
  `id` VARCHAR(191) NOT NULL,
  `nome` VARCHAR(191) NOT NULL,
  `descricao` TEXT NULL,
  `identificador` VARCHAR(191) NOT NULL,
  `token` VARCHAR(191) NOT NULL,
  `empresaId` VARCHAR(191) NULL,
  `status` ENUM('ONLINE', 'OFFLINE') NOT NULL DEFAULT 'OFFLINE',
  `ultimaConexao` DATETIME(3) NULL,
  `sistemaOperacional` VARCHAR(191) NULL,
  `ip` VARCHAR(191) NULL,
  `versaoAgente` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `Terminal_identificador_key`(`identificador`),
  UNIQUE INDEX `Terminal_token_key`(`token`),
  INDEX `Terminal_status_idx`(`status`),
  INDEX `Terminal_empresaId_idx`(`empresaId`),
  INDEX `Terminal_ultimaConexao_idx`(`ultimaConexao`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `SessaoRemota` (
  `id` VARCHAR(191) NOT NULL,
  `terminalId` VARCHAR(191) NOT NULL,
  `usuarioId` VARCHAR(191) NOT NULL,
  `status` ENUM('AGUARDANDO', 'CONECTANDO', 'ATIVA', 'ENCERRADA') NOT NULL DEFAULT 'AGUARDANDO',
  `iniciadaEm` DATETIME(3) NULL,
  `encerradaEm` DATETIME(3) NULL,
  `logs` JSON NULL,
  `signaling` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `SessaoRemota_terminalId_status_idx`(`terminalId`, `status`),
  INDEX `SessaoRemota_usuarioId_idx`(`usuarioId`),
  INDEX `SessaoRemota_createdAt_idx`(`createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `SessaoRemota`
  ADD CONSTRAINT `SessaoRemota_terminalId_fkey`
  FOREIGN KEY (`terminalId`) REFERENCES `Terminal`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `SessaoRemota`
  ADD CONSTRAINT `SessaoRemota_usuarioId_fkey`
  FOREIGN KEY (`usuarioId`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
