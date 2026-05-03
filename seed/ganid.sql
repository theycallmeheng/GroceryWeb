-- Nước uống
UPDATE product SET category_id = 1 WHERE id IN (10,11,17,90,91,92,93,94,95,96,97,98,99);

-- Rau củ
UPDATE product SET category_id = 2 WHERE id IN (22,23,24,25,27,28,29);

-- Thịt và cá
UPDATE product SET category_id = 3 WHERE id IN (18,30,31,32,34,35,36,37,38,39,40,41,42,43,44,45,46,52,53,54,55);

-- Trứng và sữa
UPDATE product SET category_id = 4 WHERE id IN (12,19,33,80,81,82,83,84,85,86,87,88,89,120,121,122,123,125,126,127,128,129);

-- Bánh
UPDATE product SET category_id = 5 WHERE id IN (14,15,16,47,48,49,50,51,59,70,71,72,73,74,75,76,77,78,79);

-- Gia vị
UPDATE product SET category_id = 6 WHERE id IN (64,65,66,67,68,69,63);

-- Bổ sung Trái cây vào nhóm Rau củ (Category_id = 2)
UPDATE product SET category_id = 2 WHERE id IN (20, 21, 26);

-- Bổ sung Mì gói và Khoai tây đông lạnh vào nhóm Bánh/Đồ ăn nhanh (Category_id = 5)
UPDATE product SET category_id = 5 WHERE id IN (56, 57, 58, 60, 61, 62);

-- Cập nhật các sản phẩm còn lại vào nhóm 7
UPDATE product SET category_id = 7 WHERE id IN (13, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 124);