-- UUID üretimi için gerekli uzantıyı aktif et
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Kullanıcılar tablosu
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Güncelleme saatini otomatik oturtacak fonksiyon
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Tablo güncellendiğinde tetiklenecek mekanizma
DROP TRIGGER IF EXISTS update_users_modtime ON users;
CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- Konuşma oturumları
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    title VARCHAR(255) DEFAULT 'Yeni Konuşma',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Mesajlar (hem user hem model mesajları)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'model')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performans indexleri
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_role_created_at ON messages(role, created_at);

-- Tablo güncellendiğinde tetiklenecek mekanizma (conversations için)
DROP TRIGGER IF EXISTS update_conversations_modtime ON conversations;
CREATE TRIGGER update_conversations_modtime
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- =============================================
-- Blog tablosu
-- =============================================
CREATE TABLE IF NOT EXISTS blogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    cover_image VARCHAR(500) DEFAULT '',
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_published ON blogs(published);
CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON blogs(created_at DESC);

DROP TRIGGER IF EXISTS update_blogs_modtime ON blogs;
CREATE TRIGGER update_blogs_modtime
    BEFORE UPDATE ON blogs
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- =============================================
-- Projeler tablosu
-- =============================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    tech TEXT[] DEFAULT '{}',
    status VARCHAR(100) DEFAULT 'In Development',
    cover_image VARCHAR(500) DEFAULT '',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_sort_order ON projects(sort_order);

DROP TRIGGER IF EXISTS update_projects_modtime ON projects;
CREATE TRIGGER update_projects_modtime
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- =============================================
-- Blog görselleri
-- =============================================
CREATE TABLE IF NOT EXISTS blog_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_id UUID NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255) DEFAULT '',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blog_images_blog_id ON blog_images(blog_id);

-- =============================================
-- Proje görselleri
-- =============================================
CREATE TABLE IF NOT EXISTS project_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255) DEFAULT '',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_project_images_project_id ON project_images(project_id);