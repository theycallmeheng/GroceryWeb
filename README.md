Phần 1: Cài đặt môi trường cơ bản
    - Cài đặt Java (JDK 21): Vì Backend của bạn đang chạy Spring Boot 3.2.5 nên yêu cầu JDK tối thiểu là bản 17, tốt nhất bạn hãy tải và cài đặt JDK 21 (LTS) từ trang chủ Oracle hoặc Adoptium.
    - Cài đặt Node.js: Để chạy được Frontend React/Vite, bạn cần tải và cài đặt Node.js (Khuyên dùng bản LTS mới nhất từ trang chủ nodejs.org). Khi cài Node.js, công cụ npm sẽ tự động được cài theo.
    - Cài đặt MySQL: Tải và cài đặt MySQL Server (và MySQL Workbench hoặc DBeaver để dễ thao tác).
    - Cài đặt IDE (Trình soạn thảo code): Bạn nên dùng IntelliJ IDEA (hoặc Eclipse) cho Backend và Visual Studio Code cho Frontend.


Phần 2: Thiết lập Cơ sở dữ liệu (Database)
    - Mở MySQL Workbench (hoặc công cụ quản lý DB của bạn).
    - Tạo một database mới dành cho dự án (groceryweb).
    - Tạm thời bạn chưa cần tạo bảng, vì Spring Boot (thông qua Hibernate/JPA) sẽ tự động tạo các bảng dựa trên code Entity của bạn khi Backend khởi chạy.
     **Sau khi khởi chạy Backend(StringBoot) để hoàn tất quá trình tạo bảng thì ta execute lần lượt các file seed/taodanhmuc.sql và seed/product.sql vào MySQL Workbench để insert dữ liệu cơ bản vào bảng.**


Phần 3: Khởi chạy Backend (Spring Boot)
    - Mở IDE (IntelliJ IDEA) và chọn Open, sau đó trỏ tới thư mục backend của dự án đã clone về.
    - Chờ một chút để Maven tự động tải về các thư viện (hiển thị quá trình ở góc dưới màn hình).
    - Tìm và mở file cấu hình src/main/resources/application.yml (hoặc application.properties). Bạn cần cập nhật lại thông tin kết nối MySQL cho khớp với máy của bạn:

        spring:
            datasource:
                url: jdbc:mysql://localhost:3306/grocery_db?useSSL=false&serverTimezone=UTC
                username: root # Tên đăng nhập MySQL của bạn
                password: password_cua_ban # Mật khẩu MySQL của bạn
            jpa:
                hibernate:
                ddl-auto: update # Tự động tạo/cập nhật bảng

- Tìm file MyAppApplication.java (chứa hàm main), click chuột phải và chọn Run 'MyAppApplication.main()'. Backend sẽ khởi chạy thành công ở cổng 8081 (như cấu hình gọi API bên frontend).


Phần 4: Khởi chạy Frontend (ReactJS)
    - Mở Terminal (Command Prompt / PowerShell / Git Bash).
    
    - Di chuyển vào thư mục frontend của dự án:
    
    bash
    cd đường_dẫn_tới_dự_án/frontend

    - Cài đặt các thư viện cần thiết bằng lệnh:
    bash
    npm install

    - Khởi chạy server giao diện:
    bash
    npm run dev

- Sau khi lệnh chạy xong, Terminal sẽ hiển thị một đường link (thường là http://localhost:5173). Bạn click hoặc copy đường link đó dán lên trình duyệt (Chrome/Edge) là có thể sử dụng web!
