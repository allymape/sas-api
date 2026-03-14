-- MySQL dump 10.13  Distrib 8.0.34, for macos13 (arm64)
--
-- Host: 41.59.225.111    Database: MOE
-- ------------------------------------------------------
-- Server version	8.0.45-0ubuntu0.22.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */
;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */
;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */
;
/*!50503 SET NAMES utf8 */
;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */
;
/*!40103 SET TIME_ZONE='+00:00' */
;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */
;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */
;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */
;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */
;

--
-- Table structure for table `addresses`
--

DROP TABLE IF EXISTS `addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `addresses` (
    `id` int NOT NULL AUTO_INCREMENT,
    `address_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `pobox` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `office_id` int DEFAULT NULL,
    `office_type` int DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `algorthm`
--

DROP TABLE IF EXISTS `algorthm`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `algorthm` (
    `id` int NOT NULL AUTO_INCREMENT,
    `school_type` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `last_number` int DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 5 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `api_requests`
--

DROP TABLE IF EXISTS `api_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `api_requests` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `request_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `client_id` bigint unsigned DEFAULT NULL,
    `client_ip` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `http_method` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `endpoint` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `headers` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `response_code` int DEFAULT NULL,
    `response_time` double DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `api_requests_client_id_foreign` (`client_id`)
) ENGINE = InnoDB AUTO_INCREMENT = 27157 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `api_tokens`
--

DROP TABLE IF EXISTS `api_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `api_tokens` (
    `id` char(26) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `org` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `app_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `auth_key` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `deleted_at` timestamp NULL DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `applicants`
--

DROP TABLE IF EXISTS `applicants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `applicants` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `display_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `box` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `lga_box_location` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `street_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `applicantable_id` bigint unsigned DEFAULT NULL,
    `applicantable_type` enum(
        'appModelsPersonal_info',
        'appModelsInstitute_info',
        'App\\Models\\Personal_info',
        'App\\Models\\Institute_info'
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `user_id` bigint unsigned DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_applicantable` (
        `applicantable_id`,
        `applicantable_type`
    ),
    UNIQUE KEY `applicants_user_id_unique` (`user_id`),
    KEY `applicants_user_id_index` (`user_id`),
    CONSTRAINT `applicants_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE = InnoDB AUTO_INCREMENT = 70652 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `application_categories`
--

DROP TABLE IF EXISTS `application_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `application_categories` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `app_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `application_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 15 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `application_status`
--

DROP TABLE IF EXISTS `application_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `application_status` (
    `id` int NOT NULL,
    `status_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `badge_class` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `application_statuses`
--

DROP TABLE IF EXISTS `application_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `application_statuses` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 3 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `applications`
--

DROP TABLE IF EXISTS `applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `applications` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `establishing_school_id` bigint unsigned DEFAULT NULL,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `foreign_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `tracking_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `user_id` bigint unsigned DEFAULT NULL,
    `registry_type_id` bigint unsigned DEFAULT NULL,
    `application_category_id` bigint unsigned NOT NULL,
    `is_approved` int DEFAULT '0',
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `status_id` int NOT NULL DEFAULT '1',
    `staff_id` int DEFAULT NULL,
    `approved_at` datetime DEFAULT NULL,
    `approved_by` bigint DEFAULT NULL,
    `control_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `payment_status_id` bigint unsigned DEFAULT '2',
    `amount` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `expire_date` timestamp NULL DEFAULT NULL,
    `kumb_na` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `folio` int DEFAULT '1',
    `is_complete` tinyint(1) NOT NULL DEFAULT '0',
    PRIMARY KEY (`id`),
    KEY `applications_user_id_index` (`user_id`),
    KEY `applications_registry_type_id_index` (`registry_type_id`),
    KEY `applications_payment_status_id_index` (`payment_status_id`),
    KEY `application_category_id_index` (`application_category_id`),
    KEY `idx_applications_is_complete` (`is_complete`),
    KEY `idx_applications_is_approved` (`is_approved`),
    KEY `idx_applications_secure_token` (`secure_token`),
    KEY `idx_applications_foreign_token` (`foreign_token`),
    KEY `idx_applications_staff_id` (`staff_id`),
    KEY `idx_applications_status_id` (`status_id`),
    KEY `idx_applications_tracking_number` (`tracking_number`),
    KEY `fk_applications_establishing_school` (`establishing_school_id`),
    CONSTRAINT `applications_payment_status_id_foreign` FOREIGN KEY (`payment_status_id`) REFERENCES `payment_statuses` (`id`),
    CONSTRAINT `fk_applications_establishing_school` FOREIGN KEY (`establishing_school_id`) REFERENCES `establishing_schools` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 33681 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `attachment_types`
--

DROP TABLE IF EXISTS `attachment_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `attachment_types` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `registry_type_id` bigint unsigned DEFAULT NULL,
    `attachment_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `application_category_id` bigint unsigned DEFAULT NULL,
    `registration_structure_id` bigint DEFAULT '0',
    `file_size` double(4, 2) DEFAULT NULL,
    `file_format` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `no_of_views` int DEFAULT NULL,
    `status_id` int NOT NULL DEFAULT '1',
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `application_attachment_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `is_backend` int DEFAULT '0',
    PRIMARY KEY (`id`),
    KEY `attachment_types_registry_type_id_index` (`registry_type_id`),
    KEY `attachment_types_application_category_id_index` (`application_category_id`)
) ENGINE = InnoDB AUTO_INCREMENT = 152 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `attachments`
--

DROP TABLE IF EXISTS `attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `attachments` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `uploader_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `tracking_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `attachment_type_id` bigint unsigned DEFAULT NULL,
    `attachment_path` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `user_id` int NOT NULL DEFAULT '0',
    PRIMARY KEY (`id`),
    UNIQUE KEY `attachment_unique_index` (
        `tracking_number`,
        `attachment_type_id`
    ),
    KEY `attachments_tracking_number_index` (`tracking_number`),
    KEY `attachments_attachment_type_id_index` (`attachment_type_id`)
) ENGINE = InnoDB AUTO_INCREMENT = 22546 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `audit_trail`
--

DROP TABLE IF EXISTS `audit_trail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `audit_trail` (
    `id` int NOT NULL AUTO_INCREMENT,
    `user_id` int DEFAULT NULL,
    `event_type` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `old_body` json DEFAULT NULL,
    `new_body` json DEFAULT NULL,
    `created_at` datetime DEFAULT NULL,
    `ip_address` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `api_router` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `browser_used` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `rollId` int DEFAULT NULL,
    `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `tableName` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 178758 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `backup_attachments`
--

DROP TABLE IF EXISTS `backup_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `backup_attachments` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `attachment_path` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `backup_institute_attachments`
--

DROP TABLE IF EXISTS `backup_institute_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `backup_institute_attachments` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `attachment_path` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `building_structures`
--

DROP TABLE IF EXISTS `building_structures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `building_structures` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `building` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 3 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `building_types`
--

DROP TABLE IF EXISTS `building_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `building_types` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `building_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `number` int NOT NULL,
    `sq_meter` double(8, 2) NOT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `cache` (
    `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `value` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `expiration` int DEFAULT NULL,
    PRIMARY KEY (`key`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `cache_locks` (
    `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `owner` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `expiration` int DEFAULT NULL,
    PRIMARY KEY (`key`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `certificate_types`
--

DROP TABLE IF EXISTS `certificate_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `certificate_types` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `certificate` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `school_category_id` bigint unsigned DEFAULT NULL,
    `level` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `certificate_types_school_category_id_index` (`school_category_id`),
    CONSTRAINT `certificate_types_school_category_id_foreign` FOREIGN KEY (`school_category_id`) REFERENCES `school_categories` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 9 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `class_rooms`
--

DROP TABLE IF EXISTS `class_rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `class_rooms` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `class_range` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 4 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `combination_subjects`
--

DROP TABLE IF EXISTS `combination_subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `combination_subjects` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `combination_id` bigint unsigned NOT NULL,
    `subject_id` bigint unsigned NOT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `combination_subjects_combination_id_index` (`combination_id`),
    KEY `combination_subjects_subject_id_index` (`subject_id`),
    CONSTRAINT `combination_subjects_combination_id_foreign` FOREIGN KEY (`combination_id`) REFERENCES `combinations` (`id`),
    CONSTRAINT `combination_subjects_subject_id_foreign` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `combinations`
--

DROP TABLE IF EXISTS `combinations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `combinations` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `school_specialization_id` bigint unsigned DEFAULT NULL,
    `combination` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `certificate_type_id` bigint unsigned DEFAULT NULL,
    `status_id` int NOT NULL DEFAULT '1',
    `code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `combinations_school_specialization_id_index` (`school_specialization_id`),
    KEY `combinations_certificate_type_id_index` (`certificate_type_id`),
    CONSTRAINT `combinations_certificate_type_id_foreign` FOREIGN KEY (`certificate_type_id`) REFERENCES `certificate_types` (`id`),
    CONSTRAINT `combinations_school_specialization_id_foreign` FOREIGN KEY (`school_specialization_id`) REFERENCES `school_specializations` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 45 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `curricula`
--

DROP TABLE IF EXISTS `curricula`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `curricula` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `curriculum` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 5 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `deleted_applications`
--

DROP TABLE IF EXISTS `deleted_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `deleted_applications` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `tracking_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `application_category_id` bigint unsigned NOT NULL,
    `registry_type_id` bigint unsigned DEFAULT NULL,
    `application_data` json DEFAULT NULL,
    `deleted_by` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `deleted_applications_tracking_number_index` (`tracking_number`),
    KEY `deleted_applications_application_category_id_index` (`application_category_id`),
    KEY `deleted_applications_created_at_index` (`created_at`)
) ENGINE = InnoDB AUTO_INCREMENT = 1026 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `denominations`
--

DROP TABLE IF EXISTS `denominations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `denominations` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `ownership_sub_type_id` bigint unsigned NOT NULL,
    `denomination` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `denominations_ownership_sub_type_id_index` (`ownership_sub_type_id`),
    CONSTRAINT `denominations_ownership_sub_type_id_foreign` FOREIGN KEY (`ownership_sub_type_id`) REFERENCES `ownership_sub_types` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 26 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `districts`
--

DROP TABLE IF EXISTS `districts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `districts` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `RegionCode` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `LgaCode` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `LgaName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `ngazi` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `sqa_box` int DEFAULT NULL,
    `district_box` int DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `tamisemi_id` bigint unsigned NOT NULL,
    `parent_area` bigint unsigned DEFAULT NULL,
    `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_type_id` bigint unsigned DEFAULT NULL,
    `label` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_short_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_hq_id` bigint unsigned DEFAULT NULL,
    `area_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `establishment_date_approximated` tinyint(1) DEFAULT '0',
    `mof_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_districts_RegionCode` (`RegionCode`),
    KEY `idx_districts_LgaCode` (`LgaCode`),
    KEY `idx_districts_id` (`id`),
    KEY `districts_ngazi_index` (`ngazi`)
) ENGINE = InnoDB AUTO_INCREMENT = 185 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `establishing_schools`
--

DROP TABLE IF EXISTS `establishing_schools`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `establishing_schools` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `school_category_id` bigint unsigned DEFAULT NULL,
    `school_sub_category_id` bigint unsigned DEFAULT NULL,
    `school_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `registry_type_id` bigint unsigned DEFAULT NULL,
    `school_size` double(8, 2) DEFAULT NULL,
    `area` double(8, 2) DEFAULT NULL,
    `stream` int DEFAULT NULL,
    `website` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `language_id` bigint unsigned DEFAULT NULL,
    `building_structure_id` bigint unsigned DEFAULT NULL,
    `school_gender_type_id` bigint unsigned DEFAULT NULL,
    `school_specialization_id` bigint unsigned DEFAULT NULL,
    `ward_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `village_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `v_tamisemi_id` bigint DEFAULT NULL,
    `street_tamisemi_id` int unsigned DEFAULT NULL,
    `latitude` decimal(20, 10) DEFAULT NULL,
    `longitude` decimal(20, 10) DEFAULT NULL,
    `registration_structure_id` bigint unsigned DEFAULT NULL,
    `curriculum_id` bigint unsigned DEFAULT NULL,
    `certificate_type_id` bigint unsigned DEFAULT NULL,
    `sect_name_id` bigint unsigned DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `tracking_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `applicant_id` bigint unsigned DEFAULT NULL,
    `school_phone` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `school_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `po_box` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `stage` int NOT NULL DEFAULT '0',
    `school_address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `number_of_students` int DEFAULT NULL,
    `lessons_and_courses` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `number_of_teachers` int DEFAULT NULL,
    `teacher_student_ratio_recommendation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `teacher_information` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `is_for_disabled` tinyint(1) NOT NULL DEFAULT '0',
    `control_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `is_hostel` tinyint(1) NOT NULL DEFAULT '0',
    `file_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `school_folio` int DEFAULT NULL,
    `max_folio` int DEFAULT NULL,
    `male_capacity` int unsigned DEFAULT NULL,
    `female_capacity` int unsigned DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `establishing_schools_school_category_id_index` (`school_category_id`),
    KEY `establishing_schools_school_sub_category_id_index` (`school_sub_category_id`),
    KEY `establishing_schools_language_id_index` (`language_id`),
    KEY `establishing_schools_building_structure_id_index` (`building_structure_id`),
    KEY `establishing_schools_school_gender_type_id_index` (`school_gender_type_id`),
    KEY `establishing_schools_school_specialization_id_index` (`school_specialization_id`),
    KEY `establishing_schools_ward_id_index` (`ward_id`),
    KEY `establishing_schools_registration_structure_id_index` (`registration_structure_id`),
    KEY `establishing_schools_curriculum_id_index` (`curriculum_id`),
    KEY `establishing_schools_certificate_type_id_index` (`certificate_type_id`),
    KEY `establishing_schools_sect_name_id_index` (`sect_name_id`),
    KEY `school_establishment_indexes` (
        `id`,
        `school_category_id`,
        `tracking_number`
    ),
    KEY `idx_establishing_schools_school_category_id` (`school_category_id`),
    KEY `idx_establishing_schools_village_id` (`village_id`),
    KEY `establishing_school_secure_token_index` (`secure_token`),
    KEY `establishing_schools_latitude_index` (`latitude`),
    KEY `establishing_schools_longitude_index` (`longitude`),
    KEY `fk_establishing_schools_applicant` (`applicant_id`),
    CONSTRAINT `fk_establishing_schools_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `applicants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 33669 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `establishing_schools_copy`
--

DROP TABLE IF EXISTS `establishing_schools_copy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `establishing_schools_copy` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `school_category_id` bigint unsigned DEFAULT NULL,
    `school_sub_category_id` bigint unsigned DEFAULT NULL,
    `school_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `school_size` double(8, 2) DEFAULT NULL,
    `area` double(8, 2) DEFAULT NULL,
    `stream` int DEFAULT NULL,
    `website` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `language_id` bigint unsigned DEFAULT NULL,
    `building_structure_id` bigint unsigned DEFAULT NULL,
    `school_gender_type_id` bigint unsigned DEFAULT NULL,
    `school_specialization_id` bigint unsigned DEFAULT NULL,
    `ward_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `village_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `latitude` decimal(20, 10) DEFAULT NULL,
    `longitude` decimal(20, 10) DEFAULT NULL,
    `registration_structure_id` bigint unsigned DEFAULT NULL,
    `curriculum_id` bigint unsigned DEFAULT NULL,
    `certificate_type_id` bigint unsigned DEFAULT NULL,
    `sect_name_id` bigint unsigned DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `tracking_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `school_phone` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `school_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `po_box` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `stage` int NOT NULL DEFAULT '0',
    `school_address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `number_of_students` int DEFAULT NULL,
    `lessons_and_courses` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `number_of_teachers` int DEFAULT NULL,
    `teacher_student_ratio_recommendation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `teacher_information` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `is_for_disabled` tinyint(1) NOT NULL DEFAULT '0',
    `control_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `is_hostel` tinyint(1) NOT NULL DEFAULT '0',
    `file_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `school_folio` int DEFAULT NULL,
    `max_folio` int DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `establishing_schools_school_category_id_index` (`school_category_id`),
    KEY `establishing_schools_school_sub_category_id_index` (`school_sub_category_id`),
    KEY `establishing_schools_language_id_index` (`language_id`),
    KEY `establishing_schools_building_structure_id_index` (`building_structure_id`),
    KEY `establishing_schools_school_gender_type_id_index` (`school_gender_type_id`),
    KEY `establishing_schools_school_specialization_id_index` (`school_specialization_id`),
    KEY `establishing_schools_ward_id_index` (`ward_id`),
    KEY `establishing_schools_registration_structure_id_index` (`registration_structure_id`),
    KEY `establishing_schools_curriculum_id_index` (`curriculum_id`),
    KEY `establishing_schools_certificate_type_id_index` (`certificate_type_id`),
    KEY `establishing_schools_sect_name_id_index` (`sect_name_id`),
    KEY `school_establishment_indexes` (
        `id`,
        `school_category_id`,
        `tracking_number`
    ),
    KEY `idx_establishing_schools_school_category_id` (`school_category_id`),
    KEY `idx_establishing_schools_village_id` (`village_id`),
    KEY `establishing_school_secure_token_index` (`secure_token`),
    KEY `establishing_schools_latitude_index` (`latitude`),
    KEY `establishing_schools_longitude_index` (`longitude`)
) ENGINE = InnoDB AUTO_INCREMENT = 29310 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `failed_jobs` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `uuid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `connection` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `queue` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `exception` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `fees`
--

DROP TABLE IF EXISTS `fees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `fees` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `fee_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `amount` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `is_active` tinyint(1) NOT NULL DEFAULT '0',
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 7 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `former_managers`
--

DROP TABLE IF EXISTS `former_managers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `former_managers` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `establishing_school_id` bigint unsigned DEFAULT NULL,
    `tracking_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `manager_first_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `manager_middle_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `manager_last_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `occupation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `ward_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `house_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `street` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `manager_phone_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `manager_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `education_level` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `expertise_level` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `manager_cv` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `manager_certificate` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    PRIMARY KEY (`id`),
    KEY `former_managers_establishing_school_id_index` (`establishing_school_id`),
    KEY `former_managers_ward_id_foreign` (`ward_id`),
    KEY `idx_former_managers_ward_id` (`ward_id`),
    KEY `idx_former_managers_tracking_number` (`tracking_number`),
    CONSTRAINT `former_managers_establishing_school_id_foreign` FOREIGN KEY (`establishing_school_id`) REFERENCES `establishing_schools` (`id`),
    CONSTRAINT `former_managers_ward_id_foreign` FOREIGN KEY (`ward_id`) REFERENCES `wards` (`WardCode`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 51 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `former_owner_referees`
--

DROP TABLE IF EXISTS `former_owner_referees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `former_owner_referees` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `first_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `middle_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `last_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `occupation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `former_owner_id` bigint unsigned DEFAULT NULL,
    `ward_id` bigint unsigned DEFAULT NULL,
    `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `phone_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `former_owner_referees_former_owner_id_index` (`former_owner_id`),
    KEY `former_owner_referees_ward_id_index` (`ward_id`),
    KEY `idx_former_owner_referees_ward_id` (`ward_id`),
    CONSTRAINT `former_owner_referees_former_owner_id_foreign` FOREIGN KEY (`former_owner_id`) REFERENCES `former_owners` (`id`),
    CONSTRAINT `former_owner_referees_ward_id_foreign` FOREIGN KEY (`ward_id`) REFERENCES `wards` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 220 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `former_owners`
--

DROP TABLE IF EXISTS `former_owners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `former_owners` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `establishing_school_id` bigint unsigned DEFAULT NULL,
    `tracking_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `owner_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `authorized_person` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `owner_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `phone_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `purpose` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `former_owners_establishing_school_id_index` (`establishing_school_id`),
    KEY `idx_former_owners_tracking_number` (`tracking_number`),
    CONSTRAINT `former_owners_establishing_school_id_foreign` FOREIGN KEY (`establishing_school_id`) REFERENCES `establishing_schools` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 55 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `former_school_combinations`
--

DROP TABLE IF EXISTS `former_school_combinations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `former_school_combinations` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `establishing_school_id` bigint unsigned DEFAULT NULL,
    `combination_id` bigint unsigned DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `tracking_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `former_school_combinations_establishing_school_id_index` (`establishing_school_id`),
    KEY `former_school_combinations_combination_id_index` (`combination_id`),
    KEY `idx_former_school_combinations_establishing_school_id` (`establishing_school_id`),
    KEY `idx_former_school_combinations_tracking_number` (`tracking_number`),
    CONSTRAINT `former_school_combinations_combination_id_foreign` FOREIGN KEY (`combination_id`) REFERENCES `combinations` (`id`),
    CONSTRAINT `former_school_combinations_establishing_school_id_foreign` FOREIGN KEY (`establishing_school_id`) REFERENCES `establishing_schools` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 995 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `former_school_infos`
--

DROP TABLE IF EXISTS `former_school_infos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `former_school_infos` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `tracking_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `establishing_school_id` bigint unsigned DEFAULT NULL,
    `school_category_id` bigint unsigned DEFAULT NULL,
    `school_sub_category_id` bigint unsigned DEFAULT NULL,
    `school_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `school_phone` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `school_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `school_size` double(8, 2) DEFAULT NULL,
    `area` double(8, 2) DEFAULT NULL,
    `stream` int DEFAULT NULL,
    `website` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `language_id` bigint unsigned DEFAULT NULL,
    `building_structure_id` bigint unsigned DEFAULT NULL,
    `school_gender_type_id` bigint unsigned DEFAULT NULL,
    `school_specialization_id` bigint unsigned DEFAULT NULL,
    `ward_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `village_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `registration_structure_id` bigint unsigned DEFAULT NULL,
    `curriculum_id` bigint unsigned DEFAULT NULL,
    `certificate_type_id` bigint unsigned DEFAULT NULL,
    `sect_name_id` bigint unsigned DEFAULT NULL,
    `is_for_disabled` tinyint(1) NOT NULL DEFAULT '0',
    `is_hostel` tinyint(1) NOT NULL DEFAULT '0',
    `number_of_students` int DEFAULT NULL,
    `school_address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `lessons_and_courses` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `number_of_teachers` int DEFAULT NULL,
    `teacher_student_ratio_recommendation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `teacher_information` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `former_school_infos_establishing_school_id_index` (`establishing_school_id`),
    KEY `former_school_infos_school_category_id_index` (`school_category_id`),
    KEY `former_school_infos_school_sub_category_id_index` (`school_sub_category_id`),
    KEY `former_school_infos_language_id_index` (`language_id`),
    KEY `former_school_infos_building_structure_id_index` (`building_structure_id`),
    KEY `former_school_infos_school_gender_type_id_index` (`school_gender_type_id`),
    KEY `former_school_infos_school_specialization_id_index` (`school_specialization_id`),
    KEY `former_school_infos_ward_id_index` (`ward_id`),
    KEY `former_school_infos_registration_structure_id_index` (`registration_structure_id`),
    KEY `former_school_infos_curriculum_id_index` (`curriculum_id`),
    KEY `former_school_infos_certificate_type_id_index` (`certificate_type_id`),
    KEY `former_school_infos_sect_name_id_index` (`sect_name_id`),
    KEY `idx_former_school_infos_tracking_number` (`tracking_number`),
    KEY `idx_former_school_infos_ward_id` (`ward_id`),
    CONSTRAINT `former_school_infos_building_structure_id_foreign` FOREIGN KEY (`building_structure_id`) REFERENCES `building_structures` (`id`),
    CONSTRAINT `former_school_infos_certificate_type_id_foreign` FOREIGN KEY (`certificate_type_id`) REFERENCES `certificate_types` (`id`),
    CONSTRAINT `former_school_infos_curriculum_id_foreign` FOREIGN KEY (`curriculum_id`) REFERENCES `curricula` (`id`),
    CONSTRAINT `former_school_infos_establishing_school_id_foreign` FOREIGN KEY (`establishing_school_id`) REFERENCES `establishing_schools` (`id`),
    CONSTRAINT `former_school_infos_language_id_foreign` FOREIGN KEY (`language_id`) REFERENCES `languages` (`id`),
    CONSTRAINT `former_school_infos_registration_structure_id_foreign` FOREIGN KEY (`registration_structure_id`) REFERENCES `registration_structures` (`id`),
    CONSTRAINT `former_school_infos_school_category_id_foreign` FOREIGN KEY (`school_category_id`) REFERENCES `school_categories` (`id`),
    CONSTRAINT `former_school_infos_school_gender_type_id_foreign` FOREIGN KEY (`school_gender_type_id`) REFERENCES `school_gender_types` (`id`),
    CONSTRAINT `former_school_infos_school_specialization_id_foreign` FOREIGN KEY (`school_specialization_id`) REFERENCES `school_specializations` (`id`),
    CONSTRAINT `former_school_infos_school_sub_category_id_foreign` FOREIGN KEY (`school_sub_category_id`) REFERENCES `school_sub_categories` (`id`),
    CONSTRAINT `former_school_infos_sect_name_id_foreign` FOREIGN KEY (`sect_name_id`) REFERENCES `sect_names` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 1198 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `handover`
--

DROP TABLE IF EXISTS `handover`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `handover` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `staff_id` bigint NOT NULL,
    `handover_by` bigint NOT NULL,
    `start` datetime NOT NULL,
    `end` datetime NOT NULL,
    `reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `active` tinyint(1) NOT NULL DEFAULT '1',
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `identity_types`
--

DROP TABLE IF EXISTS `identity_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `identity_types` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `id_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 6 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `institute_attachments`
--

DROP TABLE IF EXISTS `institute_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `institute_attachments` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `institute_info_id` bigint unsigned DEFAULT NULL,
    `attachment_type_id` bigint unsigned DEFAULT NULL,
    `attachment` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `institute_attachment_unique_index` (
        `institute_info_id`,
        `attachment_type_id`
    ),
    KEY `institute_attachments_institute_info_id_index` (`institute_info_id`),
    KEY `institute_attachments_attachment_type_id_index` (`attachment_type_id`)
) ENGINE = InnoDB AUTO_INCREMENT = 1269 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `institute_infos`
--

DROP TABLE IF EXISTS `institute_infos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `institute_infos` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `registration_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `institute_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `institute_phone` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `box` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `ward_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `street` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `registration_certificate_copy` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `organizational_constitution` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `agreement_document` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `institute_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    PRIMARY KEY (`id`),
    UNIQUE KEY `secure_token_UNIQUE` (`secure_token`),
    KEY `institute_infos_ward_id_index` (`ward_id`),
    KEY `institute_info_secure_info_index` (`secure_token`),
    KEY `institute_info_village_id` (`street`)
) ENGINE = InnoDB AUTO_INCREMENT = 4488 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `languages`
--

DROP TABLE IF EXISTS `languages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `languages` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `language` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 3 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `login_activity`
--

DROP TABLE IF EXISTS `login_activity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `login_activity` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `staff_id` bigint unsigned NOT NULL,
    `browser` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `ip` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `device` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `login_activity_staff_id_foreign` (`staff_id`),
    CONSTRAINT `login_activity_staff_id_foreign` FOREIGN KEY (`staff_id`) REFERENCES `staffs` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 123321 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `managers`
--

DROP TABLE IF EXISTS `managers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `managers` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `establishing_school_id` bigint unsigned DEFAULT NULL,
    `tracking_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `manager_first_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `manager_middle_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `manager_last_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `occupation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `ward_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `house_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `street` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `manager_phone_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `manager_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `education_level` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `expertise_level` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `manager_cv` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `manager_certificate` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    PRIMARY KEY (`id`),
    KEY `managers_establishing_school_id_index` (`establishing_school_id`),
    KEY `managers_ward_id_index` (`ward_id`),
    CONSTRAINT `managers_establishing_school_id_foreign` FOREIGN KEY (`establishing_school_id`) REFERENCES `establishing_schools` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 29185 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `maoni`
--

DROP TABLE IF EXISTS `maoni`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `maoni` (
    `id` int NOT NULL AUTO_INCREMENT,
    `trackingNo` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `user_from` int DEFAULT NULL,
    `user_to` int DEFAULT NULL,
    `coments` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `type_of_comment` int NOT NULL DEFAULT '0',
    `created_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_maoni_trackingNo` (`trackingNo`),
    KEY `idx_maoni_user_from` (`user_from`),
    KEY `idx_maoni_user_to` (`user_to`)
) ENGINE = InnoDB AUTO_INCREMENT = 40431 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `migrations` (
    `id` int unsigned NOT NULL AUTO_INCREMENT,
    `migration` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `batch` int NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 330 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `owners`
--

DROP TABLE IF EXISTS `owners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `owners` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `establishing_school_id` bigint unsigned DEFAULT NULL,
    `tracking_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `owner_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `authorized_person` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `owner_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `phone_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `purpose` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `is_manager` tinyint(1) NOT NULL DEFAULT '0',
    `ownership_sub_type_id` bigint unsigned DEFAULT NULL,
    `denomination_id` bigint unsigned DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `owners_establishing_school_id_index` (`establishing_school_id`),
    KEY `owners_ownership_sub_type_id_index` (`ownership_sub_type_id`),
    KEY `owners_denomination_id_index` (`denomination_id`),
    KEY `idx_owners_establishing_school_id` (`establishing_school_id`),
    KEY `idx_owners_owner_email` (`owner_email`),
    KEY `idx_owners_tracking_number` (`tracking_number`),
    CONSTRAINT `owners_denomination_id_foreign` FOREIGN KEY (`denomination_id`) REFERENCES `denominations` (`id`),
    CONSTRAINT `owners_establishing_school_id_foreign` FOREIGN KEY (`establishing_school_id`) REFERENCES `establishing_schools` (`id`),
    CONSTRAINT `owners_ownership_sub_type_id_foreign` FOREIGN KEY (`ownership_sub_type_id`) REFERENCES `ownership_sub_types` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 33670 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `ownership_sub_types`
--

DROP TABLE IF EXISTS `ownership_sub_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `ownership_sub_types` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `ownership_type_id` bigint unsigned NOT NULL,
    `sub_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `ownership_sub_types_ownership_type_id_index` (`ownership_type_id`),
    CONSTRAINT `ownership_sub_types_ownership_type_id_foreign` FOREIGN KEY (`ownership_type_id`) REFERENCES `ownership_types` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 6 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `ownership_types`
--

DROP TABLE IF EXISTS `ownership_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `ownership_types` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 4 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `password_resets` (
    `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    KEY `password_resets_email_index` (`email`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `payment_statuses`
--

DROP TABLE IF EXISTS `payment_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `payment_statuses` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `status_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 3 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `permission_role`
--

DROP TABLE IF EXISTS `permission_role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `permission_role` (
    `id` int NOT NULL AUTO_INCREMENT,
    `permission_id` int DEFAULT NULL,
    `role_id` int DEFAULT NULL,
    `status_id` int DEFAULT NULL,
    `created_at` datetime DEFAULT NULL,
    `created_by` int DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 14330 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `permissions` (
    `id` int NOT NULL AUTO_INCREMENT,
    `permission_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `status_id` int DEFAULT NULL,
    `is_default` tinyint(1) DEFAULT '0',
    `created_at` datetime DEFAULT NULL,
    `created_by` int DEFAULT NULL,
    `display_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 154 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `personal_access_tokens` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `tokenable_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `tokenable_id` bigint unsigned NOT NULL,
    `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `abilities` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `last_used_at` timestamp NULL DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
    KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (
        `tokenable_type`,
        `tokenable_id`
    )
) ENGINE = InnoDB AUTO_INCREMENT = 78888 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `personal_infos`
--

DROP TABLE IF EXISTS `personal_infos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `personal_infos` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `first_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `middle_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `last_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `occupation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `personal_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `personal_phone_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `identity_type_id` bigint unsigned DEFAULT NULL,
    `personal_id_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `personal_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `ward_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `user_id` bigint unsigned DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `personal_infos_identity_type_id_index` (`identity_type_id`),
    KEY `personal_infos_ward_id_index` (`ward_id`),
    KEY `personal_info_secure_token_index` (`secure_token`),
    KEY `personal_infos_user_id_foreign` (`user_id`),
    CONSTRAINT `personal_infos_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 33665 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `ranks`
--

DROP TABLE IF EXISTS `ranks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `ranks` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `status_id` tinyint(1) DEFAULT '1',
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 8 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `referees`
--

DROP TABLE IF EXISTS `referees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `referees` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `first_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `middle_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `last_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `occupation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `owner_id` bigint unsigned DEFAULT NULL,
    `ward_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `phone_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `village_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `referees_owner_id_index` (`owner_id`),
    KEY `referees_ward_id_index` (`ward_id`),
    CONSTRAINT `referees_owner_id_foreign` FOREIGN KEY (`owner_id`) REFERENCES `owners` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 2860 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `regions`
--

DROP TABLE IF EXISTS `regions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `regions` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `tamisemi_id` bigint unsigned NOT NULL,
    `parent_area` bigint unsigned DEFAULT NULL,
    `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `area_type_id` int unsigned DEFAULT NULL,
    `area_type_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_type_name_sw` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_type_order_id` int unsigned DEFAULT NULL,
    `RegionCode` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `RegionName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `zone_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `box` int DEFAULT '0',
    `sqa_zone` tinyint DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_regions_RegionCode` (`RegionCode`),
    KEY `idx_regions_zone_id` (`zone_id`)
) ENGINE = InnoDB AUTO_INCREMENT = 27 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `registration_fees`
--

DROP TABLE IF EXISTS `registration_fees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `registration_fees` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `payment_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `amount` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `is_active` tinyint(1) NOT NULL DEFAULT '0',
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `registration_structures`
--

DROP TABLE IF EXISTS `registration_structures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `registration_structures` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `structure` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 3 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `registry_types`
--

DROP TABLE IF EXISTS `registry_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `registry_types` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `registry` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `registry_type_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 4 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `role_management`
--

DROP TABLE IF EXISTS `role_management`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `role_management` (
    `id` int NOT NULL AUTO_INCREMENT,
    `role_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `status_id` int DEFAULT NULL,
    `created_at` datetime DEFAULT NULL,
    `created_by` int DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 5 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `roles` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `vyeoId` int DEFAULT NULL,
    `status_id` int NOT NULL DEFAULT '1',
    PRIMARY KEY (`id`),
    KEY `idx_roles_vyeoId` (`vyeoId`),
    KEY `idx_roles_status_id` (`status_id`),
    KEY `namex_roles` (`name`)
) ENGINE = InnoDB AUTO_INCREMENT = 162 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `school_categories`
--

DROP TABLE IF EXISTS `school_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `school_categories` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `code` char(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `category` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `uk_msambao` double(8, 2) DEFAULT NULL,
    `uk_ghorofa` double(8, 2) DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `class_room_id` bigint unsigned DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `school_categories_class_room_id_index` (`class_room_id`),
    CONSTRAINT `school_categories_class_room_id_foreign` FOREIGN KEY (`class_room_id`) REFERENCES `class_rooms` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 5 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `school_combinations`
--

DROP TABLE IF EXISTS `school_combinations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `school_combinations` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `school_registration_id` bigint unsigned DEFAULT NULL,
    `combination_id` bigint unsigned DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_combination_school` (
        `combination_id`,
        `school_registration_id`
    ),
    KEY `school_combinations_school_registration_id_index` (`school_registration_id`),
    KEY `school_combinations_combination_id_index` (`combination_id`),
    CONSTRAINT `school_combinations_combination_id_foreign` FOREIGN KEY (`combination_id`) REFERENCES `combinations` (`id`),
    CONSTRAINT `school_combinations_school_registration_id_foreign` FOREIGN KEY (`school_registration_id`) REFERENCES `school_registrations` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 11663 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `school_detours`
--

DROP TABLE IF EXISTS `school_detours`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `school_detours` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `school_registration_id` bigint unsigned DEFAULT NULL,
    `school_specialization_id` bigint unsigned DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `school_detours_school_registration_id_index` (`school_registration_id`),
    KEY `school_detours_school_specialization_id_index` (`school_specialization_id`),
    CONSTRAINT `school_detours_school_registration_id_foreign` FOREIGN KEY (`school_registration_id`) REFERENCES `school_registrations` (`id`),
    CONSTRAINT `school_detours_school_specialization_id_foreign` FOREIGN KEY (`school_specialization_id`) REFERENCES `school_specializations` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 244 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `school_event_queue`
--

DROP TABLE IF EXISTS `school_event_queue`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `school_event_queue` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `reg_no` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `application_category_id` bigint unsigned NOT NULL,
    `tracking_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `approved_at` timestamp NULL DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `moe_school_event_queue_application_category_id_unique` (`application_category_id`),
    UNIQUE KEY `moe_school_event_queue_tracking_number_unique` (`tracking_number`)
) ENGINE = InnoDB AUTO_INCREMENT = 294 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `school_gender_types`
--

DROP TABLE IF EXISTS `school_gender_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `school_gender_types` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `gender_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 4 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `school_registrations`
--

DROP TABLE IF EXISTS `school_registrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `school_registrations` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `establishing_school_id` bigint unsigned DEFAULT NULL,
    `tracking_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `school_opening_date` date DEFAULT NULL,
    `registration_date` date DEFAULT NULL,
    `level_of_education` bigint unsigned DEFAULT NULL,
    `is_seminary` tinyint(1) NOT NULL DEFAULT '0',
    `registration_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `reg_status` tinyint(1) DEFAULT '2',
    `is_verified` tinyint(1) NOT NULL DEFAULT '0',
    `sharti` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `deleted_at` datetime DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `school_registrations_establishing_school_id_index` (`establishing_school_id`),
    KEY `reg_status_index` (`reg_status`),
    KEY `idx_school_registrations_tracking_number` (`tracking_number`),
    KEY `idx_school_registrations_level_of_education` (`level_of_education`),
    KEY `idx_registration_number` (`registration_number`),
    CONSTRAINT `school_registrations_establishing_school_id_foreign` FOREIGN KEY (`establishing_school_id`) REFERENCES `establishing_schools` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 33669 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `school_registries`
--

DROP TABLE IF EXISTS `school_registries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `school_registries` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `school_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `registry_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `school_registries_school_token_index` (`school_token`),
    KEY `school_registries_registry_token_index` (`registry_token`)
) ENGINE = InnoDB AUTO_INCREMENT = 2466 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `school_specializations`
--

DROP TABLE IF EXISTS `school_specializations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `school_specializations` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `specialization` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `status_id` int NOT NULL DEFAULT '1',
    `code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 13 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `school_sub_categories`
--

DROP TABLE IF EXISTS `school_sub_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `school_sub_categories` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `subcategory` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 4 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `school_verifications`
--

DROP TABLE IF EXISTS `school_verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `school_verifications` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `tracking_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `corrected` tinyint(1) NOT NULL DEFAULT '0',
    `created_by` bigint DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `school_verifications_tracking_number_unique` (`tracking_number`)
) ENGINE = InnoDB AUTO_INCREMENT = 5396 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `sect_names`
--

DROP TABLE IF EXISTS `sect_names`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `sect_names` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `word` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 4 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `sessions` (
    `id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `user_id` bigint unsigned DEFAULT NULL,
    `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `last_activity` int NOT NULL,
    `api_token_id` char(26) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `deleted_at` datetime DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `sessions_user_id_index` (`user_id`),
    KEY `sessions_last_activity_index` (`last_activity`),
    KEY `sessions_api_token_id_foreign` (`api_token_id`),
    CONSTRAINT `sessions_api_token_id_foreign` FOREIGN KEY (`api_token_id`) REFERENCES `api_tokens` (`id`) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `staffs`
--

DROP TABLE IF EXISTS `staffs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `staffs` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `phone_no` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `user_status` int NOT NULL,
    `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `email_notify` tinyint(1) NOT NULL DEFAULT '0',
    `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `user_level` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `last_login` datetime DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `role_id` int DEFAULT NULL,
    `station_level` int DEFAULT NULL,
    `office` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `zone_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `region_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `district_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `signature` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `kaimu` int NOT NULL DEFAULT '0',
    `kaimu_cheo` int DEFAULT NULL,
    `twofa` tinyint(1) DEFAULT '0',
    `twofa_digit` int DEFAULT NULL,
    `token_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `login_id` int DEFAULT '0',
    `new_role_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `is_password_changed` tinyint(1) DEFAULT '0',
    PRIMARY KEY (`id`),
    KEY `idx_staffs_username` (`username`),
    KEY `idx_staffs_user_status` (`user_status`),
    KEY `idx_staffs_email` (`email`),
    KEY `idx_staffs_user_level` (`user_level`),
    KEY `idx_staffs_role_id` (`role_id`),
    KEY `idx_staffs_station_level` (`station_level`),
    KEY `idx_staffs_office` (`office`),
    KEY `idx_staffs_zone_id` (`zone_id`),
    KEY `idx_staffs_region_code` (`region_code`),
    KEY `idx_staffs_district_code` (`district_code`),
    KEY `idx_staffs_kaimu_cheo` (`kaimu_cheo`),
    KEY `idx_staffs_kaimu` (`kaimu`),
    KEY `idx_staffs_login_id` (`login_id`),
    KEY `idx_staffs_new_role_id` (`new_role_id`),
    KEY `namex_staffs_name` (`name`)
) ENGINE = InnoDB AUTO_INCREMENT = 1787 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `streets`
--

DROP TABLE IF EXISTS `streets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `streets` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `StreetCode` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `StreetName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `WardCode` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `tamisemi_id` bigint unsigned NOT NULL,
    `parent_area` bigint unsigned DEFAULT NULL,
    `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_type_id` bigint unsigned DEFAULT NULL,
    `label` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_short_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_hq_id` bigint unsigned DEFAULT NULL,
    `area_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `establishment_date_approximated` tinyint(1) DEFAULT '0',
    `mof_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `streets_streetcode_unique` (`StreetCode`),
    KEY `street_uid_index` (`id`, `StreetCode`),
    KEY `ward_code_index` (`WardCode`),
    KEY `idx_streets_StreetCode` (`StreetCode`),
    KEY `idx_streets_WardCode` (`WardCode`)
) ENGINE = InnoDB AUTO_INCREMENT = 19236 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `streetsBackup`
--

DROP TABLE IF EXISTS `streetsBackup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `streetsBackup` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `StreetCode` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `StreetName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `WardCode` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `tamisemi_id` bigint unsigned NOT NULL,
    `parent_area` bigint unsigned DEFAULT NULL,
    `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_type_id` bigint unsigned DEFAULT NULL,
    `label` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_short_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_hq_id` bigint unsigned DEFAULT NULL,
    `area_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `establishment_date_approximated` tinyint(1) DEFAULT '0',
    `mof_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `streets_streetcode_unique` (`StreetCode`),
    KEY `street_uid_index` (`id`, `StreetCode`),
    KEY `ward_code_index` (`WardCode`),
    KEY `idx_streets_StreetCode` (`StreetCode`),
    KEY `idx_streets_WardCode` (`WardCode`)
) ENGINE = InnoDB AUTO_INCREMENT = 25600 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `student_staff_infos`
--

DROP TABLE IF EXISTS `student_staff_infos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `student_staff_infos` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `school_registration_id` bigint unsigned DEFAULT NULL,
    `number_of_students` int DEFAULT NULL,
    `lessons_and_courses` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `number_of_teachers` int DEFAULT NULL,
    `teacher_student_ratio_recommendation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `teacher_information` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `student_staff_infos_school_registration_id_index` (`school_registration_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `subjects`
--

DROP TABLE IF EXISTS `subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `subjects` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `subject_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `tamisemi_councils`
--

DROP TABLE IF EXISTS `tamisemi_councils`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `tamisemi_councils` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `existing_id` bigint unsigned DEFAULT NULL,
    `parent_area` bigint unsigned DEFAULT NULL,
    `parent_area_ares_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `ares_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `label` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_short_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_hq_id` bigint unsigned DEFAULT NULL,
    `area_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `establishment_date_approximated` tinyint(1) NOT NULL DEFAULT '0',
    `mof_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `area_type_id` int unsigned DEFAULT NULL,
    `area_type_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_type_name_sw` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_type_order_id` int unsigned DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `tamisemi_councils_ares_code_unique` (`ares_code`),
    KEY `tamisemi_councils_parent_area_foreign` (`parent_area`),
    CONSTRAINT `tamisemi_councils_parent_area_foreign` FOREIGN KEY (`parent_area`) REFERENCES `tamisemi_regions` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 436 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `tamisemi_regions`
--

DROP TABLE IF EXISTS `tamisemi_regions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `tamisemi_regions` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `existing_id` bigint unsigned DEFAULT NULL,
    `parent_area` bigint unsigned DEFAULT NULL,
    `parent_area_ares_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `ares_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `label` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_short_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_hq_id` bigint unsigned DEFAULT NULL,
    `area_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `establishment_date_approximated` tinyint(1) NOT NULL DEFAULT '0',
    `mof_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `area_type_id` int unsigned DEFAULT NULL,
    `area_type_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_type_name_sw` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_type_order_id` int unsigned DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `tamisemi_regions_ares_code_unique` (`ares_code`)
) ENGINE = InnoDB AUTO_INCREMENT = 80 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `tamisemi_streets`
--

DROP TABLE IF EXISTS `tamisemi_streets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `tamisemi_streets` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `existing_id` bigint unsigned DEFAULT NULL,
    `parent_area` bigint unsigned DEFAULT NULL,
    `parent_area_ares_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `ares_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `label` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_short_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_hq_id` bigint unsigned DEFAULT NULL,
    `area_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `establishment_date_approximated` tinyint(1) NOT NULL DEFAULT '0',
    `mof_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `area_type_id` int unsigned DEFAULT NULL,
    `area_type_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_type_name_sw` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_type_order_id` int unsigned DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `tamisemi_streets_ares_code_unique` (`ares_code`),
    KEY `tamisemi_streets_parent_area_foreign` (`parent_area`),
    CONSTRAINT `tamisemi_streets_parent_area_foreign` FOREIGN KEY (`parent_area`) REFERENCES `tamisemi_wards` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 23338 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `tamisemi_wards`
--

DROP TABLE IF EXISTS `tamisemi_wards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `tamisemi_wards` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `existing_id` bigint unsigned DEFAULT NULL,
    `parent_area` bigint unsigned DEFAULT NULL,
    `parent_area_ares_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `ares_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `label` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_short_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_hq_id` bigint unsigned DEFAULT NULL,
    `area_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `establishment_date_approximated` tinyint(1) NOT NULL DEFAULT '0',
    `mof_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `area_type_id` int unsigned DEFAULT NULL,
    `area_type_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_type_name_sw` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_type_order_id` int unsigned DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `tamisemi_wards_ares_code_unique` (`ares_code`),
    KEY `tamisemi_wards_parent_area_foreign` (`parent_area`),
    CONSTRAINT `tamisemi_wards_parent_area_foreign` FOREIGN KEY (`parent_area`) REFERENCES `tamisemi_councils` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 3960 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `temp_locations`
--

DROP TABLE IF EXISTS `temp_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `temp_locations` (
    `registration_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `latitude` decimal(20, 10) DEFAULT NULL,
    `longitude` decimal(20, 10) DEFAULT NULL,
    UNIQUE KEY `temp_locations_registration_number_unique` (`registration_number`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `users` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `email_verified_at` timestamp NULL DEFAULT NULL,
    `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `two_factor_secret` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `two_factor_recovery_codes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    `remember_token` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `secure_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `users_email_unique` (`email`)
) ENGINE = InnoDB AUTO_INCREMENT = 3800 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `vyeo`
--

DROP TABLE IF EXISTS `vyeo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `vyeo` (
    `id` int NOT NULL AUTO_INCREMENT,
    `rank_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `status_id` int DEFAULT '1',
    `rank_level` int DEFAULT NULL,
    `overdue` tinyint DEFAULT '1',
    PRIMARY KEY (`id`),
    KEY `idx_vyeo_status_id` (`status_id`),
    KEY `idx_vyeo_rank_level` (`rank_level`)
) ENGINE = InnoDB AUTO_INCREMENT = 21 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `wards`
--

DROP TABLE IF EXISTS `wards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `wards` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `LgaCode` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `WardCode` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `WardName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `tamisemi_id` bigint unsigned NOT NULL,
    `parent_area` bigint unsigned DEFAULT NULL,
    `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_type_id` bigint unsigned DEFAULT NULL,
    `label` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_short_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_hq_id` bigint unsigned DEFAULT NULL,
    `area_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `establishment_date_approximated` tinyint(1) DEFAULT '0',
    `mof_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `ward_uid_index` (`id`, `WardCode`),
    KEY `wards_code_index` (`WardCode`),
    KEY `lga_code_index` (`LgaCode`),
    KEY `idx_wards_WardCode` (`WardCode`),
    KEY `idx_wards_LgaCode` (`LgaCode`)
) ENGINE = InnoDB AUTO_INCREMENT = 3960 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `wardsBackup`
--

DROP TABLE IF EXISTS `wardsBackup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `wardsBackup` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `LgaCode` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `WardCode` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `WardName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `tamisemi_id` bigint unsigned NOT NULL,
    `parent_area` bigint unsigned DEFAULT NULL,
    `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_type_id` bigint unsigned DEFAULT NULL,
    `label` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_short_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `area_hq_id` bigint unsigned DEFAULT NULL,
    `area_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `establishment_date_approximated` tinyint(1) DEFAULT '0',
    `mof_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `ward_uid_index` (`id`, `WardCode`),
    KEY `wards_code_index` (`WardCode`),
    KEY `lga_code_index` (`LgaCode`),
    KEY `idx_wards_WardCode` (`WardCode`),
    KEY `idx_wards_LgaCode` (`LgaCode`)
) ENGINE = InnoDB AUTO_INCREMENT = 3957 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `work_flow`
--

DROP TABLE IF EXISTS `work_flow`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `work_flow` (
    `id` int NOT NULL AUTO_INCREMENT,
    `application_category_id` bigint NOT NULL,
    `start_from` int NOT NULL,
    `end_to` int NOT NULL,
    `_order` int NOT NULL DEFAULT '0',
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `start_from_end_to_unique` (
        `start_from`,
        `end_to`,
        `application_category_id`
    )
) ENGINE = InnoDB AUTO_INCREMENT = 143 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `workflow`
--

DROP TABLE IF EXISTS `workflow`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `workflow` (
    `id` int NOT NULL AUTO_INCREMENT,
    `user_id` int DEFAULT NULL,
    `tracking_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `status_id` int DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `zones`
--

DROP TABLE IF EXISTS `zones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `zones` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `zone_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `zone_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `box` int DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `status_id` int NOT NULL DEFAULT '1',
    PRIMARY KEY (`id`),
    KEY `idx_zones_id` (`id`),
    KEY `idx_zones_zone_code` (`zone_code`),
    KEY `idx_zones_status_id` (`status_id`)
) ENGINE = InnoDB AUTO_INCREMENT = 12 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */
;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */
;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */
;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */
;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */
;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */
;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */
;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */
;

-- Dump completed on 2026-03-07 15:06:12