# Rezervační systém učeben a vybavení

Full-stack webová aplikace postavená na **Nuxt 4**, **Vue 3**, **Tailwind CSS** a **Supabase**.

---

## Požadavky

- Node.js 20+
- npm 10+ (nebo pnpm / yarn)
- Účet na [supabase.com](https://supabase.com) (bezplatný tier stačí)

---

## 1. Nastavení Supabase projektu

1. Přihlaste se na [app.supabase.com](https://app.supabase.com) a vytvořte nový projekt.
2. Přejděte do **SQL Editor** a spusťte celý obsah souboru `setup.sql`.
3. Zkopírujte si:
   - **Project URL** → `SUPABASE_URL`
   - **anon / public key** → `SUPABASE_KEY`
   
   Obě hodnoty naleznete v sekci **Project Settings → API**.

> **Vytvoření prvního admina:** Po registraci přes aplikaci spusťte v SQL Editoru:
> ```sql
> UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';
> ```

---

## 2. Lokální spuštění aplikace

```bash
# 1. Klonujte / stáhněte projekt
cd Databaza-projekt

# 2. Nainstalujte závislosti
npm install

# 3. Vytvořte soubor .env
cp .env.example .env
# Otevřete .env a doplňte hodnoty SUPABASE_URL a SUPABASE_KEY

# 4. Spusťte vývojový server
npm run dev
```

Aplikace bude dostupná na **http://localhost:3000**.

---

## Struktura souboru `.env`

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_KEY=your-anon-public-key
```

---

## Dostupné příkazy

| Příkaz | Popis |
|---|---|
| `npm run dev` | Spustí vývojový server s hot-reload |
| `npm run build` | Sestaví produkční build |
| `npm run preview` | Spustí náhled produkčního buildu |
| `npm run generate` | Vygeneruje statický export |

---

## Struktura projektu

```
Databaza-projekt/
├── app/                        # Zdrojový adresář (Nuxt 4)
│   ├── assets/css/main.css     # Globální CSS + Tailwind direktivy
│   ├── components/             # Sdílené Vue komponenty
│   │   ├── AppNavBar.vue
│   │   ├── ResourceCard.vue
│   │   ├── ReservationCard.vue
│   │   └── ui/                 # Generické UI primitiv
│   ├── composables/            # Logika komunikace se Supabase
│   │   ├── useProfile.ts
│   │   ├── useResources.ts
│   │   └── useReservations.ts
│   ├── layouts/                # Layouty stránek
│   ├── middleware/             # Route middleware (auth, admin)
│   ├── pages/                  # File-based routing
│   └── types/index.ts          # TypeScript typy
├── setup.sql                   # Kompletní SQL pro Supabase
├── nuxt.config.ts
└── .env.example
```
