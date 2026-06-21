# System Inwentaryzacyjny (IOT LAB)

A comprehensive, role-based laboratory inventory and ordering management system designed to streamline the reservation and checkout processes for university laboratories.

## 🚀 Key Features

### 👥 Role-Based Access
- **Guests & Students**: Browse available equipment, filter items, and seamlessly add them to a cart to request rentals.
- **Lecturers (Owners)**: Manage their own laboratory objects and receive direct notifications when their equipment is requested.
- **Admins**: Full control over orders, users, dynamic categories, tags, email templates, and system configuration.

### 📦 Advanced Inventory Management
- Create, update, and categorize laboratory objects, materials, and components.
- Support for **custom extra fields** (dynamic schema) to accommodate diverse types of equipment.
- Advanced filtering and live search capabilities.

### 📅 Order Processing & Calendar
- **Interactive Calendar View**: Visualize all active, upcoming, and past rentals on a responsive calendar.
- Manage order lifecycles: from pending requests to assigned, rented, and returned statuses.
- Real-time stock calculation and demand tracking.

### 🔔 Notifications & Communication
- **In-App Notification Hub**: Lecturers receive dedicated alerts when their items are requested.
- **Automated Emails**: Integrated Nodemailer support to automatically notify students about order status changes.

### 🛠 Extra Tools
- **PDF Reporting & Agreements**: Generate downloadable PDF reports of the inventory and dynamically filled Rental Agreements for students.
- **Dark Mode**: Fully supported, modern dark theme integrated with customized TailwindCSS palettes.
- **Internationalization (i18n)**: Seamless switching between Polish (PL) and English (EN) throughout the entire application.

## 💻 Tech Stack
- **Frontend**: React 19, Vite, TailwindCSS v4, React Router v7, Material UI (MUI), React Big Calendar.
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT for secure authentication, Nodemailer.
- **Libraries**: `jspdf` for document generation, `react-toastify` (custom context) for alerts, `date-fns` for time management.

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or via MongoDB Atlas)

### 1. Clone the repository
```bash
git clone <repository-url>
cd IOTLABBB
```

### 2. Backend Setup
From the project root directory, install backend dependencies:
```bash
npm install
```
Create a `.env` file in the root directory:
```env
PORT=3500
MONGO_URI="mongodb://127.0.0.1:27017/iotlab_db"
JWT_SECRET="your_jwt_secret"
SMTP_HOST=smtp.gmail.com
SMTP_SERVICE=gmail
SMTP_PORT=587
SMTP_MAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```
Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
npm install
```
Start the Vite development server:
```bash
npm run dev
```

### 4. Database Seeding (Optional)
To populate the database with initial admin users, categories, components, templates, and mock data:
```bash
npm run seed
```

## 📄 License
This project is for educational and laboratory purposes at Poznan University of Technology.
