# Empatify — AI Landing Page Copy Generator

Aplikacja webowa generująca copy na landing page'e z wykorzystaniem API Claude. Użytkownik definiuje profil marki, podaje brief, a system generuje 14-sekcyjny copy, który przechodzi przez panel ekspertów (copywriterzy-legendy) i weryfikację końcową.

## Stack

- **Framework:** Next.js 14.2, React 18, TypeScript
- **Styling:** Tailwind CSS 3, PostCSS
- **AI:** Anthropic Claude API (`@anthropic-ai/sdk ^0.37.0`)
- **Pliki:** mammoth (docx→tekst), pdf-parse, docx (generowanie docx)
- **State:** localStorage (profile marki), React state (flow generowania)

## Struktura projektu

```
empatify/
├── app/
│   ├── api/             # Endpointy API (generowanie, panel, korekta)
│   ├── setup/           # Konfiguracja profilu marki
│   ├── page.tsx         # Główna strona — 3-krokowy flow
│   ├── layout.tsx       # Root layout
│   └── globals.css      # Tailwind globals
├── components/
│   ├── BrandProfileForm.tsx   # Formularz profilu marki
│   ├── LandingPageForm.tsx    # Formularz projektu (typ, cel, brief)
│   ├── CopyOutput.tsx         # Podgląd wygenerowanego copy (prawy panel)
│   ├── ExpertPanel.tsx        # Panel 5 ekspertów-copywriterów
│   ├── FinalVerification.tsx  # Korekta kontekstowa + checklist
│   └── DocumentUpload.tsx     # Upload briefu (docx/pdf)
├── lib/
│   ├── brand-context.ts   # Profil marki: typy, CRUD, localStorage, migracja
│   ├── claude.ts          # Klient Anthropic SDK
│   ├── prompts.ts         # Wszystkie prompty, typy, konfiguracja panelu
│   └── export.ts          # Eksport copy do pliku
├── .env.local             # ANTHROPIC_API_KEY
└── .claude/
    ├── launch.json
    └── settings.local.json
```

## Architektura aplikacji

### Flow użytkownika (3 kroki w akordeonach)

1. **Informacje o projekcie** → typ strony + cel + brief (opcjonalnie upload docx/pdf) → generowanie copy
2. **Panel Ekspertów** → 5 copywriterów ocenia draft → użytkownik wybiera rekomendację → iteracja
3. **Weryfikacja końcowa** → korekta kontekstowa (mobile-first, język 2026) + checklist

### Profil marki (brand-context.ts)

- Archetyp (12 archetypów Junga)
- Opis archetypu w kontekście marki
- Persona docelowa
- Ton głosu (tablica)
- Słownictwo: preferowane / zakazane
- Esencja marki
- Dodatkowy kontekst
- Multi-profil: localStorage z migracją, przełączanie, CRUD
- Completeness score: 5 kryteriów

### 14 sekcji landing page (prompts.ts)

hero → problem → konsekwencje → obietnica → oferta → dla kogo/nie → dowody → autor → obiekcje → CTA główne → redukcja ryzyka → pilność (domyślnie OFF) → powtórzenie CTA → FAQ

### Panel ekspertów — 3 warianty

- **service** (domyślny): Ogilvy, Halbert, Sugarman, Schwartz, Hopkins
- **campaign** (lead-gen, free-trial): Schwartz, Caples, Ogilvy, Kennedy, Collier
- **premium** (marka premium): Ogilvy, Schwartz, Bernbach, Burnett, Abbott

Każdy ekspert daje: mocne strony, krytykę, rekomendację + targetElement + conflictsWith.

### Prompty (prompts.ts)

- `buildBrandSystemPrompt()` — system prompt z profilem marki
- `buildUserPrompt()` — generowanie copy (lub ulepszanie własnego draftu)
- `buildPanelCritiquePrompt()` — panel ekspertów z rundami iteracji
- `buildImplementFeedbackPrompt()` — wdrożenie wybranej rekomendacji
- `buildContextualCorrectionPrompt()` — korekta końcowa (mobile-first, język PL 2026)
- `buildSuggestGoalPrompt()` — sugestia celu na podstawie briefu

## Typy stron

launch | lead-gen | product-feature | webinar | free-trial | case-study

## Konwencje

- Cały UI i prompty po polsku
- Odpowiedzi AI wyłącznie jako JSON (parsowane client-side)
- Copy zawsze w formacie `GeneratedCopy { sections: LandingSection[], metaDescription }`
- Sekcje zachowują id, enabled, kolejność przez wszystkie iteracje
- [PLACEHOLDER] dla brakujących danych (np. opinie klientów)

## Uruchomienie

```bash
cp .env.local.example .env.local  # dodaj ANTHROPIC_API_KEY
npm install
npm run dev
```

## Znane ograniczenia / TODO

- State trzymany w localStorage — brak backendu/bazy danych
- Brak autosave wygenerowanego copy (tylko profil marki się zapisuje)
- Panel ekspertów — brak zapisywania historii iteracji
