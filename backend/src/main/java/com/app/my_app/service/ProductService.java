package com.app.my_app.service;

import com.app.my_app.domain.Category;
import com.app.my_app.domain.OrderItem;
import com.app.my_app.domain.Product;
import com.app.my_app.model.ProductDTO;
import com.app.my_app.repos.CategoryRepository;
import com.app.my_app.repos.OrderItemRepository;
import com.app.my_app.repos.ProductRepository;
import java.util.List;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;


@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;
    private final CategoryRepository categoryRepository;

    @Autowired
    private ModelMapper modelMapper;

    public ProductService(final ProductRepository productRepository,
            final OrderItemRepository orderItemRepository,
            final CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.orderItemRepository = orderItemRepository;
        this.categoryRepository = categoryRepository;
    }

    /**
     * Tìm tất cả các sản phẩm và trả lại chúng dưới dạng danh sách.
     *
     * @return Danh sách tất cả các sản phẩm trong cơ sở dữ liệu.
     */
    public List<Product> findAll() {
        return productRepository.findAll();
    }

    public Product get(final Long id) {
        return productRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    public Long create(final ProductDTO productDTO) {
        final Product product = new Product();
        mapToEntity(productDTO, product);
        return productRepository.save(product).getId();
    }

    public void update(final Long id, final ProductDTO productDTO) {
        final Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        mapToEntity(productDTO, product);
        productRepository.save(product);
    }

    public void addStock(final Long id, final Integer additionalQuantity, final Long importPrice) {
        final Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm"));
        
        // Yêu cầu Entity Product cần có trường 'quantity' (Integer)
        int currentStock = product.getQuantity() != null ? product.getQuantity() : 0;
        product.setQuantity(currentStock + additionalQuantity);

        final Long resolvedImportPrice = resolveImportPrice(importPrice, product.getPrice());
        if (resolvedImportPrice != null) {
            product.setImportPrice(resolvedImportPrice);
        }
        
        productRepository.save(product);
    }

    private Long resolveImportPrice(final Long inputImportPrice, final Long sellingPrice) {
        if (inputImportPrice != null && inputImportPrice >= 0) {
            return inputImportPrice;
        }
        if (sellingPrice == null) {
            return null;
        }
        final long price = sellingPrice;
        if (price >= 500000) return price - 100000;
        if (price >= 300000) return price - 70000;
        if (price >= 200000) return price - 60000;
        if (price >= 100000) return price - 30000;
        if (price >= 50000) return price - 20000;
        if (price >= 30000) return price - 10000;
        if (price >= 10000) return price - 5000;
        return price - 3000;
    }

    public void delete(final Long id) {
        productRepository.deleteById(id);
    }


    private Product mapToEntity(final ProductDTO productDTO, Product product) {
        product = modelMapper.map(productDTO, Product.class);
        if (productDTO.getCategory() != null && (product.getCategory() == null || !product.getCategory().getId().equals(productDTO.getCategory()))) {
            final Category category = categoryRepository.findById(productDTO.getCategory())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "category not found"));
            product.setCategory(category);
        }
        return product;
    }

}
