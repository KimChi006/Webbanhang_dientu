USE WebBanHang;
GO
DROP TABLE IF EXISTS dbo.KhachHang;
GO
DROP TABLE IF EXISTS dbo.TaiKhoan;
GO
CREATE TABLE dbo.TaiKhoan (
    MaTaiKhoan INT IDENTITY(1,1) PRIMARY KEY,
    HoTen NVARCHAR(100) NOT NULL,
    Email NVARCHAR(254) NOT NULL
        CONSTRAINT UQ_TaiKhoan_Email UNIQUE,
    MatKhauHash VARCHAR(255) NOT NULL,
    VaiTro VARCHAR(20) NOT NULL
        CONSTRAINT DF_TaiKhoan_VaiTro DEFAULT 'CUSTOMER'
        CONSTRAINT CK_TaiKhoan_VaiTro
        CHECK (VaiTro IN ('CUSTOMER', 'ADMIN')),
    TrangThai VARCHAR(20) NOT NULL
        CONSTRAINT DF_TaiKhoan_TrangThai DEFAULT 'ACTIVE'
        CONSTRAINT CK_TaiKhoan_TrangThai
        CHECK (TrangThai IN ('ACTIVE', 'LOCKED')),
    DaXoa BIT NOT NULL
        CONSTRAINT DF_TaiKhoan_DaXoa DEFAULT 0,
    NgayTao DATETIME2 NOT NULL
        CONSTRAINT DF_TaiKhoan_NgayTao
        DEFAULT SYSDATETIME()
);
GO

CREATE TABLE dbo.KhachHang (
    MaKhachHang INT IDENTITY(1,1) PRIMARY KEY,
    MaTaiKhoan INT NOT NULL
        CONSTRAINT UQ_KhachHang_MaTaiKhoan UNIQUE,
    NgaySinh DATE NULL,
    SoDienThoai NVARCHAR(20) NULL,
    DiaChi NVARCHAR(300) NULL,
    NgayCapNhat DATETIME2 NOT NULL
        CONSTRAINT DF_KhachHang_NgayCapNhat
        DEFAULT SYSDATETIME(),

    CONSTRAINT FK_KhachHang_TaiKhoan
        FOREIGN KEY (MaTaiKhoan)
        REFERENCES dbo.TaiKhoan(MaTaiKhoan)
);
GO

/*
// Khi muốn thay đổi vai trò thành admin, sử dụng câu lệnh UPDATE sau:
UPDATE dbo.TaiKhoan
SET VaiTro = 'ADMIN'
WHERE Email = N'abc@gmail.com'
  AND DaXoa = 0;
GO
*/

INSERT INTO dbo.TaiKhoan (HoTen, Email, MatKhauHash, VaiTro) VALUES 
(N'Nguyễn Văn A', 'nguyenvana@gmail.com', '123456789a', 'CUSTOMER'),
(N'Trần Thị B', 'tranthib@gmail.com', '123456789b', 'CUSTOMER');
GO

-- 2. Thêm thông tin chi tiết khách hàng tương ứng
INSERT INTO dbo.KhachHang (MaTaiKhoan, NgaySinh, SoDienThoai, DiaChi) VALUES 
(1, '1995-05-15', '0901234567', N'123 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM'),
(2, '1998-10-22', '0912345678', N'456 Trần Hưng Đạo, Phường 2, Quận 5, TP.HCM');
GO

SELECT * FROM dbo.TaiKhoan;
SELECT * FROM dbo.KhachHang;
GO