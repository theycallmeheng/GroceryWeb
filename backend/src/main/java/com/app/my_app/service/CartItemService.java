package com.app.my_app.service;

import com.app.my_app.domain.CartItem;
import com.app.my_app.model.CartItemDTO;
import com.app.my_app.repos.CartItemRepository;
import com.app.my_app.repos.ProductRepository;
import com.app.my_app.repos.UserRepository;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import jakarta.transaction.Transactional;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;


@Service
@Transactional
public class CartItemService {

    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @Autowired
    private AuthService authService;


    @Autowired
    private ProductService productService;

    @Autowired
    private ModelMapper modelMapper;

    public CartItemService(final CartItemRepository cartItemRepository,
                           final UserRepository userRepository, final ProductRepository productRepository) {
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }


    public List<CartItem> findAll() {
        return cartItemRepository.findAllByUserId(authService.getCurrentUserId());
    }

    public List<CartItem> findAllByUserId() {
        return cartItemRepository.findAllByUserId(authService.getCurrentUserId());
    }

    /**
     * Nếu mặt hàng trong giỏ hàng tồn tại, hãy trả lại, nếu không, hãy ném 404.
     *
     * @param id Id của mặt hàng giỏ hàng sẽ được truy xuất.
     * @return Một đối tượng CartItem
     */
    public CartItem get(final Long id) {
        return cartItemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }


    /**
     * nếu product đã có trong cart, tăng quantity lên 1, ngược lại tạo một mặt hàng giỏ hàng mới
     *
     * @param cartItemDTO The object that contains the data of the cart item to be created.
     * @return CartItem
     */
    @Transactional
    public CartItem create(final CartItemDTO cartItemDTO) {
        CartItem cartItem = cartItemRepository.findCartItemByProductIdAndUserId(cartItemDTO.getProductId(), authService.getCurrentUserId());
        if (cartItem != null) {
            cartItem.setQuantity(cartItem.getQuantity() + cartItemDTO.getQuantity());
        } else {
            cartItem = new CartItem();
            cartItem.setQuantity(cartItemDTO.getQuantity());
            cartItem.setProduct(productService.get(cartItemDTO.getProductId()));
            cartItem.setUser(authService.getCurrentUser());
        }
        return cartItemRepository.save(cartItem);
    }

    public List<CartItem> createTodaySuggestion() {
        List<Long> productIds = productRepository.findAll().stream()
                .filter(product -> product.getQuantity() != null && product.getQuantity() > 0)
                .filter(product -> !isNonFoodCategory(product))
                .map(product -> product.getId())
                .toList();

        if (productIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không còn món ăn phù hợp để gợi ý");
        }

        List<Long> shuffledProductIds = new ArrayList<>(productIds);
        Collections.shuffle(shuffledProductIds);

        int itemCount = Math.min(3, shuffledProductIds.size());
        List<CartItem> addedItems = new ArrayList<>();
        for (Long productId : shuffledProductIds.subList(0, itemCount)) {
            CartItemDTO cartItemDTO = new CartItemDTO();
            cartItemDTO.setProductId(productId);
            cartItemDTO.setQuantity(1);
            addedItems.add(create(cartItemDTO));
        }

        return addedItems;
    }

    private boolean isNonFoodCategory(com.app.my_app.domain.Product product) {
        if (product.getCategory() == null) {
            return false;
        }

        Long categoryId = product.getCategory().getId();
        if (categoryId != null && categoryId == 7L) {
            return true;
        }

        String categoryName = product.getCategory().getName();
        if (categoryName == null) {
            return false;
        }

        String normalizedName = categoryName.toLowerCase();
        return normalizedName.contains("hóa")
                || normalizedName.contains("mỹ phẩm")
                || normalizedName.contains("mĩ phẩm")
                || normalizedName.contains("đồ dùng");
    }


    /**
     * Xóa tất cả các mặt hàng trong giỏ hàng cho người dùng hiện tại.
     */
    public void deleteAll() {
        cartItemRepository.deleteAllByUserId(authService.getCurrentUserId());
    }


    /**
     * Cập nhật mặt hàng giỏ hàng với id đã cho với dữ liệu đã cho.
     *
     * @param id The id of the cart item to be updated.
     * @param cartItemDTO This is the object that contains the data that we want to update.
     * @return A CartItem object
     */
    public CartItem update(Long id, final CartItemDTO cartItemDTO) {
        CartItem cartItem = cartItemRepository.findById(id).orElse(null);
        cartItem.setQuantity(cartItemDTO.getQuantity());
        return cartItemRepository.save(cartItem);
    }

    public void delete(final Long id) {
        cartItemRepository.deleteById(id);
    }


}
