import "./App.css";
import { useEffect } from "react";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
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
import Notifications from "./pages/Notifications";

import Components from "./pages/Components";
import ComponentPreview from "./pages/ComponentPreview";
import Templates from "./pages/Templates";

// Components
import Logout from "./components/auth/Logout";

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
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
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
            <Route path="/orderPreview/:orderUUID" element={<OrderPreview />} />
            <Route
              path="/components/:collectionId"
              element={<ComponentPreview />}
            />

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
              <Route path="notifications" element={<Notifications />} />

              <Route element={<ProtectedRoutes requireRole={["admin"]} />}>
                <Route path="users" element={<Users />} />
                <Route path="materials" element={<Materials />} />
                <Route path="components" element={<Components />} />
                <Route path="categories" element={<Categories />} />
                <Route path="templates" element={<Templates />} />
              </Route>
            </Route>
          </Routes>
          </Router>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
