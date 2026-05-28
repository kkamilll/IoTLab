# System Inwentaryzacyjny (IOT LAB)

A comprehensive, role-based laboratory inventory and ordering management system.

## 🚀 Features
- **Role-based Authentication**: Secure access for Guests, Users, and Admins.
- **Inventory Management**: Create, update, and manage laboratory objects, materials, and components. Includes support for custom extra fields (dynamic schema).
- **Cart & Ordering System**: Guests and users can browse available items, add them to a cart, and submit rental requests.
- **Admin Dashboard**: Manage orders (approve/reject/rent/return), users, dynamic categories, tags, and predefined templates.
- **PDF Generation**: Export generated reports of products and orders directly to PDF.
- **Rich User Interface**: Responsive and modern UI built with React and TailwindCSS.

## 🛠 Tech Stack
- **Frontend**: React 19, Vite, TailwindCSS v4, React Router v7, Material UI (MUI), Axios.
- **Backend**: Node.js, Express, MongoDB (Mongoose), JSON Web Tokens (JWT) for authentication, Nodemailer for email notifications.

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or via a cloud provider like MongoDB Atlas)

### 1. Clone the repository
```bash
git clone <repository-url>
cd IOTLABBB
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the root or `backend` folder based on your setup:
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
To populate the database with initial admin users or sample data, you can run the seed script:
```bash
node backend/seed.js
```

## 📄 License
This project is for educational and laboratory purposes at Poznan University of Technology.
