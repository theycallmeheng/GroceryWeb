package com.app.my_app.rest;

import com.app.my_app.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/reports")
public class ReportController {

    @Autowired
    private OrderService orderService;

    @GetMapping("/revenue")
    public ResponseEntity<Map<String, Object>> getRevenueStats() {
        return ResponseEntity.ok(orderService.getRevenueStats());
    }
}