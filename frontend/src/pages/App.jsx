import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Orders from './pages/Orders';

// Component Header giả định (Bạn sẽ tạo sau)
const Header = () => <header className="p-3 bg-dark text-white text-center">Header React Component</header>;

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        {/* Định nghĩa các trang tại đây */}
        <Route path="/orders" element={<Orders />} />
        {/* Thêm các Route khác sau: <Route path="/dangnhap" element={<Login />} /> */}
      </Routes>
    </Router>
  );
}

export default App;