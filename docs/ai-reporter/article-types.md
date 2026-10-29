# סוגי כתבות בחייטון (Article types)

Each Haiton story has one `articleType`. The reporter picks it during the interview (with a hidden `angle`), the editor writes in that type's structure, and the user can switch it on the draft screen.

## 1. How the list was derived

- 200 full ynet bodies (news, sport, economy, entertainment, digital, health, parents, food, wellness, judaism, activism), each labelled by GPT with an open-ended type (no list given), lede type, paragraph roles, quote share and positions, kicker, voice. Files: `corpus/classified.json`, clustered into `corpus/types.json` (9 clusters).
- 20 real interviews (135 question-and-answer pairs) from the same pull: `corpus/interviews.json`.
- Short forms (flash, "story in a minute") come from 60 ynet/Walla feed items in `corpus/feeds.json`, since they have no long body.

Clusters from the corpus and what happened to them:

| Corpus cluster (n) | Fit for a small personal event (1-5) | Decision |
|---|---|---|
| reported_feature, "כתבת צבע ושטח" (21) | 2.5, the best | Kept: `feature` |
| profile_interview (21) | 2.0 | Split: `profile` (person is the spine) and `interview` (Q&A) |
| column_review (24) | 1.5 | Kept: `column` (first-person voice) |
| straight_news (33) | 1.5 | Dropped: `news_brief` made every story too short |
| match_report (7) | 1.4 | Kept: `sports_report` |
| document_based_report (16), initiative_testimonial (16), explainer_service (45), other (17) | 1.1-1.7 | Dropped: investigations, sponsored testimonials, how-to guides, recipes and fiction cannot carry a private life event honestly |
| (from feeds) flash | n/a | Dropped: a one-paragraph ticker cannot carry an interview |
| (from feeds) "סיפור בדקה" | n/a | Added: `quirky` |

"Dramatic news break" is not a separate type. The `dramatic` revision is that tone. Real flashes in the corpus are flat: ynet flash median 55 characters, no sub-headline.

Type ids: `feature`, `profile`, `interview`, `column`, `sports_report`, `quirky`. Default when unsure: `feature`.

## 2. Measured shape per type (corpus) and the Haiton scale

Real articles are long (median 9-27 paragraphs). Haiton stories keep the structure but run 3-5 paragraphs, at least 350 characters.

| Type | Corpus lede | Corpus quote share | Corpus kicker | Haiton body |
|---|---|---|---|---|
| feature | anecdote 6, hard fact 7, scene 5, quote 3 | 60% | quote 8 of 21 | 3-5 paragraphs |
| profile | anecdote 7, scene 5, hard fact 4 | 60% | reflection 7, none 7 | 3-5 paragraphs |
| interview | short intro, then Q&A | 100% (answers) | last answer | intro of 2 sentences plus every Q&A |
| column | anecdote 8, other 9 | 2% | reflection 10, twist 3 | 3-5 paragraphs, first person |
| sports_report | hard fact 7 of 7 (score) | 0% | fact 5 of 7 | 3-4 paragraphs |
| quirky | the odd detail | one line | none | 3-4 paragraphs |

## 3. The types

### feature (כתבת צבע)  [default]
- Fits when: the story is an experience or a small drama with a person, a detail and a quote: waited, tried, finally, a surprise, a reaction.
- Headline: "X: Y" where X is a time anchor or a scene ("אחרי חודשיים של טפטוף") or quote-led. Sub: the detail the headline held back, ending with a short quote.
- Lede: a scene or anecdote (not a summary). Order: scene/anecdote, the number or background, the quote, a last quote or fact as the kicker. Quotes appear early and in the middle (18 and 20 of 21 corpus pieces).
- Real: `לוחם שריון, וגנן בגן ילדים: "המשימה שלי היא לשמור עליהם"`, `"ב-1949 הביאו קופסת קרטון, וקראו לה קלפי": הוותיקים שמצביעים מקום המדינה`.
- Haiton: `אחרי חצי שנה של אימונים: שחר הרים 100 קילו בסקוואט`.

### profile (דיוקן)
- Fits when: the story is about who someone is, and the user talks about another person (a grandmother, a child, a neighbor), or about themselves in a trait-revealing moment.
- Headline: a quote from the subject plus the name, or "name: what defines them". Lede: an anecdote that shows the character, then a short bio line (age, role, relation), then quotes, kicker returns to the subject's outlook (reflection 7 of 21).
- Real: `גילתה באמצע החיים שהיא יהודייה: "הוריי פחדו שהשואה תקרה שוב"`.
- Haiton: `בת 90 ועדיין במטבח: סבתא של רונית הכריזה שהיא לא פורשת`.

### interview (ראיון, Q&A)
- Fits when: the user gave a lot of direct speech and several distinct beats, so the real questions and answers carry the story better than narration. Uses only the questions actually asked in the chat and the user's answers, trimmed.
- Headline: the sharpest answer as a quote, then the name. Sub: the setup. Body format: one paragraph of intro, then paragraphs where each string is `question?\nanswer` (the same line break the corpus uses). The questions are the reporter's questions, so the interview type must never use an invented question.
- Real (question shapes, see the reporter playbook): `יכול להיות שבעצם סינדלת את עצמך עם העברית, כדי להרשות לעצמך להיחשף?`
- Haiton: `"אמרתי לעצמי שאם היא תחכה עד סוף החודש, זה סימן": מאיה על החולצה`.

### column (טור אישי)
- Fits when: the user has an opinion, a joke or a reflection and the point of view is the story ("ככה אני רואה את זה"). First person as the user. The editor must not invent opinions.
- Headline: the claim or the confession. Lede: a short confession line ("שלום, אני נוסעת."), then the anecdote that earned the opinion, then the turn. Kicker: a reflection or a punchline (reflection 10, twist 3 of 24). Almost no quotation marks (2%).
- Real: `מעולם לא חלמתי על רילוקיישן, אבל אז פרצה המלחמה`, `מילה של מורה: זה השיעור הכי חשוב עבור הילדים שלכם`.
- Haiton: `הפעם האחרונה שאני מכינה שקשוקה כמו של אמא`.

### sports_report (דיווח ספורט והישג)
- Fits when: a score, a record, a time, a competition (a squat record, a 10K, a neighborhood league goal).
- Headline: the result with the number: "שיא אישי בחדר הכושר: ..." or "X:Y". Lede: the result and the number in the first sentence. Order: result, how it got there (the minute, the set, the weight), one quote late, closing with a fact or the next goal. Sports register: "הבקיע", "שיא אישי", "קאמבק".
- Real: `שני שערים בתוספת הזמן: הדרמה המטורפת של אינטר`.
- Haiton: `דודו הבקיע מחצי מגרש בליגת השכונה, שתי דקות לסיום`.

### quirky (סיפור בדקה)
- Fits when: the event is odd or absurd and told straight (a dog trick, a Zoom mistake, a sofa stuck in an elevator).
- Headline: "הדבר המוזר: מי עשה אותו", deadpan. Sub: the one detail that makes it funny. Body: 3-4 paragraphs, the odd detail in the first line, the reaction in the last. No jokes from the writer.
- Real: `החדשות בדקה | אוסטרליה: שר המשטרה צילם כבשה בזמן נהיגה - ונקנס`, `סיפור בדקה: הצעיר שריחף מעל העיר עם בלוני הליום לא מתחרט`.
- Haiton: `גיל שכח להשתיק בזום ושר באמבטיה בפני המחלקה`.

## 4. Event signals to type

| Signal in the chat | Type |
|---|---|
| One fact, or something that happened to someone else, with no stronger signal | feature |
| A wait, a first time, a surprise, a reaction from someone | feature |
| The person (not the event) is the story, a relative's trait | profile |
| Three or more vivid answers, several beats, user is talkative | interview |
| User has a view or a confession | column |
| A number, a score, a time, a record, a match | sports_report |
| An odd or absurd moment told lightly | quirky |
| Nothing clear | feature |

Tie-breakers: a number plus a competition beats everything (sports_report). An absurd detail with no real emotion is quirky, not feature. A strong quote from someone else plus a wait is feature. A talkative chat with 3+ vivid answers can be interview, but only if the questions asked were good ones.

## 5. How the editor and revisions use the type

- The editor gets `articleType` and the reporter's `angle` and follows the section of that type. Headline, sub and push must reflect the angle.
- `funnier`, `dramatic`, `restrained`, `headline`, `alternate` apply inside the type. `dramatic` is the news-break tone.
- A new revision `type` rewrites the same facts in another type. It must keep the facts and never turn on a quote the user did not say.

## 6. API contract change (frontend and mocks are a follow-up)

```ts
export type ArticleType = 'feature' | 'profile' | 'interview' | 'column' | 'sports_report' | 'quirky'

// ReporterTurn gains hidden fields, never shown to the user:
// (known and target are reasoning fields the model writes before the reply; keep them hidden or drop them in production)
export interface ReporterTurn { reply: string | null; canDraft: boolean; angle: string; articleType: ArticleType; known?: string; target?: string }

// Draft gains:
//   articleType: ArticleType
//   angle: string
// RevisionKind gains a typed variant:
export type Revision = { kind: RevisionKind } | { kind: 'type'; type: ArticleType }
```
