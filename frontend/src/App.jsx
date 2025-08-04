
import './App.css'
import {BrowserRouter as Router, Routes, Route} from 'react-router'
import Login from './pages/Login';
import Home from './pages/Home';
import Admin from './pages/HomeAdmin';

function App() {
  
  return (
    <Router> 
      <Routes>
        <Route path='/login' element={<Login/>} />
        <Route path='/home' element={<Home/>} />
        <Route path='/home-admin' element={<Admin/>} />
      </Routes>
    </Router>
  )
}
export default App
