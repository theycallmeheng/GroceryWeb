package com.app.my_app.repos;

import com.app.my_app.domain.StockReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StockReceiptRepository extends JpaRepository<StockReceipt, Long> {
}