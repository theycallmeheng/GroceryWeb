package com.app.my_app.config;

import com.app.my_app.domain.User;
import com.app.my_app.domain.Shipper;
import com.app.my_app.repos.UserRepository;
import com.app.my_app.repos.ShipperRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminSeederConfig {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ShipperRepository shipperRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner initAdminUser() {
        return args -> {
            // Kiểm tra xem đã có tài khoản admin chưa
            User admin = userRepository.findByUsername("admin");
            if (admin == null) {
                admin = new User();
                admin.setUsername("admin");
                admin.setEmail("admin@grocery.com");
                admin.setPassword(passwordEncoder.encode("admin123")); // Mật khẩu là admin123
                admin.setRole("ROLE_ADMIN");
                admin.setFirstname("Trường");
                admin.setLastname("Quản Trị");
                admin.setPhone("0123456789");
                admin.setAddress("Hà Nội");
                
                userRepository.save(admin);
                System.out.println("Đã tự động tạo tài khoản quản trị: Tên đăng nhập: 'admin', Mật khẩu: 'admin123'");
            }
            
            if (shipperRepository.count() == 0) {
                Shipper shipper1 = new Shipper();
                shipper1.setEmpCode("SHP001");
                shipper1.setName("Nguyễn Văn Giao Hàng");
                shipper1.setPhone("0987654321");
                shipper1.setAddress("Hà Nội");
                shipper1.setVehicle("Xe máy Wave Alpha");
                
                Shipper shipper2 = new Shipper();
                shipper2.setEmpCode("SHP002");
                shipper2.setName("Trần Giao Nhanh");
                shipper2.setPhone("0901234567");
                shipper2.setAddress("Hồ Chí Minh");
                shipper2.setVehicle("Xe máy Sirius");
                
                shipperRepository.save(shipper1);
                shipperRepository.save(shipper2);
                System.out.println("Đã thêm mock data cho danh mục Shipper!");
            }
        };
    }
}
