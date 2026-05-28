package com.app.my_app.service;

import com.app.my_app.domain.*;
import com.app.my_app.model.OrderDTO;
import com.app.my_app.repos.OrderItemRepository;
import com.app.my_app.repos.OrderRepository;
import com.app.my_app.repos.OrderStatusRepository;
import com.app.my_app.repos.ProductRepository;
import com.app.my_app.repos.UserRepository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
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

import jakarta.transaction.Transactional;


@Service
public class OrderService {

    private static final String PAYMENT_STATUS_PENDING = "Chờ xác nhận";
    private static final String PAYMENT_STATUS_UNPAID = "Chưa thanh toán";
    private static final String PAYMENT_STATUS_PAID = "Đã thanh toán";

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
    
    @Autowired
    private ShippingService shippingService;

    public OrderService(final OrderRepository orderRepository,
                        final OrderStatusRepository orderStatusRepository,
                        final UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.orderStatusRepository = orderStatusRepository;
        this.userRepository = userRepository;
    }

    // Lấy tất cả danh sách order
    public List<Order> findAll() {
        User currentUser = authService.getCurrentUser();
        if (currentUser != null && "ROLE_ADMIN".equals(currentUser.getRole())) {
            return orderRepository.findAll(); // Admin được xem toàn bộ đơn của khách
        }
        return orderRepository.findAllByUsersId(currentUser.getId()); // Khách chỉ xem đơn của mình
    }

    public Order get(final Long id) {
        return orderRepository.findById(id).orElse(null);
    }

    public Long create(final OrderDTO orderDTO) {
        final Order order = new Order();
        mapToEntity(orderDTO, order);
        if (order.getPaymentMethod() == null || order.getPaymentMethod().isEmpty() || !"QR".equalsIgnoreCase(order.getPaymentMethod())) {
            order.setPaymentMethod("Tiền mặt");
        } else {
            order.setPaymentMethod("QR");
        }
        if (order.getPaymentStatus() == null || order.getPaymentStatus().isEmpty()) {
            order.setPaymentStatus(PAYMENT_STATUS_PENDING);
        }
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

        // Xác minh lại địa chỉ một lần nữa khi lưu DB để tránh người dùng lách luật
        String lowerAddress = order.getAddress() != null ? order.getAddress().toLowerCase() : "";
        if (!lowerAddress.contains("hà nội") && !lowerAddress.contains("hanoi") && !lowerAddress.contains("ha noi")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rất xin lỗi, shop chỉ hỗ trợ giao hàng trong khu vực Hà Nội.");
        }
        
        if (orderData != null && orderData.getPhone() != null && !orderData.getPhone().isEmpty()) {
            order.setPhone(orderData.getPhone());
        } else {
            order.setPhone(authService.getCurrentUser().getPhone());
        }
        if (orderData != null && orderData.getPaymentMethod() != null && !orderData.getPaymentMethod().isEmpty()
                && "QR".equalsIgnoreCase(orderData.getPaymentMethod())) {
            order.setPaymentMethod("QR");
        } else {
            order.setPaymentMethod("Tiền mặt");
        }
        order.setPaymentStatus(PAYMENT_STATUS_PENDING);
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
            // Chỉ tự tính lại tiền ship nếu Frontend vì lý do nào đó không gửi tổng tiền lên
            long shippingFee = shippingService.calculateShippingFee(order.getAddress());
            updateOrder.setTotal(totalPrice + shippingFee);
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
    public void updatePaymentStatus(final Long id, final String paymentStatus) {
        if (paymentStatus == null || paymentStatus.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "paymentStatus is required");
        }
        if (!isValidPaymentStatus(paymentStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái thanh toán không hợp lệ");
        }
        final Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng"));
        order.setPaymentStatus(paymentStatus);
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
            else if (statusId.equals(6L)) status.setName("Yêu cầu hủy");
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

    @Transactional
    public void cancelOrderByUser(final Long id) {
        final Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng"));
        
        // Kiểm tra xem đơn hàng có thuộc về user hiện hành không
        if (order.getUsers() == null || !order.getUsers().getId().equals(authService.getCurrentUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền hủy đơn hàng của người khác!");
        }

        Long oldStatusId = order.getStatus() != null ? order.getStatus().getId() : null;
        
        // Chỉ cho phép hủy khi đang ở trạng thái Chờ xác nhận (1) hoặc Đang chuẩn bị hàng (2).
        // Trạng thái Đang giao hàng (3) không được phép yêu cầu hủy theo quy định mới.
        if (oldStatusId == null || !(oldStatusId.equals(1L) || oldStatusId.equals(2L))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn chỉ có thể hủy đơn hàng khi đang ở trạng thái Chờ xác nhận hoặc Đang chuẩn bị!");
        }

        // Luôn chuyển sang trạng thái "Yêu cầu hủy" (6) để chờ Admin phê duyệt.
        updateStatus(id, 6L);
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

    public Map<String, Object> getRevenueStats() {
        List<Order> orders = orderRepository.findAll();
        long totalRevenue = 0;
        long totalProfit = 0;
        Map<Long, Map<String, Object>> productStatsMap = new HashMap<>();

        for (Order order : orders) {
            if (order.getStatus() != null && order.getStatus().getId().equals(4L)) {
                if (order.getOrderItems() != null) {
                    for (OrderItem item : order.getOrderItems()) {
                        long itemPrice = item.getPrice() != null ? item.getPrice() : (item.getProduct() != null && item.getProduct().getPrice() != null ? item.getProduct().getPrice() : 0L);
                        long qty = item.getQuantity() != null ? item.getQuantity() : 0L;
                        long rev = itemPrice * qty;
                        long importPrice = calculateImportPrice(itemPrice);
                        long prof = (itemPrice - importPrice) * qty;

                        totalRevenue += rev;
                        totalProfit += prof;

                        Long productId = item.getProduct() != null ? item.getProduct().getId() : (item.getName() != null ? (long) item.getName().hashCode() : 0L);
                        String productName = item.getProduct() != null ? item.getProduct().getName() : (item.getName() != null ? item.getName() : "Unknown");

                        Map<String, Object> stat = productStatsMap.getOrDefault(productId, new HashMap<>());
                        stat.put("id", productId);
                        stat.put("name", productName);
                        stat.put("sellPrice", itemPrice);
                        stat.put("importPrice", importPrice);
                        stat.put("quantity", ((Number) stat.getOrDefault("quantity", 0L)).longValue() + qty);
                        stat.put("totalRev", ((Number) stat.getOrDefault("totalRev", 0L)).longValue() + rev);
                        stat.put("totalProf", ((Number) stat.getOrDefault("totalProf", 0L)).longValue() + prof);
                        productStatsMap.put(productId, stat);
                    }
                }
            }
        }
        List<Map<String, Object>> productStatsList = new ArrayList<>(productStatsMap.values());
        productStatsList.sort((a, b) -> Long.compare(((Number) b.get("quantity")).longValue(), ((Number) a.get("quantity")).longValue()));

        Map<String, Object> result = new HashMap<>();
        result.put("totalRevenue", totalRevenue);
        result.put("totalProfit", totalProfit);
        result.put("productStats", productStatsList);
        return result;
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

    private boolean isValidPaymentStatus(final String paymentStatus) {
        return PAYMENT_STATUS_PENDING.equals(paymentStatus)
                || PAYMENT_STATUS_UNPAID.equals(paymentStatus)
                || PAYMENT_STATUS_PAID.equals(paymentStatus);
    }
}
