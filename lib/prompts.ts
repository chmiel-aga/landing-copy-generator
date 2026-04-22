import type { BrandProfile } from './brand-context'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LandingSection {
  id: string
  title: string
  body: string
  enabled: boolean
}

export interface GeneratedCopy {
  sections: LandingSection[]
  metaDescription: string
}

export interface ExpertOpinion {
  expert: string
  strengths: string
  critique: string
  recommendation: string
  targetElement: string
  conflictsWith: string[]
}

export type PanelVariant = 'service' | 'campaign' | 'premium'

// ─── 14-section structure ─────────────────────────────────────────────────────

export const LANDING_SECTION_DEFS: Array<{
  id: string
  title: string
  hint: string
  enabledByDefault: boolean
}> = [
  {
    id: 'hero',
    title: 'Hero',
    hint: 'Nagłówek główny (max 10 słów) + pod-nagłówek (1–2 zdania) + hero copy (2–3 zdania bijące w ból persony) + tekst przycisku CTA',
    enabledByDefault: true,
  },
  {
    id: 'problem',
    title: 'Problem',
    hint: 'Lustro użytkownika — konkretne momenty, myśli i emocje. Musi wywoływać "to o mnie". 3–5 zdań.',
    enabledByDefault: true,
  },
  {
    id: 'consequences',
    title: 'Konsekwencje braku zmiany',
    hint: 'Co się stanie za miesiąc / pół roku bez działania. Ukryte koszty (czas, pieniądze, relacje). Zbuduj napięcie bez katastrofizmu. 3–4 zdania.',
    enabledByDefault: true,
  },
  {
    id: 'promise',
    title: 'Obietnica / Rozwiązanie',
    hint: 'Przed vs po. Mechanizm działania. Czas do pierwszych efektów. Co wyróżnia ofertę. 4–5 zdań.',
    enabledByDefault: true,
  },
  {
    id: 'offer',
    title: 'Co dokładnie zawiera oferta',
    hint: 'Konkret: co dostaje użytkownik, forma materiałów, czas realizacji, rdzeń vs bonusy. Wypunktowane lub krótkie bloki.',
    enabledByDefault: true,
  },
  {
    id: 'fit',
    title: 'Dla kogo / Dla kogo nie',
    hint: 'Kto odniesie największą wartość i na jakim etapie. Kto może się rozczarować. Dwie czytelne części: TAK / NIE.',
    enabledByDefault: true,
  },
  {
    id: 'proof',
    title: 'Dowody (social proof)',
    hint: 'Wyniki klientów, przed i po, obawy z początku, liczby. Jeśli brak — doświadczenie autora. Użyj [PLACEHOLDERÓW] dla brakujących danych.',
    enabledByDefault: true,
  },
  {
    id: 'author',
    title: 'Autor / Marka',
    hint: 'Dlaczego zajmujesz się tematem, doświadczenie praktyczne, co widzisz inaczej niż inni, dlaczego zaufać właśnie Tobie. 3–4 zdania.',
    enabledByDefault: true,
  },
  {
    id: 'objections',
    title: 'Obiekcje (w trakcie strony)',
    hint: 'Najczęstsze wątpliwości zanim kliknięcie. Wpleć w narrację lub krótkie bloki. 3–5 obiekcji z odpowiedziami.',
    enabledByDefault: true,
  },
  {
    id: 'cta_main',
    title: 'Call to Action (główne)',
    hint: 'Co stanie się po kliknięciu, ile zajmie. Tekst przycisku (max 5 słów). Krótkie uzasadnienie decyzji. 2–3 zdania.',
    enabledByDefault: true,
  },
  {
    id: 'risk',
    title: 'Redukcja ryzyka',
    hint: 'Czego użytkownik boi się najbardziej. Jak zmniejszyć ryzyko (gwarancja, próbka, jasne warunki). Co pokazuje, że to bezpieczna decyzja. 2–3 zdania.',
    enabledByDefault: true,
  },
  {
    id: 'urgency',
    title: 'Pilność',
    hint: 'TYLKO jeśli jest realny powód — co się kończy lub ogranicza, dlaczego teraz. Bez sztucznych timerów. Jeśli brak powodu — zostaw puste body.',
    enabledByDefault: false,
  },
  {
    id: 'cta_repeat',
    title: 'Powtórzenie CTA',
    hint: 'Krótkie domknięcie narracji (1–2 zdania) + tekst CTA. Spójne z całą stroną, bez nowych informacji.',
    enabledByDefault: true,
  },
  {
    id: 'faq',
    title: 'FAQ',
    hint: 'Pytania tuż przed kliknięciem: czas, format, dostęp, "czy to dla mnie", co jeśli nie zadziała, wsparcie. Min. 6 par Q&A.',
    enabledByDefault: true,
  },
]

// ─── Panel config ─────────────────────────────────────────────────────────────

export const PANEL_CONFIG: Record<
  PanelVariant,
  { label: string; when: string; experts: { name: string; school: string }[] }
> = {
  service: {
    label: 'Wariant A — Usługi / Kursy',
    when: 'Domyślny. Landing page usługowy, kursowy, B2B.',
    experts: [
      { name: 'David Ogilvy', school: 'Klasyczna precyzja i badania konsumenckie' },
      { name: 'Gary Halbert', school: 'Bezpośredniość i emocjonalny hak' },
      { name: 'Joe Sugarman', school: 'Slippery slide i psychologia czytania' },
      { name: 'Eugene Schwartz', school: 'Poziomy świadomości i masa pragnienia' },
      { name: 'Claude Hopkins', school: 'Konkretne dowody i testowanie' },
    ],
  },
  campaign: {
    label: 'Wariant B — Kampanie reklamowe',
    when: 'Krótki format. Ruch z Meta, Google lub LinkedIn.',
    experts: [
      { name: 'Eugene Schwartz', school: 'Poziomy świadomości i masa pragnienia' },
      { name: 'John Caples', school: 'Testowanie nagłówków i ciekawość' },
      { name: 'David Ogilvy', school: 'Klasyczna precyzja i badania konsumenckie' },
      { name: 'Dan Kennedy', school: 'Direct response w nowoczesnym formacie' },
      { name: 'Robert Collier', school: 'Dołączanie do wewnętrznej rozmowy czytelnika' },
    ],
  },
  premium: {
    label: 'Wariant C — Premium / Wizerunkowy',
    when: 'Marka premium. Elegancja ważniejsza niż agresja sprzedażowa.',
    experts: [
      { name: 'David Ogilvy', school: 'Klasyczna precyzja i badania konsumenckie' },
      { name: 'Eugene Schwartz', school: 'Poziomy świadomości i masa pragnienia' },
      { name: 'Bill Bernbach', school: 'Big idea i kreatywna perswazja' },
      { name: 'Leo Burnett', school: 'Storytelling i archetypy' },
      { name: 'Tony Abbott', school: 'Brytyjski minimalizm i elegancja' },
    ],
  },
}

// ─── Copy utilities ───────────────────────────────────────────────────────────

export function formatCopyAsText(copy: GeneratedCopy): string {
  const sections = copy.sections
    .map((s) => `## ${s.title}${!s.enabled ? ' [wyłączona]' : ''}\n${s.body}`)
    .join('\n\n')
  return `${sections}\n\nMETA OPIS: ${copy.metaDescription}`
}

// ─── Brand system prompt ──────────────────────────────────────────────────────

export function buildBrandSystemPrompt(profile: BrandProfile): string {
  const toneList =
    (profile.toneOfVoice?.length ?? 0) > 0 ? profile.toneOfVoice.join(', ') : 'nie określono'
  const preferredWords =
    (profile.vocabulary?.preferred?.length ?? 0) > 0
      ? profile.vocabulary.preferred.join(', ')
      : 'brak ograniczeń'
  const avoidedWords =
    (profile.vocabulary?.avoided?.length ?? 0) > 0 ? profile.vocabulary.avoided.join(', ') : 'brak'

  return `Jesteś ekspertem od copywritingu tworzącym treści dla konkretnej marki. Poniżej pełny profil tej marki — traktuj go jako swoją konstytucję twórczą.

## ARCHETYP MARKI
Archetyp: ${profile.archetype || 'nie określono'}
${profile.archetypeDescription ? `Opis w kontekście tej marki: ${profile.archetypeDescription}` : ''}

## DOCELOWA PERSONA
${profile.targetPersona || 'Nie określono. Pisz do szerokiej, profesjonalnej grupy odbiorców.'}

## TON GŁOSU
${toneList}

## ESENCJA MARKI
${profile.brandEssence || 'Nie określono.'}

## SŁOWNICTWO
Używaj: ${preferredWords}
Unikaj: ${avoidedWords}
${profile.additionalContext ? `\n## DODATKOWY KONTEKST\n${profile.additionalContext}` : ''}

## ZASADY OBOWIĄZKOWE
1. Każde zdanie musi odzwierciedlać archetyp i ton głosu marki
2. Pisz bezpośrednio do persony — używaj "Ty", "Twój", "Tobie"
3. Stosuj preferowane słownictwo, bezwzględnie unikaj słów z listy zakazanych
4. Wszystkie treści WYŁĄCZNIE po polsku
5. Bądź konkretny — zero ogólników i korporacyjnego żargonu
6. Skup się na wartości i transformacji dla odbiorcy, nie na cechach produktu
7. Długości: Hero — nagłówek max 10 słów; sekcje narracyjne — 3–5 zdań; FAQ — min. 6 par Q&A`
}

// ─── Generation format ────────────────────────────────────────────────────────

export function buildGenerationSystemInstructions(): string {
  return `## FORMAT ODPOWIEDZI
Odpowiadaj WYŁĄCZNIE poprawnym JSON — bez tekstu przed ani po, bez markdown.

Wygeneruj 14 sekcji. Body każdej: 2–3 zdania (FAQ — 4 pary Q&A, Obiekcje — 3 krótkie bloki). Zachowaj "id" i "enabled" dokładnie jak poniżej.

{
  "sections": [
    { "id": "hero",         "title": "Hero",                        "body": "nagłówek + podtytuł + hero copy + tekst CTA",           "enabled": true },
    { "id": "problem",      "title": "Problem",                     "body": "lustro — konkretne momenty, myśli, emocje persony",      "enabled": true },
    { "id": "consequences", "title": "Konsekwencje braku zmiany",   "body": "co się stanie bez działania, ukryte koszty",             "enabled": true },
    { "id": "promise",      "title": "Obietnica / Rozwiązanie",     "body": "przed vs po, mechanizm, czas pierwszych efektów",        "enabled": true },
    { "id": "offer",        "title": "Co dokładnie zawiera oferta", "body": "co dostaje użytkownik, forma, czas, rdzeń vs bonusy",    "enabled": true },
    { "id": "fit",          "title": "Dla kogo / Dla kogo nie",     "body": "dwie części: TAK (kto zyska) / NIE (kto się rozczaruje)","enabled": true },
    { "id": "proof",        "title": "Dowody (social proof)",       "body": "wyniki lub doświadczenie autora, [PLACEHOLDER] opinie",  "enabled": true },
    { "id": "author",       "title": "Autor / Marka",               "body": "dlaczego się tym zajmujesz, co widzisz inaczej",         "enabled": true },
    { "id": "objections",   "title": "Obiekcje (w trakcie strony)", "body": "3 obiekcje z krótkimi odpowiedziami",                    "enabled": true },
    { "id": "cta_main",     "title": "Call to Action (główne)",     "body": "co stanie się po kliknięciu + tekst przycisku CTA",      "enabled": true },
    { "id": "risk",         "title": "Redukcja ryzyka",             "body": "główna obawa użytkownika i jak ją adresować",            "enabled": true },
    { "id": "urgency",      "title": "Pilność",                     "body": "",                                                       "enabled": false },
    { "id": "cta_repeat",   "title": "Powtórzenie CTA",             "body": "krótkie domknięcie + tekst CTA",                         "enabled": true },
    { "id": "faq",          "title": "FAQ",                         "body": "4 pary Q&A: czas, format, dostęp, co jeśli nie zadziała","enabled": true }
  ],
  "metaDescription": "meta opis max 160 znaków"
}`
}

// ─── User prompt ──────────────────────────────────────────────────────────────

export function buildUserPrompt(
  pageType: string,
  pageGoal: string,
  brief?: string,
  ownDraft?: string,
): string {
  const typeLabels: Record<string, string> = {
    launch: 'Landing page launchu produktu/usługi',
    'lead-gen': 'Landing page generowania leadów',
    'product-feature': 'Landing page funkcji produktu',
    webinar: 'Landing page webinaru lub wydarzenia',
    'free-trial': 'Landing page bezpłatnego okresu próbnego',
    'case-study': 'Landing page case study',
  }
  const typeLabel = typeLabels[pageType] ?? pageType

  if (ownDraft?.trim()) {
    return `Typ strony: **${typeLabel}**

CEL STRONY:
${pageGoal}
${brief ? `\nBRIEF PROJEKTU:\n${brief}\n` : ''}
WŁASNY DRAFT DO ULEPSZENIA:
---
${ownDraft}
---

Ulepsz ten draft: rozpisz go na 14 sekcji landing page zgodnie z profilem marki. Zachowaj intencję i kluczowe informacje autora. Odpowiedz wyłącznie JSON.`
  }

  return `Stwórz copy na: **${typeLabel}**

CEL STRONY:
${pageGoal}
${brief ? `\nBRIEF PROJEKTU:\n${brief}\n` : ''}
Wygeneruj pełne copy dla wszystkich 14 sekcji landing page, zgodne z profilem marki. Odpowiedz wyłącznie JSON.`
}

// ─── Panel critique ───────────────────────────────────────────────────────────

export function buildPanelCritiquePrompt(
  copy: GeneratedCopy,
  panelVariant: PanelVariant,
  round: number,
  previousExpert?: string,
): string {
  const copyText = formatCopyAsText(copy)
  const experts = PANEL_CONFIG[panelVariant].experts
  const roundNote =
    round > 1 && previousExpert
      ? `To jest runda ${round}. W poprzedniej rundzie wdrożono radę ${previousExpert}. Oceń aktualną wersję i wskaż, co jeszcze warto poprawić.`
      : `To jest runda 1 — pierwsza ocena draftu.`
  const expertList = experts.map((e, i) => `${i + 1}. ${e.name} (szkoła: ${e.school})`).join('\n')

  return `Jesteś moderatorem panelu ekspertów od copywritingu. Zebrałeś opinie 5 mistrzów na temat poniższego landing page'a.

TEKST DO OCENY:
---
${copyText}
---

${roundNote}

Poproś każdego z tych 5 copywriterów o ocenę ze swojej perspektywy:
${expertList}

Każdy ekspert wskazuje: mocne strony, główny problem, i jedną konkretną rekomendację do wdrożenia.

WAŻNE: dla każdej rekomendacji określ:
- "targetElement": który element copy dotyczy (np. "hero", "problem", "CTA", "FAQ")
- "conflictsWith": tablica imion ekspertów, których rekomendacja dotyczy TEGO SAMEGO elementu i jest SPRZECZNA. Jeśli brak konfliktu, zostaw pustą tablicę.

Odpowiadaj WYŁĄCZNIE poprawnym JSON bez żadnego tekstu przed ani po:
{
  "opinions": [
    {
      "expert": "Imię i nazwisko",
      "strengths": "Co działa dobrze (1-2 zdania)",
      "critique": "Główny problem lub słabość (1-2 zdania)",
      "recommendation": "Konkretna rada — co dokładnie zmienić i jak (2-3 zdania)",
      "targetElement": "np. hero",
      "conflictsWith": []
    }
  ]
}

Pisz po polsku. Każda ocena musi różnić się perspektywą i być konkretna.`
}

// ─── Implement feedback ───────────────────────────────────────────────────────

export function buildImplementFeedbackPrompt(
  copy: GeneratedCopy,
  expertName: string,
  recommendation: string,
): string {
  const copyText = formatCopyAsText(copy)
  return `Wdróż poniższą rekomendację eksperta w landing page'u.

AKTUALNY TEKST:
---
${copyText}
---

REKOMENDACJA DO WDROŻENIA (${expertName}):
${recommendation}

Wdróż tę rekomendację. Ulepsz tylko odpowiednie sekcje. Zachowaj WSZYSTKIE sekcje (włącznie z wyłączonymi), ich "id", "enabled" i kolejność.

Odpowiedz WYŁĄCZNIE poprawnym JSON — bez tekstu przed ani po, bez markdown. Format:
{"sections":[{"id":"...","title":"...","body":"...","enabled":true}],"metaDescription":"..."}`
}

// ─── Contextual correction ────────────────────────────────────────────────────

export function buildContextualCorrectionPrompt(
  copy: GeneratedCopy,
  mediumContext: string,
): string {
  const copyJson = JSON.stringify(copy)
  return `Popraw ten landing page pod kątem nowoczesnego kontekstu digital.

KONTEKST MEDIUM:
${mediumContext}

COPY DO KOREKTY (JSON):
${copyJson}

Wykonaj korektę zawartości pól "title", "body" i "metaDescription":
1. Usuń archaizmy stylistyczne i styl direct mail z lat 60.
2. Dostosuj długość do medium (mobile-first = krótsze akapity, skanowalne nagłówki)
3. Dopasuj język do polskiego rynku 2026 — naturalny, konwersacyjny, bez korporacyjnego żargonu
4. Upewnij się, że CTA jest jasne i widoczne w kluczowych momentach
5. Zachowaj substancję wszystkich poprzednich zmian wprowadzonych przez panel ekspertów

Zachowaj WSZYSTKIE sekcje (włącznie z wyłączonymi), ich "id", "enabled" i kolejność bez zmian.

Odpowiedz WYŁĄCZNIE poprawnym JSON w identycznej strukturze jak wejściowy — bez tekstu przed ani po, bez markdown.`
}

// ─── Suggest goal ─────────────────────────────────────────────────────────────

export function buildSuggestGoalPrompt(brief: string, pageType: string): string {
  const typeLabels: Record<string, string> = {
    launch: 'strony launchu produktu/usługi',
    'lead-gen': 'strony generowania leadów',
    'product-feature': 'strony funkcji produktu',
    webinar: 'strony webinaru lub wydarzenia',
    'free-trial': 'strony bezpłatnego okresu próbnego',
    'case-study': 'strony case study',
  }
  const typeLabel = typeLabels[pageType] ?? pageType

  return `Na podstawie poniższego briefu zaproponuj cel dla ${typeLabel}.

Cel powinien opisywać: co konkretnie użytkownik ma zrobić (CTA), jaką wartość lub transformację otrzyma, dla kogo jest ta oferta. Maks. 4–5 zdań. Pisz po polsku. Odpowiedz tylko samym tekstem celu — bez wstępu, tytułu ani komentarzy.

BRIEF:
${brief}`
}

// ─── Static data ──────────────────────────────────────────────────────────────

export const LANDING_PAGE_TYPES = [
  { value: 'launch', label: 'Strona Launchu' },
  { value: 'lead-gen', label: 'Generowanie Leadów' },
  { value: 'product-feature', label: 'Funkcja Produktu' },
  { value: 'webinar', label: 'Webinar / Wydarzenie' },
  { value: 'free-trial', label: 'Bezpłatny Okres Próbny' },
  { value: 'case-study', label: 'Case Study' },
]

export const BRAND_ARCHETYPES = [
  'The Hero (Bohater)',
  'The Caregiver (Opiekun)',
  'The Rebel (Buntownik)',
  'The Sage (Mędrzec)',
  'The Innocent (Niewinny)',
  'The Explorer (Odkrywca)',
  'The Creator (Twórca)',
  'The Ruler (Władca)',
  'The Magician (Czarodziej)',
  'The Lover (Kochanek)',
  'The Jester (Wesołek)',
  'The Everyman (Zwykły Człowiek)',
]

export function defaultPanelVariant(pageType: string): PanelVariant {
  if (pageType === 'free-trial' || pageType === 'lead-gen') return 'campaign'
  return 'service'
}
