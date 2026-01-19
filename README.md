# Libertas PWA - Eduneta Dashboard

Personal Modern PWA Dashboard for Eduneta student portal using a backend-proxy model.

## Features

- **Modern UI/UX** - Responsive mobile-first design
- **Dashboard Overview** - Today's timetable, notifications, messages, files
- **Timetable** - Weekly and daily views
- **Notifications** - Read/unread states
- **Messages** - Inbox with attachments
- **Files** - Categorized document list with download
- **PWA** - Installable on iOS and Android
- **Offline Support** - Cached data for basic views

## Tech Stack

### Backend
- Node.js + Express
- Axios for HTTP requests
- Cheerio for HTML parsing
- Express-session for session management

### Frontend
- React + Vite
- Tailwind CSS
- React Router
- Vite PWA plugin

## Quick Start

### 1. Clone and Install

```bash
cd libertas-pwa

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
ENFORCE_SINGLE_USER=true
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

# Configure production .env
cd ../backend
cp .env.example .env.production
# Edit .env.production with production settings

# Start production server
NODE_ENV=production node src/index.js
```

## PWA Installation

### iOS
1. Open in Safari
2. Tap Share button
3. Tap "Add to Home Screen"

### Android
1. Open in Chrome
2. Tap menu (three dots)
3. Tap "Install App" or "Add to Home Screen"

## Project Structure

```
libertas-pwa/
├── backend/
│   ├── src/
│   │   ├── index.js           # Express server entry
│   │   ├── services/
│   │   │   └── eduneta.js     # Eduneta API proxy service
│   │   ├── routes/
│   │   │   ├── auth.js        # Login/logout endpoints
│   │   │   ├── dashboard.js   # Dashboard overview
│   │   │   ├── timetable.js   # Timetable endpoints
│   │   │   ├── notifications.js
│   │   │   ├── messages.js
│   │   │   └── files.js
│   │   └── middleware/
│   │       └── auth.js        # Session validation
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx            # Main app with routing
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Timetable.jsx
    │   │   ├── Notifications.jsx
    │   │   ├── Messages.jsx
    │   │   └── Files.jsx
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   └── MobileNav.jsx
    │   └── services/
    │       └── api.js         # API client
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
| GET | /api/timetable/today | Today's lessons |
| GET | /api/notifications | All notifications |
| GET | /api/messages/inbox | All messages |
| GET | /api/files | All files |
| GET | /api/files/download/:id | Download file |

## Security Notes

- HTTPS required for production
- Credentials sent only during login
- Session tokens protected against XSS
- Single-user mode enforcement
- No credential storage in persistent storage

## License

Personal use only. Not for redistribution.

## Author

Created for personal use with Eduneta.
