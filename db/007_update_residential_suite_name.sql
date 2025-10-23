-- Update room type name from 'Residential' to 'Residential Suite'
UPDATE room_types 
SET type_name = 'Residential Suite' 
WHERE type_name = 'Residential'; 