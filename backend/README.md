# AskMyNotes Backend (CRAG)

## Required Environment Variables

- `DATABASE_URL`
- `PINECONE_API_KEY`
- `PINECONE_ENV`
- `PINECONE_INDEX`
- `GOOGLE_API_KEY` (or `GEMINI_API_KEY`)
- `NOT_FOUND_THRESHOLD`
- `CHUNK_SIZE`
- `CHUNK_OVERLAP`

Recommended defaults:

- `TOP_K=8`
- `RERANK_TOP_N=5`
- `GEMINI_MODEL=gemini-1.5-pro`
- `LANGGRAPH_AUTO_SETUP=true`

## Behavior Guarantees

- Pinecone single index with strict namespace isolation: `namespace = subjectId`.
- Retrieval flow: embed query -> Pinecone query -> rerank -> threshold gate -> prompt -> Gemini -> postprocess -> save thread memory.
- If top reranked score is below `NOT_FOUND_THRESHOLD`, LLM is not called.
- Not-found response is exactly:
  - `Not found in your notes for [Subject]`

## LangGraph Postgres Checkpointer Setup

- Preferred: run `npm run checkpointer:setup` once per environment.
- SQL reference is included at:
  - `prisma/checkpointer.sql`

## Install / Run

```bash
npm install
npm run prisma:generate
npm run typecheck
npm run dev
```
