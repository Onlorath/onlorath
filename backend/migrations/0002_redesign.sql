-- Pastel Bento redesign: all public content becomes DB-driven and bilingual.
-- Localized text columns are JSONB objects shaped like {"tr": "...", "en": "..."}.

-- =============================================
-- Site profile (single row, id = 1)
-- =============================================
CREATE TABLE IF NOT EXISTS site_profile (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    name VARCHAR(120) NOT NULL DEFAULT '',
    logo_text VARCHAR(60) NOT NULL DEFAULT '',
    hero_headline JSONB NOT NULL DEFAULT '{}',
    availability JSONB NOT NULL DEFAULT '{}',
    available BOOLEAN NOT NULL DEFAULT true,
    hero_lead JSONB NOT NULL DEFAULT '{}',
    role_title JSONB NOT NULL DEFAULT '{}',
    location_line JSONB NOT NULL DEFAULT '{}',
    about_title JSONB NOT NULL DEFAULT '{}',
    about_paragraphs JSONB NOT NULL DEFAULT '[]',
    contact_lead JSONB NOT NULL DEFAULT '{}',
    email VARCHAR(255) NOT NULL DEFAULT '',
    footer_note JSONB NOT NULL DEFAULT '{}',
    cv_url VARCHAR(500) NOT NULL DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_site_profile_modtime ON site_profile;
CREATE TRIGGER update_site_profile_modtime
    BEFORE UPDATE ON site_profile
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- =============================================
-- Projects (replaces the old flat projects + project_images)
-- =============================================
DROP TABLE IF EXISTS project_images;
DROP TABLE IF EXISTS projects;

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(200) UNIQUE NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    published BOOLEAN NOT NULL DEFAULT true,
    category VARCHAR(20) NOT NULL DEFAULT 'software' CHECK (category IN ('game', 'software')),
    color VARCHAR(20) NOT NULL DEFAULT 'coral' CHECK (color IN ('coral', 'sky', 'butter', 'lavender', 'sage')),
    title JSONB NOT NULL DEFAULT '{}',
    platform JSONB NOT NULL DEFAULT '{}',
    status_label JSONB NOT NULL DEFAULT '{}',
    description JSONB NOT NULL DEFAULT '{}',
    meta JSONB NOT NULL DEFAULT '[]',
    actions JSONB NOT NULL DEFAULT '[]',
    media JSONB NOT NULL DEFAULT '{"type": "placeholder"}',
    tech TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_sort_order ON projects(sort_order);

CREATE TRIGGER update_projects_modtime
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- =============================================
-- Experience timeline, skills, social links
-- =============================================
CREATE TABLE IF NOT EXISTS experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sort_order INT NOT NULL DEFAULT 0,
    period JSONB NOT NULL DEFAULT '{}',
    title VARCHAR(200) NOT NULL DEFAULT '',
    subtitle JSONB NOT NULL DEFAULT '{}',
    tag JSONB NOT NULL DEFAULT '{}',
    color VARCHAR(20) NOT NULL DEFAULT 'sky' CHECK (color IN ('coral', 'sky', 'butter', 'lavender', 'sage')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sort_order INT NOT NULL DEFAULT 0,
    label VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS social_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sort_order INT NOT NULL DEFAULT 0,
    label VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Contact messages (inbox in the admin panel)
-- =============================================
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    locale VARCHAR(5) NOT NULL DEFAULT 'tr',
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);

-- =============================================
-- Blogs become bilingual; existing text is copied into both languages
-- =============================================
DROP TABLE IF EXISTS blog_images;

ALTER TABLE blogs
    ALTER COLUMN title TYPE JSONB USING jsonb_build_object('tr', title, 'en', title),
    ALTER COLUMN content DROP DEFAULT,
    ALTER COLUMN content TYPE JSONB USING jsonb_build_object('tr', content, 'en', content),
    ALTER COLUMN content SET DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS excerpt JSONB NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

UPDATE blogs SET published_at = created_at WHERE published AND published_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_blogs_published_at ON blogs(published_at DESC);
