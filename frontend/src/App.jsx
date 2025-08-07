import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import WelcomePage from './pages/WelcomePage';
import Login from './pages/Login';
import Admin from './pages/HomeAdmin';

import ProtectedRoutes from './utils/ProtectedRoutes';
import RootRedirect from './utils/RootRedirect';

import Users from './components/Users';
import CustomerProducts from './components/CustomerProducts';

import Logout from './components/Logout';

import Products from './pages/Products';

function App() {
  return (
    <Router>
      <Routes>

        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<>Unauthorized</>} />
        <Route path="/redirect" element={<RootRedirect />} />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoutes requireRole={['admin']}>
              <Admin />
            </ProtectedRoutes>
          }
        >
          <Route index element={<h1>Welcome to Admin Dashboard</h1>} />
          <Route path="categories" element={<h1>1</h1>} />
          <Route path="products" element={<Products/>} />
          <Route path="orders" element={<h1>3</h1>} />
          <Route path="users" element={<Users />} />
          <Route path="profile" element={<h1>4</h1>} />
        </Route>

        <Route path="/customer-dashboard" element={<Admin />}>
          <Route index element={<CustomerProducts />} />
          <Route path="orders" element={<h1>1</h1>} />
          <Route path="profile" element={<h1>2</h1>} />
        </Route>

        <Route path='/logout' element={<Logout />} />

      </Routes>
    </Router>
  );
}

export default App;
