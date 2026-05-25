package com.app.my_app.rest;

import com.app.my_app.domain.Product;
import com.app.my_app.domain.StockReceipt;
import com.app.my_app.repos.ProductRepository;
import com.app.my_app.repos.StockReceiptRepository;
import com.app.my_app.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/stock-receipts")
public class StockReceiptController {

    @Autowired
    private StockReceiptRepository stockReceiptRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private AuthService authService;

    @GetMapping
    public ResponseEntity<List<StockReceipt>> getAllReceipts() {
        return ResponseEntity.ok(stockReceiptRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<?> createReceipt(@RequestBody Map<String, Object> payload) {
        Long productId = Long.valueOf(payload.get("productId").toString());
        Integer quantity = Integer.valueOf(payload.get("quantity").toString());
        Long importPrice = payload.get("importPrice") != null ? Long.valueOf(payload.get("importPrice").toString()) : 0L;

        Product product = productRepository.findById(productId).orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại"));
        product.setQuantity((product.getQuantity() == null ? 0 : product.getQuantity()) + quantity);
        productRepository.save(product);

        StockReceipt receipt = new StockReceipt();
        receipt.setProduct(product); receipt.setUser(authService.getCurrentUser());
        receipt.setQuantity(quantity); receipt.setImportPrice(importPrice);
        return ResponseEntity.ok(stockReceiptRepository.save(receipt));
    }
}