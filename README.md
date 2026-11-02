# ponpes-finance-web

Frontend web application for `ponpes-finance`, a mobile-first financial management platform for pondok pesantren.

## Tech Stack
- **Framework**: Next.js 15 (App Router, React 19)
- **Styling**: Tailwind CSS v4 (`@theme`), Shadcn UI
- **Design System**: Refero Mercury + Wise color palette (Deep Forest Green `#0F5132`, Emerald Accent `#10B981`, Gold Amber `#D97706`, Warning Red `#EF4444`, Slate Canvas `#F8FAFC`, Surface `#FFFFFF`, Border `#E2E8F0`, Text `#0F172A`)
- **Typography**: Plus Jakarta Sans (Headings), Inter (Body), JetBrains Mono (Monetary amounts & NIS)
- **Authentication & RBAC**: NextAuth v5 (Auth.js) credentials with bcrypt hashing and session enrichment
- **Spreadsheet Processing**: `xlsx` (SheetJS)
- **Database Linking**: `@ponpes-finance/db` local file dependency

## Key Features
- **Role-Based Access Control (RBAC)**:
  - Super Admin: Full system access across all complexes.
  - Bendahara Komplek: Multi-complex administration scoped to assigned complexes.
  - Santri: Self-service access with mandatory first-login password update.
- **Master Data Management**:
  - Residential Complexes CRUD (`/master/komplek`)
  - Santri Categories (`/master/kategori`)
  - Santri Directory & Status Lifecycle (`aktif` / `boyong`) (`/master/santri`)
  - Syahriah Rate Matrix UI with Rp50.000 fixed savings allocation & effective dates (`/master/tarif`)
- **Excel (.xlsx) Import Engine (`/master/santri/impor`)**:
  - Drag-and-drop `.xlsx` file upload
  - 7-step validation pipeline: required columns, in-file duplicate NIS, database duplicate NIS, phone normalization (`628...`), entity FK resolution, scoped access check, and opening balance verification
  - Interactive dual-state preview table (green for valid, warning red for errors)
  - Atomic batch confirmation & database commit
  - Downloadable compliant `.xlsx` template generator
- **Responsive Layout**:
  - Bendahara desktop collapsible sidebar & header
  - Santri mobile-first layout with 5 bottom tabs

## Scripts
- `pnpm dev`: Start Next.js development server
- `pnpm build`: Build production bundle
- `pnpm start`: Start production server
