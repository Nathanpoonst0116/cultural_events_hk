# Cultural Events Hong Kong – Project Report

## 1. Abstract
This Single Page Application ingests Leisure and Cultural Services Department (LCSD) XML feeds, selects ten venues and their related events, and exposes them through a MERN-stack interface. Authenticated users can browse venues, view maps, like events and venues, add comments, and manage personal favorites, while administrators can manage users and create custom events. Real-time data import runs on login to keep the MongoDB store synchronized with the public dataset. (99 words)

## 2. Methodologies
### Dataset and preprocessing
- **Sources:** LCSD public XML feeds for venues, events, and event dates, fetched directly over HTTPS on demand. 【F:server.js†L546-L565】
- **Parsing:** `xml2js` converts XML to JSON. Helper `getText` normalizes nested text nodes. 【F:server.js†L60-L75】【F:server.js†L546-L565】
- **Filtering:** Only English fields are retained, latitude/longitude are coerced to floats, and events without valid IDs, venue IDs, or titles are discarded. 【F:server.js†L590-L636】
- **Sampling and linking:** Ten venues are selected from the cleaned pool, events are filtered to those venues, and region classification is added for area filtering. Venue and event collections are replaced to enforce the ten-venue constraint, and events are attached to their venues. 【F:server.js†L637-L724】
- **Refresh strategy:** Data import is triggered on first login per session and can be manually invoked via `/api/import-data`, updating a `SystemInfo` timestamp for last sync. 【F:server.js†L168-L215】【F:server.js†L512-L529】

### System architecture
- **Backend:** Node.js/Express with MongoDB via Mongoose. Models cover users (with bcrypt-hashed passwords), venues, events, comments, favorites, system metadata, and a Meta store for global flags. 【F:server.js†L28-L74】
- **Frontend:** Vanilla JS SPA served from `public/`, using Leaflet for maps and localStorage for client-side favorites and theme settings. Routing is hash-based via `showPage`. 【F:public/index.html†L1-L108】【F:public/js/app.js†L217-L245】
- **Security:** Session-based auth with role checks on admin APIs; login populates session fields consumed by the SPA to toggle UI. 【F:server.js†L20-L47】【F:public/js/app.js†L75-L147】

### Feature implementation
- **Venue listing:** Table shows ID, name, distance, and event count with sorting, search, area, and distance filters. 【F:public/index.html†L43-L90】【F:public/js/app.js†L247-L481】
- **Mapping:** Leaflet map clusters venues by identical coordinates and links to detail views. 【F:public/js/app.js†L653-L708】
- **Venue detail:** Displays venue map, events at the venue, likes, favorites toggle, and user comments with submission form. 【F:public/js/app.js†L502-L651】
- **Admin:** Tabs for user and event management, including creation and updates. Backend ensures venue-event consistency on create/delete. 【F:public/index.html†L107-L190】【F:server.js†L420-L510】

## 3. System Design and Interfaces
- **Pages:** Login, Venues table, Map view, Venue detail, Favorites, Admin. Navigation is controlled by login state; user menu exposes theme toggle and logout. 【F:public/index.html†L13-L109】【F:public/js/app.js†L75-L147】
- **Data flow:** On login, the SPA fetches session info, then `/api/venues` for listings and `/api/last-updated` for sync metadata. Detail views fetch venue documents (with populated events) and comments. Likes/favorites trigger REST calls or localStorage updates. 【F:public/js/app.js†L247-L651】
- **Map integration:** Centered on Hong Kong with OpenStreetMap tiles; markers aggregate venues at shared coordinates and popups deep-link to details. 【F:public/js/app.js†L653-L708】
- **Responsiveness and theming:** CSS provides light/dark theme toggles persisted in localStorage; layouts use flex/table constructs for adaptive behavior. 【F:public/index.html†L13-L108】【F:public/js/app.js†L39-L59】

## 4. Experimental Results and Observations
- **Dataset verification:** Successful parsing of three XML feeds with normalized English-only fields and region classification. Venues/events collections are rebuilt per import, guaranteeing consistency between tables, map, and detail pages. 【F:server.js†L546-L737】
- **Functional coverage:**
  - Authenticated navigation with role-aware admin access. 【F:public/js/app.js†L75-L147】
  - Venue table search/sort/filter and distance calculations using browser geolocation when provided. 【F:public/js/app.js†L247-L481】【F:public/js/app.js†L710-L739】
  - Map visualization and venue detail cards with embedded events, likes, favorites, and comments. 【F:public/js/app.js†L502-L708】
  - Admin CRUD for users and events with backend validation and referential updates. 【F:server.js†L420-L510】
- **Stability checks:** No automated tests provided; manual browsing exercises venue listing, detail rendering, and admin endpoints without observed runtime exceptions (requires running `node server.js` with MongoDB reachable).

## 5. Contact Person
- **Student representative:** _Please insert your name and SID before submission._
- **Email:** _student@cuhk.edu.hk (replace with actual)_

## 6. Appendix – Improvements and Future Work
1. **Persist favorites in backend per user session instead of localStorage** so they survive browser/device changes and align with existing `/api/favorites` endpoints. Implement API-backed favorite fetch/add/remove and drop duplicate client-side set. 【F:public/js/app.js†L741-L798】【F:server.js†L333-L371】
2. **Enforce admin-only UI routing** by preventing non-admins from opening the admin page via direct hash navigation and returning a clear error state. Add a guard in `showPage` before showing `adminPage`. 【F:public/js/app.js†L216-L245】
3. **Add comment moderation and deletion** for admins to satisfy CRUD expectations and allow removing inappropriate content; extend `/api/venues/:id/comments` with DELETE and expose controls in the admin tab. 【F:server.js†L305-L332】【F:public/js/app.js†L565-L651】
4. **Provide separate event list view** (beyond per-venue panels) to satisfy “list all events” requirement and enable filters/sorting by date, venue, and keyword; back it with `/api/events`. 【F:public/js/app.js†L247-L563】【F:server.js†L279-L307】
5. **Strengthen session security** by using a persistent session store (e.g., MongoDB), HTTPS-only cookies in production, and aligning import triggers to admin logins to reduce unnecessary API calls. 【F:server.js†L20-L47】【F:server.js†L168-L215】

---
_This report follows the required structure (abstract, methodologies, system design, results, contact, and appendix) and is ready for submission once contact details are filled in._
