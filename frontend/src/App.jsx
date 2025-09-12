import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Pages
import WelcomePage from './pages/WelcomePage';
import Login from './pages/Login';
import Admin from './pages/HomeAdmin';
import Products from './pages/Products';
import Notes from './pages/Notes';
import PasswordResetFlow from './pages/PasswordResetFlow';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ProductPreview from './pages/ProductsPreview';
import CartPage from './pages/CartPage';
import Categories from './pages/Categories';
import GuestProducts from './pages/GuestProducts';
import Materials from './pages/Materials';
import MainGuest from './pages/MainGuest';
import Orders from './pages/Orders';
import Users from './pages/Users';

// Components
import Logout from './components/Logout';
// import ReturnedOrders from './components/ReturnedOrders';

// Utils
import ProtectedRoutes from './utils/ProtectedRoutes';
import RootRedirect from './utils/RootRedirect';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<PasswordResetFlow />} />
        <Route path="/unauthorized" element={<>Unauthorized</>} />
        <Route path="/redirect" element={<RootRedirect />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/guest-products/:menuCategory" element={<GuestProducts />} />
        <Route path="/mainguest" element={<MainGuest />} />

        {/* Admin Dashboard - Protected Routes */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoutes requireRole={['admin', 'lecturer']}>
              <Admin />
            </ProtectedRoutes>
          }
        >
          {/* Nested routes for Admin */}
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="orders" element={<Orders />} />
          <Route path="users" element={<Users />} />
          <Route path="profile" element={<Profile />} />
          <Route path="preview" element={<ProductPreview />} />
          <Route path="notes" element={<Notes />} />
          <Route path="materials" element={<Materials />} />
          <Route
            path="categories"
            element={
              <ProtectedRoutes requireRole={['admin']}>
                <Categories />
              </ProtectedRoutes>
            }
          />
          {/* <Route path="ReturnedOrders" element={<ReturnedOrders />} /> */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
