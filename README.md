# Rezervační systém učeben a vybavení

Webová aplikace pro rezervaci sdílených zdrojů — učeben a vybavení — v prostředí vzdělávací instituce. Postavena na **Nuxt 3**, **Vue 3**, **Tailwind CSS** a **Supabase**.

---

## Funkce

- Registrace a přihlášení (e-mail + Google OAuth) s potvrzením e-mailem
- Výběr role při registraci — **Žák** nebo **Admin**
- Přehled dostupných zdrojů s vyhledáváním a filtrováním podle typu
- Vytváření rezervací s automatickou detekcí kolizí
- Dashboard s přehledem nadcházejících a minulých rezervací, možnost zrušení
- Administrátorský panel pro správu zdrojů (přidání, úprava, smazání)
- Ochrana stránek přes route middleware (přihlášený uživatel / admin)

---

## Technologický stack

| Vrstva | Technologie |
|---|---|
| Frontend | Nuxt 3, Vue 3 (Composition API, `<script setup>`) |
| Stylování | Tailwind CSS + `@nuxtjs/tailwindcss` |
| Ikony | `@nuxt/icon` (heroicons) |
| Backend / DB | Supabase (PostgreSQL + Auth + Row Level Security) |
| Integrace | `@nuxtjs/supabase` |
| Jazyk | TypeScript |

---

## Požadavky

- Node.js 20+
- npm 10+
- Účet na [supabase.com](https://supabase.com) (bezplatný tier stačí)

---

## 1. Nastavení Supabase projektu

### Databáze

1. Přihlaste se na [app.supabase.com](https://app.supabase.com) a vytvořte nový projekt.
2. Přejděte do **SQL Editor** a spusťte celý obsah souboru `setup.sql` — vytvoří tabulky, triggery, RLS politiky a ukázková data.
3. Zkopírujte si přihlašovací údaje z **Project Settings → API**:
   - **Project URL** → `SUPABASE_URL`
   - **anon / public key** → `SUPABASE_KEY`

### E-mailový SMTP (pro potvrzení registrace)

Supabase free tier má přísný limit odeslaných e-mailů. Doporučujeme nastavit vlastní SMTP:

1. **Authentication → Emails** v Supabase dashboardu
2. Zapněte **Enable Custom SMTP** a vyplňte přihlašovací údaje zvoleného poskytovatele (např. Gmail App Password, Resend, SendGrid).

### Google OAuth (volitelné)

1. Vytvořte OAuth aplikaci v [Google Cloud Console](https://console.cloud.google.com).
2. V Supabase: **Authentication → Sign In / Providers → Google** — vložte Client ID a Client Secret.

---

## 2. Lokální spuštění

```bash
# 1. Přejděte do složky projektu
cd Databaza-projekt

# 2. Nainstalujte závislosti
npm install

# 3. Vytvořte soubor .env
cp .env.example .env
# Otevřete .env a doplňte SUPABASE_URL a SUPABASE_KEY

# 4. Spusťte vývojový server
npm run dev
```

Aplikace bude dostupná na **http://localhost:3000**.

> **macOS:** Pokud narazíte na chybu `connect EINVAL` při spuštění, příkaz `npm run dev` již obsahuje opravu (`TMPDIR=/tmp`) — není třeba nic měnit.

---

## Struktura `.env`

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_KEY=your-anon-public-key
```

---

## Dostupné příkazy

| Příkaz | Popis |
|---|---|
| `npm run dev` | Vývojový server s hot-reload |
| `npm run build` | Produkční build |
| `npm run preview` | Náhled produkčního buildu lokálně |
| `npm run generate` | Statický export |

---

## Uživatelské role

| Role | Oprávnění |
|---|---|
| `student` | Prohlížení zdrojů, vytváření a rušení vlastních rezervací |
| `admin` | Vše výše + správa zdrojů (přidání, úprava, smazání) |

Role se vybírá přímo při registraci. V databázi ji lze kdykoli změnit ručně:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'vas@email.com';
```

---

## Struktura projektu

```
Databaza-projekt/
├── app/                        # Zdrojový adresář (Nuxt 4 compat)
│   ├── assets/css/main.css     # Globální CSS + Tailwind direktivy
│   ├── components/
│   │   ├── AppNavBar.vue       # Navigační lišta
│   │   ├── ResourceCard.vue    # Karta zdroje v seznamu
│   │   ├── ReservationCard.vue # Karta rezervace v dashboardu
│   │   └── ui/                 # Generické UI komponenty
│   │       ├── AppButton.vue
│   │       ├── AppModal.vue
│   │       └── LoadingSpinner.vue
│   ├── composables/
│   │   ├── useProfile.ts       # Profil a role přihlášeného uživatele
│   │   ├── useResources.ts     # CRUD operace nad zdroji
│   │   └── useReservations.ts  # CRUD + detekce kolizí rezervací
│   ├── layouts/
│   │   ├── auth.vue            # Layout pro přihlášení / registraci
│   │   └── default.vue         # Hlavní layout s navigací
│   ├── middleware/
│   │   ├── auth.ts             # Přesměruje nepřihlášené na /login
│   │   └── admin.ts            # Přesměruje ne-adminy na /
│   ├── pages/
│   │   ├── index.vue           # Přesměrování podle stavu přihlášení
│   │   ├── login.vue           # Přihlášení
│   │   ├── register.vue        # Registrace s výběrem role
│   │   ├── dashboard.vue       # Moje rezervace
│   │   ├── resources/
│   │   │   ├── index.vue       # Seznam zdrojů + filtrování
│   │   │   └── [id].vue        # Detail zdroje + formulář rezervace
│   │   └── admin/
│   │       └── resources.vue   # Správa zdrojů (pouze admin)
│   └── types/index.ts          # TypeScript typy a konstanty
├── setup.sql                   # Kompletní SQL schéma pro Supabase
├── nuxt.config.ts
├── tailwind.config.ts
└── .env.example
```
