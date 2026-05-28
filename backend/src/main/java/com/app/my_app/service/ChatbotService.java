package com.app.my_app.service;

import com.app.my_app.domain.Product;
import com.app.my_app.repos.ProductRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChatbotService {

    @Autowired
    private ProductRepository productRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // DÁN API KEY BẠN VỪA LẤY Ở GOOGLE STUDIO VÀO ĐÂY:
    private static final String GEMINI_API_KEY = "AIzaSyCvI2ZZt5MUdssIlJbMVjJWcDnVUkrWdLE";

    public Map<String, Object> processMessage(String message) {
        Map<String, Object> response = new HashMap<>();
        List<Product> suggestedProducts = new ArrayList<>();

        List<Product> allProducts = productRepository.findAll();
        
        // Gom danh sách sản phẩm thành chuỗi để gửi cho AI đọc
        String productListWithIds = allProducts.stream()
                .map(p -> p.getId() + " - " + p.getName())
                .collect(Collectors.joining(", "));

        // Tạo câu lệnh (Prompt) "thao túng tâm lý" Google Gemini
        String prompt = "Bạn là nhân viên tư vấn cửa hàng thực phẩm thân thiện. Khách hàng nói: \"" + message + "\".\n"
                + "Đây là danh sách sản phẩm shop đang có (ID - Tên sản phẩm):\n"
                + productListWithIds + "\n"
                + "Hãy tư vấn ngắn gọn và chọn ra các ID sản phẩm phù hợp nhất với yêu cầu để gợi ý cho khách.\n"
                + "BẮT BUỘC trả về kết quả ĐÚNG định dạng JSON sau (không chứa thẻ markdown, không chứa chữ ```json):\n"
                + "{\n"
                + "  \"reply\": \"Lời tư vấn của bạn\",\n"
                + "  \"productIds\": [danh sách các ID số nguyên]\n"
                + "}";

        try {
            // Cập nhật model AI thế hệ mới nhất của Google (gemini-2.5-flash) vì các bản cũ đã bị Google khai tử
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + GEMINI_API_KEY;
            
            Map<String, Object> parts = new HashMap<>();
            parts.put("text", prompt);
            Map<String, Object> contents = new HashMap<>();
            contents.put("parts", Collections.singletonList(parts));
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", Collections.singletonList(contents));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // Gọi sang máy chủ của Google
            ResponseEntity<JsonNode> apiResponse = restTemplate.postForEntity(url, entity, JsonNode.class);
            JsonNode body = apiResponse.getBody();
            
            if (body != null && body.has("candidates")) {
                String aiText = body.get("candidates").get(0).get("content").get("parts").get(0).get("text").asText();
                // Cắt bỏ thẻ markdown json nếu AI cố tình trả về
                aiText = aiText.replace("```json", "").replace("```", "").trim();
                
                JsonNode aiJson = objectMapper.readTree(aiText);
                String replyText = aiJson.has("reply") ? aiJson.get("reply").asText() : "Mình gợi ý cho bạn một số món này nhé:";
                
                // Lấy ID do AI suy luận ra và map với Database
                if (aiJson.has("productIds") && aiJson.get("productIds").isArray()) {
                    for (JsonNode idNode : aiJson.get("productIds")) {
                        Long pId = idNode.asLong();
                        allProducts.stream().filter(p -> p.getId().equals(pId)).findFirst().ifPresent(suggestedProducts::add);
                    }
                }
                
                response.put("reply", replyText);
                response.put("products", suggestedProducts);
                return response;
            }
        } catch (Exception e) {
            e.printStackTrace();
            String errorDetail = e.getMessage();
            if (errorDetail != null && errorDetail.contains("400")) {
                errorDetail = "API Key không hợp lệ (400 Bad Request). Bạn hãy kiểm tra lại Key nhé!";
            }
            response.put("reply", "Lỗi kết nối AI: " + errorDetail);
            response.put("products", new ArrayList<>());
            return response;
        }

        response.put("reply", "Xin lỗi, tôi chưa thể tìm ra món ăn phù hợp lúc này.");
        response.put("products", new ArrayList<>());
        return response;
    }
}