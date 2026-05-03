package com.app.my_app.service;

import com.app.my_app.domain.*;
import com.app.my_app.model.OrderDTO;
import com.app.my_app.repos.OrderItemRepository;
import com.app.my_app.repos.OrderRepository;
import com.app.my_app.repos.OrderStatusRepository;
import com.app.my_app.repos.UserRepository;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.aspectj.weaver.ast.Or;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import javax.transaction.Transactional;


@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderStatusRepository orderStatusRepository;
    private final UserRepository userRepository;

    @Autowired
    OrderItemRepository orderItemRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserService userService;

    @Autowired
    private ModelMapper modelMapper;


    @Autowired
    private CartItemService cartItemService;

    public OrderService(final OrderRepository orderRepository,
                        final OrderStatusRepository orderStatusRepository,
                        final UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.orderStatusRepository = orderStatusRepository;
        this.userRepository = userRepository;
    }

    // Lấy tất cả danh sách order
    public List<Order> findAll() {
        return orderRepository.findAllByUsersId(authService.getCurrentUserId());
    }

    public Order get(final Long id) {
        return orderRepository.findById(id).orElse(null);
    }

    public Long create(final OrderDTO orderDTO) {
        final Order order = new Order();
        mapToEntity(orderDTO, order);
        return orderRepository.save(order).getId();
    }


    /**
     * Tạo order mới
     *
     * @return Order
     */
    @Transactional
    public Order makeOrder(com.app.my_app.rest.OrderResource.OrderRequestDTO orderData) {
        // Tạo order mới
        Order order = new Order();
        
        if (orderData != null && orderData.getAddress() != null && !orderData.getAddress().isEmpty()) {
            order.setAddress(orderData.getAddress());
        } else {
            order.setAddress(authService.getCurrentUser().getAddress());
        }
        
        if (orderData != null && orderData.getPhone() != null && !orderData.getPhone().isEmpty()) {
            order.setPhone(orderData.getPhone());
        } else {
            order.setPhone(authService.getCurrentUser().getPhone());
        }
        order.setUsers(authService.getCurrentUser());
        Long totalPrice = 0L;
        order.setTotal(totalPrice);


        Order updateOrder = orderRepository.save(order);

        List<OrderItem> orderItems = new ArrayList<>();
        // Get cart item;
        List<CartItem> cartItems = cartItemService.findAll();

        for (CartItem c : cartItems) {
            OrderItem o = new OrderItem();
            o.setName(c.getProduct().getName());
            o.setPrice(c.getProduct().getPrice());
            o.setQuantity(c.getQuantity());
            o.setOrder(updateOrder);
            o.setProduct(c.getProduct());
            OrderItem orderItemSave = orderItemRepository.save(o);
            orderItems.add(orderItemSave);
            totalPrice += o.getPrice() * o.getQuantity();
        }
        
        if (orderData != null && orderData.getTotal() != null) {
            updateOrder.setTotal(orderData.getTotal().longValue());
        } else {
            updateOrder.setTotal(totalPrice);
        }
        
        Set<OrderItem> os = new HashSet<>(orderItems);
        updateOrder.setOrderItems(os);
        // xóa
        cartItemService.deleteAll();

        return orderRepository.save(updateOrder);
    }

    public void update(final Long id, final OrderDTO orderDTO) {
        final Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        mapToEntity(orderDTO, order);
        orderRepository.save(order);
    }

    public void updateStatus(final Long id, final Long statusId) {
        if (statusId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "statusId is required");
        }
        final Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng"));
        
        OrderStatus status = orderStatusRepository.findById(statusId).orElse(null);
        
        if (status == null) {
            status = new OrderStatus();
            status.setId(statusId);
            if (statusId.equals(1L)) status.setName("Chờ xác nhận");
            else if (statusId.equals(2L)) status.setName("Đang chuẩn bị hàng");
            else if (statusId.equals(3L)) status.setName("Đang giao hàng");
            else if (statusId.equals(4L)) status.setName("Giao thành công");
            else if (statusId.equals(5L)) status.setName("Đã hủy");
            else status.setName("Trạng thái " + statusId);
            
            try {
                status = orderStatusRepository.save(status);
            } catch (Exception e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Bảng OrderStatus trong DB đang bị trống ID=" + statusId);
            }
        }
        
        order.setStatus(status);
        orderRepository.save(order);
    }

    public void delete(final Long id) {
        orderRepository.deleteById(id);
    }


    private Order mapToEntity(final OrderDTO orderDTO, Order order) {
        order = modelMapper.map(orderDTO, Order.class);
        if (orderDTO.getStatus() != null && (order.getStatus() == null || !order.getStatus().getId().equals(orderDTO.getStatus()))) {
            final OrderStatus status = orderStatusRepository.findById(orderDTO.getStatus())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "status not found"));
            order.setStatus(status);
        }
        if (orderDTO.getUsers() != null && (order.getUsers() == null || !order.getUsers().getId().equals(orderDTO.getUsers()))) {
            final User users = userRepository.findById(orderDTO.getUsers())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "users not found"));
            order.setUsers(users);
        }
        return order;
    }

}
