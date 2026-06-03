# Technická dokumentace — Rezervační systém učeben a vybavení

**Datum:** 3. 6. 2026  
**Autor:** Vítězslav Kubis  
**Stack:** Nuxt 4 · Vue 3 · TypeScript · Tailwind CSS · Supabase (PostgreSQL)

---

## 1. Přehled aplikace

Webová aplikace umožňuje rezervaci sdílených zdrojů (učeben, notebooků, projektorů, kamer) v prostředí vzdělávací instituce. Uživatelé se registrují s rolí **žák** nebo **admin**. Přihlášení probíhá e-mailem nebo přes Google OAuth.

### Technologický stack

| Vrstva | Technologie |
|---|---|
| Frontend | Nuxt 4, Vue 3 (Composition API, `<script setup>`) |
| Stylování | Tailwind CSS v3 |
| Backend / DB | Supabase — PostgreSQL, Auth, Row Level Security |
| Jazyk | TypeScript |

---

## 2. Databázové schéma

Databáze obsahuje 3 tabulky. Všechny mají aktivní **Row Level Security (RLS)**.

### `profiles`
Rozšiřuje `auth.users`. Záznam se vytvoří automaticky triggerem `on_auth_user_created` při každé nové registraci.

| Sloupec | Typ | Popis |
|---|---|---|
| `id` | UUID PK | Shoduje se s `auth.users.id` |
| `email` | TEXT | E-mail uživatele |
| `role` | TEXT | `student` / `teacher` / `admin` |
| `display_name` | TEXT | Zobrazované jméno |

### `resources`
Záznamy učeben a vybavení. Spravuje pouze admin.

| Sloupec | Typ | Popis |
|---|---|---|
| `id` | UUID PK | Automaticky generovaný |
| `name` | TEXT | Název zdroje |
| `type` | TEXT | `classroom` / `laptop` / `projector` / `camera` / `other` |
| `quantity` | INTEGER | Počet kusů (výchozí: 1) |
| `location` | TEXT | Fyzické umístění |

### `reservations`
Rezervace zdrojů uživateli.

| Sloupec | Typ | Popis |
|---|---|---|
| `id` | UUID PK | Automaticky generovaný |
| `resource_id` | UUID FK | Odkaz na `resources.id` |
| `user_id` | UUID FK | Odkaz na `profiles.id` |
| `start_time` | TIMESTAMPTZ | Začátek rezervace |
| `end_time` | TIMESTAMPTZ | Konec (vždy > `start_time`) |
| `status` | TEXT | `active` / `cancelled` |

Index `idx_reservations_resource_time` na `(resource_id, start_time, end_time)` WHERE `status = 'active'` urychluje detekci kolizí.

### RLS přehled

| Tabulka | Operace | Kdo má přístup |
|---|---|---|
| `profiles` | SELECT | Každý přihlášený |
| `profiles` | UPDATE | Vlastní záznam nebo admin |
| `resources` | SELECT | Každý přihlášený |
| `resources` | INSERT / UPDATE / DELETE | Pouze admin |
| `reservations` | SELECT | Každý přihlášený |
| `reservations` | INSERT | Uživatel sám za sebe |
| `reservations` | UPDATE / DELETE | Vlastní rezervace nebo admin |

---

## 3. Klíčová logika — detekce kolizí

Před vytvořením každé rezervace composable `useReservations.ts` spustí dotaz:

```typescript
const { data } = await supabase
  .from('reservations')
  .select('id')
  .eq('resource_id', resourceId)
  .eq('status', 'active')
  .lt('start_time', endTime)   // existující začátek < nový konec
  .gt('end_time', startTime)   // existující konec > nový začátek
```

Podmínka `start < newEnd AND end > newStart` je standardní test překryvu intervalů. Pokud dotaz vrátí alespoň jeden řádek, rezervace se neuloží a uživateli se zobrazí chyba.

---

## 4. Stránky a přístup

| URL | Stránka | Přístup |
|---|---|---|
| `/login` | Přihlášení | Veřejná |
| `/register` | Registrace + výběr role | Veřejná |
| `/resources` | Seznam zdrojů + filtrování | Přihlášený |
| `/resources/:id` | Detail + rezervační formulář | Přihlášený |
| `/dashboard` | Moje rezervace | Přihlášený |
| `/admin/resources` | CRUD správa zdrojů | Admin |

Ochrana stránek: `middleware/auth.ts` přesměruje nepřihlášené na `/login`, `middleware/admin.ts` přesměruje neadminy na `/`.

---

## 5. Spuštění

```bash
cp .env.example .env      # doplnit SUPABASE_URL a SUPABASE_KEY
npm install
npm run dev               # http://localhost:3000
```

Před spuštěním je nutné v Supabase SQL Editoru spustit celý soubor `setup.sql`, který vytvoří tabulky, triggery, RLS politiky a ukázková data. Prvního admina je třeba nastavit ručně:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'vas@email.com';
```

---

## 6. Omezení

| Omezení | Popis |
|---|---|
| Race condition při rezervaci | Kolizní detekce běží na aplikační vrstvě — při souběžných požadavcích nelze zaručit atomicitu. Produkční řešení: databázová funkce nebo trigger. |
| Admin middleware jen na klientovi | Stránka `/admin/*` může být na zlomek sekundy viditelná při SSR před přesměrováním. |
| Žádné real-time aktualizace | Obsazenost zdrojů se aktualizuje jen při načtení stránky, nikoliv v reálném čase (bez WebSocket). |
