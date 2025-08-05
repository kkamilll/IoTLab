
import './App.css'
import {BrowserRouter as Router, Routes, Route} from 'react-router'
import Login from './pages/Login';
import Home from './pages/Home';
import Admin from './pages/HomeAdmin';
import Root from './utils/Root';
import ProtectedRoutes from './utils/ProtectedRoutes';

function App() {
  
  return (
    <Router> 
      <Routes>
        <Route path='/' element={<Root/>} />
        <Route path='/login' element={<Login/>} />
        <Route path='/home' element={<Home/>} />
        <Route path='/home-admin' element={ <ProtectedRoutes requireRole={['admin']}>
              <Admin />
            </ProtectedRoutes>
} />
        <Route path='/unauthorized' element={<>Unauthorized</>} />
      </Routes>
    </Router>
  )
}
export default App
