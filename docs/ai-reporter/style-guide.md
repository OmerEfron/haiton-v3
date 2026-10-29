# מדריך סגנון: הכתב של חייטון

Why this exists: Haiton turns small personal events into news-style stories. The AI reporter interviews the user, the AI editor writes the story. Both must sound like Israeli newsroom people, not like a translated chatbot.

Sources: 673 headline/sub pairs from ynet, Walla, mako, Haaretz RSS (collected by `corpus/collect.mjs` into `corpus/feeds.json`), 40 full ynet bodies (`corpus/bodies.json`), and 70 real push notifications (`corpus/pushes.csv`).

Known gaps (honest limits):
- Sport5, ONE and Kan blocked automated fetch (HTTP 500 / Cloudflare). Sports voice comes from ynet sport, Walla sport and the 22 sports pushes, which include Sport5/ONE/Sport 1 headlines.
- Plan 2 added 200 full ynet bodies and 20 real interviews (135 Q&A pairs, `corpus/interviews.json`), all from ynet, so interviewer moves reflect celebrity and human-interest interviews, not private-life chat. Article types and their structures: [article-types.md](article-types.md). The sections below describe the default `feature` shape; other types override it.
- The pushes are mostly politics/security (election week). We take the structure, not the topic or the harshness.

## 1. Numbers measured from the corpus

| Format | Median | p90 | Max | Notes |
|---|---|---|---|---|
| Push (n=69) | 54 chars / 9 words | 75 chars / 13 words | 93 chars / 16 words | News 50 chars median, sports 61 |
| Headline (n=673) | 59 chars | 74 chars | 126 chars | |
| ynet flash (n=30) | 56 chars | 72 chars | 75 chars | |
| RSS sub (n=639) | 214 chars | 376 chars | | These are long ledes. Haiton subs are shorter, see targets. |

Frequencies (some inflated, see notes):
- Zero pushes and zero headlines end with a period.
- Push contains a quote: 56% (news 60%, sports 50%).
- Push has the "X: Y" shape: news about 50%, sports about 80%. Inflated for sports by labels like "מחצית:" and "ישיר בספורט3:".
- Question hook: push 9%, headline 11%.
- Headline opens with a quote: 11%.
- Digits in push: 22%, much more in sports (scores like 66:78, 1:0).

Haiton targets (what the editor must output, and what the eval checks):

| Field | Chars | Words |
|---|---|---|
| headline | 35-90 | 6-14 |
| sub | 45-180 | |
| flash (ticker) | 25-80 | 5-13 |
| push | 20-90 | 4-15 |
| body | 2-4 short paragraphs, one idea each | |

## 2. Headline grammar

- No final period. Ever. Question mark and closing quote are fine.
- The workhorse is "X: Y" (colon). Left side is the hook or the setup, right side is the news. Examples from the corpus: "20 שנה אחרי שנפל בהופעה: ירמי קפלן הוכר כנפגע עבודה", "הקטל בכבישים: רוכב קורקינט נהרג".
  - Left side types: time distance ("20 שנה אחרי..."), a label word ("דרמה", "בלעדי"), a number, or a scene.
- Dash form " - " adds the twist after the fact: "הכסף נעלם - והחשוד הוא השכן".
- Quote-led: the strongest line the person said, in quotes, then who said it. "אני נורמלי": ... Quotes in headlines are exact words from the person only.
- Tense: headline in past or noun phrase ("קנתה", "הבקיע", "שיא אישי"), present tense for ongoing ("חוזר הביתה"). Body in past tense. Never future unless it is an announced plan.
- Numbers as digits, with the unit the Israelis use: 100 ק"ג, 3 שנים, 40 דקות. Spell out numbers only in a quote when the person said it that way.
- Names: first name for private people (they are not public figures), first name plus last name on first mention in the body. The headline can use first name only if the group is small and everyone knows them; otherwise first and last.
- Sub-headline: one or two sentences that add what the headline held back, ideally with a short quote that ends the sub: `"...", היא מספרת`. Format of the seed articles: `"כל יום בדקתי שהיא עדיין שם", היא מספרת`.

## 3. Register

- Standard news Hebrew: short sentences, active verbs, concrete nouns. Not formal-bureaucratic ("הוחלט כי", "בהתאם ל") and not slangy.
- Slang and spoken Hebrew ("אחי", "וואלה", "פיצוץ") only inside a direct quote, and only if the user really said it.
- Hebrew news likes the dated anchor: "ביום חמישי", "אתמול בבוקר", "הערב (ראשון)". Use the weekday, not the date, for events in the last week.
- Sports register is its own voice: "הבקיע", "שיא אישי", "חצי מגרש", "קאמבק", "החמיץ", "העפיל". Use it when the event is physical or competitive (gym, football with friends, a run, a board game tournament). Scores and numbers go in as digits.
- Soft-news register (culture/lifestyle, ynet): a little warm, a little ironic, one image in the headline ("חולצה לבנה בחלון הראווה"), never gushing.
- Verbs carry the energy, not adjectives. Corpus pushes lean on single strong verbs: "נשברה", "מרגיע", "קורא", "חוטף", "חושף", "הצית".

## 4. Push and flash recipe

Recipe for the push (derived from the 70 real pushes):
1. One idea, 4-15 words, median about 9.
2. Pick the hook:
   - Quote: the person's sharpest line. `"אשתי לא האמינה": שלמה תיקן את הברז`
   - Colon: setup then news. `משמרת שקטה בתחנה: אף שיחה לא התקבלה`
   - Question (rare, 1 in 10): only when the answer is the story. `מי תיקן את הברז במטבח של שלמה?`
   - Teaser: hold back one detail. `מאיה והטחינה: האסון שלא התרחש`
3. Strong verb, no adjective stacks.
4. Never repeat the headline word for word. The push is a sharper, shorter angle on the same story.
5. No emojis, no exclamation marks, no clickbait that the story does not pay off.

Flash (ticker, shown in the feed): a plain factual one-liner in past tense, no colon needed, 25-80 chars. "מאיה כהן קנתה סוף סוף את החולצה הלבנה מהחלון". It must not duplicate the push.

Real examples to learn the shape (from `pushes.csv`):
- News: `"עברתי שנה מורכבת מאוד": מגישת ערוץ 14 נפרדת`
- News: `כטב"מים ביום הבחירות? ההנחיה של הרמטכ"ל`
- News: `בנט קרא לאיילה חסון "שקרנית גדולה" - היא לא נשארה חייבת`
- News: `הזכות להגיד לא לסקס, גם אחרי 20 שנות נישואים`
- News: `סוף להנחות שנעלמות: המהלך שישנה את פוליסת הביטוח`
- Sport: `"עוצר נשימה": הנתון שבו דניאל פרץ מוביל את הצ'מפיונשיפ`
- Sport: `שונא חוזר על הספסל: הרכבי ברצלונה וריאל מדריד לקלאסיקו`
- Sport: `ניצחון ראשון העונה לנס ציונה, 66:78 על הפועל העמק בחוץ`
- Sport: `קאריק: "סיטואציה קשה, לא יודע מה יהיה"`

Use them for structure only. Haiton content is warm and small, so the register stays light: tabloid tone ("היא לא נשארה חייבת", "לא נשאר חייב") is allowed only in the `dramatic` revision.

## 5. Interview behavior (the reporter)

Goal: feel like a local reporter on the phone with you, not a therapist and not a form.

Plan 2 update (see `prompts/reporter.md`): the reporter works a hidden angle (first time, number, wait, irony, other person, stakes) and every question tests it. Real questions measured in 20 ynet interviews: median 6 words, 29% at 4 words or fewer, 67% at 8 or fewer. The rules below still hold, with these changes: questions reuse a noun from the last answer, a question shape is never repeated, quote-seeking is done through "what did X say" or a reality check (no dedicated quote question, and "מה יצא לך מהפה" is now banned too), and the reply JSON carries a hidden `angle` and `articleType`.

Rules:
1. First message is already fixed by the API: `מה קרה?`. Do not re-ask it.
2. One short question per turn, 3-12 words, at most one question mark.
3. Chase the news hook in this order, skipping what the user already gave: the before, origin, constraint, near miss, contradiction, number, other person or quote. The second generated question must chase what the first answer left unresolved, not move to a checklist item.
4. React like a person in 1-4 words before the question, when it fits: "רגע, מחצי מגרש?", "וואו, ממש.", "חחח, לא.", "אוי." Not every turn. No "זה נשמע מרתק", "תודה ששיתפת".
5. Ask for something quotable once, tied to the scene and only if the user has not quoted anyone. About another person: "ומה היא אמרה?". Otherwise use a reality check that makes the user answer in their own words. Fixed stock phrases ("יש משפט שנשאר לך מזה?", "מה אמרת לעצמך?", "מה עבר לך בראש?", "מה יצא לך מהפה?") read as a form once they repeat across stories, so they are banned in the prompt. This is the quote source for the editor.
6. Never ask feeling-questions in therapy phrasing: "איך הרגשת?", "איך זה מרגיש?", "ספר/י עוד על הרגשות". If feelings are needed, ask for the behavior: "ומה עשית אחרי זה?".
7. Never invent a detail inside the question ("אז הבעל שלך צחק?" when no husband was mentioned).
8. The reporter asks at least 2 and at most 7 questions after the opener. `canDraft` is true only after the user has answered 2 of those questions, and the draft button stays hidden until then. The reporter keeps asking while a new concrete detail is still worth a line. If it only has a number plus a generic reaction, it asks one more angle-deepening question. Then `reply` becomes null (the UI stops the chat) or a short closer ("יש לי מספיק, אפשר לכתוב.").
9. If the user gives a very short or flat answer, ask a concrete follow-up, not an open one. "מה אכלת?" beats "ספר עוד".
10. Gender: address with the user's gender if known (profile `gender`). If unknown use infinitive or plural-neutral forms ("אז מה קרה אחר כך?" works for everyone). Never mix forms.

Bad vs good:
- Bad: "ואיך הרגשתם כשזה קרה?" Good: "ומה עשיתם מיד אחרי?"
- Bad: "איזה יופי. ספרו עוד, איך זה התחיל?" Good: "מתי זה התחיל, חודשיים?"
- Bad: "נשמע טעים. תגידי, אם זה היה נשפך עלייך, איך היית מגיבה?" Good: "ומה אכלת בסוף?"

## 6. Fact fidelity (editor)

- Only facts from the user's messages, the user's previous article, or the saved facts list (`facts`).
- Quotes are verbatim from the user, trimmed at most. A paraphrase never goes inside quotation marks.
- If the user gave no quote, the story has no quote. Do not invent one. Use a plain sentence instead.
- Numbers, names, places, relations are copied exactly.
- The reporter's reaction, jokes or the editor's own flavor never become facts.
- New facts discovered in the chat (a person's name, a place, a relation, a pet) go to `newFacts`; the user decides whether to save them.

## 7. Anti-robotic blacklist

The editor and the reporter must not use these. Treat any match as a failed eval.

Translationese and filler:
- "לקחת החלטה" (use "החליט"), "עשה זאת", "בסופו של יום", "זה היה מדהים/מרגש/מרתק", "אין ספק ש", "חשוב לציין ש", "בעולם של היום", "מסע" (journey), "רגע מרגש", "קסם", "חוויה בלתי נשכחת", "אחד מהדברים ש".
- "שיתפה/שיתף" as a verb for telling (use "סיפרה/סיפר"), "הרגישה שהיא..." stacks, "בואו נצלול".
- English calques: "זה לא היה על...", "להרגיש טוב עם", "סוג של", "חווה" for everything.

AI tells:
- Adjective stacks ("חם, מבהיל ומרגש").
- Three-part parallel lists used for rhythm.
- Ending with a moral or summary sentence ("וכך למדה ש...").
- Em dash. Use a comma, colon or hyphen with spaces as in the corpus.
- Exclamation marks, emojis, hashtags.
- Starting every sentence with the person's name.

Reporter tells:
- "תודה ששיתפת", "זה נשמע", "אני מבין/ה", "מעניין", "שאלה מצוינת".
- Any reply longer than 15 words.

## 8. Revision recipes (`RevisionKind`)

Each revision keeps the facts and rewrites style. Headline, sub, body, flash and push must all stay consistent.

| Kind | Hebrew label | What changes |
|---|---|---|
| `funnier` | מצחיק יותר | Dry deadpan newsroom humor, the funny comes from the understatement and the specific detail. Headline plays on the event: "הטחינה נפלה, החולצה שרדה". No jokes added from outside, no emoji, no "חחח". Body keeps a straight face. |
| `dramatic` | דרמטי יותר | Tabloid/weekend-supplement hook with a twist or time pressure: "האסון שלא קרה: הטחינה פספסה את מאיה בסנטימטרים". Strong verbs, one cliffhanger in the sub. Never claim danger that did not happen. |
| `restrained` | מאופק יותר | Wire-service tone: who, what, when, one fact per sentence. "משמרת שקטה לעמרי דהן אחרי שבוע עמוס". No quote in the headline, minimal adjectives. |
| `headline` | כותרת חדשה | Only the headline changes: another structure from section 2 (swap colon-form for quote-led or the other way). Same facts as before, never repeating the previous headline. |
| `alternate` | נוסח אחר | A full second version of headline, sub, body with a different lede angle (for example start from the quote, or from the number). |

## 9. Seed baseline (existing mock voice)

The seeded articles in `frontend/src/mocks/seed/haiton-data.js` already match this guide well and are used as few-shot examples:
- "אחרי חודש של מבטים בחלון הראווה: מאיה קנתה את החולצה הלבנה" (time anchor + colon).
- "שיא אישי בחדר הכושר: שחר הרים 100 קילו בסקוואט" (sports register).
- "אף אחד לא התקשר: המשמרת הכי משעממת של עמרי היא גם הכי טובה" (dry irony).

What the mocks get wrong, and the prompts fix: the reporter replies (therapy phrasing, invented details, 2 plural-form questions in a row) as listed in section 5.

## 10. Eval findings and decisions (3 runs, 20 scenarios, GPT-6.1 Sol vs GPT-6 Luna)

Final run (prompts with few-shots, judge: GPT-6 Astra, scale 1-5):

| Model | Israeli | Human | Hebrew | Gender | Story fidelity | Auto-checks pass |
|---|---|---|---|---|---|---|
| gpt-6.1-sol | 4.55 | 4.00 | 4.80 | 4.85 | 90% | 100% |
| gpt-6-luna | 4.55 | 4.15 | 4.75 | 4.60 | 75% | 90% |

What the runs changed:
1. First run scored fidelity 30-40%. Causes: the few-shot examples were also eval scenarios (the model copied them), and the reporter used "מה אמרת לעצמך" as a template. Fixed by new few-shots and the stock-phrase ban. I also split the judge's fidelity score into story fidelity and "question presumes", because the first judge failed stories over scripted-chat artifacts. Story fidelity then measured 85-90% for Sol, so the jump from 35% is partly the stricter-but-fairer rubric, not only the prompt.
2. Curly quotes and Hebrew gershayim (״) appeared as quotation marks: prompt now demands ASCII ", and an automatic check enforces it.
3. Stitched quotes (two sayings joined into one quote) are caught by the quote-verbatim check.
4. Prompt variants with and without few-shots scored the same on Sol (4.45 / 3.80-3.85 in run 2). Luna was safer with few-shots (auto-check 95% vs 75%). Decision: keep few-shots.

Decisions:
- Model: start with `gpt-6.1-sol` for both reporter and editor. Luna is cheaper and slightly more natural in questions but breaks gender and fidelity more often (for example "מצאתן" said to a single woman, invented "בשער"). Revisit Luna for the reporter only, once the profile has a gender field.
- Add a `gender` (male/female/unspecified) field to the user profile. With a unisex name (דנה, שרון) and no gendered words from the user, both models still guess. This was the weakest case in the eval.
- Fidelity is the main risk, not style. Keep the automatic quote check and show the user the draft before publishing (the draft screen already does).
- The scripted-user harness cannot answer the generated question, so reporter naturalness is only partly tested. Test with real chats before launch.
- Corpus has no true interview transcripts. If interviewer tone is still off in real use, collect 10-20 real Hebrew radio/print interview Q&As and add them as few-shots.

## 11. Plan 2 eval: article types and the interviewer (2 full runs, 26 scenarios)

Harness: the reporter talks to a simulated user (gpt-6-luna) that answers only what is asked from a hidden fact sheet and holds back one `buriedFact`. Reporter and editor: gpt-6.1-sol, judge: gpt-6-astra. Not comparable with section 10 (scripted turns, 20 scenarios; Sol human feel was 4.00 there). Raw results: `evals/out-v2a/` (run A) and `evals/out-v2b/` (run B). Older: `evals/out-v1/`.

| Run | Israeli | Human | Hebrew | Gender | Type fit | Interview | Fidelity | Buried fact | Type in expected | Questions avg | Draft checks | Reporter checks |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A: new prompts | 3.88 | 3.27 | 4.54 | 4.88 | 3.46 | 3.31 | 85% | 15% | 88% | 2.58 | 100% | 88% |
| B: `known`/`angle`/`target` written before `reply` | 3.92 | 3.31 | 4.54 | 4.88 | 3.38 | 3.04 | 88% | 19% | 92% | 2.62 | 100% | 88% |

Run B moved nothing beyond noise, so writing the angle before the reply (forced reasoning) is kept for structure but is not what fixes the interview. `type in expected` is 88-92%, the structure checks pass, and all 21 type and style revisions from 3 scenarios passed the checks.

What the chats show (read in `out/` and `out-v2a/`):
1. The interview is the weak part, not the editor. Interview score 3.0-3.3 and buried fact surfaced in only 15-19% of chats. The reporter's questions are on topic but low yield: in about half the chats it asks for a reaction ("ומה אמר/אמרו...?") and in 4-5 chats the same "מה גרם לך... דווקא עכשיו?". Both are shapes copied from the prompt's own examples and probes. The reporter rarely follows the surprising detail in the user's answer, and rarely asks "ומאיפה התחלת?" or "היה רגע ש...?" which would reach the buried facts.
2. Still some invented premises ("איזה שעון הוא מסרב לתקן?", "מה אחיך אמר כשראה את הידיים?"), and re-asks of what was said ("מתי הייתה לך לאחרונה משמרת שקטה?").
3. The simulated user answers "לא זוכר" to about a third of the questions. That is partly realistic, but it makes the stories thin and punishes the reporter for questions a real user could answer. Treat the absolute numbers as a lower bound and use the harness for before/after comparison only. Giving the simulated user a richer memory (about 8 facts, as the plan said, instead of the 3-4 scripted lines) is the first thing to change.
4. The editor, on thin chats, padded and restated the same fact in the sub, body and summary, put ongoing habits in past tense, and turned "נראה לי" into a flat "first ever". Fixed in `editor.md` after run A (run B shows the fidelity gain of about 3 points, not enough to claim).
5. Gender: 4.88. The unknown-gender scenarios still slip occasionally ("דנה שחר קנו" in one story).
6. Quote hygiene: the judge flagged a period before the closing quote ("..."., סיפר) in about 6 stories. Not caught by the automatic checks yet.

Decisions and next steps:
- Keep the type system and the per-type structures: they work mechanically. The ceiling is the interview.
- Next iteration, in this order: (a) richer fact sheets for the simulated user and rerun the same prompts for a fair baseline; (b) rewrite the reporter's probe list so each shape is used at most once per chat, which was added to `reporter.md` but not yet tested; (c) add a check for a period before a closing quote; (d) test with 10 real chats, since a simulated user cannot say whether a question feels like a real reporter.

## 12. Run C: richer memory, scene-first questions, tighter editor (26 scenarios)

Same harness and models as section 11. Changes since run B: each scenario has a `truth` scene sheet of 6 facts (`evals/scenarios.json`); the simulated user answers from it instead of defaulting to "לא זוכר"; the reporter asks about the stakes of the last concrete detail, drops a dead thread, and only changes type on the last turn in specific cases; the editor must not clone the summary into the sub or lede, must keep the hook in the flash, and must not put a period before a closing quote. The last two are now automatic checks. Raw results: `evals/out/`.

| Run | Israeli | Human | Hebrew | Gender | Type fit | Interview | Fidelity | Buried fact | Type in expected | Questions avg | Draft checks | Reporter checks |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| B (baseline) | 3.92 | 3.31 | 4.54 | 4.88 | 3.38 | 3.04 | 88% | 19% | 92% | 2.62 | 100% | 88% |
| C | 4.23 | 3.38 | 4.69 | 5.00 | 3.73 | 3.19 | 81% | 23% | 88% | 2.54 | 96% | 100% |

What moved, on the 1-5 scale:
- Israeli feel and type fit moved (3.92 to 4.23, 3.38 to 3.73). Sports reports and quirky pieces scored 4-5 on type fit. `column_train` was typed `column` (it was `feature` in run B). `orit_cake` and `profile_watch` stayed on `feature` and `profile` and the user actually answered the scene questions (no measurements in the diary; the watchmaker's line and the 7am opening).
- Human feel and interview quality did not move past noise (3.31 to 3.38, 3.04 to 3.19). The buried fact surfaced in 23% of chats, up from 19%. The reporter still does not aim the second question at what the first answer left at stake.
- Story fidelity fell to 81%. A richer memory gives the editor more facts to overstate.
- Reporter automatic checks went from 88% to 100%. One draft (`terse_bike`) failed the new "sub or lede copies the summary" check. Gender was 5.00 on this run; one run is not a fix for unisex names.

Still open: interview quality. The next useful test is 10 real chats. The simulated user can no longer explain a low score by stonewalling.
