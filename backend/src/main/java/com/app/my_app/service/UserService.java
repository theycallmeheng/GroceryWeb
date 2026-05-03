package com.app.my_app.service;

import com.app.my_app.domain.User;
import com.app.my_app.model.UserDTO;
import com.app.my_app.model.UserDetailsImpl;
import com.app.my_app.repos.UserRepository;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;


@Service
public class UserService  implements UserDetailsService {

    private static final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final UserRepository userRepository;

    @Autowired
    private ModelMapper modelMapper;



    public UserService(final UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<UserDTO> findAll() {
        return userRepository.findAll().stream().map(user -> mapToDTO(user, new UserDTO())).collect(Collectors.toList());
    }

    public User get(final Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    public Long create(final UserDTO userDTO) {
        final User user = new User();
        mapToEntity(userDTO, user);
        return userRepository.save(user).getId();
    }

    public void update(final Long id, final UserDTO userDTO) {
        final User user = userRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        // Kiểm tra ràng buộc duy nhất: username, email, phone (không được trùng với tài khoản người khác)
        if (userDTO.getUsername() != null && !userDTO.getUsername().equals(user.getUsername()) && userRepository.existsByUsername(userDTO.getUsername())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username này đã được sử dụng!");
        }
        if (userDTO.getEmail() != null && !userDTO.getEmail().equals(user.getEmail()) && userRepository.existsByEmail(userDTO.getEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email này đã được sử dụng!");
        }
        if (userDTO.getPhone() != null && !userDTO.getPhone().isEmpty() && !userDTO.getPhone().equals(user.getPhone()) && userRepository.existsByPhone(userDTO.getPhone())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại này đã được sử dụng!");
        }

        // Cập nhật thông tin
        if (userDTO.getUsername() != null) user.setUsername(userDTO.getUsername());
        if (userDTO.getEmail() != null) user.setEmail(userDTO.getEmail());
        if (userDTO.getFirstname() != null) user.setFirstname(userDTO.getFirstname());
        if (userDTO.getLastname() != null) user.setLastname(userDTO.getLastname());
        user.setAddress(userDTO.getAddress());
        user.setPhone(userDTO.getPhone());

        userRepository.save(user);
    }

    public User registerUser(UserDTO userDto) {
        User user = new User();
        
        // Nhận ID đã được tính toán từ Controller
        if (userDto.getId() != null) {
            user.setId(userDto.getId());
        }

        // Ánh xạ các thông tin cơ bản
        user.setUsername(userDto.getUsername());
        user.setEmail(userDto.getEmail());
        
        // Mã hóa mật khẩu trước khi lưu vào Database để chức năng Login hoạt động đúng
        user.setPassword(passwordEncoder.encode(userDto.getPassword()));
        
        // BỔ SUNG LƯU CÁC MỤC NHẬP MỚI VÀO DATABASE
        user.setFirstname(userDto.getFirstname());
        user.setLastname(userDto.getLastname());
        user.setPhone(userDto.getPhone());
        user.setAddress(userDto.getAddress());
        
        // Cấp quyền mặc định cho tài khoản đăng ký mới
        user.setRole("ROLE_USER");
        
        // Lưu xuống Database
        return userRepository.save(user);
    }

    public void delete(final Long id) {
        userRepository.deleteById(id);
    }

    private UserDTO mapToDTO(final User user, UserDTO userDTO) {
        userDTO = modelMapper.map(user, UserDTO.class);

        return userDTO;
    }

    private User mapToEntity(final UserDTO userDTO, User user) {
        user = modelMapper.map(userDTO, User.class);
        return user;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        String login = username == null ? null : username.toLowerCase(Locale.ROOT);
        User user = userRepository.findByUsername(login);
        if (user == null) {
            user = userRepository.findByEmail(login);
        }
        if (user == null) {
            throw new UsernameNotFoundException(username);
        }
        return new UserDetailsImpl(user);
    }



}
