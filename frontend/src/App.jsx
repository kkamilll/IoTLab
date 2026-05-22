import "./App.css";
import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

// Pages
import WelcomePage from "./pages/WelcomePage";
import Login from "./pages/Login";
import Admin from "./pages/HomeAdmin";
import Products from "./pages/Products";
import Notes from "./pages/Notes";
import PasswordResetFlow from "./pages/PasswordResetFlow";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import ProductPreview from "./pages/ProductsPreview";
import CartPage from "./pages/CartPage";
import Categories from "./pages/Categories";
import GuestProducts from "./pages/GuestProducts";
import Materials from "./pages/Materials";
import MainGuest from "./pages/MainGuest";
import Orders from "./pages/Orders";
import Users from "./pages/Users";
import OrderPreview from "./pages/OrderPreview";

import Components from "./pages/Components";
import ComponentPreview from "./pages/ComponentPreview";
import Templates from "./pages/Templates";

// Components
<<<<<<< HEAD
import Logout from "./components/auth/Logout";
=======
import Users from './components/Users';
import Logout from './components/Logout';
>>>>>>> 0805072fd15dde93ec5d23aecb48b0fa9e058f21
// import ReturnedOrders from './components/ReturnedOrders';

// Utils
import ProtectedRoutes from "./utils/ProtectedRoutes";
import RootRedirect from "./utils/RootRedirect";

const pathPrefix = "/admin-dashboard";
const excludedPathsWithPrefix = [`${pathPrefix}/products`];

function GlobalEffect() {
  const location = useLocation();

  const resetCart = () => {
    localStorage.setItem("cart", JSON.stringify([]));
  };

  useEffect(() => {
    if (
      location.pathname.startsWith(pathPrefix) &&
      !excludedPathsWithPrefix.includes(location.pathname)
    )
      resetCart();
  }, [location]);

  return null;
}

function App() {
  return (
    <Router>
      <GlobalEffect />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<PasswordResetFlow />} />
        <Route path="/unauthorized" element={<>Unauthorized</>} />
        <Route path="/redirect" element={<RootRedirect />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/cart" element={<CartPage />} />
        <Route
          path="/guest-products/:menuCategory?"
          element={<GuestProducts />}
        />
        <Route path="/mainguest" element={<MainGuest />} />
        <Route path="/preview" element={<ProductPreview />} />
<<<<<<< HEAD
        <Route path="/orderPreview/:orderUUID" element={<OrderPreview />} />
        <Route
          path="/components/:collectionId"
          element={<ComponentPreview />}
        />

=======
>>>>>>> 0805072fd15dde93ec5d23aecb48b0fa9e058f21
        {/* Admin Dashboard - Protected Routes */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoutes requireRole={["admin", "lecturer"]}>
              <Admin />
            </ProtectedRoutes>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="orders" element={<Orders />} />
          <Route path="profile" element={<Profile />} />
          <Route path="preview" element={<ProductPreview />} />
          <Route path="notes" element={<Notes />} />
<<<<<<< HEAD

          <Route element={<ProtectedRoutes requireRole={["admin"]} />}>
            <Route path="users" element={<Users />} />
            <Route path="materials" element={<Materials />} />
            <Route path="components" element={<Components />} />
            <Route path="categories" element={<Categories />} />
            <Route path="templates" element={<Templates />} />
          </Route>
=======
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
>>>>>>> 0805072fd15dde93ec5d23aecb48b0fa9e058f21
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
