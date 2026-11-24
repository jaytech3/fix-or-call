# Fix or Call

A home repair triage agent. Describe a problem at home (text, photo or voice) and get one clear answer: fix it yourself, wait and watch, ask your owner or society, use the brand's service, call a professional, or stop because it is urgent.

It does not book services, contact any company or professional, or access any account.

## How it works
- `index.html` holds the interface and the agent's tools: safety check, DIY guide, visit brief, responsibility check, warranty check, a clarifying question and the final verdict.
- `api/chat.js` is a small server function that forwards the conversation to the model. The model chooses which tool to call; the page runs the tool and sends the result back until a verdict is given.
- Every verdict shows which checks were run, so tool choice can be audited.

## Deploy
1. Import this repository into Vercel.
2. Add the environment variable `ANTHROPIC_API_KEY`.
3. Deploy.

Optional: set `FOC_MODEL` to use a different model.
