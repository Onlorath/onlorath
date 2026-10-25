#!/bin/bash
# ──────────────────────────────────────────────
# 🧹 Frontend Nuclear Cache Reset
# Kullanım: ./nuke-cache.sh
# ──────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WEB_DIR="$SCRIPT_DIR/frontend/web"

echo "⚡ Orphan npm process'leri öldürülüyor..."
pkill -9 -f "npm (i|install|run)" 2>/dev/null || true
sleep 1

echo "🗑️  Next.js build cache siliniyor..."
rm -rf "$WEB_DIR/.next" "$WEB_DIR/tsconfig.tsbuildinfo"

echo "🗑️  node_modules siliniyor..."
rm -rf "$WEB_DIR/node_modules"

echo "🗑️  package-lock.json siliniyor..."
rm -f "$WEB_DIR/package-lock.json"

echo "🗑️  Global npm cache temizleniyor..."
npm cache clean --force 2>/dev/null

echo "🗑️  TypeScript IDE cache temizleniyor..."
rm -rf ~/Library/Caches/typescript/*

echo "📦 Paketler yeniden kuruluyor..."
cd "$WEB_DIR"
npm install --legacy-peer-deps

echo ""
echo "✅ Temizlik tamamlandı. 'npm run dev' ile başlatabilirsin."
