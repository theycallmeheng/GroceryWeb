package com.app.my_app.rest;

import com.app.my_app.domain.Order;
import com.app.my_app.model.OrderDTO;
import com.app.my_app.service.OrderService;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import java.util.List;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping(value = "/api/orders", produces = MediaType.APPLICATION_JSON_VALUE)
public class OrderResource {

    private final OrderService orderService;

    public OrderResource(final OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrder(@PathVariable final Long id) {
        return ResponseEntity.ok(orderService.get(id));
    }

    @PostMapping
    @ApiResponse(responseCode = "201")
    public ResponseEntity<Long> createOrder(@RequestBody @Valid final OrderDTO orderDTO) {
        return new ResponseEntity<>(orderService.create(orderDTO), HttpStatus.CREATED);
    }

    public static class OrderRequestDTO {
        private String phone;
        private String address;
        private Double total;
        private String deliveryTime;
        private String paymentMethod;

        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public Double getTotal() { return total; }
        public void setTotal(Double total) { this.total = total; }
        public String getDeliveryTime() { return deliveryTime; }
        public void setDeliveryTime(String deliveryTime) { this.deliveryTime = deliveryTime; }
        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    }

    @PostMapping("/create")
    public Order createOrder(@RequestBody(required = false) OrderRequestDTO orderData) {
        // Truyền orderData nhận được xuống cho Service xử lý
        return orderService.makeOrder(orderData);
    }

    public static class StatusRequestDTO {
        private Long statusId;
        public Long getStatusId() { return statusId; }
        public void setStatusId(Long statusId) { this.statusId = statusId; }
    }

    public static class PaymentStatusRequestDTO {
        private String paymentStatus;
        public String getPaymentStatus() { return paymentStatus; }
        public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Void> updateOrderStatus(@PathVariable final Long id,
            @RequestBody StatusRequestDTO payload) {
        orderService.updateStatus(id, payload.getStatusId());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/payment-status")
    public ResponseEntity<Void> updatePaymentStatus(@PathVariable final Long id,
            @RequestBody PaymentStatusRequestDTO payload) {
        orderService.updatePaymentStatus(id, payload.getPaymentStatus());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> updateOrder(@PathVariable final Long id,
            @RequestBody @Valid final OrderDTO orderDTO) {
        orderService.update(id, orderDTO);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable final Long id) {
        try {
            orderService.cancelOrderByUser(id);
            return ResponseEntity.ok().body("{\"message\": \"Hủy đơn hàng thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @DeleteMapping("/{id}")
    @ApiResponse(responseCode = "204")
    public ResponseEntity<Void> deleteOrder(@PathVariable final Long id) {
        orderService.delete(id);
        return ResponseEntity.noContent().build();
    }

}
