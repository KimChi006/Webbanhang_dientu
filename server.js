require('dotenv').config();

const express = require('express');
const sql = require('mssql');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    name: 'techstore.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 2 * 60 * 60 * 1000
    }
}));

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
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool;

function cleanAccount(account) {
    return {
        maKH: account.MaTaiKhoan ?? account.maKH,
        hoTen: account.HoTen ?? account.hoTen,
        email: account.Email ?? account.email,
        vaiTro: account.VaiTro ?? account.vaiTro
    };
}

function validEmail(email) {
    return typeof email === 'string'
        && email.trim().length <= 254
        && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validName(name) {
    return typeof name === 'string'
        && name.trim().length > 0
        && name.trim().length <= 100;
}

function validPassword(password) {
    return typeof password === 'string'
        && password.length >= 8
        && Buffer.byteLength(password, 'utf8') <= 72;
}

function validOptionalText(value, maxLength) {
    return value == null
        || (typeof value === 'string' && value.trim().length <= maxLength);
}

// BẮT BUỘC ĐĂNG NHẬP ADMIN
async function requireAdmin(req, res, next) {
    try {
        const account = req.session.account;

        if (!account) {
            return res.status(401).json({
                message: 'Vui lòng đăng nhập Admin.'
            });
        }

        const result = await pool.request()
            .input('MaTaiKhoan', sql.Int, account.maKH)
            .query(`
                SELECT MaTaiKhoan, HoTen, Email, VaiTro,
                       TrangThai, DaXoa
                FROM dbo.TaiKhoan
                WHERE MaTaiKhoan = @MaTaiKhoan
            `);

        const current = result.recordset[0];

        if (
            !current ||
            current.DaXoa ||
            current.TrangThai !== 'ACTIVE' ||
            current.VaiTro !== 'ADMIN'
        ) {
            return res.status(403).json({
                message: 'Bạn không có quyền thực hiện chức năng này.'
            });
        }

        req.admin = current;
        next();
    } catch (err) {
        console.error('Lỗi kiểm tra Admin:', err.message);
        res.status(500).json({
            message: 'Không thể xác minh quyền Admin.'
        });
    }
}

// ĐĂNG KÝ KHÁCH HÀNG
app.post('/api/register', async (req, res) => {
    let transaction;

    try {
        const { hoTen, email, matKhau } = req.body;

        if (!validName(hoTen)) {
            return res.status(400).json({
                message: 'Họ tên không hợp lệ.'
            });
        }

        if (!validEmail(email)) {
            return res.status(400).json({
                message: 'Email không hợp lệ.'
            });
        }

        if (!validPassword(matKhau)) {
            return res.status(400).json({
                message: 'Mật khẩu phải có ít nhất 8 ký tự và tối đa 72 byte UTF-8.'
            });
        }

        const emailChuanHoa = email.trim().toLowerCase();

        const existed = await pool.request()
            .input('Email', sql.NVarChar(254), emailChuanHoa)
            .query(`
                SELECT MaTaiKhoan
                FROM dbo.TaiKhoan
                WHERE Email = @Email
            `);

        if (existed.recordset.length > 0) {
            return res.status(409).json({
                message: 'Email này đã được đăng ký.'
            });
        }

        const matKhauHash = await bcrypt.hash(matKhau, 12);

        transaction = new sql.Transaction(pool);
        await transaction.begin();

        const accountResult = await new sql.Request(transaction)
            .input('HoTen', sql.NVarChar(100), hoTen.trim())
            .input('Email', sql.NVarChar(254), emailChuanHoa)
            .input('MatKhauHash', sql.VarChar(255), matKhauHash)
            .query(`
                INSERT INTO dbo.TaiKhoan
                    (HoTen, Email, MatKhauHash, VaiTro, TrangThai)
                OUTPUT
                    INSERTED.MaTaiKhoan,
                    INSERTED.HoTen,
                    INSERTED.Email,
                    INSERTED.VaiTro
                VALUES
                    (@HoTen, @Email, @MatKhauHash,
                     'CUSTOMER', 'ACTIVE')
            `);

        const account = accountResult.recordset[0];

        await new sql.Request(transaction)
            .input('MaTaiKhoan', sql.Int, account.MaTaiKhoan)
            .query(`
                INSERT INTO dbo.KhachHang (MaTaiKhoan)
                VALUES (@MaTaiKhoan)
            `);

        await transaction.commit();

        return res.status(201).json({
            message: 'Đăng ký thành công!',
            account: cleanAccount(account)
        });
    } catch (err) {
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (_) {}
        }

        if (err.number === 2601 || err.number === 2627) {
            return res.status(409).json({
                message: 'Email này đã được đăng ký.'
            });
        }

        console.error('Lỗi đăng ký:', err.message);
        return res.status(500).json({
            message: 'Không thể đăng ký lúc này.'
        });
    }
});

// ĐĂNG NHẬP KHÁCH HÀNG
app.post('/api/login', async (req, res) => {
    try {
        const { email, matKhau } = req.body;

        if (!validEmail(email) || typeof matKhau !== 'string' || !matKhau) {
            return res.status(400).json({
                message: 'Vui lòng nhập email và mật khẩu hợp lệ.'
            });
        }

        const result = await pool.request()
            .input('Email', sql.NVarChar(254), email.trim().toLowerCase())
            .query(`
                SELECT MaTaiKhoan, HoTen, Email, MatKhauHash,
                       VaiTro, TrangThai, DaXoa
                FROM dbo.TaiKhoan
                WHERE Email = @Email
            `);

        const account = result.recordset[0];

        if (!account || account.DaXoa) {
            return res.status(401).json({
                message: 'Email hoặc mật khẩu không đúng.'
            });
        }

        const matched = await bcrypt.compare(matKhau, account.MatKhauHash);

        if (!matched) {
            return res.status(401).json({
                message: 'Email hoặc mật khẩu không đúng.'
            });
        }

        if (account.TrangThai !== 'ACTIVE') {
            return res.status(403).json({
                message: 'Tài khoản đã bị khóa.'
            });
        }

        req.session.regenerate((err) => {
            if (err) {
                console.error('Lỗi tạo session:', err.message);
                return res.status(500).json({
                    message: 'Không thể tạo phiên đăng nhập.'
                });
            }

            req.session.account = cleanAccount(account);

            req.session.save((saveErr) => {
                if (saveErr) {
                    console.error('Lỗi lưu session:', saveErr.message);
                    return res.status(500).json({
                        message: 'Không thể lưu phiên đăng nhập.'
                    });
                }

                return res.json({
                    message: 'Đăng nhập thành công!',
                    account: req.session.account
                });
            });
        });
    } catch (err) {
        console.error('Lỗi đăng nhập:', err.message);
        return res.status(500).json({
            message: 'Không thể đăng nhập lúc này.'
        });
    }
});

// KHÔI PHỤC PHIÊN ĐĂNG NHẬP
app.get('/api/me', async (req, res) => {
    try {
        if (!req.session.account) {
            return res.status(401).json({
                message: 'Chưa đăng nhập.'
            });
        }

        const result = await pool.request()
            .input('MaTaiKhoan', sql.Int, req.session.account.maKH)
            .query(`
                SELECT MaTaiKhoan, HoTen, Email, VaiTro,
                       TrangThai, DaXoa
                FROM dbo.TaiKhoan
                WHERE MaTaiKhoan = @MaTaiKhoan
            `);

        const account = result.recordset[0];

        if (!account || account.DaXoa || account.TrangThai !== 'ACTIVE') {
            return req.session.destroy(() => {
                res.status(401).json({
                    message: 'Tài khoản không còn hoạt động.'
                });
            });
        }

        req.session.account = cleanAccount(account);

        return res.json({
            account: req.session.account
        });
    } catch (err) {
        console.error('Lỗi lấy tài khoản:', err.message);
        return res.status(500).json({
            message: 'Không thể lấy thông tin tài khoản.'
        });
    }
});

// ĐĂNG XUẤT
app.post('/api/logout', logoutHandler);
app.post('/api/admin/logout', logoutHandler);

function logoutHandler(req, res) {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                message: 'Không thể đăng xuất lúc này.'
            });
        }

        res.clearCookie('techstore.sid', {
            httpOnly: true,
            sameSite: 'lax',
            secure: false
        });

        return res.json({
            message: 'Đăng xuất thành công!'
        });
    });
}

// ADMIN: ĐĂNG NHẬP
app.post('/api/admin/login', async (req, res) => {
    try {
        const { email, matKhau } = req.body;

        if (!validEmail(email) || typeof matKhau !== 'string' || !matKhau) {
            return res.status(400).json({
                message: 'Vui lòng nhập email và mật khẩu.'
            });
        }

        const result = await pool.request()
            .input('Email', sql.NVarChar(254), email.trim().toLowerCase())
            .query(`
                SELECT MaTaiKhoan, HoTen, Email, MatKhauHash,
                       VaiTro, TrangThai, DaXoa
                FROM dbo.TaiKhoan
                WHERE Email = @Email
            `);

        const account = result.recordset[0];

        if (!account || account.DaXoa) {
            return res.status(401).json({
                message: 'Thông tin đăng nhập không chính xác.'
            });
        }

        if (account.VaiTro !== 'ADMIN') {
            return res.status(403).json({
                message: 'Tài khoản không có quyền Admin.'
            });
        }

        if (account.TrangThai !== 'ACTIVE') {
            return res.status(403).json({
                message: 'Tài khoản đã bị khóa.'
            });
        }

        const matched = await bcrypt.compare(matKhau, account.MatKhauHash);

        if (!matched) {
            return res.status(401).json({
                message: 'Thông tin đăng nhập không chính xác.'
            });
        }

        req.session.regenerate((err) => {
            if (err) {
                return res.status(500).json({
                    message: 'Không thể tạo phiên đăng nhập.'
                });
            }

            req.session.account = cleanAccount(account);

            req.session.save((saveErr) => {
                if (saveErr) {
                    return res.status(500).json({
                        message: 'Không thể lưu phiên đăng nhập.'
                    });
                }

                res.json({
                    message: 'Đăng nhập Admin thành công.',
                    account: req.session.account
                });
            });
        });
    } catch (err) {
        console.error('Lỗi đăng nhập Admin:', err.message);
        res.status(500).json({
            message: 'Không thể đăng nhập Admin lúc này.'
        });
    }
});

app.get('/api/admin/me', requireAdmin, (req, res) => {
    res.json({
        account: cleanAccount(req.admin)
    });
});

// ADMIN: DANH SÁCH KHÁCH HÀNG
app.get('/api/admin/customers', requireAdmin, async (req, res) => {
    try {
        const result = await pool.request().query(`
            SELECT
                tk.MaTaiKhoan AS maKH,
                tk.HoTen AS hoTen,
                tk.Email AS email,
                tk.VaiTro AS vaiTro,
                tk.TrangThai AS trangThai,
                tk.NgayTao AS ngayTao,
                kh.SoDienThoai AS soDienThoai,
                kh.DiaChi AS diaChi
            FROM dbo.TaiKhoan tk
            LEFT JOIN dbo.KhachHang kh
                ON kh.MaTaiKhoan = tk.MaTaiKhoan
            WHERE tk.VaiTro = 'CUSTOMER'
              AND tk.DaXoa = 0
            ORDER BY tk.NgayTao DESC
        `);

        res.json({
            customers: result.recordset
        });
    } catch (err) {
        console.error('Lỗi lấy danh sách khách hàng:', err.message);
        res.status(500).json({
            message: 'Không thể tải danh sách khách hàng.'
        });
    }
});

// ADMIN: THÊM KHÁCH HÀNG
// Body: hoTen, email, matKhau, soDienThoai, diaChi
app.post('/api/admin/customers', requireAdmin, async (req, res) => {
    let transaction;

    try {
        const { hoTen, email, matKhau, soDienThoai, diaChi } = req.body;

        if (!validName(hoTen) || !validEmail(email) || !validPassword(matKhau)) {
            return res.status(400).json({
                message: 'Họ tên, email hoặc mật khẩu không hợp lệ.'
            });
        }

        if (
            !validOptionalText(soDienThoai, 20) ||
            !validOptionalText(diaChi, 300)
        ) {
            return res.status(400).json({
                message: 'Số điện thoại hoặc địa chỉ quá dài.'
            });
        }

        const hash = await bcrypt.hash(matKhau, 12);

        transaction = new sql.Transaction(pool);
        await transaction.begin();

        const accountResult = await new sql.Request(transaction)
            .input('HoTen', sql.NVarChar(100), hoTen.trim())
            .input('Email', sql.NVarChar(254), email.trim().toLowerCase())
            .input('MatKhauHash', sql.VarChar(255), hash)
            .query(`
                INSERT INTO dbo.TaiKhoan
                    (HoTen, Email, MatKhauHash, VaiTro, TrangThai)
                OUTPUT INSERTED.MaTaiKhoan
                VALUES
                    (@HoTen, @Email, @MatKhauHash, 'CUSTOMER', 'ACTIVE')
            `);

        const id = accountResult.recordset[0].MaTaiKhoan;

        await new sql.Request(transaction)
            .input('MaTaiKhoan', sql.Int, id)
            .input('SoDienThoai', sql.NVarChar(20), soDienThoai?.trim() || null)
            .input('DiaChi', sql.NVarChar(300), diaChi?.trim() || null)
            .query(`
                INSERT INTO dbo.KhachHang
                    (MaTaiKhoan, SoDienThoai, DiaChi)
                VALUES
                    (@MaTaiKhoan, @SoDienThoai, @DiaChi)
            `);

        await transaction.commit();

        res.status(201).json({
            message: 'Thêm khách hàng thành công.',
            maKH: id
        });
    } catch (err) {
        if (transaction) {
            try { await transaction.rollback(); } catch (_) {}
        }

        if (err.number === 2601 || err.number === 2627) {
            return res.status(409).json({
                message: 'Email này đã được sử dụng.'
            });
        }

        console.error('Lỗi thêm khách hàng:', err.message);
        res.status(500).json({
            message: 'Không thể thêm khách hàng.'
        });
    }
});

// ADMIN: SỬA THÔNG TIN KHÁCH HÀNG
app.patch('/api/admin/customers/:id', requireAdmin, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: 'Mã khách hàng không hợp lệ.'
        });
    }

    try {
        const { hoTen, email, soDienThoai, diaChi } = req.body;

        if (!validName(hoTen) || !validEmail(email)) {
            return res.status(400).json({
                message: 'Họ tên hoặc email không hợp lệ.'
            });
        }

        if (
            !validOptionalText(soDienThoai, 20) ||
            !validOptionalText(diaChi, 300)
        ) {
            return res.status(400).json({
                message: 'Số điện thoại hoặc địa chỉ quá dài.'
            });
        }

        const result = await pool.request()
            .input('Id', sql.Int, id)
            .input('HoTen', sql.NVarChar(100), hoTen.trim())
            .input('Email', sql.NVarChar(254), email.trim().toLowerCase())
            .input('SoDienThoai', sql.NVarChar(20), soDienThoai?.trim() || null)
            .input('DiaChi', sql.NVarChar(300), diaChi?.trim() || null)
            .query(`
                BEGIN TRANSACTION;

                UPDATE dbo.TaiKhoan
                SET HoTen = @HoTen,
                    Email = @Email
                WHERE MaTaiKhoan = @Id
                  AND VaiTro = 'CUSTOMER'
                  AND DaXoa = 0;

                IF @@ROWCOUNT = 0
                BEGIN
                    ROLLBACK TRANSACTION;
                    THROW 50001, 'Không tìm thấy khách hàng.', 1;
                END;

                UPDATE dbo.KhachHang
                SET SoDienThoai = @SoDienThoai,
                    DiaChi = @DiaChi,
                    NgayCapNhat = SYSDATETIME()
                WHERE MaTaiKhoan = @Id;

                COMMIT TRANSACTION;
            `);

        res.json({
            message: 'Cập nhật thông tin khách hàng thành công.'
        });
    } catch (err) {
        if (err.number === 2601 || err.number === 2627) {
            return res.status(409).json({
                message: 'Email này đã được sử dụng.'
            });
        }

        if (err.number === 50001) {
            return res.status(404).json({
                message: 'Không tìm thấy khách hàng.'
            });
        }

        console.error('Lỗi sửa khách hàng:', err.message);
        res.status(500).json({
            message: 'Không thể cập nhật khách hàng.'
        });
    }
});

// ADMIN: KHÓA / MỞ KHÓA
// Body: { "trangThai": "ACTIVE" } hoặc { "trangThai": "LOCKED" }
app.patch('/api/admin/customers/:id/status', requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const { trangThai } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: 'Mã khách hàng không hợp lệ.'
        });
    }

    if (!['ACTIVE', 'LOCKED'].includes(trangThai)) {
        return res.status(400).json({
            message: 'Trạng thái không hợp lệ.'
        });
    }

    try {
        const result = await pool.request()
            .input('Id', sql.Int, id)
            .input('TrangThai', sql.VarChar(20), trangThai)
            .query(`
                UPDATE dbo.TaiKhoan
                SET TrangThai = @TrangThai
                WHERE MaTaiKhoan = @Id
                  AND VaiTro = 'CUSTOMER'
                  AND DaXoa = 0
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                message: 'Không tìm thấy khách hàng.'
            });
        }

        res.json({
            message: trangThai === 'LOCKED'
                ? 'Đã khóa tài khoản khách hàng.'
                : 'Đã mở khóa tài khoản khách hàng.'
        });
    } catch (err) {
        console.error('Lỗi đổi trạng thái:', err.message);
        res.status(500).json({
            message: 'Không thể cập nhật trạng thái.'
        });
    }
});

// ADMIN: ĐẶT LẠI MẬT KHẨU
// Body: { "matKhauMoi": "..." }
app.patch('/api/admin/customers/:id/reset-password', requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const matKhauMoi = req.body.matKhauMoi;

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: 'Mã khách hàng không hợp lệ.'
        });
    }

    if (!validPassword(matKhauMoi)) {
        return res.status(400).json({
            message: 'Mật khẩu mới phải có ít nhất 8 ký tự và tối đa 72 byte UTF-8.'
        });
    }

    try {
        const hash = await bcrypt.hash(matKhauMoi, 12);

        const result = await pool.request()
            .input('Id', sql.Int, id)
            .input('Hash', sql.VarChar(255), hash)
            .query(`
                UPDATE dbo.TaiKhoan
                SET MatKhauHash = @Hash
                WHERE MaTaiKhoan = @Id
                  AND VaiTro = 'CUSTOMER'
                  AND DaXoa = 0
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                message: 'Không tìm thấy khách hàng.'
            });
        }

        res.json({
            message: 'Đặt lại mật khẩu thành công.'
        });
    } catch (err) {
        console.error('Lỗi đặt lại mật khẩu:', err.message);
        res.status(500).json({
            message: 'Không thể đặt lại mật khẩu.'
        });
    }
});

// ADMIN: XÓA MỀM KHÁCH HÀNG
// Giữ lại dữ liệu để bảo toàn lịch sử về sau.
app.delete('/api/admin/customers/:id', requireAdmin, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: 'Mã khách hàng không hợp lệ.'
        });
    }

    try {
        const result = await pool.request()
            .input('Id', sql.Int, id)
            .query(`
                UPDATE dbo.TaiKhoan
                SET DaXoa = 1,
                    TrangThai = 'LOCKED'
                WHERE MaTaiKhoan = @Id
                  AND VaiTro = 'CUSTOMER'
                  AND DaXoa = 0
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                message: 'Không tìm thấy khách hàng.'
            });
        }

        res.json({
            message: 'Đã xóa khách hàng khỏi danh sách quản lý.'
        });
    } catch (err) {
        console.error('Lỗi xóa khách hàng:', err.message);
        res.status(500).json({
            message: 'Không thể xóa khách hàng.'
        });
    }
});

/* =========================================
   SẢN PHẨM: HÀM HỖ TRỢ
========================================= */

// Chuyển "3.490.000" thành 3490000
function parseProductPrice(value) {
    if (typeof value === 'number') {
        return Number.isFinite(value) && value >= 0 ? value : null;
    }

    if (typeof value !== 'string' || !value.trim()) {
        return null;
    }

    const normalized = value.trim().replace(/\./g, '').replace(/,/g, '');

    if (!/^\d+(\.\d+)?$/.test(normalized)) {
        return null;
    }

    const number = Number(normalized);
    return Number.isFinite(number) && number >= 0 ? number : null;
}

function formatProductPrice(value) {
    return new Intl.NumberFormat('vi-VN', {
        maximumFractionDigits: 0
    }).format(Number(value) || 0);
}

function mapProduct(row) {
    return {
        maSanPham: row.MaSanPham,
        maSP: row.MaSP,
        tenSanPham: row.TenSanPham,
        hang: row.Hang,
        hinhAnh: row.HinhAnh || "",
        gia: Number(row.Gia),
        soLuongTon: row.SoLuongTon,
        loaiKhuyenMai: row.LoaiKhuyenMai || "",
        giaTriKhuyenMai: row.GiaTriKhuyenMai == null
            ? null
            : Number(row.GiaTriKhuyenMai),
        soSao: row.SoSao,
        soLuotDanhGia: row.SoLuotDanhGia,
        manHinh: row.ManHinh || "",
        heDieuHanh: row.HeDieuHanh || "",
        cameraSau: row.CameraSau || "",
        cameraTruoc: row.CameraTruoc || "",
        cpu: row.CPU || "",
        ram: row.RAM || "",
        rom: row.ROM || "",
        theNho: row.TheNho || "",
        pin: row.Pin || "",
        trangThai: row.TrangThai,
        ngayTao: row.NgayTao
    };
}

function validateProduct(body) {
    const price = parseProductPrice(body.gia);
    const stock = Number(body.soLuongTon ?? 0);
    const star = Number(body.soSao ?? 0);
    const rateCount = Number(body.soLuotDanhGia ?? 0);

    const maSP = body.maSP;

    if (
        typeof maSP !== "string" ||
        !/^[a-zA-Z0-9_-]{1,30}$/.test(maSP.trim())
    ) {
        return { error: "Mã sản phẩm không hợp lệ." };
    }

    if (
        typeof body.tenSanPham !== "string" ||
        !body.tenSanPham.trim() ||
        body.tenSanPham.trim().length > 200
    ) {
        return { error: "Tên sản phẩm không hợp lệ." };
    }

    if (
        typeof body.hang !== "string" ||
        !body.hang.trim() ||
        body.hang.trim().length > 100
    ) {
        return { error: "Hãng sản phẩm không hợp lệ." };
    }

    if (price === null) {
        return { error: "Giá sản phẩm không hợp lệ." };
    }

    if (!Number.isInteger(stock) || stock < 0) {
        return { error: "Số lượng tồn kho không hợp lệ." };
    }

    if (!Number.isInteger(star) || star < 0 || star > 5) {
        return { error: "Số sao phải từ 0 đến 5." };
    }

    if (!Number.isInteger(rateCount) || rateCount < 0) {
        return { error: "Số lượt đánh giá không hợp lệ." };
    }

    const optionalFields = [
        ["hinhAnh", 500],
        ["loaiKhuyenMai", 30],
        ["manHinh", 300],
        ["heDieuHanh", 200],
        ["cameraSau", 300],
        ["cameraTruoc", 300],
        ["cpu", 300],
        ["ram", 100],
        ["rom", 100],
        ["theNho", 300],
        ["pin", 300]
    ];

    for (const [key, maxLength] of optionalFields) {
        const value = body[key];

        if (
            value != null &&
            (typeof value !== "string" || value.length > maxLength)
        ) {
            return { error: `Trường ${key} không hợp lệ hoặc quá dài.` };
        }
    }

    const promoValue =
        body.giaTriKhuyenMai == null || body.giaTriKhuyenMai === ""
            ? null
            : parseProductPrice(body.giaTriKhuyenMai);

    if (
        body.giaTriKhuyenMai != null &&
        body.giaTriKhuyenMai !== "" &&
        promoValue === null
    ) {
        return { error: "Giá trị khuyến mãi không hợp lệ." };
    }

    return {
        data: {
            maSP: maSP.trim(),
            tenSanPham: body.tenSanPham.trim(),
            hang: body.hang.trim(),
            hinhAnh: body.hinhAnh?.trim() || null,
            gia: price,
            soLuongTon: stock,
            loaiKhuyenMai: body.loaiKhuyenMai?.trim() || null,
            giaTriKhuyenMai: promoValue,
            soSao: star,
            soLuotDanhGia: rateCount,
            manHinh: body.manHinh?.trim() || null,
            heDieuHanh: body.heDieuHanh?.trim() || null,
            cameraSau: body.cameraSau?.trim() || null,
            cameraTruoc: body.cameraTruoc?.trim() || null,
            cpu: body.cpu?.trim() || null,
            ram: body.ram?.trim() || null,
            rom: body.rom?.trim() || null,
            theNho: body.theNho?.trim() || null,
            pin: body.pin?.trim() || null
        }
    };
}

function saveProduct(request, product) {
    return request
        .input("MaSP", sql.VarChar(30), product.maSP)
        .input("TenSanPham", sql.NVarChar(200), product.tenSanPham)
        .input("Hang", sql.NVarChar(100), product.hang)
        .input("HinhAnh", sql.NVarChar(500), product.hinhAnh)
        .input("Gia", sql.Decimal(18, 2), product.gia)
        .input("SoLuongTon", sql.Int, product.soLuongTon)
        .input("LoaiKhuyenMai", sql.VarChar(30), product.loaiKhuyenMai)
        .input("GiaTriKhuyenMai", sql.Decimal(18, 2), product.giaTriKhuyenMai)
        .input("SoSao", sql.Int, product.soSao)
        .input("SoLuotDanhGia", sql.Int, product.soLuotDanhGia)
        .input("ManHinh", sql.NVarChar(300), product.manHinh)
        .input("HeDieuHanh", sql.NVarChar(200), product.heDieuHanh)
        .input("CameraSau", sql.NVarChar(300), product.cameraSau)
        .input("CameraTruoc", sql.NVarChar(300), product.cameraTruoc)
        .input("CPU", sql.NVarChar(300), product.cpu)
        .input("RAM", sql.NVarChar(100), product.ram)
        .input("ROM", sql.NVarChar(100), product.rom)
        .input("TheNho", sql.NVarChar(300), product.theNho)
        .input("Pin", sql.NVarChar(300), product.pin);
}

//  SẢN PHẨM: API CÔNG KHAI
// Trang bán hàng chỉ nhận sản phẩm đang hiển thị
app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.request().query(`
            SELECT *
            FROM dbo.SanPham
            WHERE TrangThai = 'ACTIVE'
            ORDER BY NgayTao DESC, MaSanPham DESC
        `);

        res.json({
            products: result.recordset.map(mapProduct)
        });
    } catch (err) {
        console.error('Lỗi lấy sản phẩm:', err.message);
        res.status(500).json({
            message: 'Không thể tải danh sách sản phẩm.'
        });
    }
});

/* =========================================
   ADMIN: DANH SÁCH SẢN PHẨM
========================================= */

app.get('/api/admin/products', requireAdmin, async (req, res) => {
    try {
        const result = await pool.request().query(`
            SELECT *
            FROM dbo.SanPham
            ORDER BY NgayTao DESC, MaSanPham DESC
        `);

        res.json({
            products: result.recordset.map(mapProduct)
        });
    } catch (err) {
        console.error('Lỗi lấy danh sách sản phẩm Admin:', err.message);
        res.status(500).json({
            message: 'Không thể tải danh sách sản phẩm.'
        });
    }
});

/* =========================================
   ADMIN: THÊM SẢN PHẨM
========================================= */

app.post('/api/admin/products', requireAdmin, async (req, res) => {
    const validation = validateProduct(req.body);

    if (validation.error) {
        return res.status(400).json({ message: validation.error });
    }

        try {
        const product = validation.data;
        const request = saveProduct(pool.request(), product);

        const result = await request.query(`
            INSERT INTO dbo.SanPham (
                MaSP, TenSanPham, Hang, HinhAnh, Gia, SoLuongTon,
                LoaiKhuyenMai, GiaTriKhuyenMai, SoSao, SoLuotDanhGia,
                ManHinh, HeDieuHanh, CameraSau, CameraTruoc, CPU,
                RAM, ROM, TheNho, Pin, TrangThai
            )
            OUTPUT INSERTED.*
            VALUES (
                @MaSP, @TenSanPham, @Hang, @HinhAnh, @Gia, @SoLuongTon,
                @LoaiKhuyenMai, @GiaTriKhuyenMai, @SoSao, @SoLuotDanhGia,
                @ManHinh, @HeDieuHanh, @CameraSau, @CameraTruoc, @CPU,
                @RAM, @ROM, @TheNho, @Pin, 'ACTIVE'
            )
        `);

        res.status(201).json({
            message: "Thêm sản phẩm thành công.",
            product: mapProduct(result.recordset[0])
        });
    } catch (err) {
        if (err.number === 2601 || err.number === 2627) {
            return res.status(409).json({
                message: "Mã sản phẩm đã tồn tại."
            });
        }

        console.error("Lỗi thêm sản phẩm:", err.message);
        res.status(500).json({
            message: "Không thể thêm sản phẩm."
        });
    }
});

//  ADMIN: SỬA SẢN PHẨM

app.put('/api/admin/products/:id', requireAdmin, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: 'Mã sản phẩm không hợp lệ.'
        });
    }

    const validation = validateProduct(req.body);

    if (validation.error) {
        return res.status(400).json({ message: validation.error });
    }

        try {
        const product = validation.data;
        const request = saveProduct(pool.request(), product);
        request.input("Id", sql.Int, id);

        const result = await request.query(`
            UPDATE dbo.SanPham
            SET TenSanPham = @TenSanPham,
                Hang = @Hang,
                HinhAnh = @HinhAnh,
                Gia = @Gia,
                SoLuongTon = @SoLuongTon,
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
                Pin = @Pin
            WHERE MaSanPham = @Id;

            SELECT * FROM dbo.SanPham WHERE MaSanPham = @Id;
        `);

        if (!result.recordset.length) {
            return res.status(404).json({
                message: "Không tìm thấy sản phẩm."
            });
        }

        res.json({
            message: "Cập nhật sản phẩm thành công.",
            product: mapProduct(result.recordset[0])
        });
    } catch (err) {
        if (err.number === 2601 || err.number === 2627) {
            return res.status(409).json({
                message: "Mã sản phẩm đã được sử dụng."
            });
        }

        console.error("Lỗi sửa sản phẩm:", err.message);
        res.status(500).json({
            message: "Không thể cập nhật sản phẩm."
        });
    }
});

// ADMIN: ẨN / HIỆN SẢN PHẨM

// DELETE dùng để ẩn sản phẩm, không xóa dữ liệu khỏi SQL
app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: 'Mã sản phẩm không hợp lệ.'
        });
    }

    try {
        const result = await pool.request()
            .input('Id', sql.Int, id)
            .query(`
                UPDATE dbo.SanPham
                SET TrangThai = 'HIDDEN'
                WHERE MaSanPham = @Id;

                SELECT @@ROWCOUNT AS SoDong;
            `);

        if (result.recordset[0].SoDong === 0) {
            return res.status(404).json({
                message: 'Không tìm thấy sản phẩm.'
            });
        }

        res.json({
            message: 'Đã ẩn sản phẩm khỏi cửa hàng.'
        });
    } catch (err) {
        console.error('Lỗi ẩn sản phẩm:', err.message);
        res.status(500).json({
            message: 'Không thể ẩn sản phẩm.'
        });
    }
});

app.patch('/api/admin/products/:id/status', requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const { trangThai } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: 'Mã sản phẩm không hợp lệ.'
        });
    }

    if (!['ACTIVE', 'HIDDEN'].includes(trangThai)) {
        return res.status(400).json({
            message: 'Trạng thái sản phẩm không hợp lệ.'
        });
    }

    try {
        const result = await pool.request()
            .input('Id', sql.Int, id)
            .input('TrangThai', sql.VarChar(20), trangThai)
            .query(`
                UPDATE dbo.SanPham
                SET TrangThai = @TrangThai
                WHERE MaSanPham = @Id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                message: 'Không tìm thấy sản phẩm.'
            });
        }

        res.json({
            message: trangThai === 'ACTIVE'
                ? 'Đã hiển thị sản phẩm.'
                : 'Đã ẩn sản phẩm.'
        });
    } catch (err) {
        console.error('Lỗi đổi trạng thái sản phẩm:', err.message);
        res.status(500).json({
            message: 'Không thể cập nhật trạng thái sản phẩm.'
        });
    }
});

// Phục vụ các trang HTML trong public
const path = require('path');

// Trang quản trị
app.get('/admin', (req, res) => {
    res.redirect('/admin/index.html');
});

app.get('/admin/', (req, res) => {
    res.redirect('/admin/index.html');
});

// Phục vụ các file HTML, CSS, JS trong public
app.use(express.static(__dirname));
async function startServer() {
    if (!process.env.SESSION_SECRET) {
        throw new Error('Chưa cấu hình SESSION_SECRET trong file .env');
    }

    pool = await new sql.ConnectionPool(dbConfig).connect();

    // Kiểm tra các bảng và cột mà server cần sử dụng
    await pool.request().query(`
        SELECT TOP 0
            MaTaiKhoan, HoTen, Email, MatKhauHash,
            VaiTro, TrangThai, NgayTao, DaXoa
        FROM dbo.TaiKhoan;

        SELECT TOP 0
            MaKhachHang, MaTaiKhoan, SoDienThoai,
            DiaChi, NgayCapNhat
        FROM dbo.KhachHang;
    `);

    console.log('Đã kết nối SQL Server:', process.env.DB_NAME);

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'index.html'));
    });

    app.listen(PORT, () => {
        console.log(`Website chạy tại http://localhost:${PORT}`);
    });
}

startServer().catch((err) => {
    console.error('Không thể khởi động server:', err.message);
    process.exit(1);
});