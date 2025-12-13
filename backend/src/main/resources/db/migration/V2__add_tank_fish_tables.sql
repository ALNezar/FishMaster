-- FishMaster Onboarding Schema Migration
-- Adds tables for tanks, fish types, fish, and water parameters

-- Add onboarding_completed flag to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Fish Types reference table with optimal water parameters
CREATE TABLE fish_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    min_ph DECIMAL(3,1) NOT NULL,
    max_ph DECIMAL(3,1) NOT NULL,
    min_temp DECIMAL(4,1) NOT NULL,  -- Celsius
    max_temp DECIMAL(4,1) NOT NULL,  -- Celsius
    description TEXT,
    care_level VARCHAR(20) DEFAULT 'beginner',  -- beginner, intermediate, advanced
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tanks table - each user can have multiple tanks
CREATE TABLE tanks (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    size_liters INTEGER NOT NULL CHECK (size_liters > 0 AND size_liters <= 500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fish table - each tank can have multiple fish
CREATE TABLE fish (
    id BIGSERIAL PRIMARY KEY,
    tank_id BIGINT NOT NULL REFERENCES tanks(id) ON DELETE CASCADE,
    fish_type_id BIGINT NOT NULL REFERENCES fish_types(id),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Water parameters for each tank
CREATE TABLE water_parameters (
    id BIGSERIAL PRIMARY KEY,
    tank_id BIGINT NOT NULL REFERENCES tanks(id) ON DELETE CASCADE,
    ph DECIMAL(3,1),
    temperature DECIMAL(4,1),  -- Celsius
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tank_id)  -- One water parameters entry per tank
);

-- Create indexes for better query performance
CREATE INDEX idx_tanks_user_id ON tanks(user_id);
CREATE INDEX idx_fish_tank_id ON fish(tank_id);
CREATE INDEX idx_water_parameters_tank_id ON water_parameters(tank_id);

-- Seed default fish types with scientifically accurate parameters
-- Data sourced from aquarium hobbyist literature and MSD Veterinary Manual
INSERT INTO fish_types (name, min_ph, max_ph, min_temp, max_temp, description, care_level) VALUES
    ('Goldfish', 7.0, 7.4, 18.0, 24.0, 
     'Hardy coldwater fish. Ideal for beginners. Requires good filtration due to high waste production.', 
     'beginner'),
    ('Betta', 6.5, 7.5, 24.0, 27.0, 
     'Beautiful labyrinth fish. Males must be kept alone. Prefers calm water with minimal current.', 
     'beginner'),
    ('Guppy', 7.0, 8.0, 22.0, 28.0, 
     'Colorful livebearers that breed easily. Peaceful community fish. Males are more colorful.', 
     'beginner'),
    ('Neon Tetra', 6.0, 7.0, 20.0, 26.0, 
     'Iconic schooling fish with bright blue and red stripes. Keep in groups of 6 or more.', 
     'beginner'),
    ('Angelfish', 6.0, 7.5, 24.0, 30.0, 
     'Elegant cichlid. Can grow large. May eat smaller fish. Needs tall tank for vertical fins.', 
     'intermediate'),
    ('Molly', 7.5, 8.5, 22.0, 28.0, 
     'Peaceful livebearers. Tolerate slightly brackish water. Easy to breed.', 
     'beginner'),
    ('Platy', 7.0, 8.0, 20.0, 26.0, 
     'Hardy and colorful livebearers. Great community fish. Come in many color varieties.', 
     'beginner'),
    ('Corydoras Catfish', 6.0, 8.0, 22.0, 26.0, 
     'Bottom-dwelling catfish. Keep in groups of 4+. Excellent tank cleaners.', 
     'beginner'),
    ('Cherry Barb', 6.0, 7.0, 23.0, 27.0, 
     'Peaceful barbs with red coloration. Keep in schools. Males turn bright red when breeding.', 
     'beginner'),
    ('Zebra Danio', 6.5, 7.5, 18.0, 25.0, 
     'Active schooling fish. Very hardy and tolerant of temperature swings. Great for cycling tanks.', 
     'beginner'),
    ('Dwarf Gourami', 6.0, 7.5, 22.0, 28.0, 
     'Colorful labyrinth fish. Males can be territorial. Prefer planted tanks with hiding spots.', 
     'intermediate'),
    ('Bristlenose Pleco', 6.5, 7.5, 23.0, 27.0, 
     'Excellent algae eater. Stays smaller than common plecos. Needs driftwood in tank.', 
     'beginner');
