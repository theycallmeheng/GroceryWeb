package com.app.my_app.repos;

import com.app.my_app.domain.Shipper;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShipperRepository extends JpaRepository<Shipper, Long> {
}