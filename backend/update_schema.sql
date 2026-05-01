-- ============================================
-- RUN THIS IN MYSQL WORKBENCH
-- Adds Payment + Password Reset to Servify
-- ============================================

USE servify_db;

-- Add payment columns to bookings table
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_status ENUM('unpaid', 'paid', 'refunded') DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_id VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS order_id VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT NULL;

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  user_id INT NOT NULL,
  razorpay_order_id VARCHAR(100) NOT NULL,
  razorpay_payment_id VARCHAR(100) DEFAULT NULL,
  razorpay_signature VARCHAR(255) DEFAULT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status ENUM('created', 'paid', 'failed', 'refunded') DEFAULT 'created',
  payment_method VARCHAR(50) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL,
  user_type ENUM('user', 'provider') NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token (token),
  INDEX idx_email (email)
);

SELECT 'Tables created successfully!' AS status;
