import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import Header from './components/Header';
import Home from './pages/Home';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Success from './pages/Success';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import ProductDetail from './pages/ProductDetail';

function App() {
  return (
    <Router>
      <Routes>
        {/* Tuyến đường dành cho Quản trị viên (Không có Header của User) */}
        <Route path="/admin" element={<Admin />} />
        
        {/* Các tuyến đường dành cho Người dùng (Sẽ luôn có Header đi kèm) */}
        <Route path="/*" element={
          <>
            <Header />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/dangnhap" element={<Login />} />
              <Route path="/giohang" element={<Cart />} />
              <Route path="/thanhtoan" element={<Checkout />} />
              <Route path="/success" element={<Success />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </>
        } />
      </Routes>
    </Router>
  );
}

export default App
