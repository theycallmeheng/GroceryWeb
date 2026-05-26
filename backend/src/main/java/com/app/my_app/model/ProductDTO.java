package com.app.my_app.model;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
public class ProductDTO {

    private Long id;

    @Size(max = 255)
    private String name;

    @Size(max = 255)
    private String description;

    @Size(max = 1000)
    private String image;


    private Long price;

    private Long importPrice;


    private Integer quantity;

    private Integer soldQuantity;

    private Long revenue;

    private Long profit;

    @Size(max = 255)
    private String unit;

    private Long orderItem;

    private Long category;

}
