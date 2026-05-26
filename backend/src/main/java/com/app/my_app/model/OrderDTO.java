package com.app.my_app.model;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
public class OrderDTO {

    private Long id;

    private Long total;

    @Size(max = 255)
    private String address;

    @Size(max = 255)
    private String paymentMethod;

    @Size(max = 255)
    private String paymentStatus;

    private Long status;

    private Long users;

}
