# 🔧 Servify — Local Services Marketplace

A full-stack platform connecting customers with local service professionals across Indian cities.

## ✨ Features

| Feature | Details |
|---------|---------|
| 🔐 Authentication | JWT-based auth for Users, Providers, Admin |
| 📍 Location Matching | Address → geocoding → 5km radius filtering |
| 🔍 Smart Search | Keyword + category + city + distance filtering |
| 📅 Booking System | Date/time picker + confirmation flow |
| 📊 Status Tracking | Pending → Accepted → In Progress → Done |
| 💌 Email Notifications | HTML templates via Nodemailer/Gmail |
| ⭐ Reviews & Ratings | 5-star system, weighted averages |
| 👨‍💼 Provider Dashboard | Manage bookings, services, earnings |
| 📊 Admin Panel | Analytics, Chart.js, user management |
| 🔄 Real-time Updates | Socket.io live booking status |

## 🏗️ Tech Stack

- **Frontend**: React 18, React Router 6, Chart.js, Socket.io Client
- **Backend**: Node.js, Express, Socket.io
- **Database**: MySQL with lat/lng columns
- **Email**: Nodemailer + Gmail
- **Geocoding**: OpenStreetMap Nominatim (free, no API key)
- **Auth**: JWT tokens
- **Deployment**: Render.com (free tier)

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- MySQL 8+

### 1. Database Setup
```sql
-- Create and run the schema
mysql -u root -p < backend/schema.sql
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Fill in your .env values
npm install
npm run dev   # Starts on port 5000
```

### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env
# Fill in your .env values
npm install
npm start     # Starts on port 3000
```

---

## ⚙️ Environment Variables

### Backend `.env`
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=servify_db
JWT_SECRET=your_64_char_secret_here
PORT=5000
FRONTEND_URL=http://localhost:3000
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=your_gmail_app_password  # Use App Password, not account password
APP_NAME=Servify
```

### Frontend `.env`
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### Gmail App Password Setup
1. Enable 2FA on your Gmail account
2. Go to Google Account → Security → App passwords
3. Create app password for "Mail"
4. Use that 16-char password as `EMAIL_PASSWORD`

---

## 🌍 Location System

**How it works:**
1. User registers with address + city (e.g., "Koramangala, Bangalore")
2. Backend calls OpenStreetMap Nominatim to convert → lat/lng
3. When searching, Haversine formula filters providers within 5km
4. Service cards show distance badges ("2.3km away")

**Supported cities**: Bangalore, Mumbai, Pune, Kolhapur, Hyderabad, Chennai, Delhi, and more

---

## 📱 User Roles

### 👤 Customer
- Register/login with email + address
- Search services by keyword, category, city
- Book services with date/time picker
- Track booking status in real-time
- Submit reviews after completion

### 🔧 Service Provider
- Register with service area
- Add/manage services with pricing
- Accept/reject/complete bookings
- View earnings and reviews

### ⚙️ Admin
- Dashboard with revenue charts
- Verify/suspend providers
- View all users and bookings

**Default admin**: admin@servify.com / admin123

---

## 🚢 Deploy to Render

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Blueprint
3. Connect your repo (select `render.yaml`)
4. Set environment variables in dashboard
5. Deploy!

**Note**: Use PlanetScale or Railway for MySQL (Render doesn't offer MySQL natively)

---

## 📂 Project Structure

```
servify/
├── backend/
│   ├── config/
│   │   └── db.js              # MySQL pool
│   ├── middleware/
│   │   └── auth.js            # JWT middleware
│   ├── routes/
│   │   ├── auth.js            # Registration/login
│   │   ├── services.js        # Search + service detail
│   │   ├── bookings.js        # Booking creation + reviews
│   │   ├── provider.js        # Provider dashboard APIs
│   │   ├── admin.js           # Admin APIs
│   │   └── users.js           # User profile
│   ├── utils/
│   │   ├── geocode.js         # OpenStreetMap + Haversine
│   │   └── email.js           # Nodemailer + HTML templates
│   ├── schema.sql             # Complete database schema
│   ├── server.js              # Express + Socket.io
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── ServiceCard.js
│   │   │   ├── Stars.js
│   │   │   └── Toast.js
│   │   ├── context/
│   │   │   ├── AuthContext.js
│   │   │   └── SocketContext.js
│   │   ├── pages/
│   │   │   ├── HomePage.js
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js
│   │   │   ├── SearchPage.js
│   │   │   ├── ServiceDetailPage.js
│   │   │   ├── BookingPage.js
│   │   │   ├── UserDashboard.js
│   │   │   ├── ProviderDashboard.js
│   │   │   └── AdminDashboard.js
│   │   ├── utils/
│   │   │   └── api.js         # Axios instance + all API calls
│   │   └── index.css          # Complete design system
│   └── .env.example
└── render.yaml                # Render deployment config
```

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register/user` | - | User registration |
| POST | `/api/auth/register/provider` | - | Provider registration |
| POST | `/api/auth/login/user` | - | User login |
| POST | `/api/auth/login/provider` | - | Provider login |
| GET | `/api/services/search` | Optional | Search services |
| GET | `/api/services/categories` | - | All categories |
| GET | `/api/services/:id` | - | Service detail |
| POST | `/api/bookings` | User | Create booking |
| GET | `/api/bookings/my` | User | My bookings |
| POST | `/api/bookings/:id/review` | User | Submit review |
| GET | `/api/provider/bookings` | Provider | Provider bookings |
| PUT | `/api/provider/bookings/:id/status` | Provider | Update status |
| GET | `/api/admin/dashboard` | Admin | Analytics |

---

## 🎨 Design System

- **Primary**: `#FF6B35` (warm orange)
- **Display font**: Fraunces (Google Fonts)
- **Body font**: DM Sans
- **Border radius**: 12px / 20px
- **Cards hover**: lift + orange shadow effect
