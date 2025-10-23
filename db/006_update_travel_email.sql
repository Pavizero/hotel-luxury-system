-- Migration to update travel user email
-- This updates the travel user email to match the new quick login email

UPDATE users 
SET email = 'travel.agency@hotel.com' 
WHERE email = 'travel@hotel.com' AND role = 'travel'; 