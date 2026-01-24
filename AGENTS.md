# Agentic Guidelines for studomaticno (Libertas PWA)

This repository contains a personal Modern PWA Dashboard for the Eduneta student portal. It follows a backend-proxy model scraping data from Eduneta and serving it via a React frontend.

## 🚀 Build and Development Commands

### General
The project is split into `backend/` and `frontend/`. Install dependencies in both directories before starting.

### Backend (Node.js/Express)
- **Directory**: `/backend`
- **Install**: `npm install`
- **Development**: `npm run dev` (uses `node --watch`)
- **Production Start**: `npm start`
- **Main Entry**: `src/index.js`

### Frontend (React/Vite)
- **Directory**: `/frontend`
- **Install**: `npm install`
- **Development**: `npm run dev` (starts Vite on port 5173)
- **Build**: `npm run build`
- **Preview**: `npm run preview`
- **Main Entry**: `src/App.jsx`

### Testing & Linting
- **Tests**: Currently, there is no testing framework implemented (no `jest`, `mocha`, `vitest` found).
- **Linting**: No dedicated ESLint/Prettier configuration files found. Follow existing patterns.

## 🛠 Tech Stack
- **Backend**: Node.js, Express, Axios (for proxying), Cheerio (for HTML parsing), Express-session.
- **Frontend**: React 18, Vite, Tailwind CSS, React Router, Vite PWA Plugin.

## 🎨 Code Style & Conventions

### General
- **Imports**: Use ES Modules (`import/export`). In the frontend, `@` is aliased to `src/`.
- **Naming**: 
  - Variables/Functions: `camelCase`
  - Components/Contexts: `PascalCase`
  - Files: `PascalCase.jsx` for React components, `camelCase.js` for utilities/routes.

### Backend Patterns
- **Logging**: Use the custom `log` function from `src/services/eduneta.js`. It outputs JSON to console.
  ```javascript
  log('info', requestId, 'Message here', { key: 'value' });
  ```
- **Error Handling**: Wrap scraping logic in `try-catch` blocks. Use `requestId` (RID) for tracing across logs.
- **Scraping**: Heavy use of `cheerio`. Refer to existing routes in `backend/src/routes/` for table parsing patterns.
- **Encoding**: Eduneta uses `windows-1250`. Use `edunetaService.decodeHtml(data, rid)` to handle Croatian characters.

### Frontend Patterns
- **Styling**: Tailwind CSS only. Avoid inline styles.
- **State Management**: React Context (`AuthContext`, `SettingsContext`) and local `useState`/`useEffect`.
- **API Calls**: Use the `api` service in `src/services/api.js`.
- **PWA**: PWA configuration is in `vite.config.js`. Manifest and icons are in `public/`.
- **Dark Mode**: Supported via Tailwind's `class` strategy.

## 📁 Project Structure
- `backend/src/`:
  - `routes/`: Feature-specific API endpoints (timetable, grades, etc.).
  - `services/`: Core logic (especially `eduneta.js` for proxying).
  - `middleware/`: Auth and session validation.
- `frontend/src/`:
  - `components/`: UI building blocks (Sidebar, MobileNav, etc.).
  - `pages/`: Main route components.
  - `services/`: API client and integration.
  - `contexts/`: Global state providers.
  - `utils/`: Helpers and caching logic.

## ⚠️ Important Notes
- **Security**: Sensitive data (EDUNETA_BASE_URL, SESSION_SECRET) is managed via `.env` files. Never commit `.env`.
- **Sticky Announcements**: The backend has special logic to handle "imperative" messages on Eduneta that must be marked as read before accessing the dashboard.
- **Single User**: Typically configured for a single-user proxy model (see `ENFORCE_SINGLE_USER` in `.env`).
