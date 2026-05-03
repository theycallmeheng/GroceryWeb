package com.app.my_app.domain;

import javax.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Shipper {

    @Id
    @Column(nullable = false, updatable = false)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String empCode; // Mã nhân viên

    @Column(nullable = false)
    private String name; // Tên NV

    @Column
    private String phone; // Số điện thoại

    @Column
    private String address; // Địa chỉ

    @Column
    private String vehicle; // Phương tiện giao hàng
}
