# Đợt 3 — nhật ký dữ liệu, nguồn và kiểm thử

Ngày chốt: 2026-10-31. Phạm vi này bổ sung dữ liệu bằng các batch lũy tiến, không xóa
LocalStorage và không ghi đè sản phẩm mà Admin đã sửa hoặc xóa.

## Kết quả dữ liệu

| Danh mục | Trước Đợt 3 | Sau Đợt 3 |
|---|---:|---:|
| Điện thoại (L01) | 25 | 25 |
| Máy tính bảng (L02) | 15 | 15 |
| Phụ kiện (L03) | 0 | 20 |
| Laptop (L04) | 25 | 25 |
| Tai nghe (L05) | 0 | 15 |
| Đồng hồ thông minh (L06) | 0 | 10 |
| Loa (L07) | 0 | 10 |
| **Tổng** | **65** | **120** |

Phụ kiện được chia đều: 4 chuột, 4 bàn phím, 4 củ sạc, 4 cáp và 4 pin dự
phòng. Giá và tồn kho trong mọi mô tả mới đều được ghi rõ là dữ liệu demo; tất
cả sản phẩm mới có 0 sao và 0 lượt đánh giá, không tạo review/lượt bán giả.

## Bảng nguồn theo từng sản phẩm

“Nguồn ảnh/đối chiếu” là trang hãng dùng xác nhận đúng model và hình dáng. File
ảnh catalog đã được lưu cục bộ, kiểm tra chữ ký JPEG/PNG và dung lượng trên
10 KB. Các ảnh thương mại vẫn thuộc chủ sở hữu tương ứng; repo không kèm giấy
phép tái phân phối, vì vậy cần thay bằng asset được cấp phép hoặc xin phép trước
khi phát hành công khai/thương mại.

| Mã | Model | Ảnh local | Nguồn ảnh/đối chiếu và thông số |
|---|---|---|---|
| HP-APP3 | AirPods 3 | airpods-3.png | [Apple Support][airpods3] |
| HP-APPP2 | AirPods Pro 2 USB-C | airpods-pro-2.png | [Apple AirPods compare][airpods-compare] |
| HP-APMAX | AirPods Max | airpods-max.png | [Apple AirPods compare][airpods-compare] |
| HP-SWHXM5 | Sony WH-1000XM5 | sony-wh-1000xm5.png | [Sony WH-1000XM5][sony-xm5] |
| HP-SWHXM4 | Sony WH-1000XM4 | sony-wh-1000xm4.png | [Sony WH-1000XM4][sony-xm4] |
| HP-SCH520 | Sony WH-CH520 | sony-wh-ch520.jpg | [Sony WH-CH520][sony-ch520] |
| HP-SWFXM5 | Sony WF-1000XM5 | sony-wf-1000xm5.png | [Sony headphone support][sony-headphones] |
| HP-SSB2 | Galaxy Buds2 | samsung-galaxy-buds2.png | [Samsung Buds comparison][samsung-buds] |
| HP-SSB2P | Galaxy Buds2 Pro | samsung-galaxy-buds2-pro.png | [Samsung Buds comparison][samsung-buds] |
| HP-SSBFE | Galaxy Buds FE | samsung-galaxy-buds-fe.png | [Samsung Buds comparison][samsung-buds] |
| HP-JBL520 | JBL Tune 520BT | jbl-tune-520bt.png | [JBL spec sheet][jbl-520] |
| HP-JBLWAVE | JBL Wave Beam | jbl-wave-beam.png | [JBL spec sheet][jbl-wave] |
| HP-MAJOR4 | Marshall Major IV | marshall-major-iv.png | [Marshall Major IV][major4] |
| HP-MINOR3 | Marshall Minor III | marshall-minor-iii.png | [Marshall headphones][marshall-headphones] |
| HP-MOTIF2 | Marshall Motif II A.N.C. | marshall-motif-ii-anc.png | [Marshall support][motif2] |
| SW-AWS9 | Apple Watch Series 9 45 mm | apple-watch-series-9.png | [Apple Series 9][watch-s9] |
| SW-AWSE2 | Apple Watch SE 2 44 mm | apple-watch-se-2.png | [Apple Watch compare][watch-compare] |
| SW-AWU2 | Apple Watch Ultra 2 49 mm | apple-watch-ultra-2.png | [Apple Watch compare][watch-compare] |
| SW-GW6 | Galaxy Watch6 44 mm | samsung-galaxy-watch6.png | [Samsung Watch6][watch6] |
| SW-GW6C | Galaxy Watch6 Classic 47 mm | samsung-galaxy-watch6-classic.png | [Samsung spec sheet][watch6-classic] |
| SW-GFR55 | Garmin Forerunner 55 | garmin-forerunner-55.png | [Garmin compare][garmin-compare] |
| SW-GFR265 | Garmin Forerunner 265 | garmin-forerunner-265.png | [Garmin compare][garmin-compare] |
| SW-HWGT4 | Huawei Watch GT 4 46 mm | huawei-watch-gt-4.png | [Huawei GT 4][huawei-gt4] |
| SW-RW4 | Redmi Watch 4 | redmi-watch-4.png | [Xiaomi specs][redmi-watch4] |
| SW-XSB8P | Xiaomi Smart Band 8 Pro | xiaomi-smart-band-8-pro.png | [Xiaomi product page][band8pro] |
| SP-JBLC5 | JBL Charge 5 | jbl-charge-5.png | [JBL speaker compare][jbl-speakers] |
| SP-JBLF6 | JBL Flip 6 | jbl-flip-6.png | [JBL speaker compare][jbl-speakers] |
| SP-JBLCL4 | JBL Clip 4 | jbl-clip-4.png | [JBL speaker compare][jbl-speakers] |
| SP-JBLG3 | JBL Go 3 | jbl-go-3.png | [JBL speaker compare][jbl-speakers] |
| SP-MAREM2 | Marshall Emberton II | marshall-emberton-ii.png | [Marshall Emberton II][emberton2] |
| SP-MARWIL | Marshall Willen | marshall-willen.png | [Marshall speakers][marshall-speakers] |
| SP-MARST3 | Marshall Stanmore III | marshall-stanmore-iii.png | [Marshall speakers][marshall-speakers] |
| SP-SXB100 | Sony SRS-XB100 | sony-srs-xb100.png | [Sony XB100][sony-xb100] |
| SP-HPMINI | Apple HomePod mini | apple-homepod-mini.png | [Apple Support][homepod-mini] |
| SP-HKONYX8 | Harman Kardon Onyx Studio 8 | harman-kardon-onyx-studio-8.png | [Harman Kardon][onyx8] |
| AC-MX3S | Logitech MX Master 3S | logitech-mx-master-3s.png | [Logitech product page][mx3s] |
| AC-M650 | Logitech Signature M650 | logitech-signature-m650.jpg | [Logitech specs][m650] |
| AC-G102 | Logitech G102 LIGHTSYNC | logitech-g102-lightsync.png | [Logitech data sheet][g102] |
| AC-MGMOUSE | Apple Magic Mouse USB-C | apple-magic-mouse.png | [Apple Support][magic-mouse] |
| AC-K380 | Logitech K380 | logitech-k380.png | [Logitech data sheet][k380] |
| AC-MXKEYS | Logitech MX Keys S | logitech-mx-keys-s.png | [Logitech MX Keys sheet][mxkeys] |
| AC-KEYK8 | Keychron K8 | keychron-k8.png | [Keychron product page][keychron-k8] |
| AC-MGKEY | Apple Magic Keyboard USB-C | apple-magic-keyboard.png | [Apple Support][magic-keyboard] |
| AC-AP20W | Apple 20W USB-C Adapter | apple-20w-usb-c-adapter.png | [Apple Support][apple-20w] |
| AC-AN30W | Anker Nano 3 30W | anker-nano-3-30w.png | [Anker product description][anker-30w] |
| AC-AN70W | Anker Nano 70W | anker-nano-70w.png | [Anker product page][anker-70w] |
| AC-UG65W | UGREEN Nexode 65W | ugreen-nexode-65w.png | [UGREEN product page][ugreen-65w] |
| AC-APC1M | Apple 60W USB-C Cable 1 m | apple-usb-c-charge-cable-1m.png | [Apple Store][apple-cable] |
| AC-ANFLOW | Anker Flow USB-C–Lightning | anker-flow-usb-c-lightning.png | [Anker cable catalog][anker-cables] |
| AC-ANZOLO | Anker Zolo USB-C 240W | anker-zolo-usb-c-240w.png | [Anker cable catalog][anker-cables] |
| AC-UGUNO | UGREEN Uno USB-C 100W | ugreen-uno-usb-c-100w.png | [UGREEN product page][ugreen-uno] |
| AC-AN737 | Anker 737 Power Bank | anker-737-power-bank.png | [Anker product page][anker-737] |
| AC-ANNANO10 | Anker Nano Power Bank 10K | anker-nano-power-bank-10000.png | [Anker power bank catalog][anker-powerbanks] |
| AC-SSEBP3400 | Samsung EB-P3400 | samsung-eb-p3400-power-bank.png | [Samsung product page][samsung-pb] |
| AC-XIPB4I | Xiaomi Power Bank 4i 10K | xiaomi-power-bank-4i-10000.png | [Xiaomi specs][xiaomi-pb] |

## Batch và cách nhập vào dữ liệu hiện có

Các ID là `batch-03-headphones-v1`, `batch-03-watches-v1`,
`batch-03-speakers-v1` và `batch-03-accessories-v1`. Khi tải lại trang
khách hoặc Admin, `importStandardBatches` chỉ nhập batch chưa có trong
`importedBatches`; mã đã tồn tại hoặc có trong `deletedProductCodes` được
bỏ qua. Không cần và không nên reset LocalStorage.

## Tám kịch bản lọc đã tự động kiểm thử

1. Tai nghe: đủ 15 sản phẩm và phân trang 2 trang.
2. Tai nghe + kiểu Over-ear: đúng 3 sản phẩm.
3. Tai nghe + Sony + ANC: đúng 3 sản phẩm, có chip URL.
4. Đồng hồ + kích thước 45 mm: chỉ Apple Watch Series 9.
5. Đồng hồ + Garmin + 5ATM: đúng Forerunner 55 và 265.
6. Loa + công suất 50 W RMS: chỉ Onyx Studio 8.
7. Phụ kiện + Cáp + Anker: đúng 2 sản phẩm.
8. Phụ kiện + giá giảm dần + trang 2: giữ `category`, `sort`, `page` trên URL.

[airpods3]: https://support.apple.com/en-gb/111863
[airpods-compare]: https://www.apple.com/airpods/compare/
[sony-xm5]: https://www.sony.com/electronics/support/wireless-headphones-bluetooth-headphones/wh-1000xm5/specifications
[sony-xm4]: https://www.sony.com/electronics/support/product/wh-1000xm4
[sony-ch520]: https://www.sony.com/electronics/support/wireless-headphones-bluetooth-headphones/wh-ch520/specifications
[sony-headphones]: https://www.sony.com/electronics/support/wireless-headphones-bluetooth-headphones
[samsung-buds]: https://www.samsung.com/uk/support/mobile-devices/comparison-between-the-galaxy-budsfe-buds2-pro-and-buds2/
[jbl-520]: https://dk.jbl.com/on/demandware.static/-/Sites-masterCatalog_Harman/default/dw2195c17e/pdfs/JBL%20Tune%20520BT_%20Specsheet_EN.pdf
[jbl-wave]: https://support.jbl.com/on/demandware.static/-/Sites-masterCatalog_Harman/default/dw0d333b4e/pdfs/JBL%20Wave%20Beam_%20Specsheet_EN.pdf
[major4]: https://www.marshall.com/nz/en/product/major-iv?pid=1006127
[marshall-headphones]: https://www.marshall.com/gb/en/headphones
[motif2]: https://www.marshall.com/gb/en/support/headphones/support-for-motif-ii-anc
[watch-s9]: https://support.apple.com/en-au/111833
[watch-compare]: https://www.apple.com/watch/compare/
[watch6]: https://news.samsung.com/us/samsung-galaxy-watch6-series-classic-inspiring-best-self-day-night-unpacked-2023/
[watch6-classic]: https://images.samsung.com/is/content/samsung/assets/us/2307/business/mobile/wearables/gwc/Galaxy_Watch6_Classic_Spec_Sheet.pdf
[garmin-compare]: https://www.garmin.com/en-CA/compare/?compareProduct=741137&compareProduct=886785
[huawei-gt4]: https://consumer.huawei.com/ph/wearables/watch-gt4/specs/
[redmi-watch4]: https://www.mi.com/ae-en/product/redmi-watch-4/specs/
[band8pro]: https://www.mi.com/global/product/xiaomi-smart-band-8-pro/
[jbl-speakers]: https://global.jbl.com/compare-bluetooth-speakers.html
[emberton2]: https://www.marshall.com/gb/en/product/emberton-ii?pid=1006788
[marshall-speakers]: https://www.marshall.com/gb/en/speakers
[sony-xb100]: https://www.sony.com/electronics/support/speakers-wireless-speakers/srs-xb100/specifications
[homepod-mini]: https://support.apple.com/en-ie/111914
[onyx8]: https://www.harmankardon.com/speakers/ONYX-STUDIO-8-.html
[mx3s]: https://www.logitech.com/en-us/shop/p/mx-master-3s.910-006557
[m650]: https://hub.sync.logitech.com/m650/post/specifications---signature-m650-dotbTrB1mkoalg3
[g102]: https://www.logitech.com/assets/64967/2/g102-prodigy.pdf
[magic-mouse]: https://support.apple.com/en-gb/121931
[k380]: https://www.logitech.com/content/dam/logitech/en/business/pdf/k380-multi-device-blurtooth-keyboard.pdf
[mxkeys]: https://www.logitech.com/content/dam/logitech/fr/business/pdf/mx-keys-for-business-data-sheet-w11.pdf
[keychron-k8]: https://www.keychron.com/products/keychron-k8-tenkeyless-wireless-mechanical-keyboard
[magic-keyboard]: https://support.apple.com/en-gb/121955
[apple-20w]: https://support.apple.com/en-euro/guide/iphone/iph8c1e31583/ios
[anker-30w]: https://service.anker.com/product-description/a085g000004zRHdAAM/anker-511-charger-nano-3-30w
[anker-70w]: https://www.anker.com/products/a121a-70w-3-ports-charger
[ugreen-65w]: https://uk.ugreen.com/products/ugreen-nexode-65w-usb-c-gan-charger-3-ports-wall-charger
[apple-cable]: https://www.apple.com/shop/product/mw493am/a/60w-usb-c-charge-cable-1-m
[anker-cables]: https://www.anker.com/collections/cables
[ugreen-uno]: https://us.ugreen.com/products/ugreen-uno-100w-usb-c-to-c-fast-charging-cable-led-display
[anker-737]: https://www.anker.com/products/a1289
[anker-powerbanks]: https://www.anker.com/collections/power-banks
[samsung-pb]: https://www.samsung.com/ie/mobile-accessories/10-000mah-battery-pack-beige-eb-p3400xuegeu/
[xiaomi-pb]: https://www.mi.com/in/product/xiaomi-power-bank-4i-10000mah/specs/
