# Đợt 2 — kiểm tra chéo dữ liệu, ảnh và migration

Phạm vi chính thức gồm 65 sản phẩm đang hoạt động ở ba danh mục: 25 điện thoại,
15 máy tính bảng và 25 laptop. Giá bán, tồn kho, khuyến mãi và đánh giá là dữ
liệu demo; phần kiểm tra này chỉ xác nhận model/cấu hình, ảnh và luồng sử dụng.

Ký hiệu nguồn: **A** Apple Support/Newsroom; **S** Samsung Support/Newsroom;
**X** Xiaomi; **O** OPPO; **H** HUAWEI; **L** Lenovo PSREF; **AS** ASUS;
**D** Dell Support; **HP** HP Support và trang bán đúng SKU; **AC** Acer;
**M** MSI; **R** trang hãng Realme/Vivo; **LC** catalogue legacy đã có trong
repo và đối chiếu chéo theo model. `OK` nghĩa là ảnh local sạch, đúng dòng/model
sau khi xem trực quan. `Chờ ảnh` là placeholder trung tính, không giả làm ảnh
sản phẩm.

| ID | Tên / model-SKU | Trạng thái dữ liệu | File ảnh | Nguồn | Trạng thái ảnh | Đã sửa |
|---|---|---|---|---|---|---|
| Sam0 | Samsung Galaxy J4+ | Khớp model | samsung-galaxy-j4-plus-pink-400x400.jpg | S/LC | OK | Chuẩn hóa tên |
| Xia0 | Xiaomi Mi 8 Lite 4/64 | Khớp | xiaomi-mi-8-lite-black-1-600x600.jpg | X/LC | OK | — |
| Opp0 | OPPO F9 4/64 | Khớp | oppo-f9-red-600x600.jpg | O/LC | OK | Chuẩn hóa OPPO |
| Nok0 | Nokia 5.1 Plus 3/32 | Khớp | image-updating.svg | LC | Chờ ảnh sạch | Bỏ ảnh có huy hiệu quảng cáo |
| Sam1 | Galaxy A8+ (2018) | Khớp | samsung-galaxy-a8-plus-2018-gold-600x600.jpg | S/LC | OK | — |
| App0 | iPhone X 256GB | Khớp | iphone-x-256gb-silver-400x400.jpg | A | OK | — |
| Opp1 | OPPO A3s 32GB | Khớp | oppo-a3s-32gb-600x600.jpg | O/LC | OK | Chuẩn hóa OPPO |
| Sam2 | Galaxy J8 | Khớp | samsung-galaxy-j8-600x600-600x600.jpg | S/LC | OK | — |
| App2 | iPhone 7 Plus 32GB | Khớp | iphone-7-plus-32gb-hh-600x600.jpg | A | OK | — |
| Xia1 | Xiaomi Mi 8 6/64 | Đã khớp Mi 8 | xiaomi-mi-8-1-600x600.jpg | X | OK | Sửa màn hình/CPU/RAM/camera/pin/thẻ nhớ |
| Mob0 | Mobiistar X | Khớp model legacy | mobiistar-x-3-600x600.jpg | LC | OK | — |
| Mob1 | Mobiistar Zumbo S2 Dual | Khớp model legacy | mobiistar-zumbo-s2-dual-300x300.jpg | LC | OK | — |
| Mob2 | Mobiistar E Selfie | Khớp model legacy | mobiistar-e-selfie-300-1copy-600x600.jpg | LC | OK | — |
| Mob3 | Mobiistar B310 | Khớp model legacy | mobiistar-b310-orange-600x600.jpg | LC | OK | — |
| Xia2 | Redmi Note 5 | Khớp | xiaomi-redmi-note-5-pro-600x600.jpg | X/LC | OK | — |
| Xia3 | Redmi 5 Plus 4GB | Khớp | xiaomi-redmi-5-plus-600x600.jpg | X/LC | OK | — |
| Hua0 | HUAWEI Mate 20 Pro | Khớp | huawei-mate-20-pro-green-600x600.jpg | H | OK | — |
| Hua1 | HUAWEI nova 3 | Khớp | huawei-nova-3-2-600x600.jpg | H | OK | — |
| Hua2 | HUAWEI Y5 2017 | Khớp | huawei-y5-2017-300x300.jpg | H/LC | OK | — |
| DT-IP13 | iPhone 13 128GB | Khớp | pilot-iphone-13.png | A | OK | — |
| DT-SS23 | Galaxy S23 5G 128GB | Khớp | pilot-samsung-galaxy-s23.png | S | OK | — |
| DT-OPRE11 | OPPO Reno11 5G 256GB | Khớp | oppo-reno-11.png | O | OK | — |
| DT-XIN13 | Redmi Note 13 128GB | Khớp | xiaomi-redmi-note-13.png | X | OK | — |
| DT-REAC67 | Realme C67 128GB | Khớp | realme-c67.png | R | OK | — |
| DT-VIVV29 | Vivo V29e 5G 256GB | Khớp | vivo-v29e.png | R | OK | — |
| App1 | iPad (thế hệ 6, 2018) Wi‑Fi 32GB | Khớp | ipad-wifi-32gb-2018-thumb-600x600.jpg | A | OK | Sửa tên màn hình và pin theo thời lượng hãng |
| TB-IP9 | iPad 9 Wi‑Fi 64GB | Khớp | ipad-gen-9.png | A | OK | — |
| TB-IP10 | iPad 10 Wi‑Fi 64GB | Khớp | pilot-ipad-gen-10.jpg | A | OK | — |
| TB-IPAIR5 | iPad Air 5 M1 64GB | Khớp | ipad-air-5.png | A | OK | — |
| TB-IPMINI6 | iPad mini 6 64GB | Khớp | ipad-mini-6.png | A | OK | — |
| TB-IPPRO11 | iPad Pro 11 M2 128GB | Khớp | ipad-pro-11.jpg | A | OK | — |
| TB-SSA9 | Galaxy Tab A9 Wi‑Fi 64GB | Khớp | samsung-galaxy-tab-a9.png | S | OK | — |
| TB-SSA9P | Galaxy Tab A9+ Wi‑Fi 64GB | Khớp | samsung-galaxy-tab-a9-plus.jpg | S | OK | — |
| TB-SSS9FE | Galaxy Tab S9 FE Wi‑Fi 128GB | Khớp | samsung-galaxy-tab-s9-fe.jpg | S | OK | — |
| TB-SSS9 | Galaxy Tab S9 128GB | Khớp | pilot-samsung-galaxy-tab-s9.png | S | OK | — |
| TB-XIPAD6 | Xiaomi Pad 6 128GB | Khớp | xiaomi-pad-6.jpg | X | OK | — |
| TB-REDPAD | Redmi Pad SE 128GB | Khớp | redmi-pad-se.png | X | OK | — |
| TB-LENM11 | Lenovo Tab M11 64GB | Khớp | lenovo-tab-m11.png | L | OK | — |
| TB-LENP11 | Lenovo Tab P11 Gen 2 128GB | Khớp | lenovo-tab-p11.png | L | OK | — |
| TB-OPPAD2 | OPPO Pad Neo 128GB | Khớp | oppo-pad-neo.png | O | OK | — |
| LT-APM1 | MacBook Air 13 M1 8/256 | Khớp | pilot-macbook-air-m1.jpg | A | OK | Thêm GPU 7 lõi |
| LT-APM2 | MacBook Air 13 M2 8/256 | Khớp | macbook-air-m2.jpg | A | OK | Thêm GPU 8 lõi |
| LT-APM3 | MacBook Air 13 M3 16/256 | Khớp cấu hình | macbook-air-m3.jpg | A | OK | Thêm GPU 8 lõi |
| LT-APPR14 | MacBook Pro 14 M3 16/512 | Khớp cấu hình | macbook-pro-14-m3.jpg | A | OK | Thêm GPU 10 lõi |
| LT-ASVIVO15 | ASUS Vivobook 15 X1504ZA | Khớp dòng/cấu hình | asus-vivobook-15.png | AS | OK | Thêm GPU |
| LT-ASVIVO14 | ASUS Vivobook 14 OLED A1405VA | Khớp dòng/cấu hình | asus-vivobook-14.jpg | AS | OK | Thêm GPU |
| LT-ASZEN14 | ASUS Zenbook 14 OLED UX3405MA | Khớp dòng/cấu hình | asus-zenbook-14.jpg | AS | OK | Thêm GPU |
| LT-ASTUF15 | ASUS TUF F15 FX506HF | Khớp | asus-tuf-gaming-f15.jpg | AS | OK | Thêm RTX 2050 |
| LT-ASROG6 | ASUS ROG Strix G16 G614JU | Khớp | asus-rog-strix-g16.png | AS | OK | Thêm RTX 4050 |
| LT-DELL3520 | Dell Inspiron 15 3520 i5 | Khớp dòng/cấu hình | dell-inspiron-15-3520.png | D | OK | Thêm GPU |
| LT-DELL3530 | Dell Inspiron 15 3530 i7 | Khớp dòng/cấu hình | image-updating.svg | D | Chờ ảnh sạch | Bỏ ảnh có người/watermark |
| LT-DELLVO15 | Dell Vostro 15 3520 i3 | Khớp dòng/cấu hình | dell-vostro-15-3520.jpg | D | OK | Thêm GPU |
| LT-DELLXPS13 | Dell XPS 13 9315 i5 | Khớp | dell-xps-13.png | D | OK | Thêm GPU |
| LT-HP15S | HP 15s-fq5229TU | Khớp model | image-updating.svg | HP | Chờ ảnh sạch | Bỏ ảnh infographic |
| LT-HPPAV14 | HP Pavilion 14-dv2073TU (7C0P2PA) | Khớp SKU | hp-pavilion-14.jpg | HP | OK | Thêm GPU |
| LT-HPENVY13 | HP Envy x360 13-bf0094TU (76B14PA) | Khớp SKU | hp-envy-x360.jpg | HP | OK | Thêm GPU |
| LT-HPVICT16 | HP Victus 16-r0129TX (8C5N4PA) | Đã sửa đúng SKU | image-updating.svg | HP | Chờ ảnh đúng SKU | Sửa i7-13700H + RTX 3050 6GB; bỏ ảnh r0374TX |
| LT-LENID3 | IdeaPad 3 15ITL6 | Khớp dòng/cấu hình | lenovo-ideapad-3.jpg | L | OK | Thêm GPU |
| LT-LENID5 | IdeaPad Slim 5 14IRH8 | Khớp dòng/cấu hình | lenovo-ideapad-slim-5.png | L | OK | Thêm GPU |
| LT-LENLOQ | LOQ 15IAX9 (83GS000FVN) | Đã sửa đúng SKU | image-updating.svg | L | Chờ ảnh sạch | Sửa RAM 8GB + RTX 2050; bỏ infographic |
| LT-LENLEG5 | Legion 5 16IRX9 (83DG004YVN) | Khớp SKU | lenovo-legion-5.jpg | L | OK | Ghi SKU + RTX 4060 |
| LT-ACASP3 | Acer Aspire 3 A315-59-381E | Khớp SKU | image-updating.svg | AC | Chờ ảnh sạch | Bỏ infographic |
| LT-ACNITRO5 | Acer Nitro 5 AN515-58 i5 | Khớp dòng/cấu hình | pilot-acer-nitro-5.jpg | AC | OK | Thêm RTX 3050 |
| LT-MSIGF63 | MSI Thin GF63 12VE i5 | Khớp dòng/cấu hình | image-updating.svg | M | Chờ ảnh sạch | Bỏ infographic; thêm RTX 4050 |
| LT-MSIMOD14 | MSI Modern 14 C12MO-815 | Khớp SKU | image-updating.svg | M | Chờ ảnh sạch | Ghi SKU; bỏ infographic; thêm GPU |

## Nguồn đối chiếu chính

- A: <https://support.apple.com/specs> và Apple Newsroom.
- S: <https://www.samsung.com/us/support/> và Samsung Global Newsroom.
- X: <https://www.mi.com/uk/mi8/specs/>; các trang thông số sản phẩm Xiaomi Global.
- L: <https://psref.lenovo.com/>; riêng 83GS000FVN được đối chiếu thêm trên NVIDIA Marketplace Việt Nam.
- HP: <https://support.hp.com/>; SKU Victus 8C5N4PA đối chiếu trang Phong Vũ, Pavilion 7C0P2PA trên HP Support.
- AS/D/AC/M/O/H/R: trang sản phẩm hoặc support chính thức của hãng; khi hãng đã gỡ model legacy, dùng catalogue local và nguồn bán lẻ đúng mã để đối chiếu chéo.

## Migration và ảnh chờ

`batch-02-audit-v1` chạy đúng một lần qua `importStandardBatches()`. Migration chỉ
thay giá trị khi nó còn đúng bằng giá trị mặc định cũ; tên hoặc ảnh riêng do Admin
sửa không bị ghi đè. Ảnh cũ có quảng cáo/watermark vẫn được giữ trên đĩa để tránh
xóa nhầm tài sản người dùng, nhưng tám sản phẩm nêu trên không còn tham chiếu đến
chúng. Khi có ảnh sạch đúng model, thay file trong Admin hoặc cập nhật mapping rồi
tăng phiên bản migration; không reset LocalStorage.
