require('dotenv').config();

const sql = require('mssql');
const products = require('./products.js');

const dbConfig = {
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        instanceName: process.env.DB_INSTANCE || undefined,
        encrypt: false,
        trustServerCertificate: true
    },
    pool: {
        max: 5,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

function parsePrice(value) {
    if (value == null || value === '') return 0;

    const number = Number(
        String(value).replace(/[^\d-]/g, '')
    );

    if (!Number.isFinite(number) || number < 0) {
        throw new Error(`Giá không hợp lệ: ${value}`);
    }

    return number;
}

function parseOptionalNumber(value) {
    if (value == null || String(value).trim() === '') {
        return null;
    }

    const number = Number(
        String(value).replace(/[^\d-]/g, '')
    );

    return Number.isFinite(number) ? number : null;
}

function cleanText(value) {
    if (value == null || value === '') return null;
    return String(value).trim();
}

async function importProducts() {
    if (!Array.isArray(products) || products.length === 0) {
        throw new Error(
            'Không đọc được danh sách sản phẩm từ public/products.js'
        );
    }

    const pool = await new sql.ConnectionPool(dbConfig).connect();
    const transaction = new sql.Transaction(pool);

    let imported = 0;
    let updated = 0;

    try {
        await transaction.begin();

        for (const product of products) {
            if (!product.name || !product.company || !product.masp) {
                throw new Error(
                    `Sản phẩm thiếu name, company hoặc masp: ${
                        product.name || '(không có tên)'
                    }`
                );
            }

            const detail = product.detail || {};
            const promo = product.promo || {};

            const price = parsePrice(product.price);
            const promoValue = parseOptionalNumber(promo.value);
            const stars = Math.max(
                0,
                Math.min(5, Number(product.star) || 0)
            );
            const rateCount = Math.max(
                0,
                Number(product.rateCount) || 0
            );

            const request = new sql.Request(transaction);

            request
                .input('MaSP', sql.VarChar(30), String(product.masp))
                .input('TenSanPham', sql.NVarChar(200), String(product.name))
                .input('Hang', sql.NVarChar(100), String(product.company))
                .input('HinhAnh', sql.NVarChar(500), cleanText(product.img))
                .input('Gia', sql.Decimal(18, 2), price)
                .input('LoaiKhuyenMai', sql.VarChar(30), cleanText(promo.name))
                .input('GiaTriKhuyenMai', sql.Decimal(18, 2), promoValue)
                .input('SoSao', sql.Int, stars)
                .input('SoLuotDanhGia', sql.Int, rateCount)
                .input('ManHinh', sql.NVarChar(300), cleanText(detail.screen))
                .input('HeDieuHanh', sql.NVarChar(200), cleanText(detail.os))
                .input('CameraSau', sql.NVarChar(300), cleanText(detail.camara))
                .input('CameraTruoc', sql.NVarChar(300), cleanText(detail.camaraFront))
                .input('CPU', sql.NVarChar(300), cleanText(detail.cpu))
                .input('RAM', sql.NVarChar(100), cleanText(detail.ram))
                .input('ROM', sql.NVarChar(100), cleanText(detail.rom))
                .input('TheNho', sql.NVarChar(300), cleanText(detail.microUSB))
                .input('Pin', sql.NVarChar(300), cleanText(detail.battery));

            const result = await request.query(`
                IF EXISTS (
                    SELECT 1
                    FROM dbo.SanPham
                    WHERE MaSP = @MaSP
                )
                BEGIN
                    UPDATE dbo.SanPham
                    SET TenSanPham = @TenSanPham,
                        Hang = @Hang,
                        HinhAnh = @HinhAnh,
                        Gia = @Gia,
                        LoaiKhuyenMai = @LoaiKhuyenMai,
                        GiaTriKhuyenMai = @GiaTriKhuyenMai,
                        SoSao = @SoSao,
                        SoLuotDanhGia = @SoLuotDanhGia,
                        ManHinh = @ManHinh,
                        HeDieuHanh = @HeDieuHanh,
                        CameraSau = @CameraSau,
                        CameraTruoc = @CameraTruoc,
                        CPU = @CPU,
                        RAM = @RAM,
                        ROM = @ROM,
                        TheNho = @TheNho,
                        Pin = @Pin,
                        TrangThai = 'ACTIVE'
                    WHERE MaSP = @MaSP;

                    SELECT 'UPDATED' AS KetQua;
                END
                ELSE
                BEGIN
                    INSERT INTO dbo.SanPham (
                        MaSP, TenSanPham, Hang, HinhAnh, Gia,
                        LoaiKhuyenMai, GiaTriKhuyenMai,
                        SoSao, SoLuotDanhGia,
                        ManHinh, HeDieuHanh, CameraSau, CameraTruoc,
                        CPU, RAM, ROM, TheNho, Pin, TrangThai
                    )
                    VALUES (
                        @MaSP, @TenSanPham, @Hang, @HinhAnh, @Gia,
                        @LoaiKhuyenMai, @GiaTriKhuyenMai,
                        @SoSao, @SoLuotDanhGia,
                        @ManHinh, @HeDieuHanh, @CameraSau, @CameraTruoc,
                        @CPU, @RAM, @ROM, @TheNho, @Pin, 'ACTIVE'
                    );

                    SELECT 'INSERTED' AS KetQua;
                END
            `);

            if (result.recordset[0].KetQua === 'UPDATED') {
                updated++;
            } else {
                imported++;
            }
        }

        await transaction.commit();

        console.log('===================================');
        console.log('CHUYỂN SẢN PHẨM HOÀN TẤT');
        console.log(`Tổng trong products.js: ${products.length}`);
        console.log(`Sản phẩm mới thêm: ${imported}`);
        console.log(`Sản phẩm đã cập nhật: ${updated}`);
        console.log('===================================');
    } catch (error) {
        try {
            await transaction.rollback();
        } catch (_) {}

        throw error;
    } finally {
        await pool.close();
    }
}

importProducts().catch((error) => {
    console.error('LỖI CHUYỂN SẢN PHẨM:', error.message);
    process.exitCode = 1;
});