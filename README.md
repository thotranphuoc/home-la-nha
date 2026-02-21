# Home La Nha – PWA Quản lý bất động sản

Angular 17+ PWA với Supabase: Admin (tòa nhà, phòng, tài sản, thu chi) và Cổng khách thuê (CCCD, hóa đơn).

## Yêu cầu

- Node 18+
- Tài khoản Supabase

## Cài đặt

```bash
npm install
```

## Cấu hình Supabase

1. Tạo project tại [supabase.com](https://supabase.com).
2. Chạy migration: trong SQL Editor, mở và chạy nội dung file `supabase/migrations/20250219000000_initial_schema.sql`.
3. Tạo bucket **id-cards** (Private) trong Storage và cấu hình policy cho user đã đăng nhập.
4. Copy **Project URL** và **anon public key** vào `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  supabaseUrl: 'https://xxx.supabase.co',
  supabaseAnonKey: 'eyJ...',
};
```

Hoặc tạo `src/environments/environment.local.ts` (file này được gitignore) và điền key để override.

5. Tạo user admin: sau khi đăng ký một user, trong SQL Editor chạy:
   `UPDATE profiles SET role = 'admin' WHERE id = '0362869e-96c3-4172-8b61-60048a77712d';`

## Chạy

```bash
npm start
```

Mở http://localhost:4200. Đăng nhập bằng user đã tạo (admin hoặc tenant tùy role trong `profiles`).

## Build production

```bash
npm run build
```

Output: `dist/homelanha/`. Có thể deploy lên bất kỳ host tĩnh nào (Firebase Hosting, Vercel, Netlify, …).

## Cấu trúc chính

- **Core:** `AuthService` (signals), `PropertyService`, `AssetService` (khấu hao thẳng), `FinanceService`, `TenantService`, `SupabaseService`
- **Guards:** `authGuard`, `tenantEditGuard` (chặn sửa khi `is_locked`)
- **Admin:** `/admin` – Tổng quan, Phòng, Tài sản, Thu chi
- **Tenant:** `/tenant` – Cập nhật CCCD, Thanh toán hóa đơn
- **PWA:** Service Worker + manifest (offline, cài lên màn hình)
