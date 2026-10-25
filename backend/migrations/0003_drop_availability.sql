-- The "open to new projects" hero badge was removed from the design.
ALTER TABLE site_profile
    DROP COLUMN IF EXISTS availability,
    DROP COLUMN IF EXISTS available;
