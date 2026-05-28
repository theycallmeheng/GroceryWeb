package com.app.my_app.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalTime;
import java.net.URI;
import org.springframework.web.util.UriComponentsBuilder;
import java.util.HashMap;
import java.util.Map;

@Service
public class ShippingService {

    private final RestTemplate restTemplate;

    // Tọa độ của shop tại 120 Yên Lãng, Đống Đa, Hà Nội
    private static final double STORE_LAT = 21.012563;
    private static final double STORE_LON = 105.817457;

    public ShippingService() {
        this.restTemplate = new RestTemplate();
    }

    public Map<String, Object> calculateShippingDetails(String customerAddress) {
        Map<String, Object> result = new HashMap<>();
        result.put("fee", 30000L);
        result.put("distance", 0.0);
        result.put("isRaining", false);
        result.put("isRushHour", false);

        if (customerAddress == null || customerAddress.trim().isEmpty()) {
            return result;
        }

        // Chặn giao hàng ngoài Hà Nội
        String lowerAddress = customerAddress.toLowerCase();
        if (!lowerAddress.contains("hà nội") && !lowerAddress.contains("hanoi") && !lowerAddress.contains("ha noi")) {
            result.put("error", "Rất xin lỗi, hiện tại shop chỉ hỗ trợ giao hàng trong khu vực Hà Nội.");
            result.put("fee", 0L);
            return result;
        }

        try {
            // 1. Chuyển địa chỉ thành tọa độ
            double[] coords = getCoordinatesFromAddress(customerAddress);
            if (coords == null) {
                return result; // Địa chỉ khó tìm, lấy đồng giá 30k
            }
            return doCalculateWithCoords(coords[0], coords[1]);

        } catch (Exception e) {
            e.printStackTrace();
            return result; // Fallback an toàn
        }
    }

    public Map<String, Object> calculateShippingDetailsWithCoords(String customerAddress, double cusLat, double cusLon) {
        // Chặn giao hàng ngoài Hà Nội
        if (customerAddress != null && !customerAddress.trim().isEmpty()) {
            String lowerAddress = customerAddress.toLowerCase();
            if (!lowerAddress.contains("hà nội") && !lowerAddress.contains("hanoi") && !lowerAddress.contains("ha noi")) {
                Map<String, Object> errorResult = new HashMap<>();
                errorResult.put("error", "Rất xin lỗi, hiện tại shop chỉ hỗ trợ giao hàng trong khu vực Hà Nội.");
                errorResult.put("fee", 0L);
                return errorResult;
            }
        }
        return doCalculateWithCoords(cusLat, cusLon);
    }

    private Map<String, Object> doCalculateWithCoords(double cusLat, double cusLon) {
        Map<String, Object> result = new HashMap<>();
        result.put("fee", 30000L);
        result.put("distance", 0.0);
        result.put("isRaining", false);
        result.put("isRushHour", false);

        try {
            // 2. Tính khoảng cách
            double distanceKm = getDistanceFromOSRM(STORE_LON, STORE_LAT, cusLon, cusLat);
            result.put("distance", distanceKm);

            // 3. Kiểm tra thời tiết
            boolean isRaining = checkIsRaining(cusLat, cusLon);
            result.put("isRaining", isRaining);

            // 4. Kiểm tra giờ cao điểm (17h - 19h)
            boolean isRushHour = checkIsRushHour();
            result.put("isRushHour", isRushHour);

            // 5. Tính tổng phí: Lấy số KM nhân 5000, sau đó làm tròn đến hàng nghìn
            double rawFee = distanceKm * 5000;
            long totalFee = (long) Math.round(rawFee / 1000.0) * 1000;
            
            if (totalFee < 5000) {
                totalFee = 5000; // Mức phí ship tối thiểu nếu khách ở quá gần
            }

            if (isRaining) {
                totalFee += 7000; // Mưa cộng thêm 7k
            }

            if (isRushHour) {
                totalFee += 5000; // Giờ cao điểm cộng 5k
            }

            result.put("fee", totalFee);
            return result;

        } catch (Exception e) {
            e.printStackTrace();
            return result; // Fallback an toàn
        }
    }
    // Wrapper giữ nguyên hàm cũ để OrderService lưu DB không bị lỗi
    public long calculateShippingFee(String customerAddress) {
        Map<String, Object> details = calculateShippingDetails(customerAddress);
        return ((Number) details.get("fee")).longValue();
    }

    private double[] getCoordinatesFromAddress(String address) {
        // Sử dụng UriComponentsBuilder để tự động mã hóa dấu cách và tiếng Việt
        URI uri = UriComponentsBuilder.fromHttpUrl("https://nominatim.openstreetmap.org/search")
                .queryParam("q", address)
                .queryParam("format", "json")
                .queryParam("limit", 1)
                .build()
                .encode()
                .toUri();

        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "GroceryWebApp/1.0");
        HttpEntity<String> entity = new HttpEntity<>(headers);
        ResponseEntity<JsonNode[]> response = restTemplate.exchange(uri, HttpMethod.GET, entity, JsonNode[].class);
        JsonNode[] nodes = response.getBody();
        if (nodes != null && nodes.length > 0) {
            double lat = nodes[0].get("lat").asDouble();
            double lon = nodes[0].get("lon").asDouble();
            return new double[]{lat, lon};
        }
        return null;
    }

    private double getDistanceFromOSRM(double lon1, double lat1, double lon2, double lat2) {
        String url = "http://router.project-osrm.org/route/v1/driving/" + lon1 + "," + lat1 + ";" + lon2 + "," + lat2 + "?overview=false";
        JsonNode response = restTemplate.getForObject(url, JsonNode.class);
        if (response != null && response.has("routes") && response.get("routes").isArray()) {
            JsonNode route = response.get("routes").get(0);
            return route.get("distance").asDouble() / 1000.0;
        }
        return 0;
    }

    private boolean checkIsRaining(double lat, double lon) {
        // Mã thời tiết > 50 của WMO thường là đang có mưa
        String url = "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon + "&current_weather=true";
        JsonNode response = restTemplate.getForObject(url, JsonNode.class);
        
        if (response != null && response.has("current_weather")) {
            int weatherCode = response.get("current_weather").get("weathercode").asInt();
            
            System.out.println("==== KIỂM TRA THỜI TIẾT ====");
            System.out.println("Tọa độ khách hàng: " + lat + ", " + lon);
            System.out.println("Mã thời tiết (Weather Code) trả về: " + weatherCode);
            
            return weatherCode >= 50;
        }
        return false;
    }

    private boolean checkIsRushHour() {
        LocalTime now = LocalTime.now();
        boolean isLunchRush = now.isAfter(LocalTime.of(11, 0)) && now.isBefore(LocalTime.of(13, 0));
        boolean isDinnerRush = now.isAfter(LocalTime.of(17, 0)) && now.isBefore(LocalTime.of(19, 0));
        return isLunchRush || isDinnerRush;
    }
}