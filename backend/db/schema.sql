-- Patient Management System - MySQL Schema
-- Run this once to set up the database: mysql -u root -p < db/schema.sql

CREATE DATABASE IF NOT EXISTS patient_management
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE patient_management;

-- ============================================================
-- PATIENTS
-- Captures the Patient Registration form.
-- patient_id is the human-entered unique identifier (spec requirement:
-- "This is a unique field and cannot be shared between patients").
-- id is the internal auto-increment PK used for foreign keys.
-- ============================================================
CREATE TABLE IF NOT EXISTS patients (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  patient_id         VARCHAR(50) NOT NULL,
  registration_date  DATE NOT NULL,
  first_name         VARCHAR(100) NOT NULL,
  last_name          VARCHAR(100) NOT NULL,
  date_of_birth      DATE NOT NULL,
  gender             ENUM('Male', 'Female', 'Other') NOT NULL,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_patient_id (patient_id)
) ENGINE=InnoDB;

-- ============================================================
-- VITALS
-- Captures the Vitals form (Height, Weight -> auto-calculated BMI).
-- Spec: "A single patient can have multiple submissions for the vitals
-- form but on different dates" -> UNIQUE(patient_id, visit_date).
-- ============================================================
CREATE TABLE IF NOT EXISTS vitals (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  patient_id   INT NOT NULL,
  visit_date   DATE NOT NULL,
  height_cm    DECIMAL(5,2) NOT NULL,
  weight_kg    DECIMAL(5,2) NOT NULL,
  bmi          DECIMAL(5,2) NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_patient_visit_date (patient_id, visit_date),
  CONSTRAINT fk_vitals_patient FOREIGN KEY (patient_id)
    REFERENCES patients(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- VISITS
-- Covers BOTH the Overweight Assessment Form and the General
-- Assessment Form, distinguished by form_type. Which one gets
-- filled is decided by the BMI on the linked vitals record
-- (BMI > 25 -> overweight, BMI <= 25 -> general).
-- ============================================================
CREATE TABLE IF NOT EXISTS visits (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  patient_id      INT NOT NULL,
  vital_id        INT NOT NULL,
  visit_date      DATE NOT NULL,
  form_type       ENUM('overweight', 'general') NOT NULL,
  general_health  ENUM('Good', 'Poor') NOT NULL,
  on_diet         ENUM('Yes', 'No') DEFAULT NULL, -- overweight form only
  on_drugs        ENUM('Yes', 'No') DEFAULT NULL, -- general form only
  comments        TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_patient_visit_form (patient_id, visit_date, form_type),
  CONSTRAINT fk_visits_patient FOREIGN KEY (patient_id)
    REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_visits_vital FOREIGN KEY (vital_id)
    REFERENCES vitals(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_vitals_visit_date ON vitals(visit_date);
CREATE INDEX idx_visits_visit_date ON visits(visit_date);
