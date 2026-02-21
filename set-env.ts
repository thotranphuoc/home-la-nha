/**
 * Tạo file environment.production.ts từ biến môi trường (Vercel: SUPABASE_URL, SUPABASE_ANON_KEY).
 * Chạy trước khi build: npx tsx set-env.ts && ng build
 */
import { writeFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? '';

const content = `export const environment = {
  production: true,
  supabaseUrl: ${JSON.stringify(supabaseUrl)},
  supabaseAnonKey: ${JSON.stringify(supabaseAnonKey)},
};
`;

const outPath = join(__dirname, 'src', 'environments', 'environment.production.ts');
writeFileSync(outPath, content, 'utf-8');
console.log('Wrote', outPath);
