# DECISIONS.md: Architectural Trade-offs and Engineering Judgment

This document outlines the core architectural decisions, scalability considerations, and trade-offs made during the development of Linkr.

## 1. Significant Design Decisions and Trade-offs

**Using the Raw `pgx` Driver over ORMs (e.g., GORM)**
I chose the raw `pgx` driver to guarantee the redirect endpoint remains highly performant and allocation-efficient under heavy concurrent load. GORM introduces reflection overhead and can easily trigger N+1 queries. The primary trade-off of `pgx` is slower development time due to manual row-to-struct mapping boilerplate. I mitigated this by utilizing AI assistants to rapidly generate the raw SQL queries and mapping functions.

**Choosing `net/http` over Heavy Web Frameworks**
I bypassed frameworks like Gin or Echo in favor of Go's standard library `net/http`. With Go 1.22's native support for HTTP method matching and path wildcards, the primary need for third-party routers is eliminated. Sticking to the standard library ensures minimal overhead per request on the redirect hot path and prevents third-party dependency bloat.

**Server Actions and Native Fetch over Client-Side Libraries**
On the Next.js frontend, I bypassed client-side cookie libraries like `js-cookie` and data-fetching libraries like `axios`. Instead, I utilized Next.js Server Actions and native `next/headers` to securely manage the JWT as an `HttpOnly` cookie. I also used the native `fetch` API because Next.js patches it to automatically handle request deduplication and advanced caching, which `axios` bypasses.

**Dynamic Time-Window Analytics**
Instead of returning all historical clicks and causing a cramped, messy UI on the frontend, I implemented a dynamic time-window filter (7, 14, 30, or 180 days) on the stats endpoint. This trades off fetching the complete lifetime history in a single request for a significantly reduced database payload size and a legible, polished charting experience.

---

## 2. Designing for Heavy Traffic and Concurrent Load

The system is designed to handle concurrency statelessly. The backend utilizes `pgxpool` to manage active database connections efficiently, preventing the overhead of opening and closing connections on every request. Crucial lookup columns (`short_code`, `user_id`, `link_id`) are indexed to prevent sequential scans.

**What would break first:**
If traffic spikes massively beyond the configured threshold, the buffered channel for async click processing (currently sized at 1000) will fill up. Once full, new click events will be dropped by the non-blocking channel send in the redirect handler. This preserves redirect latency on the hot path, but analytics will become incomplete under sustained overload.

**How to scale it further:**
To scale further, I would implement multiple worker goroutines reading from the same channel to increase database write throughput. Additionally, I would introduce an in-memory cache (like Redis) in front of the database to handle the `short_code` to `url` lookups, removing the database entirely from the redirect read path.

---

## 3. Asynchronous Click Recording

To ensure the redirect path stays exceptionally fast, click recording operates non-blockingly. When a user hits the redirect endpoint, the handler queries the destination URL, pushes the `link_id` into a buffered Go channel (`clickChan`), and instantly returns the HTTP 302. A separate background goroutine loops over this channel and executes the database transactions (inserting the click and incrementing the total count).

**Crash handling and data loss:**
If the server crashes unexpectedly, any `link_id`s currently resting in the memory buffer (the channel) that have not yet been processed by the background worker will be permanently lost. In the context of a URL shortener, losing a small fraction of click analytics during a catastrophic server failure is a highly acceptable trade-off to guarantee the core redirect service remains lightning-fast and highly available for end-users.

---

## 4. What I Would Do Differently With Another Week

With additional time, I would focus heavily on infrastructure and advanced caching strategies. Specifically:

- Integrate a Redis caching layer for the `GET /{code}` redirect endpoint to drastically reduce PostgreSQL read load.
- Implement strict rate limiting on the link creation and authentication endpoints to prevent abuse and brute-force attacks.
- Build a robust suite of integration tests and a full CI/CD pipeline for automated linting, testing, and deployment.
- Implement a soft-delete mechanism for users and links, allowing data recovery and maintaining referential integrity for historical analytics.

---

## 5. AI Tooling Usage and Corrections

I utilized AI tooling (specifically LLMs acting as a pair-programmer) extensively to accelerate boilerplate generation. This included drafting the raw PostgreSQL `CREATE TABLE` statements, generating the repetitive Go struct mapping logic required by `pgx`, and scaffolding the Tailwind CSS layouts for the Next.js frontend.

**Where I corrected the AI:**

- **Security & Error Handling:** The AI initially suggested returning raw database error strings directly in the HTTP 500 responses (`fmt.Sprintf("failed to fetch: %v", err)`). I explicitly overrode this to prevent internal schema and table name leakage, implementing sanitized, structured JSON error responses instead to protect against SQL injection mapping.
- **Database Indexing:** The AI generated a schema that missed a critical B-tree index on the `user_id` foreign key in the `links` table. I corrected this manually to prevent sequential database scans when loading the user's dashboard, ensuring the listing endpoint remains performant under load. However, I deliberately did not add a manual index to the `username` column, recognizing that PostgreSQL automatically creates one for the `UNIQUE` constraint.
