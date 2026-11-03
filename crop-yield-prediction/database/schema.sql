-- MySQL 8.0.16+ (CHECK constraints are enforced from 8.0.16).
CREATE DATABASE IF NOT EXISTS crop_yield_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE crop_yield_db;

CREATE TABLE IF NOT EXISTS prediction_history (
  id                          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  crop                        VARCHAR(32)   NOT NULL,
  year                        SMALLINT      NOT NULL,
  state_name                  VARCHAR(64)   NOT NULL,
  district_name               VARCHAR(64)   NOT NULL,
  area_ha                     DECIMAL(14,2) NOT NULL,
  temperature_c               DECIMAL(5,2)  NOT NULL,
  humidity                    DECIMAL(5,2)  NOT NULL,
  soil_ph                     DECIMAL(4,2)  NOT NULL,
  rainfall_mm                 DECIMAL(8,2)  NOT NULL,
  wind_speed_m_s              DECIMAL(5,2)  NOT NULL,
  solar_radiation             DECIMAL(5,2)  NOT NULL,
  predicted_yield_kg_per_ha   DECIMAL(12,2) NOT NULL,
  estimated_production_kg     DECIMAL(20,2) NOT NULL,
  created_at                  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT chk_area_positive   CHECK (area_ha > 0),
  CONSTRAINT chk_year_range      CHECK (year BETWEEN 1900 AND 2100),
  CONSTRAINT chk_yield_nonneg    CHECK (predicted_yield_kg_per_ha >= 0),
  CONSTRAINT chk_humidity_range  CHECK (humidity BETWEEN 0 AND 100),
  KEY idx_ph_created_at   (created_at),
  KEY idx_ph_crop_created (crop, created_at),
  KEY idx_ph_state_district (state_name, district_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Optional: a least-privilege application user (change the password!)
-- CREATE USER 'crop_app'@'localhost' IDENTIFIED BY 'change-me';
-- GRANT SELECT, INSERT, UPDATE, DELETE, CREATE ON crop_yield_db.* TO 'crop_app'@'localhost';

-- ---------------------------------------------------------------- example queries
-- Latest 10 predictions
-- SELECT id, crop, state_name, district_name, predicted_yield_kg_per_ha, created_at
--   FROM prediction_history ORDER BY created_at DESC LIMIT 10;
-- Predictions per crop
-- SELECT crop, COUNT(*) AS n, ROUND(AVG(predicted_yield_kg_per_ha),2) AS avg_yield
--   FROM prediction_history GROUP BY crop ORDER BY n DESC;
-- Predictions per day
-- SELECT DATE(created_at) AS day, COUNT(*) FROM prediction_history GROUP BY day ORDER BY day;
-- Search one state and crop
-- SELECT * FROM prediction_history WHERE state_name = 'Karnataka' AND crop = 'maize';
-- Delete one record
-- DELETE FROM prediction_history WHERE id = 1;
