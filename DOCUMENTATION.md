# Technická dokumentace — Rezervační systém učeben a vybavení

---

## 1. Architektura a kontext aplikace

Aplikace je jednostránková webová aplikace (SPA) s možností SSR (Server-Side Rendering), postavená na frameworku **Nuxt 4** (Vue 3, Composition API). Slouží pro rezervaci sdílených zdrojů — učeben a vybavení — v prostředí vzdělávací instituce.

### Technologický stack

| Vrstva | Technologie |
|---|---|
| Frontend framework | Nuxt 4 (Vue 3, Composition API, `<script setup>`) |
| Stylování | Tailwind CSS v3 + `@nuxtjs/tailwindcss` |
| Ikony | `@nuxt/icon` (heroicons sada) |
| Backend / databáze | Supabase (PostgreSQL, Auth, Row Level Security) |
| Integrace | `@nuxtjs/supabase` — automatický import composables |
| Jazykový standard | TypeScript (strict typy pro všechna data ze Supabase) |

### Uživatelské role

| Role | Oprávnění |
|---|---|
| `student` | Čtení zdrojů, vytváření a rušení vlastních rezervací |
| `teacher` | Stejné jako student (rozšiřitelné) |
| `admin` | Plný CRUD nad zdroji + správa všech rezervací |

---

## 2. Schéma databáze

### Tabulka `profiles`

Rozšiřuje tabulku `auth.users` od Supabase Auth. Automaticky se naplní pomocí databázového triggeru při každé nové registraci.

| Sloupec | Typ | Popis |
|---|---|---|
| `id` | UUID (PK) | Odpovídá `auth.users.id` |
| `email` | TEXT | E-mailová adresa uživatele |
| `role` | TEXT | `student` / `teacher` / `admin` |
| `display_name` | TEXT | Zobrazované jméno |
| `created_at` | TIMESTAMPTZ | Datum vytvoření |

**Trigger `on_auth_user_created`:** Po vložení záznamu do `auth.users` automaticky vytvoří profil v tabulce `profiles` (funkce `handle_new_user()`, `SECURITY DEFINER`).

### Tabulka `resources`

| Sloupec | Typ | Popis |
|---|---|---|
| `id` | UUID (PK) | Automaticky generovaný identifikátor |
| `name` | TEXT | Název zdroje (povinné) |
| `type` | TEXT | `classroom` / `laptop` / `projector` / `camera` / `other` |
| `description` | TEXT | Volitelný popis |
| `location` | TEXT | Fyzické umístění |
| `quantity` | INTEGER | Počet kusů (výchozí: 1) |
| `created_at` | TIMESTAMPTZ | Datum vytvoření |

### Tabulka `reservations`

| Sloupec | Typ | Popis |
|---|---|---|
| `id` | UUID (PK) | Automaticky generovaný identifikátor |
| `resource_id` | UUID (FK) | Odkaz na `resources.id` (CASCADE DELETE) |
| `user_id` | UUID (FK) | Odkaz na `profiles.id` (CASCADE DELETE) |
| `start_time` | TIMESTAMPTZ | Začátek rezervace (povinné) |
| `end_time` | TIMESTAMPTZ | Konec rezervace (povinné, musí být > `start_time`) |
| `status` | TEXT | `active` / `cancelled` |
| `created_at` | TIMESTAMPTZ | Datum vytvoření rezervace |

**Constraint `valid_time_range`:** `CHECK (end_time > start_time)` — zajišťuje konzistenci časového rozsahu na úrovni databáze.

**Index `idx_reservations_resource_time`:** Pokrývá sloupce `(resource_id, start_time, end_time)` pro aktivní rezervace — urychluje detekci kolizí.

### Row Level Security (RLS)

Všechny tabulky mají aktivované RLS. Pomocná funkce `is_admin()` vrací `TRUE`, pokud přihlášený uživatel má roli `admin`.

| Tabulka | Operace | Podmínka |
|---|---|---|
| `profiles` | SELECT | Každý přihlášený uživatel |
| `profiles` | UPDATE | Vlastní záznam nebo admin |
| `resources` | SELECT | Každý přihlášený uživatel |
| `resources` | INSERT / UPDATE / DELETE | Pouze admin |
| `reservations` | SELECT | Každý přihlášený uživatel |
| `reservations` | INSERT | Pouze pro `user_id = auth.uid()` |
| `reservations` | UPDATE / DELETE | Vlastní rezervace nebo admin |

---

## 3. API volání a CRUD operace přes Supabase

Veškerá komunikace s databází probíhá výhradně přes **Supabase JavaScript klienta** (`@supabase/supabase-js`), který je dostupný pomocí auto-importovaného composable `useSupabaseClient()`.

### Struktura composables

#### `useProfile` (`app/composables/useProfile.ts`)
- `fetchProfile()` — načte profil přihlášeného uživatele (SELECT s `.eq('id', user.id)`)
- `isAdmin` — computed property, `true` pokud `profile.role === 'admin'`
- Stav `profile` je uložen v `useState()` — sdílený globální stav přežívající napříč komponentami

#### `useResources` (`app/composables/useResources.ts`)
- `fetchResources({ search?, type? })` — SELECT všech zdrojů s volitelným `.ilike()` a `.eq()` filtrem
- `fetchResourceById(id)` — SELECT jednoho záznamu
- `createResource(payload)` — INSERT + SELECT vrácení nového záznamu
- `updateResource(id, payload)` — UPDATE + SELECT
- `deleteResource(id)` — DELETE

#### `useReservations` (`app/composables/useReservations.ts`)
- `fetchMyReservations()` — SELECT rezervací aktuálního uživatele se vztahem `resource:resources(*)`
- `fetchResourceReservations(resourceId)` — načte budoucí aktivní rezervace pro konkrétní zdroj
- `checkConflict(resourceId, startTime, endTime)` — **klíčová funkce kolizní detekce** (viz níže)
- `createReservation(resourceId, startTime, endTime)` — volá `checkConflict()`, pak INSERT
- `cancelReservation(id)` — UPDATE nastaví `status = 'cancelled'`

### Detekce kolizí rezervací

Před každým vytvořením rezervace se spustí dotaz:

```typescript
const { data } = await supabase
  .from('reservations')
  .select('id')
  .eq('resource_id', resourceId)
  .eq('status', 'active')
  .lt('start_time', endTime)   // existující začátek < nový konec
  .gt('end_time', startTime)   // existující konec > nový začátek
```

Podmínka `start < newEnd AND end > newStart` je standardní matematický test překryvu intervalů. Pokud dotaz vrátí alespoň jeden řádek, je uživateli zobrazena chybová hláška a rezervace není uložena. Tato logika funguje na **aplikační vrstvě** a je doplněna RLS politikami na straně databáze.

---

## 4. Struktura stránek a routing

| URL | Stránka | Přístup |
|---|---|---|
| `/` | Přesměrování | Veřejná |
| `/login` | Přihlášení | Veřejná |
| `/register` | Registrace | Veřejná |
| `/resources` | Seznam zdrojů + vyhledávání | Přihlášený |
| `/resources/:id` | Detail zdroje + formulář rezervace | Přihlášený |
| `/dashboard` | Moje rezervace | Přihlášený |
| `/admin/resources` | Správa zdrojů (CRUD) | Admin |

Ochrana probíhá přes **Nuxt route middleware**:
- `middleware/auth.ts` — přesměruje na `/login` pokud `useSupabaseUser()` vrátí `null`
- `middleware/admin.ts` — načte roli z DB, přesměruje na `/` pokud není admin

---

## 5. Spuštění a nasazení

### Vývojové prostředí

```bash
cp .env.example .env   # doplnit SUPABASE_URL a SUPABASE_KEY
npm install
npm run dev            # http://localhost:3000
```

### Produkční build

```bash
npm run build
npm run preview        # ověření buildu lokálně
```

Pro nasazení do produkce je aplikace kompatibilní s **Vercel**, **Netlify** a libovolným Node.js serverem.

---

## 6. Známá omezení

| Omezení | Vysvětlení |
|---|---|
| Kolizní detekce je klientská | Detekce probíhá v composable — nelze zaručit atomicitu při souběžných požadavcích (race condition). Pro produkci je vhodné přidat databázovou funkci / trigger. |
| Admin middleware přeskakuje SSR | Middleware `admin.ts` běží pouze na klientovi (`import.meta.server` guard) — admin stránky tak mohou být na zlomek sekundy viditelné před přesměrováním při SSR. |
| Žádná e-mailová konfirmace | Supabase ve výchozím nastavení vyžaduje potvrzení e-mailu. V testovacím prostředí lze vypnout v Auth → Settings. |
| Opakující se kolizní kontrola | Aplikace negeneruje potvrzení o dostupnosti v reálném čase — uživatel vidí obsazené časy při otevření stránky, ale bez WebSocket aktualizací. |
