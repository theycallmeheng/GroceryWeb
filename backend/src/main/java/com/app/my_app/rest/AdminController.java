package com.app.my_app.rest;

import com.app.my_app.domain.Category;
import com.app.my_app.domain.Order;
import com.app.my_app.domain.Product;
import com.app.my_app.domain.Shipper;
import com.app.my_app.domain.User;
import com.app.my_app.repos.CategoryRepository;
import com.app.my_app.repos.OrderRepository;
import com.app.my_app.repos.ProductRepository;
import com.app.my_app.repos.ShipperRepository;
import com.app.my_app.repos.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private ShipperRepository shipperRepository;
    
    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardData() {
        Map<String, Object> data = new HashMap<>();
        data.put("message", "Chào mừng Admin!");
        data.put("totalUsers", userRepository.count());
        data.put("totalOrders", orderRepository.count());
        return ResponseEntity.ok(data);
    }
    
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody User user) {
        if (user.getUsername() != null && userRepository.existsByUsername(user.getUsername())) {
            return ResponseEntity.badRequest().body("Username đã tồn tại!");
        }
        if (user.getEmail() != null && userRepository.existsByEmail(user.getEmail())) {
            return ResponseEntity.badRequest().body("Email đã tồn tại!");
        }
        if (user.getPhone() != null && !user.getPhone().isEmpty() && userRepository.existsByPhone(user.getPhone())) {
            return ResponseEntity.badRequest().body("Số điện thoại đã tồn tại!");
        }
        if (user.getPassword() == null || user.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode("123456")); // Mật khẩu mặc định nếu không nhập
        } else if (!isEncoded(user.getPassword())) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole("ROLE_USER");
        }
        
        // Tự động tính ID mới (+1 so với ID cuối cùng trong DB)
        Long nextId = userRepository.findMaxId() + 1;
        user.setId(nextId);

        return ResponseEntity.ok(userRepository.save(user));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        if (userDetails.getUsername() != null && !userDetails.getUsername().equals(user.getUsername())
                && userRepository.existsByUsername(userDetails.getUsername())) {
            return ResponseEntity.badRequest().body("Username đã tồn tại!");
        }
        if (userDetails.getEmail() != null && !userDetails.getEmail().equals(user.getEmail())
                && userRepository.existsByEmail(userDetails.getEmail())) {
            return ResponseEntity.badRequest().body("Email đã tồn tại!");
        }
        if (userDetails.getPhone() != null && !userDetails.getPhone().isEmpty()
                && !userDetails.getPhone().equals(user.getPhone())
                && userRepository.existsByPhone(userDetails.getPhone())) {
            return ResponseEntity.badRequest().body("Số điện thoại đã tồn tại!");
        }

        if (userDetails.getUsername() != null) user.setUsername(userDetails.getUsername());
        if (userDetails.getEmail() != null) user.setEmail(userDetails.getEmail());
        user.setFirstname(userDetails.getFirstname());
        user.setLastname(userDetails.getLastname());
        user.setPhone(userDetails.getPhone());
        user.setAddress(userDetails.getAddress());
        user.setRole(userDetails.getRole());

        if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
            if (!isEncoded(userDetails.getPassword())) {
                user.setPassword(passwordEncoder.encode(userDetails.getPassword()));
            } else {
                user.setPassword(userDetails.getPassword());
            }
        }
        
        return ResponseEntity.ok(userRepository.save(user));
    }

    private boolean isEncoded(final String password) {
        return password.startsWith("$2a$") || password.startsWith("$2b$") || password.startsWith("$2y$");
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok().body("{\"message\": \"Xóa người dùng thành công!\"}");
    }
    
    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderRepository.findAll());
    }
    
    @GetMapping("/orders/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
        return orderRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/products")
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productRepository.findAll());
    }
    
    @PostMapping("/products")
    public ResponseEntity<Product> createProduct(@RequestBody Product product) {
        if (product.getCategory() != null && product.getCategory().getId() != null) {
            Category category = categoryRepository.findById(product.getCategory().getId()).orElse(null);
            product.setCategory(category);
        }
        return ResponseEntity.ok(productRepository.save(product));
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody Product productDetails) {
        Product product = productRepository.findById(id).orElse(null);
        if (product == null) {
            return ResponseEntity.notFound().build();
        }
        product.setName(productDetails.getName());
        product.setPrice(productDetails.getPrice());
        product.setImage(productDetails.getImage());
        
        if (productDetails.getCategory() != null && productDetails.getCategory().getId() != null) {
            Category category = categoryRepository.findById(productDetails.getCategory().getId()).orElse(null);
            product.setCategory(category);
        }
        return ResponseEntity.ok(productRepository.save(product));
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        productRepository.deleteById(id);
        return ResponseEntity.ok().body("{\"message\": \"Xóa Sản phẩm thành công!\"}");
    }

    @GetMapping("/shippers")
    public ResponseEntity<List<Shipper>> getAllShippers() {
        return ResponseEntity.ok(shipperRepository.findAll());
    }
    
    @PostMapping("/shippers")
    public ResponseEntity<Shipper> createShipper(@RequestBody Shipper shipper) {
        List<Shipper> allShippers = shipperRepository.findAll();
        long nextId = 1;
        if (!allShippers.isEmpty()) {
            nextId = allShippers.stream()
                    .map(Shipper::getEmpCode)
                    .filter(code -> code != null && code.startsWith("SHP"))
                    .mapToLong(code -> {
                        try {
                            return Long.parseLong(code.substring(3));
                        } catch (Exception e) {
                            return 0;
                        }
                    })
                    .max()
                    .orElse(0L) + 1;
        }
        shipper.setEmpCode(String.format("SHP%03d", nextId));
        return ResponseEntity.ok(shipperRepository.save(shipper));
    }

    @PutMapping("/shippers/{id}")
    public ResponseEntity<Shipper> updateShipper(@PathVariable Long id, @RequestBody Shipper shipperDetails) {
        Shipper shipper = shipperRepository.findById(id).orElse(null);
        if (shipper == null) {
            return ResponseEntity.notFound().build();
        }
        
        shipper.setEmpCode(shipperDetails.getEmpCode());
        shipper.setName(shipperDetails.getName());
        shipper.setPhone(shipperDetails.getPhone());
        shipper.setAddress(shipperDetails.getAddress());
        shipper.setVehicle(shipperDetails.getVehicle());
        
        return ResponseEntity.ok(shipperRepository.save(shipper));
    }

    @DeleteMapping("/shippers/{id}")
    public ResponseEntity<?> deleteShipper(@PathVariable Long id) {
        if (!shipperRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        shipperRepository.deleteById(id);
        return ResponseEntity.ok().body("{\"message\": \"Xóa Shipper thành công!\"}");
    }

    @PostMapping("/orders/{orderId}/assign-shipper")
    public ResponseEntity<?> assignShipper(@PathVariable Long orderId, @RequestBody Map<String, Long> payload) {
        Order order = orderRepository.findById(orderId).orElse(null);
        Long shipperId = payload.get("shipperId");
        Shipper shipper = shipperRepository.findById(shipperId).orElse(null);
        
        if (order == null || shipper == null) {
            return ResponseEntity.badRequest().body("Đơn hàng hoặc Shipper không hợp lệ");
        }
        
        order.setShipper(shipper);
        orderRepository.save(order);
        
        return ResponseEntity.ok().body("{\"message\": \"Giao việc cho Shipper thành công!\"}");
    }

    @PutMapping("/orders/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long orderId, @RequestBody Map<String, Long> payload) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            return ResponseEntity.badRequest().body("Đơn hàng không tồn tại");
        }
        
        Long statusId = payload.get("statusId");
        
        // LƯU Ý CHO BẠN: Đoạn này phụ thuộc vào Entity Status của bạn.
        // Nếu Order có quan hệ ManyToOne với Entity Status, bạn cần dùng StatusRepository để tìm status rồi set vào order:
        // Status status = statusRepository.findById(statusId).orElse(null);
        // if(status != null) {
        //     order.setStatus(status);
        //     orderRepository.save(order);
        // }
        
        return ResponseEntity.ok().body("{\"message\": \"Cập nhật trạng thái thành công!\"}");
    }
}
