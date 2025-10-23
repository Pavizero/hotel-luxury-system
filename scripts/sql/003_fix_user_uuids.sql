-- Fix User IDs to be valid UUIDs and update references

-- Define new UUIDs for the existing users
-- These are new UUIDs, different from the ones used for loyalty programs/travel companies
-- Make sure these are unique and valid UUIDs.
DO $$
DECLARE
    customer_uuid UUID := 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    clerk_uuid UUID := 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
    manager_uuid UUID := 'g1eebc99-9c0b-4ef8-bb6d-6bb9bd380a13';
    travel_uuid UUID := 'h1eebc99-9c0b-4ef8-bb6d-6bb9bd380a14';
BEGIN
    -- Update existing user IDs to valid UUIDs
    -- We'll update based on email, assuming emails are unique and stable identifiers for these seeded users.
    UPDATE users SET id = customer_uuid WHERE email = 'customer@hotel.com';
    UPDATE users SET id = clerk_uuid WHERE email = 'clerk@hotel.com';
    UPDATE users SET id = manager_uuid WHERE email = 'manager@hotel.com';
    UPDATE users SET id = travel_uuid WHERE email = 'travel.agency@hotel.com';

    -- Now, update foreign key references in other tables that used the old integer IDs.
    -- Based on 002_seed_data.sql, only 'reservations' table used user_id '1'.
    UPDATE reservations SET user_id = customer_uuid WHERE user_id = '1';

    -- If there were other tables referencing these old integer IDs, you would add more UPDATE statements here.
    -- For example:
    -- UPDATE some_other_table SET user_id = customer_uuid WHERE user_id = '1';

END $$;
