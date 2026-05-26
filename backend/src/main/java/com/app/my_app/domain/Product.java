package com.app.my_app.domain;

import java.util.Set;
import jakarta.persistence.*;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import lombok.Getter;
import lombok.Setter;


@Entity
@Getter
@Setter
public class Product {

    @Id
    @Column(nullable = false, updatable = false)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "\"description\"")
    private String description;

    @Column(length = 1000)
    private String image;

    @Column(nullable = false)
    private Long price;

    @Column(nullable = false, columnDefinition = "bigint default 0")
    private Long importPrice = 0L;

    @Column(nullable = false, columnDefinition = "integer default 0")
    private Integer quantity = 0;

    @Column(nullable = false, columnDefinition = "integer default 0")
    private Integer soldQuantity = 0;

    @Column(nullable = false, columnDefinition = "bigint default 0")
    private Long revenue = 0L;

    @Column(nullable = false, columnDefinition = "bigint default 0")
    private Long profit = 0L;

    @Column
    private String unit;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

}
