package com.app.my_app.rest;

import com.app.my_app.service.ShippingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/shipping")
@CrossOrigin(origins = "*")
public class ShippingResource {

    @Autowired
    private ShippingService shippingService;

    @PostMapping("/calculate")
    public Map<String, Object> calculateShipping(@RequestBody Map<String, String> payload) {
        String address = payload.get("address");
        String latStr = payload.get("lat");
        String lngStr = payload.get("lng");
        
        if (latStr != null && lngStr != null) {
            try {
                double lat = Double.parseDouble(latStr);
                double lng = Double.parseDouble(lngStr);
                return shippingService.calculateShippingDetailsWithCoords(address, lat, lng);
            } catch (NumberFormatException e) {
            }
        }
        return shippingService.calculateShippingDetails(address);
    }
}