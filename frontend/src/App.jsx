import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Admin from './pages/HomeAdmin';
import RootRedirect from './utils/RootRedirect';
import ProtectedRoutes from './utils/ProtectedRoutes';
import WelcomePage from './pages/WelcomePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route
          path="/home-admin"
          element={
            <ProtectedRoutes requireRole={['admin']}>
              <Admin />
            </ProtectedRoutes>
          }
        />
        <Route path="/unauthorized" element={<>Unauthorized</>} />
        <Route path="/redirect" element={<RootRedirect />} />
      </Routes>
    </Router>
  );
}

export default App;
