-- Add has_credit_card column to reservations table
ALTER TABLE reservations ADD COLUMN has_credit_card BOOLEAN DEFAULT FALSE;

-- Add no-show status to reservations
ALTER TABLE reservations MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending-checkin';
-- Status values: 'pending-checkin', 'confirmed', 'checked-in', 'checked-out', 'cancelled', 'no-show'

-- Add indexes for automated tasks
CREATE INDEX idx_reservations_status_date ON reservations(status, check_in_date);
CREATE INDEX idx_reservations_has_credit_card ON reservations(has_credit_card); 