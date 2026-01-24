# studomaticno - Eduneta Dashboard

Personal Modern PWA Dashboard for Eduneta student portal using a backend-proxy model.

## Features

- **Modern UI/UX** - Responsive mobile-first design with dark mode support
- **Multi-User Support** - Multiple users can log in simultaneously with isolated sessions
- **Dashboard Overview** - Today's timetable, notifications, messages, files
- **Timetable** - Weekly and daily views with "Add to Calendar" support
- **Grades** - Overview of grades, ECTS, and GPA
- **Notifications** - Real-time notifications and read/unread states
- **Messages** - Inbox with attachments and message details
- **Files** - Categorized document list with download
- **PWA** - Installable on iOS and Android with custom install banner
- **Localization** - Multi-language support (English and Croatian)
- **Offline Support** - Cached data for basic views

## Tech Stack

### Backend
- Node.js + Express
- Axios for HTTP requests
- Cheerio for HTML parsing
- Express-session for session management (with session-scoped services)

### Frontend
- React + Vite
- Tailwind CSS (Premium modern design)
- React Router
- Vite PWA plugin

## Quick Start

### 1. Clone and Install

```bash
cd studomaticno

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your settings:
```env
PORT=3001
EDUNETA_BASE_URL=https://eduneta.hr
SESSION_SECRET=your-super-secret-session-key
FRONTEND_URL=http://localhost:5173
```

### 3. Run Development

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

Access at: http://localhost:5173

### 4. Production Build

```bash
# Build frontend
cd frontend
npm run build

# Start production server (from root or backend)
PORT=3001 NODE_ENV=production node backend/src/index.js
```

## DigitalOcean Deployment

This project is optimized for **DigitalOcean App Platform**.

1. **Create App**: Use the "Create App" button in DigitalOcean.
2. **Components**:
   - **Service (backend)**: Set `HTTP Port` to `8080` (or as configured), Environment: Node.js.
   - **Static Site (frontend)**: Build command `npm run build`, Output directory `dist`.
3. **Environment Variables**:
   - `SESSION_SECRET`: Random long string.
   - `FRONTEND_URL`: Your App Platform URL.
   - `NODE_ENV`: `production`.

## PWA Installation

### iOS
1. Open in Safari
2. Tap Share button
3. Tap "Add to Home Screen"

### Android
1. Open in Chrome
2. Tap the custom "Install App" banner or browser menu
3. Tap "Install App"

## Project Structure

```
studomaticno/
├── backend/
│   ├── src/
│   │   ├── index.js           # Express server entry
│   │   ├── services/
│   │   │   ├── ServiceManager.js  # Manages session-scoped services
│   │   │   └── eduneta.js         # Eduneta API proxy logic
│   │   ├── routes/
│   │   │   ├── auth.js        # Login/logout endpoints
│   │   │   ├── dashboard.js   # Dashboard overview
│   │   │   ├── timetable.js   # Timetable endpoints
│   │   │   ├── grades.js      # Grades endpoints
│   │   │   ├── notifications.js
│   │   │   ├── messages.js
│   │   │   └── files.js
│   │   └── middleware/
│   │       └── auth.js        # Session validation & service attachment
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx            # Main app with routing
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Timetable.jsx
    │   │   ├── Grades.jsx
    │   │   ├── Notifications.jsx
    │   │   ├── Inbox.jsx      # Message list view
    │   │   └── Files.jsx
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   ├── MobileNav.jsx
    │   │   ├── PWAInstallBanner.jsx
    │   │   └── WeekRibbon.jsx
    │   ├── utils/
    │   │   └── dateUtils.js   # Date formatting and logic
    │   └── services/
    │       └── api.js         # Axios API client
    ├── public/
    │   └── icons/
    └── package.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login to Eduneta |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/status | Check authentication |
| GET | /api/dashboard/overview | Dashboard data |
| GET | /api/timetable | Full timetable |
| GET | /api/grades | Exam grades and ECTS |
| GET | /api/notifications | All notifications |
| GET | /api/messages/inbox | All messages |
| GET | /api/files | All files |

## Security Notes

- HTTPS required for production
- Credentials sent only during login via POST
- Session tokens protected with `httpOnly` and `secure` flags
- Per-user session isolation with separate `EdunetaService` instances
- No student credentials stored in the backend (stored only in session memory)

## License

Personal use only.
