package com.app.my_app.config;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class HtmlForwardingFilter implements Filter {

    // Danh sách các đường dẫn giao diện đã bỏ đuôi .html
    private static final List<String> HTML_ROUTES = Arrays.asList(
            "/dangnhap", "/admin", "/orders", "/donhang", 
            "/giohang", "/thanhtoan", "/thongtincanhan", "/lienhe", "/dathangthanhcong"
    );

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        String path = req.getRequestURI();

        // Nếu đường dẫn truy cập khớp với danh sách giao diện, tự động forward (chuyển ngầm) tới file .html
        if (HTML_ROUTES.contains(path)) {
            request.getRequestDispatcher(path + ".html").forward(request, response);
            return;
        }

        chain.doFilter(request, response);
    }
}
