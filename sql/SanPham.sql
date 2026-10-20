USE WebBanHang;
GO

IF OBJECT_ID('dbo.SanPham', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.SanPham (
        MaSanPham INT IDENTITY(1,1) PRIMARY KEY,

        -- Thông tin cơ bản
        MaSP VARCHAR(30) NOT NULL UNIQUE,
        TenSanPham NVARCHAR(200) NOT NULL,
        Hang NVARCHAR(100) NOT NULL,
        HinhAnh NVARCHAR(500) NULL,
        Gia DECIMAL(18,2) NOT NULL,
        SoLuongTon INT NOT NULL DEFAULT 0,

        -- Khuyến mãi
        LoaiKhuyenMai VARCHAR(30) NULL,
        GiaTriKhuyenMai DECIMAL(18,2) NULL,

        -- Đánh giá
        SoSao INT NOT NULL DEFAULT 0,
        SoLuotDanhGia INT NOT NULL DEFAULT 0,

        -- Thông số kỹ thuật
        ManHinh NVARCHAR(300) NULL,
        HeDieuHanh NVARCHAR(200) NULL,
        CameraSau NVARCHAR(300) NULL,
        CameraTruoc NVARCHAR(300) NULL,
        CPU NVARCHAR(300) NULL,
        RAM NVARCHAR(100) NULL,
        ROM NVARCHAR(100) NULL,
        TheNho NVARCHAR(300) NULL,
        Pin NVARCHAR(300) NULL,

        -- Trạng thái sản phẩm
        TrangThai VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        NgayTao DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

        CONSTRAINT CK_SanPham_Gia
            CHECK (Gia >= 0),

        CONSTRAINT CK_SanPham_SoLuong
            CHECK (SoLuongTon >= 0),

        CONSTRAINT CK_SanPham_SoSao
            CHECK (SoSao BETWEEN 0 AND 5),

        CONSTRAINT CK_SanPham_SoLuotDanhGia
            CHECK (SoLuotDanhGia >= 0),

        CONSTRAINT CK_SanPham_TrangThai
            CHECK (TrangThai IN ('ACTIVE', 'HIDDEN'))
    );
END;
GO

SELECT * FROM dbo.SanPham;
GO