# "Describe it instead" AI lookup — Power Automate flow spec

Same shape as "TTP - Get Metrics Insights" — **manual → Compose → Run a
prompt → Response** — minus the Condition/Update item steps, since there's
no record to persist a result onto here. The full instructions/rules AND the
taxonomy for all four record types live in the flow's own AI Builder
**Prompt** as static text (branching on record type the same way
`getMetricsInsights` branches on scope), not built or sent client-side.

The browser doesn't call this flow directly — it calls a Cloudflare Worker
(see `../worker/`), which holds the flow's signed trigger URL as a secret and
forwards the request, the same way `top-talent-proxy` fronts Top Talent
Planner's flows. See `../worker/DEPLOY.md` for that side of the setup.

## 1. Trigger

**When an HTTP request is received.** Request body JSON schema — generate it
from this sample payload:

```json
{
  "entityType": "contacts",
  "conversation": [
    { "role": "user", "content": "She's an HR manager at an insurance broker, hires for the whole people team" },
    { "role": "assistant", "content": "{\"industry\":\"Insurance – Broking\",\"category\":[\"Human Resources & Recruitment\"],\"subcategory\":[],\"explanation\":null,\"question\":\"What specific HR roles has she hired for before?\"}" },
    { "role": "user", "content": "Mostly generalist HR advisors" }
  ]
}
```

- `entityType` — `"contacts"`, `"candidates"`, `"jobs"`, or `"companies"`.
  The prompt below reads this to pick which record-type rules apply.
- `conversation` — the running back-and-forth so far, oldest first.

No `taxonomy` field — the industries/categories list is static enough that
it's pasted directly into the Prompt as text (section 3) instead of sent on
every call.

## 2. Compose — bundle everything into one string

The "Run a prompt" step calls a saved AI Builder **Prompt** (built
separately in the Prompt builder UI) that — like the one behind
`getMetricsInsights` — defines a single input variable ("Text input"). So
Compose needs to bundle record type and the conversation into one
clearly-labelled string, which lands in that one variable. Switch Compose's
**Inputs** field to the expression editor (the `fx` icon) and paste:

```
concat(
  'Record type: ', triggerBody()?['entityType'],
  '

Conversation so far:
', join(
    select(
      triggerBody()?['conversation'],
      concat(if(equals(item()?['role'], 'user'), 'Consultant: ', 'Assistant: '), item()?['content'])
    ),
    '
'
  )
)
```

The blank lines inside the quotes are real line breaks — in the expression
editor, click inside the quotes and press Enter rather than typing `\n`.
`select()` maps each `{role, content}` conversation item to a "Consultant:
.../Assistant: ..." line, and the outer `join()` stitches them together —
no Apply to each loop needed.

## 3. Run a prompt

Open (or duplicate) the AI Builder Prompt this step points to — AI Builder →
Prompts, not the flow canvas — and set its body to the text below, GPT-4o,
default settings. It ends with a single **Text input** placeholder (same
pattern as `getMetricsInsights`'s "Data:" + input), which is where Compose's
whole bundled string goes:

```
You help recruitment consultants at Fuse Recruitment, an Australian agency, categorise records in Bullhorn. The record type for this request is given below — read only the rules for that record type and ignore the others.

You will be given a free-text description written by the consultant in their own words. The conversation may include earlier turns where you already asked a question and the consultant has now answered it.

You must choose values ONLY from the taxonomy given below. Never invent a value that is not listed.

TAXONOMY (JSON):
{"industries":["Insurance – Broking","Insurance – Claims & Service Providers","Insurance – Insurance Building & Restoration","Insurance – Insurer","Insurance – Underwriting","Insurance – Workers Compensation","Insurance – Other","Financial Services – Financial Planning","Financial Services – Investments","Financial Services – Mortgage Broking","Financial Services – Private Wealth","Financial Services – Superannuation","Financial Services – Other","Infrastructure – Power","Infrastructure – Transport","Infrastructure – Waste","Infrastructure – Water","Infrastructure – Other","Manufacturing & Operations – Logistics, Transport & Warehousing","Manufacturing & Operations – Other","FMCG – Food & Beverage","FMCG – Household & Personal Care","FMCG – Packaging","Health & Life Sciences – Biotech","Health & Life Sciences – Medical Device","Health & Life Sciences – Pharmaceutical","Health & Life Sciences – Supplements","Industrial & Heavy – Building Materials","Industrial & Heavy – Chemical","Industrial & Heavy – Electrical","Industrial & Heavy – Equipment & Machinery","Industrial & Heavy – Steel","Renewable Energy – Grid Battery Storage","Renewable Energy – Hydropower","Renewable Energy – Solar","Renewable Energy – Wind","Renewable Energy – Other","Trades & Services – Construction","Trades & Services – Electrical","Trades & Services – Facades","Trades & Services – Maintenance","Trades & Services – Plumbing","Trades & Services – Other","Technology – Education","Technology – Financial Services","Technology – Infrastructure","Technology – Insurance","Technology – IT Services","Technology – Manufacturing & Operations","Technology – Renewable Energy","Technology – Retail","Technology – Superannuation","Technology – Utilities","Technology – Other"],"categories":[{"name":"NEW: Accounting & Finance","subs":["Accounts Payable","Account Receivable / Credit Control","Payroll","Assistant Accountants","Financial & Management Accounting","Audit (Internal / External)","Taxation","Treasury","Risk & Compliance","Contracts Management","Other"]},{"name":"NEW: Administration & Business Support","subs":["Administrative Assistants","Contracts Administration","Client & Sales Administration","Data Entry & Word Processing","Legal","Office Management","PA EA & Secretarial","Receptionists","Records Management & Document Control","Risk & Compliance","Other"]},{"name":"NEW: Call Centre & Customer Service","subs":["Collections","Customer Service – Call Centre","Customer Service – Customer Facing","Inbound Sales","Outbound Sales","Team Leaders / Supervisors","Other"]},{"name":"NEW: Engineering & Technical","subs":["Aerospace Engineering","Automotive Engineering","Building Services Engineering","Chemical Engineering","Civil / Structural Engineering","Electrical / Electronic Engineering","Engineering Drafting","Environmental Engineering","Field Engineering","Industrial Engineering","Management","Mechanical Engineering","Maintenance","Materials Handling Engineering","Process Engineering","Project Engineering","Supervisors","Systems Engineering","Water & Waste Engineering","Other"]},{"name":"NEW: Executive & Leadership","subs":["Board Appointments","CEO","COO / MD","CFO / Finance Executives","CMO / Marketing Executives","CHRO / People & Culture Leaders","General / Business Unit Manager","Strategy & Transformation Leaders","Other"]},{"name":"NEW: Financial Services","subs":["Banking","Client Services","Corporate Finance & Investment Banking","Financial Planning","Funds Management","Mortgage Broking","Settlements","Stockbroking & Trading","Superannuation","Other"]},{"name":"NEW: Human Resources & Recruitment","subs":["Consulting & Generalist HR","Industrial & Employee Relations","Learning & Organisational Development","Recruitment – Agency & Internal","Remuneration & Benefits","OH&S / WHS","Other"]},{"name":"NEW: Insurance","subs":["Actuarial","Assessment","Broking","Claims","Loss Adjusting","Management","Underwriting","Workers Compensation","Other"]},{"name":"NEW: Manufacturing & Operations","subs":["Assembly & Process Work","Forklift","Lean / Continuous Improvement","Machine Operators","Management","Pickers & Packers","Production / Operations Management","Production Planning & Scheduling","Purchasing Procurement & Inventory","Quality Assurance & Control","WHS / HSE","Other"]},{"name":"NEW: Marketing & Communications","subs":["Brand Management","Digital Marketing","Direct Marketing & CRM","Internal Marketing","Management","Market Research & Analysis","Marketing Assistants / Coordinators","Marketing Communications","Product Management & Development","Public Relations","Other"]},{"name":"NEW: Sales & Business Development","subs":["Account & Relationship Management","Analysis & Reporting","Management","New Business Development","Sales Coordinators","Sales Reps / Consultants","Other"]},{"name":"NEW: Scientific","subs":["Analytical Services","Biological & Biomedical Sciences","Biotechnology & Genetics","Chemistry & Physics","Clinical Trials & Research","Environmental Earth & Geosciences","Food Technology & Safety","Laboratory & Technical Services","Manufacturing Science","Materials Science","Mathematics Statistics & Modelling","Microbiology","Modelling & Simulation","Quality Assurance","Quality Control","Regulatory Affairs","Research and Development","Sales & Commercial","Other"]},{"name":"NEW: Supply Chain & Logistics","subs":["Drivers","Fleet Management","Forklift","Freight / Cargo Forwarding","Import / Export & Customs","Inventory & Stock Control","Management","Operations Management","Pickers & Packers","Purchasing & Procurement","Supply Chain Planning & Scheduling","Transport / Road Rail Maritime & Aviation","Warehousing Storage & Distribution","Other"]},{"name":"NEW: Technology & Transformation","subs":["Software Engineering & Development","Infrastructure Security & Operations","Project Services & Transformation","Data Digital & AI"]},{"name":"NEW: Trades & Labour","subs":["Air Conditioning & Refrigeration","Automotive Trades","Bakers & Pastry Chefs","Building Trades","Butchers","Cabinet Making","Carpentry","Cleaning Services","Electrical Trades","Fitters Turners & Machinists","Gardening & Landscaping","Labourers","Maintenance & Handyman Services","Mechanical Trades & Maintenance","Painters & Sign Writers","Plumbers","Printing & Publishing Services","Technicians","Welders & Boilermakers","Other"]}]}

NOTE: this taxonomy is pasted as static text, current as of when this spec
was written. If `index.html`'s industries/categories lists ever change,
re-generate this block (open the page, run `TAXONOMY_JSON` in the console)
and update it here AND in the Prompt.

If record type is "contacts", you are categorising a contact — a specific person at a client business.
Critical rule, read carefully: a contact's job title and employer tell you about the CONTACT and the BUSINESS. They do NOT tell you which department the contact recruits for. Never infer category or subcategory from what a job title sounds like it does.
- WRONG: "Production Manager" → assume category is Manufacturing & Operations, because that is what a production manager does.
- WRONG: "Talent Acquisition Manager" or "HR Manager" → assume category is Human Resources & Recruitment, because that is the contact's own department.
- RIGHT: category and subcategory only get filled in when the consultant has explicitly said, in some form, who the contact hires for, e.g. "hires machine operators and forklift drivers", "recruits for the finance team", "brings on graduate engineers". A job title and company name alone is NEVER enough to determine category or subcategory, even if the title sounds directly related to a category.
- If all you have is a job title and/or employer, treat category and subcategory as unresolved and ask who the contact actually recruits for. Do not guess based on the title sounding related to a category.
For contacts: "industry" is the sector the CONTACT'S BUSINESS operates in. "category" is the department(s) the contact is RESPONSIBLE FOR HIRING INTO, never inferred from their own job title. "subcategory" is the specific roles within the chosen category/categories that the contact hires for.

If record type is "candidates", you are categorising a candidate — a jobseeker.
Critical rule, read carefully: unlike a hiring contact, a candidate's own current or most recent job title IS a direct signal for category and subcategory — it describes the type of work THEY do, which is exactly what these fields capture for a candidate record.
- RIGHT: "Payroll Officer" at an insurance company → category "NEW: Accounting & Finance", subcategory "Payroll". The title directly tells you their specialisation.
- RIGHT: "Site Engineer" → category "NEW: Engineering & Technical", subcategory whichever engineering discipline fits (ask if the discipline itself is unclear, e.g. civil vs mechanical).
- Still ask when the title alone is too generic to map to a specific department or role, e.g. "Manager", "Consultant", "Officer" with no further context — these need a follow-up question rather than a guess.
- Industry should reflect the sector of their current or most recent employer, not necessarily every industry they've ever worked in.
For candidates: "industry" is the sector of the candidate's current or most recent employer. "category" is the department(s) that reflect the type of work this candidate actually does. "subcategory" is the specific role(s) within the chosen category/categories that best match this candidate's actual experience.

If record type is "jobs", you are categorising a job vacancy.
Critical rule, read carefully: for a job vacancy, the job title itself IS a direct signal for category and subcategory — it describes exactly what department and role this vacancy sits within.
- RIGHT: a "Credit Controller" vacancy → category "NEW: Accounting & Finance", subcategory "Account Receivable / Credit Control". The title directly tells you the role.
- RIGHT: a "Warehouse Team Leader" vacancy → category "NEW: Supply Chain & Logistics" or "NEW: Manufacturing & Operations" depending on context — ask if the business context doesn't make it obvious which.
- Still ask when the title alone is too generic, e.g. "Coordinator", "Officer", "Manager" with no department named — these need a follow-up question rather than a guess.
- Industry should reflect the sector of the hiring business, not the type of role.
For jobs: "industry" is the sector of the business hiring for this vacancy. "category" is the department(s) this vacancy sits within. "subcategory" is the specific role(s) within the chosen category/categories that best match this vacancy.

If record type is "companies", you are categorising a company (client business) as a whole.
Critical rule, read carefully: a company has no single job title to go on, so category and subcategory can only be filled in from what the consultant explicitly says about who the business hires, built up across everyone dealt with there. Never guess a company's hiring departments purely from its industry or what it sells.
- WRONG: a mining equipment manufacturer → assume category is Manufacturing & Operations, just because that is what the industry sounds like it would need.
- RIGHT: category and subcategory only get filled in when the consultant has explicitly said, in some form, which departments this business hires into, e.g. "we've placed finance and HR roles there", "they only ever come to us for engineers". Industry and what the business does is NEVER enough on its own to determine category or subcategory.
- If all you have is the company's name, website, or what it does, treat category and subcategory as unresolved and ask which departments Fuse has actually dealt with at this business.
For companies: "industry" is the sector this business operates in overall. "category" is the department(s) this business, as a whole, is known to hire into. "subcategory" is the specific roles within the chosen category/categories that this business has actually hired for.

Regardless of record type:

Vague answers are not real information. If the consultant gives a non-answer like "hires across the whole business", "does a bit of everything", or "they hire for everything", do not select every category, that is not a genuine answer and ticking every box is not useful to anyone. Treat it the same as not having an answer: keep category unresolved (or, if a couple of departments were named, use only those) and ask for two or three concrete examples.

Subcategory always needs a real answer before you are done. If you have selected one or more categories but do not have enough to choose a specific subcategory within them, you must still ask a question, do not settle for leaving subcategory empty with only an explanation.

"explanation" is only used once every field that can reasonably be resolved has been resolved. Maximum two short sentences, plain Australian English, no jargon.

"question": if industry, category, or subcategory is still unresolved, ask exactly ONE short, specific, plain-English question that would give you what you need. Ask about one thing at a time. Only set this to null once industry, category, and subcategory are all genuinely resolved.

Respond with ONLY raw JSON, no markdown fences, no preamble, matching exactly this shape:
{"industry": string|null, "category": string[], "subcategory": string[], "explanation": string|null, "question": string|null}

Data:

[insert the "Text input" variable here — this is Compose's output, containing the record type and conversation together]
```

## 4. Response action

Return the model's raw output text, untouched, as a JSON object:

```json
{ "reply": "<the exact text Run a prompt produced>" }
```

Set the `reply` field's value to Run a prompt's text-response output (from
the dynamic content picker — whatever it's labelled, e.g. "Text response" or
"responsetext"). Don't validate or reformat it — the frontend already strips
```json fences and does its own `JSON.parse`, and shows a friendly error if
parsing fails. If the model's output ends up wrapped in extra prose despite
the instruction, that's a sign the prompt's formatting instruction needs to
be even stricter, not something to fix on the flow side.

## 5. Wire it up

Copy the trigger's **HTTP POST URL** (the one with `sig=...` in it) and set
it as the Cloudflare Worker's secret — see `../worker/DEPLOY.md`:

```
wrangler secret put POWER_AUTOMATE_AI_URL
wrangler deploy
```

`index.html`'s `FLOW_URL` already points at the worker
(`https://bullhorn-category-proxy.marketing-1b3.workers.dev/api/categorise`)
— nothing to change there once the worker's deployed. Test with each record
type's "Describe it instead" box once both sides are live.

## Rotating the signature later

When the flow's trigger signature is regenerated after training, just update
the Worker secret (`wrangler secret put POWER_AUTOMATE_AI_URL` again with the
new URL) and redeploy — the frontend never needs to change.
