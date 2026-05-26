package com.app.my_app.model;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
public class OrderItemDTO {
    private Long id;

    private Integer quantity;

    @Size(max = 255)
    private String name;

    @Size(max = 255)
    private Long price;

    private Long order;

}
