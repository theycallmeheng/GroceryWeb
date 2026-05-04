package com.app.my_app.service;

import com.app.my_app.domain.*;
import com.app.my_app.model.OrderDTO;
import com.app.my_app.repos.OrderItemRepository;
import com.app.my_app.repos.OrderRepository;
import com.app.my_app.repos.OrderStatusRepository;
import com.app.my_app.repos.ProductRepository;
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

    @Autowired
    private ProductRepository productRepository;

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

        // Đặt trạng thái mặc định là 1 (Chờ xác nhận) khi vừa đặt hàng
        OrderStatus defaultStatus = orderStatusRepository.findById(1L).orElse(null);
        if (defaultStatus == null) {
            defaultStatus = new OrderStatus();
            defaultStatus.setId(1L);
            defaultStatus.setName("Chờ xác nhận");
            try {
                defaultStatus = orderStatusRepository.save(defaultStatus);
            } catch (Exception ignored) {}
        }
        order.setStatus(defaultStatus);

        Order updateOrder = orderRepository.save(order);

        List<OrderItem> orderItems = new ArrayList<>();
        // Get cart item;
        List<CartItem> cartItems = cartItemService.findAll();

        for (CartItem c : cartItems) {
            Product product = c.getProduct();
            if (product.getQuantity() == null || product.getQuantity() < c.getQuantity()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sản phẩm " + product.getName() + " không đủ số lượng tồn kho!");
            }
            // Trừ số lượng tồn kho
            product.setQuantity(product.getQuantity() - c.getQuantity());
            productRepository.save(product);

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

    @Transactional
    public void updateStatus(final Long id, final Long statusId) {
        if (statusId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "statusId is required");
        }
        final Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng"));
        
        Long oldStatusId = order.getStatus() != null ? order.getStatus().getId() : null;
        
        // Chặn cập nhật trạng thái nếu đơn hàng hiện tại đã bị hủy
        if (oldStatusId != null && oldStatusId.equals(5L) && !statusId.equals(5L)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đơn hàng đã bị hủy, không thể cập nhật trạng thái mới!");
        }

        // Chặn cập nhật trạng thái nếu đơn hàng đã giao thành công
        if (oldStatusId != null && oldStatusId.equals(4L) && !statusId.equals(4L)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đơn hàng đã giao thành công, không thể cập nhật trạng thái mới!");
        }

        // Xử lý khi giao hàng thành công (Trạng thái ID = 4) -> Tính doanh thu, lợi nhuận, số lượng bán
        if (statusId.equals(4L) && (oldStatusId == null || !oldStatusId.equals(4L))) {
            if (order.getOrderItems() != null) {
                for (OrderItem item : order.getOrderItems()) {
                    Product p = item.getProduct();
                    if (p != null) {
                        Long itemPrice = item.getPrice() != null ? item.getPrice() : p.getPrice();
                        Long importPrice = calculateImportPrice(itemPrice);
                        Long itemProfit = itemPrice - importPrice;

                        p.setSoldQuantity((p.getSoldQuantity() == null ? 0 : p.getSoldQuantity()) + item.getQuantity());
                        p.setRevenue((p.getRevenue() == null ? 0L : p.getRevenue()) + (itemPrice * item.getQuantity()));
                        p.setProfit((p.getProfit() == null ? 0L : p.getProfit()) + (itemProfit * item.getQuantity()));
                        productRepository.save(p);
                    }
                }
            }
        }

        // Xử lý hoàn trả/trừ lại tồn kho khi thay đổi trạng thái Hủy đơn (Trạng thái ID = 5)
        if (statusId.equals(5L) && (oldStatusId == null || !oldStatusId.equals(5L))) {
            // Chuyển sang trạng thái "Đã hủy" -> Cộng lại tồn kho
            if (order.getOrderItems() != null) {
                for (OrderItem item : order.getOrderItems()) {
                    Product p = item.getProduct();
                    if (p != null) {
                        p.setQuantity((p.getQuantity() == null ? 0 : p.getQuantity()) + item.getQuantity());
                        productRepository.save(p);
                    }
                }
            }
        } else if (!statusId.equals(5L) && oldStatusId != null && oldStatusId.equals(5L)) {
            // Đơn hàng từ trạng thái "Đã hủy" vô tình bị chuyển sang trạng thái khác -> Trừ lại tồn kho
            if (order.getOrderItems() != null) {
                for (OrderItem item : order.getOrderItems()) {
                    Product p = item.getProduct();
                    if (p != null) {
                        if (p.getQuantity() == null || p.getQuantity() < item.getQuantity()) {
                            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sản phẩm " + p.getName() + " không đủ tồn kho để khôi phục đơn hàng!");
                        }
                        p.setQuantity(p.getQuantity() - item.getQuantity());
                        productRepository.save(p);
                    }
                }
            }
        }

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

    private Long calculateImportPrice(Long sellingPrice) {
        if (sellingPrice == null) return 0L;
        if (sellingPrice >= 500000) return sellingPrice - 100000;
        if (sellingPrice >= 300000) return sellingPrice - 70000;
        if (sellingPrice >= 200000) return sellingPrice - 60000;
        if (sellingPrice >= 100000) return sellingPrice - 30000;
        if (sellingPrice >= 50000) return sellingPrice - 20000;
        if (sellingPrice >= 30000) return sellingPrice - 10000;
        if (sellingPrice >= 10000) return sellingPrice - 5000;
        return sellingPrice - 3000;
    }
}
