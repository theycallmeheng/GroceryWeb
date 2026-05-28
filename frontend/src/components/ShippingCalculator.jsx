import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';

// Sửa lỗi hiển thị icon ghim mặc định của Leaflet trong React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Tọa độ cửa hàng của bạn tại 120 Yên Lãng
const STORE_POSITION = [21.012563, 105.817457];

// Component hỗ trợ di chuyển tâm bản đồ khi lấy vị trí hiện tại
function RecenterMap({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.setView(position, 16); // Phóng to vào vị trí được chọn
        }
    }, [position, map]);
    return null;
}

function LocationMarker({ position, setPosition, setAddress }) {
    const map = useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            setPosition([lat, lng]); // Đặt ghim vào vị trí khách bấm
            
            // Gọi API miễn phí để chuyển tọa độ vừa bấm thành chữ (Reverse Geocoding)
            axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
                .then(res => {
                    if (res.data && res.data.display_name) {
                        setAddress(res.data.display_name); // Điền tự động vào ô input
                    }
                })
                .catch(err => console.error("Lỗi lấy địa chỉ:", err));
        },
    });

    return position === null ? null : (
        <Marker position={position}>
            <Popup>Vị trí nhận hàng của bạn</Popup>
        </Marker>
    );
}

export default function ShippingCalculator({ onFeeCalculated, onAddressSelected, initialAddress }) {
    const [position, setPosition] = useState(null);
    const [address, setAddress] = useState('');
    const [fee, setFee] = useState(0);
    const [shippingDetails, setShippingDetails] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialAddress) {
            setAddress(initialAddress);
        }
    }, [initialAddress]);

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Trình duyệt của bạn không hỗ trợ định vị!', type: 'danger' } }));
            return;
        }

        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                const newPos = [latitude, longitude];
                setPosition(newPos);
                
                // Gọi API để chuyển tọa độ thành tên địa chỉ
                axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
                    .then(res => {
                        if (res.data && res.data.display_name) {
                            setAddress(res.data.display_name);
                        }
                        setLoading(false);
                    })
                    .catch(err => {
                        console.error("Lỗi lấy địa chỉ:", err);
                        setLoading(false);
                    });
            },
            (err) => {
                console.error(err);
                window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Không thể lấy vị trí. Vui lòng bật quyền truy cập vị trí trên trình duyệt!', type: 'warning' } }));
                setLoading(false);
            }
        );
    };

    const handleCalculate = async () => {
        if (!address) {
            window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Vui lòng chạm vào bản đồ để chọn vị trí hoặc tự nhập địa chỉ!', type: 'warning' } }));
            return;
        }
        setLoading(true);
        try {
            // Truyền địa chỉ lên Component Giỏ Hàng cha
            if (onAddressSelected) onAddressSelected(address);

            // Lấy token để gọi API (tránh lỗi 403 Forbidden từ Spring Security)
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Truyền trực tiếp tọa độ (lat, lng) nếu khách ghim trên bản đồ để Backend không cần dò lại chữ
            const payload = { address: address };
            if (position) {
                payload.lat = position[0].toString();
                payload.lng = position[1].toString();
            }

            // Gọi API Backend Spring Boot để tính tiền Ship
            const res = await axios.post('http://localhost:8081/api/shipping/calculate', payload, { headers });
            
            const data = res.data;

            // Nếu Backend báo lỗi (ví dụ: Địa chỉ không ở Hà Nội)
            if (data.error) {
                window.dispatchEvent(new CustomEvent('showToast', { detail: { message: data.error, type: 'danger' } }));
                setFee(0);
                setShippingDetails(null);
                if (onFeeCalculated) onFeeCalculated(0);
                setLoading(false);
                return;
            }

            const calculatedFee = data.fee;
            setFee(calculatedFee);
            setShippingDetails(data);
            
            // Truyền số tiền ship lên Component Giỏ Hàng cha để cộng vào Tổng đơn
            if (onFeeCalculated) onFeeCalculated(calculatedFee);
        } catch (error) {
            console.error(error);
            window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Không thể tính khoảng cách tự động. Áp dụng phí giao hàng mặc định 30.000đ', type: 'warning' } }));
            setFee(30000);
            setShippingDetails(null);
            if (onFeeCalculated) onFeeCalculated(30000);
        }
        setLoading(false);
    };

    return (
        <div className="card shadow-sm border-0 mb-4">
            <div className="card-body p-4">
            <div className="d-flex align-items-center mb-3">
                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold me-3" style={{width: '32px', height: '32px'}}>2</div>
                <h3 className="m-0 fs-5 fw-bold">Bản đồ chọn vị trí giao hàng</h3>
            </div>
            <p className="text-muted small">Bấm vào bản đồ để chọn vị trí nhận hàng (Giống Grab), hoặc nhập thẳng địa chỉ vào ô bên dưới.</p>
            
            {/* Khung chứa Bản Đồ */}
            <div style={{ height: "300px", width: "100%", marginBottom: "15px", borderRadius: "10px", overflow: "hidden", border: "1px solid #dee2e6", zIndex: 0 }}>
                <MapContainer center={STORE_POSITION} zoom={13} style={{ height: "100%", width: "100%", zIndex: 1 }}>
                    <TileLayer
                        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={STORE_POSITION}>
                        <Popup><b>Cửa hàng của bạn</b><br/>120 Yên Lãng, Đống Đa</Popup>
                    </Marker>
                    <LocationMarker position={position} setPosition={setPosition} setAddress={setAddress} />
                    <RecenterMap position={position} />
                </MapContainer>
            </div>

            <div className="mb-3">
                <button 
                    className="btn btn-outline-primary btn-sm fw-bold" 
                    onClick={handleGetCurrentLocation} 
                    disabled={loading}
                >
                    <i className="bi bi-geo-alt-fill me-1"></i> Sử dụng vị trí hiện tại của tôi
                </button>
            </div>

            <div className="input-group mb-3">
                <input type="text" className="form-control form-control-lg" placeholder="VD: 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội" value={address} onChange={(e) => setAddress(e.target.value)} />
                <button className="btn btn-primary px-4 fw-bold" onClick={handleCalculate} disabled={loading}>
                    {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Đang tính...</> : 'Tính Phí Ship'}
                </button>
            </div>

            {fee > 0 && (
                <div className="alert alert-success mb-0">
                    <div className="d-flex justify-content-between align-items-center border-bottom border-success pb-2 mb-2">
                        <span><strong>Phí giao hàng tạm tính:</strong></span>
                        <span className="fs-5 fw-bold text-success">+{fee.toLocaleString()} đ</span>
                    </div>
                    {shippingDetails && (
                        <ul className="mb-0 small" style={{ listStyleType: "none", paddingLeft: 0 }}>
                            <li className="text-muted"><i className="bi bi-signpost-split me-2"></i>Khoảng cách: <strong>{shippingDetails.distance ? shippingDetails.distance.toFixed(1) : 0} km</strong></li>
                            {shippingDetails.isRaining && <li className="text-danger mt-1"><i className="bi bi-cloud-rain-heavy me-2"></i>Trời đang mưa: <strong>+7.000 đ</strong></li>}
                            {shippingDetails.isRushHour && <li className="text-warning text-dark mt-1"><i className="bi bi-clock-history me-2"></i>Giờ cao điểm: <strong>+5.000 đ</strong></li>}
                        </ul>
                    )}
                </div>
            )}
            </div>
        </div>
    );
}
