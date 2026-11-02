/* TV2: danh mục dùng chung với admin; URL giữ bộ lọc mở rộng, sắp xếp và trang. */
(function () {
  'use strict';
  const S = window.TechStore;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = v => Number(v).toLocaleString('vi-VN') + ' ₫';
  const image = p => S.safeImage(p.img) ? p.img.replace(/^\.\.\//, '') : '';
  const size = 10;
  const categoryMenu = document.getElementById('navCategoryDropdown');
  let db, dataError = ''; 
  const root = document.querySelector('.products-section');
  if (!root) return;

  const params = new URLSearchParams(location.search);

  // Danh sách các khóa bộ lọc mở rộng
  const FILTER_KEYS = ['q', 'category', 'brand', 'min', 'max', 'ram', 'rom', 'os', 'screen', 'cpu', 'camera', 'spec1', 'spec2', 'spec3', 'spec4', 'spec5', 'spec6', 'sort'];
  const MULTI_FILTER_KEYS = new Set(['brand', 'ram', 'rom', 'os', 'screen', 'cpu', 'camera', 'spec1', 'spec2', 'spec3', 'spec4', 'spec5', 'spec6']);

  // Form bộ lọc sản phẩm mở rộng theo phong cách CellphoneS
  const filters = document.createElement('form');
  filters.className = 'catalog-filters';
  filters.innerHTML = `
    <div class="filters-header">
      <div class="filters-title-wrap">
        <span class="filters-heading">Bộ lọc tìm kiếm</span>
        <span class="filters-subheading">Chọn theo tiêu chí phù hợp với nhu cầu của bạn</span>
      </div>
      <button type="button" class="advanced-filter-toggle" data-action="toggle-advanced" aria-expanded="false"><i class="fa-solid fa-filter" aria-hidden="true"></i> Bộ lọc nâng cao <i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>
      <div class="filter-group-q-wrap">
        <div class="search-input-box">
          <input name="q" maxlength="200" placeholder="Bạn đang tìm thiết bị nào?" aria-label="Tìm kiếm sản phẩm theo tên">
          <button type="submit" class="btn btn-search" aria-label="Tìm kiếm"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i> Tìm</button>
        </div>
      </div>
    </div>

    <div class="filter-pills-grid">
      <label class="filter-pill-item filter-group-category">
        <span class="pill-label"><i class="fa-solid fa-table-cells-large" aria-hidden="true"></i> Loại sản phẩm</span>
        <select name="category" aria-label="Chọn loại sản phẩm">
          <option value="">Tất cả loại</option>
        </select>
      </label>

      <label class="filter-pill-item filter-group-brand">
        <span class="pill-label">Hãng</span>
        <select name="brand" aria-label="Chọn hãng sản xuất">
          <option value="">Tất cả hãng</option>
        </select>
      </label>

      <label class="filter-pill-item filter-group-price-preset">
        <span class="pill-label">Mức giá</span>
        <select name="pricePreset" aria-label="Chọn khoảng giá nhanh">
          <option value="">Tất cả mức giá</option>
          <option value="duoi-2-trieu">Dưới 2 triệu</option>
          <option value="2-4-trieu">Từ 2 - 4 triệu</option>
          <option value="4-7-trieu">Từ 4 - 7 triệu</option>
          <option value="7-13-trieu">Từ 7 - 13 triệu</option>
          <option value="tren-13-trieu">Trên 13 triệu</option>
          <option value="custom">Khoảng giá tùy chỉnh</option>
        </select>
      </label>

      <label class="filter-pill-item filter-group-ram">
        <span class="pill-label">RAM</span>
        <select name="ram" aria-label="Chọn dung lượng RAM">
          <option value="">Tất cả RAM</option>
        </select>
      </label>

      <label class="filter-pill-item filter-group-rom">
        <span class="pill-label">Bộ nhớ trong</span>
        <select name="rom" aria-label="Chọn dung lượng bộ nhớ trong">
          <option value="">Tất cả bộ nhớ</option>
        </select>
      </label>

      <label class="filter-pill-item filter-group-os">
        <span class="pill-label">Hệ điều hành</span>
        <select name="os" aria-label="Chọn hệ điều hành">
          <option value="">Tất cả HĐH</option>
          <option value="Android">Android</option>
          <option value="iOS">iOS</option>
        </select>
      </label>

      <label class="filter-pill-item filter-group-screen">
        <span class="pill-label">Màn hình</span>
        <select name="screen" aria-label="Chọn kích thước màn hình">
          <option value="">Tất cả kích thước</option>
          <option value="duoi-6-inch">Dưới 6.0 inch</option>
          <option value="tu-6-inch">Từ 6.0 inch trở lên</option>
        </select>
      </label>

      <label class="filter-pill-item filter-group-cpu">
        <span class="pill-label">Vi xử lý (CPU)</span>
        <select name="cpu" aria-label="Chọn dòng chip xử lý">
          <option value="">Tất cả vi xử lý</option>
        </select>
      </label>

      <label class="filter-pill-item filter-group-camera">
        <span class="pill-label">Camera sau</span>
        <select name="camera" aria-label="Chọn tính năng camera sau">
          <option value="">Tất cả camera</option>
          <option value="dual">Camera kép / đa camera</option>
          <option value="single">Camera đơn</option>
        </select>
      </label>

      <label class="filter-pill-item filter-group-spec1" hidden>
        <span class="pill-label">Thuộc tính 1</span>
        <select name="spec1" aria-label="Chọn thuộc tính đặc thù thứ nhất"></select>
      </label>

      <label class="filter-pill-item filter-group-spec2" hidden>
        <span class="pill-label">Thuộc tính 2</span>
        <select name="spec2" aria-label="Chọn thuộc tính đặc thù thứ hai"></select>
      </label>

      <label class="filter-pill-item filter-group-spec3" hidden>
        <span class="pill-label">Thuộc tính 3</span>
        <select name="spec3" aria-label="Chọn thuộc tính đặc thù thứ ba"></select>
      </label>

      <label class="filter-pill-item filter-group-spec4" hidden>
        <span class="pill-label">Thuộc tính 4</span>
        <select name="spec4" aria-label="Chọn thuộc tính đặc thù thứ tư"></select>
      </label>

      <label class="filter-pill-item filter-group-spec5" hidden>
        <span class="pill-label">Thuộc tính 5</span>
        <select name="spec5" aria-label="Chọn thuộc tính đặc thù thứ năm"></select>
      </label>

      <label class="filter-pill-item filter-group-spec6" hidden>
        <span class="pill-label">Thuộc tính 6</span>
        <select name="spec6" aria-label="Chọn thuộc tính đặc thù thứ sáu"></select>
      </label>

      <label class="filter-pill-item filter-group-sort">
        <span class="pill-label"><i class="fa-solid fa-arrow-up-wide-short" aria-hidden="true"></i> Sắp xếp</span>
        <select name="sort" aria-label="Sắp xếp sản phẩm">
          <option value="">Mặc định</option>
          <option value="price-asc">Giá thấp → cao</option>
          <option value="price-desc">Giá cao → thấp</option>
        </select>
      </label>
    </div>

    <div class="custom-price-inputs" id="customPriceInputs">
      <label class="custom-price-field">
        <span>Giá từ (₫)</span>
        <input name="min" type="number" min="0" step="1" placeholder="0" aria-label="Giá từ">
      </label>
      <label class="custom-price-field">
        <span>Giá đến (₫)</span>
        <input name="max" type="number" min="0" step="1" placeholder="Không giới hạn" aria-label="Giá đến">
      </label>
      <button type="submit" class="btn btn-primary btn-apply-price"><i class="fa-solid fa-filter" aria-hidden="true"></i> Áp dụng giá</button>
      <button type="button" class="btn btn-outline" data-action="reset-filters"><i class="fa-solid fa-trash-can" aria-hidden="true"></i> Xóa bộ lọc</button>
    </div>

    <p id="filterError" role="alert"></p>
  `;
  root.querySelector('.product-grid').before(filters);

  // Khu vực các nhãn lọc đang áp dụng (Active filter chips)
  const activeFilters = document.createElement('div');
  activeFilters.className = 'active-filters';
  activeFilters.id = 'activeFilters';
  activeFilters.setAttribute('aria-label', 'Đang lọc theo');
  activeFilters.hidden = true;
  root.querySelector('.product-grid').before(activeFilters);

  const pages = document.createElement('nav');
  pages.className = 'catalog-pages';
  pages.setAttribute('aria-label', 'Phân trang sản phẩm');
  root.append(pages);

  const notice = document.createElement('p');
  notice.className = 'catalog-notice';
  notice.setAttribute('role', 'status');
  root.prepend(notice);

  const active = p => !p.hidden && (!p.categoryId || (db.categories && db.categories.some(c => c.id === p.categoryId && !c.hidden)));
  const price = p => Number.isFinite(p.sqlPrice) ? p.sqlPrice : S.sellingPrice(db, p);
  const stock = p => Number.isInteger(p?.sqlStock) ? p.sqlStock : S.stock(db, typeof p === 'string' ? p : p.masp);

  function getActiveProducts() {
    return (window.__customerProducts || db.products || []).filter(active);
  }

  const CATEGORY_SPEC_FILTERS = {
    L04: [
      { key: 'gpuFamily', label: 'Đồ họa (GPU)' },
    ],
    L05: [
      { key: 'type', label: 'Kiểu tai nghe' },
      { key: 'connectionFamily', label: 'Kết nối' },
      { key: 'noiseCancellation', label: 'Chống ồn' },
    ],
    L06: [
      { key: 'size', label: 'Kích thước mặt' },
      { key: 'screenType', label: 'Loại màn hình' },
      { key: 'compatibility', label: 'Hệ điều hành tương thích' },
      { key: 'waterResistance', label: 'Chống nước' },
    ],
    L07: [
      { key: 'connectionFamily', label: 'Kết nối' },
      { key: 'powerWatts', label: 'Công suất' },
    ],
  };

  function categorySpecConfig(categoryId) {
    if (categoryId === 'L03') {
      const typeSelections = selectedValues('spec1');
      const type = typeSelections.length === 1 ? typeSelections[0] : '';
      const common = [{ key: 'accessoryType', label: 'Loại phụ kiện' }];
      if (!type) return common;
      const byType = {
        'Chuột': [{ key: 'connectionFamily', label: 'Kết nối' }, { key: 'dpi', label: 'DPI' }],
        'Bàn phím': [{ key: 'connectionFamily', label: 'Kết nối' }, { key: 'layout', label: 'Layout' }, { key: 'keyType', label: 'Loại phím' }],
        'Củ sạc': [{ key: 'powerWatts', label: 'Công suất' }, { key: 'portCount', label: 'Số cổng' }, { key: 'portTypes', label: 'Loại cổng' }, { key: 'chargingStandard', label: 'Chuẩn sạc' }],
        'Cáp': [{ key: 'connectors', label: 'Đầu kết nối' }, { key: 'length', label: 'Chiều dài' }, { key: 'powerWatts', label: 'Công suất' }],
        'Pin dự phòng': [{ key: 'capacityMah', label: 'Dung lượng' }, { key: 'powerWatts', label: 'Công suất' }, { key: 'portCount', label: 'Số cổng' }, { key: 'portTypes', label: 'Loại cổng' }],
      };
      return common.concat(byType[type] || []);
    }
    return CATEGORY_SPEC_FILTERS[categoryId] || [];
  }

  function normalizeComparable(value) {
    return String(value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');
  }

  function connectionFamilies(value) {
    const text = String(value || '');
    const values = [];
    if (/bluetooth/i.test(text)) values.push('Bluetooth');
    if (/wi[‑-]?fi|airplay/i.test(text)) values.push('Wi‑Fi / AirPlay');
    if (/jack\s*3[,.]5/i.test(text)) values.push('Jack 3,5 mm');
    if (/usb-[ac]|usb\s*[ac]/i.test(text)) values.push('USB');
    if (/có dây/i.test(text) && !values.includes('USB')) values.push('Có dây');
    return values;
  }

  function screenType(value) {
    const text = String(value || '');
    if (/super amoled|dynamic amoled|amoled/i.test(text)) return 'AMOLED';
    if (/oled/i.test(text)) return 'OLED';
    if (/\bmip\b/i.test(text)) return 'MIP';
    if (/retina/i.test(text)) return 'Retina';
    if (/tft/i.test(text)) return 'TFT LCD';
    if (/ips/i.test(text)) return 'IPS LCD';
    return '';
  }

  function gpuFamily(value) {
    const text = String(value || '');
    const rtx = text.match(/RTX\s*(2050|3050|4050|4060)/i);
    if (rtx) return 'NVIDIA RTX ' + rtx[1];
    if (/intel arc/i.test(text)) return 'Intel Arc';
    if (/iris xe/i.test(text)) return 'Intel Iris Xe';
    if (/intel uhd/i.test(text)) return 'Intel UHD';
    if (/gpu apple/i.test(text)) return 'GPU Apple';
    return '';
  }

  function normalizeWatts(value) {
    const text = String(value || '').replace(',', '.');
    if (/không công bố|phụ thuộc/i.test(text)) return '';
    const multiplied = text.match(/(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*W/i);
    if (multiplied) return String(Number(multiplied[1]) * Number(multiplied[2])) + ' W';
    const match = text.match(/(\d+(?:\.\d+)?)\s*W\b/i);
    return match ? String(Number(match[1])) + ' W' : '';
  }

  function normalizeMah(value) {
    const digits = String(value || '').match(/([\d.]+)\s*mAh/i)?.[1]?.replace(/\./g, '');
    return digits ? Number(digits).toLocaleString('vi-VN') + ' mAh' : '';
  }

  function portCount(value) {
    const matches = Array.from(String(value || '').matchAll(/(\d+)\s*×/g));
    const total = matches.reduce((sum, match) => sum + Number(match[1]), 0);
    return total ? total + ' cổng' : '';
  }

  function portTypes(value) {
    const text = String(value || '');
    return ['USB-C', 'USB-A'].filter(type => new RegExp(type, 'i').test(text));
  }

  function productSpecValue(product, key) {
    const detail = product.detail || {};
    if (key === 'connectionFamily') return connectionFamilies(detail.connection);
    if (key === 'screenType') return screenType(detail.screen);
    if (key === 'gpuFamily') return gpuFamily(detail.gpu);
    if (key === 'powerWatts') return normalizeWatts(detail.power);
    if (key === 'capacityMah') return normalizeMah(detail.capacity);
    if (key === 'portCount') return portCount(detail.ports);
    if (key === 'portTypes') return portTypes(detail.ports);
    return detail[key] || '';
  }

  function uniqueSpecValues(products, key) {
    const values = new Map();
    for (const product of products) {
      const rawValue = productSpecValue(product, key);
      const rawValues = Array.isArray(rawValue) ? rawValue : [rawValue];
      for (const value of rawValues) {
        const raw = String(value || '').trim();
        if (raw && raw !== 'Không' && !/không công bố|chưa (có|cập nhật)/i.test(raw)) {
          values.set(normalizeComparable(raw), raw);
        }
      }
    }
    return Array.from(values.values()).sort((a, b) => a.localeCompare(b, 'vi', { numeric: true, sensitivity: 'base' }));
  }

  function canonicalCapacity(value) {
    return String(value ?? '')
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/(\d)\s*(TB|GB|MB)\b/gi, (_, number, unit) => number + ' ' + unit.toUpperCase());
  }

  function selectedValues(key, source = params) {
    const values = source.getAll(key).map(value => String(value).trim()).filter(Boolean);
    return Array.from(new Map(values.map(value => [normalizeComparable(value), value])).values());
  }

  function replaceSelectedValues(key, values) {
    replaceValuesOn(params, key, values);
  }

  function replaceValuesOn(source, key, values) {
    source.delete(key);
    for (const value of values) if (String(value).trim()) source.append(key, String(value).trim());
  }

  function asSelections(selected) {
    return Array.isArray(selected) ? selected : (selected ? [selected] : []);
  }

  function updateAttributeFilterVisibility(categoryId) {
    const legacyVisible = ['L01', 'L02', 'L04'].includes(categoryId);
    for (const key of ['ram', 'rom', 'os', 'screen', 'cpu', 'camera']) {
      const group = filters.querySelector?.('.filter-group-' + key);
      if (group) group.hidden = !legacyVisible;
    }
    const cameraGroup = filters.querySelector?.('.filter-group-camera');
    if (cameraGroup && categoryId !== 'L01') cameraGroup.hidden = true;
    const config = categorySpecConfig(categoryId);
    for (let i = 0; i < 6; i++) {
      const group = filters.querySelector?.('.filter-group-spec' + (i + 1));
      if (group) group.hidden = !config[i];
    }
  }

  // Thuật toán trích xuất các thuộc tính động từ danh sách sản phẩm hiển thị
  function getAvailableOptions(products, categoryId) {
    const list = categoryId ? products.filter(p => p.categoryId === categoryId) : products;

    // Hãng (gộp hoa/thường & khoảng trắng)
    const brandMap = new Map();
    for (const p of list) {
      const raw = String(p.company ?? '').trim();
      if (raw) brandMap.set(normalizeComparable(raw), raw.replace(/\s+/g, ' '));
    }
    const brands = Array.from(brandMap.values()).sort((a, b) => a.localeCompare(b, 'vi', { sensitivity: 'base' }));

    // RAM
    const ramSet = new Map();
    for (const p of list) {
      const r = canonicalCapacity(p.detail?.ram);
      if (r && r !== 'Không') ramSet.set(r.toLowerCase(), r);
    }
    const rams = Array.from(ramSet.values()).sort((a, b) => parseInt(a) - parseInt(b));

    // ROM (Bộ nhớ trong)
    const romSet = new Map();
    for (const p of list) {
      const r = canonicalCapacity(p.detail?.rom);
      if (r && r !== 'Không') romSet.set(r.toLowerCase(), r);
    }
    const roms = Array.from(romSet.values()).sort((a, b) => parseInt(a) - parseInt(b));

    // Hệ điều hành (Android / iOS)
    const osSet = new Set();
    for (const p of list) {
      const os = p.detail?.os;
      if (os && os !== 'Không') {
        if (/ipados/i.test(os)) osSet.add('iPadOS');
        else if (/ios/i.test(os)) osSet.add('iOS');
        else if (/android|coloros/i.test(os)) osSet.add('Android');
        else if (/windows/i.test(os)) osSet.add('Windows');
        else if (/macos/i.test(os)) osSet.add('macOS');
      }
    }
    const osList = Array.from(osSet).sort();

    // Màn hình
    const screenSet = new Set();
    for (const p of list) {
      const sc = p.detail?.screen;
      if (sc) {
        const m = sc.match(/(\d+(?:\.\d+)?)\s*(?:inch|['″])/i);
        if (m) {
          const inches = parseFloat(m[1]);
          const threshold = categoryId === 'L04' ? 15 : categoryId === 'L02' ? 11 : 6;
          if (inches < threshold) screenSet.add(`duoi-${threshold}-inch`);
          else screenSet.add(`tu-${threshold}-inch`);
        }
      }
    }
    const screens = Array.from(screenSet);

    // CPU (họ vi xử lý)
    const cpuSet = new Set();
    for (const p of list) {
      const cpu = p.detail?.cpu;
      if (cpu && cpu !== 'Không') {
        if (/snapdragon/i.test(cpu)) cpuSet.add('Snapdragon');
        else if (/apple\s+m\d/i.test(cpu)) cpuSet.add('Apple M-Series');
        else if (/apple/i.test(cpu)) cpuSet.add('Apple A-Series');
        else if (/mediatek|helio|mt6/i.test(cpu)) cpuSet.add('MediaTek / Helio');
        else if (/exynos/i.test(cpu)) cpuSet.add('Exynos');
        else if (/kirin/i.test(cpu)) cpuSet.add('Kirin');
        else if (/intel/i.test(cpu)) cpuSet.add('Intel Core');
      }
    }
    const cpus = Array.from(cpuSet);

    // Camera
    const camSet = new Set();
    for (const p of list) {
      const c = p.detail?.camara;
      if (c && c !== 'Không') {
        if (/2 camera|3 camera/i.test(c)) camSet.add('dual');
        else camSet.add('single');
      }
    }
    const cameras = Array.from(camSet);

    const specConfig = categorySpecConfig(categoryId);
    const specList = categoryId === 'L03' && selectedValues('spec1').length === 1
      ? list.filter(product => matchesSpec(product, 'accessoryType', selectedValues('spec1')))
      : list;
    const specs = specConfig.map(config => ({
      ...config,
      values: uniqueSpecValues(specList, config.key),
    }));

    return { brands, rams, roms, osList, screens, cpus, cameras, specs };
  }

  // Kiểm tra so khớp từng thuộc tính
  function matchesBrand(company, selected) {
    const selections = asSelections(selected);
    if (!selections.length) return true;
    return selections.some(value => normalizeComparable(company) === normalizeComparable(value));
  }

  function matchesRam(pRam, selected) {
    const selections = asSelections(selected);
    if (!selections.length) return true;
    return selections.some(value => canonicalCapacity(pRam).toLowerCase() === canonicalCapacity(value).toLowerCase());
  }

  function matchesRom(pRom, selected) {
    const selections = asSelections(selected);
    if (!selections.length) return true;
    return selections.some(value => canonicalCapacity(pRom).toLowerCase() === canonicalCapacity(value).toLowerCase());
  }

  function matchesOs(pOs, selected) {
    const selections = asSelections(selected);
    if (!selections.length) return true;
    if (!pOs || pOs === 'Không') return false;
    return selections.some(selectedValue => {
    const s = selectedValue.toLowerCase();
    if (s === 'ios') return /ios/i.test(pOs);
    if (s === 'ipados') return /ipados/i.test(pOs);
    if (s === 'android') return /android|coloros/i.test(pOs);
    if (s === 'windows') return /windows/i.test(pOs);
    if (s === 'macos') return /macos/i.test(pOs);
    return pOs.toLowerCase().includes(s);
    });
  }

  function matchesScreen(pScreen, selected) {
    const selections = asSelections(selected);
    if (!selections.length) return true;
    if (!pScreen) return false;
    const m = pScreen.match(/(\d+(?:\.\d+)?)\s*(?:inch|['″])/i);
    if (!m) return false;
    const inches = parseFloat(m[1]);
    return selections.some(value => {
      if (value === 'duoi-6-inch' || value === 'Dưới 6.0 inch') return inches < 6.0;
      if (value === 'tu-6-inch' || value === 'Từ 6.0 inch trở lên') return inches >= 6.0;
      if (value === 'duoi-11-inch') return inches < 11;
      if (value === 'tu-11-inch') return inches >= 11;
      if (value === 'duoi-15-inch') return inches < 15;
      if (value === 'tu-15-inch') return inches >= 15;
      return false;
    });
  }

  function matchesCpu(pCpu, selected) {
    const selections = asSelections(selected);
    if (!selections.length) return true;
    if (!pCpu || pCpu === 'Không') return false;
    const c = pCpu.toLowerCase();
    return selections.some(selectedValue => {
    const s = selectedValue.toLowerCase();
    if (s === 'snapdragon') return /snapdragon/i.test(c);
    if (s === 'apple' || s === 'apple a-series') return /apple/i.test(c);
    if (s === 'mediatek' || s === 'mediatek / helio' || s === 'helio') return /mediatek|helio|mt6/i.test(c);
    if (s === 'exynos') return /exynos/i.test(c);
    if (s === 'kirin') return /kirin/i.test(c);
    if (s === 'intel core') return /intel/i.test(c);
    if (s === 'apple m-series') return /apple\s+m\d/i.test(c);
    return c.includes(s);
    });
  }

  function matchesCamera(pCam, selected) {
    const selections = asSelections(selected);
    if (!selections.length) return true;
    if (!pCam || pCam === 'Không') return false;
    const isMulti = /2 camera|3 camera/i.test(pCam);
    return selections.some(value => {
      if (value === 'dual' || value === 'Camera kép / đa camera') return isMulti;
      if (value === 'single' || value === 'Camera đơn') return !isMulti;
      return false;
    });
  }

  function matchesSpec(product, key, selected) {
    const selections = asSelections(selected);
    if (!selections.length) return true;
    const rawValue = productSpecValue(product, key);
    const productValues = (Array.isArray(rawValue) ? rawValue : [rawValue])
      .map(normalizeComparable).filter(Boolean);
    return selections.some(value => productValues.includes(normalizeComparable(value)));
  }

  function isValidPrice(v) {
    if (v === '' || v === null || v === undefined) return true;
    if (!/^\d+$/.test(String(v).trim())) return false;
    const num = Number(v);
    return Number.isSafeInteger(num) && num >= 0;
  }

  function pushParams() {
    for (const k of FILTER_KEYS) {
      if (k === 'sort') {
        const s = params.get('sort');
        if (s !== 'price-asc' && s !== 'price-desc') params.delete('sort');
      } else if (!params.get(k)) {
        params.delete(k);
      }
    }
    const pageVal = Number(params.get('page'));
    if (!Number.isSafeInteger(pageVal) || pageVal <= 1) params.delete('page');

    const searchStr = params.toString() ? '?' + params.toString() : '';
    const isDetailFile = /chi_tiet_sp\.html$/i.test(location.pathname);
    const target = (isDetailFile ? 'index.html' : '') + searchStr + '#san-pham';
    try {
      history.pushState(null, '', target || './');
    } catch (_) {}
  }

  function replaceCurrentUrl() {
    const searchStr = params.toString() ? '?' + params.toString() : '';
    const isDetailFile = /chi_tiet_sp\.html$/i.test(location.pathname);
    const target = (isDetailFile ? 'index.html' : '') + searchStr + '#san-pham';
    try {
      if (typeof history.replaceState === 'function') history.replaceState(null, '', target || './');
      else history.pushState(null, '', target || './');
    } catch (_) {}
  }

  function syncParamsFromLocation() {
    const current = new URLSearchParams(location.search);
    for (const key of Array.from(params.keys())) params.delete(key);
    for (const [key, value] of current.entries()) params.append(key, value);
  }

  // Cập nhật các danh sách tùy chọn phụ thuộc vào loại sản phẩm được chọn
  function reloadOptions(categoryId) {
    const opts = getAvailableOptions(getActiveProducts(), categoryId);

    // Hãng
    if (filters.elements.brand) {
      const curBrands = selectedValues('brand');
      filters.elements.brand.innerHTML = '<option value="">Tất cả hãng</option>' +
        opts.brands.map(b => `<option value="${esc(b)}">${esc(b)}</option>`).join('');
      const matched = curBrands.filter(value => opts.brands.some(b => normalizeComparable(b) === normalizeComparable(value)));
      replaceSelectedValues('brand', matched);
      filters.elements.brand.value = matched[0] || '';
    }

    // RAM
    if (filters.elements.ram) {
      const curRam = selectedValues('ram');
      filters.elements.ram.innerHTML = '<option value="">Tất cả RAM</option>' +
        opts.rams.map(r => `<option value="${esc(r)}">${esc(r)}</option>`).join('');
      const matched = curRam.filter(value => opts.rams.some(r => canonicalCapacity(r).toLowerCase() === canonicalCapacity(value).toLowerCase()));
      replaceSelectedValues('ram', matched);
      filters.elements.ram.value = matched[0] || '';
    }

    // ROM
    if (filters.elements.rom) {
      const curRom = selectedValues('rom');
      filters.elements.rom.innerHTML = '<option value="">Tất cả bộ nhớ</option>' +
        opts.roms.map(r => `<option value="${esc(r)}">${esc(r)}</option>`).join('');
      const matched = curRom.filter(value => opts.roms.some(r => canonicalCapacity(r).toLowerCase() === canonicalCapacity(value).toLowerCase()));
      replaceSelectedValues('rom', matched);
      filters.elements.rom.value = matched[0] || '';
    }

    // CPU
    if (filters.elements.cpu) {
      const curCpu = selectedValues('cpu');
      filters.elements.cpu.innerHTML = '<option value="">Tất cả vi xử lý</option>' +
        opts.cpus.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
      const matched = curCpu.filter(value => opts.cpus.some(c => normalizeComparable(c) === normalizeComparable(value)));
      replaceSelectedValues('cpu', matched);
      filters.elements.cpu.value = matched[0] || '';
    }

    // OS
    if (filters.elements.os) {
      const curOs = selectedValues('os');
      filters.elements.os.innerHTML = '<option value="">Tất cả hệ điều hành</option>' +
        opts.osList.map(os => `<option value="${esc(os)}">${esc(os)}</option>`).join('');
      const matched = curOs.filter(value => opts.osList.some(o => normalizeComparable(o) === normalizeComparable(value)));
      replaceSelectedValues('os', matched);
      filters.elements.os.value = matched[0] || '';
    }

    // Screen
    if (filters.elements.screen) {
      const curScreen = selectedValues('screen');
      const screenLabels = {
        'duoi-6-inch': 'Dưới 6 inch', 'tu-6-inch': 'Từ 6 inch',
        'duoi-11-inch': 'Dưới 11 inch', 'tu-11-inch': 'Từ 11 inch',
        'duoi-15-inch': 'Dưới 15 inch', 'tu-15-inch': 'Từ 15 inch',
      };
      filters.elements.screen.innerHTML = '<option value="">Tất cả kích thước</option>' +
        opts.screens.map(value => `<option value="${esc(value)}">${esc(screenLabels[value] || value)}</option>`).join('');
      const matched = curScreen.filter(value => opts.screens.includes(value));
      replaceSelectedValues('screen', matched);
      filters.elements.screen.value = matched[0] || '';
    }

    // Camera
    if (filters.elements.camera) {
      const curCam = selectedValues('camera');
      const matched = curCam.filter(value => opts.cameras.includes(value));
      replaceSelectedValues('camera', matched);
      filters.elements.camera.value = matched[0] || '';
    }

    updateAttributeFilterVisibility(categoryId);
    for (let i = 0; i < 6; i++) {
      const name = 'spec' + (i + 1);
      const selectEl = filters.elements[name];
      if (!selectEl) continue;
      const spec = opts.specs[i];
      const current = selectedValues(name);
      if (!spec) {
        selectEl.innerHTML = '';
        selectEl.value = '';
        if (current.length) params.delete(name);
        continue;
      }
      const group = filters.querySelector?.('.filter-group-' + name);
      const labelEl = group?.querySelector('.pill-label');
      if (labelEl) labelEl.textContent = spec.label;
      selectEl.setAttribute?.('aria-label', 'Chọn ' + spec.label.toLocaleLowerCase('vi'));
      selectEl.innerHTML = `<option value="">Tất cả ${esc(spec.label.toLocaleLowerCase('vi'))}</option>` +
        spec.values.map(value => `<option value="${esc(value)}">${esc(value)}</option>`).join('');
      const matched = current.filter(value => spec.values.some(option => normalizeComparable(option) === normalizeComparable(value)));
      replaceSelectedValues(name, matched);
      selectEl.value = matched[0] || '';
    }
    syncMultiFilterUI();
  }

  const multiFilterUi = new Map();

  function initMultiFilterUI() {
    if (typeof filters.querySelectorAll !== 'function') return;
    for (const name of MULTI_FILTER_KEYS) {
      const selectEl = filters.elements[name];
      const group = filters.querySelector('.filter-group-' + name);
      if (!selectEl || !group || multiFilterUi.has(name)) continue;
      selectEl.classList.add('filter-source-select');
      selectEl.tabIndex = -1;
      selectEl.setAttribute('aria-hidden', 'true');
      const popover = document.createElement('div');
      popover.className = 'filter-popover';
      popover.innerHTML = `<button class="filter-popover-trigger" type="button" aria-expanded="false" aria-haspopup="true"><span>Tất cả</span><span aria-hidden="true">⌄</span></button><div class="filter-popover-panel" role="group" hidden></div>`;
      group.append(popover);
      const trigger = popover.querySelector('.filter-popover-trigger');
      const panel = popover.querySelector('.filter-popover-panel');
      trigger.addEventListener('click', event => {
        event.preventDefault();
        const willOpen = panel.hidden;
        closeAllFilterPopovers();
        panel.hidden = !willOpen;
        trigger.setAttribute('aria-expanded', String(willOpen));
        if (willOpen) {
          panel.style.left = '0';
          panel.style.right = 'auto';
          const bounds = panel.getBoundingClientRect();
          if (bounds.right > window.innerWidth - 12) {
            panel.style.left = 'auto';
            panel.style.right = '0';
          }
        }
      });
      panel.addEventListener('change', event => {
        const checkbox = event.target.closest('input[type="checkbox"]');
        if (!checkbox) return;
        const values = Array.from(panel.querySelectorAll('input:checked')).map(input => input.value);
        replaceSelectedValues(name, values);
        if (name === 'spec1' && params.get('category') === 'L03') {
          for (let i = 2; i <= 6; i++) params.delete('spec' + i);
        }
        params.delete('page');
        params.delete('id');
        pushParams();
        render();
      });
      multiFilterUi.set(name, { selectEl, group, trigger, panel });
    }
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeAllFilterPopovers();
    });
    document.addEventListener('click', event => {
      if (!event.target.closest('.filter-popover')) closeAllFilterPopovers();
    });
  }

  function closeAllFilterPopovers() {
    for (const { trigger, panel } of multiFilterUi.values()) {
      panel.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    }
  }

  function syncMultiFilterUI() {
    for (const [name, ui] of multiFilterUi.entries()) {
      const selections = selectedValues(name);
      const selectedSet = new Set(selections.map(normalizeComparable));
      const options = Array.from(ui.selectEl.options || []).filter(option => option.value);
      ui.panel.innerHTML = options.length
        ? options.map(option => `<label class="filter-check-option"><input type="checkbox" value="${esc(option.value)}" ${selectedSet.has(normalizeComparable(option.value)) ? 'checked' : ''}><span>${esc(option.textContent)}</span></label>`).join('')
        : '<span class="filter-empty-option">Chưa có dữ liệu phù hợp</span>';
      const fallback = ui.selectEl.options?.[0]?.textContent || 'Tất cả';
      ui.trigger.querySelector('span').textContent = selections.length === 0
        ? fallback
        : selections.length === 1 ? selections[0] : `${selections.length} đã chọn`;
      ui.trigger.classList.toggle('is-active', selections.length > 0);
    }
  }

  function reload() {
    db = S.load(list_products);
    if (typeof S.importStandardBatches === 'function' && (!list_products || list_products === window.list_products || list_products.length >= 20)) {
      db = S.importStandardBatches(db);
    }
    if (typeof S.patchProductImagePaths === 'function') {
      S.patchProductImagePaths(db);
    }
    window.__customerProducts = db.products;
    for (const key of Array.from(params.keys())) {
      if (![...FILTER_KEYS, 'page', 'id'].includes(key)) params.delete(key);
    }
    let selectedCat = params.get('category') || '';
    if (selectedCat && !db.categories.some(category => category.id === selectedCat && !category.hidden)) {
      params.delete('category');
      clearCategorySpecificParams('');
      selectedCat = '';
    }
    if (!selectedCat) clearCategorySpecificParams('');
    if (!['L01', 'L02', 'L04'].includes(selectedCat)) {
      for (const key of ['ram', 'rom', 'os', 'screen', 'cpu', 'camera']) params.delete(key);
    } else if (selectedCat !== 'L01') {
      params.delete('camera');
    }
    if (filters.elements.category) {
      filters.elements.category.innerHTML = '<option value="">Tất cả loại</option>' +
        db.categories.filter(c => !c.hidden).map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
      filters.elements.category.value = selectedCat;
    }
    reloadOptions(selectedCat);
    const CAT_ICONS = {
      'L01': 'fa-mobile-screen-button',
      'L02': 'fa-tablet-screen-button',
      'L03': 'fa-plug',
      'L04': 'fa-laptop',
      'L05': 'fa-headphones',
      'L06': 'fa-clock',
      'L07': 'fa-volume-high'
    };
    if (categoryMenu) {
      categoryMenu.innerHTML = '<a href="index.html#san-pham" data-nav-category="" role="menuitem"><i class="fa-solid fa-table-cells-large" aria-hidden="true"></i> Tất cả sản phẩm</a>' +
        db.categories.filter(c => !c.hidden).map(c => {
          const icon = CAT_ICONS[c.id] || 'fa-tag';
          return `<a href="index.html?category=${encodeURIComponent(c.id)}#san-pham" data-nav-category="${esc(c.id)}" role="menuitem"><i class="fa-solid ${icon}" aria-hidden="true"></i> ${esc(c.name)}</a>`;
        }).join('');
    }
    if (typeof document.querySelectorAll === 'function') {
      document.querySelectorAll('.category-shortcuts a[data-nav-category]').forEach(link => {
        const cat = link.getAttribute('data-nav-category');
        const isMatch = (cat === selectedCat);
        if (link.classList) link.classList.toggle('active', isMatch);
        if (isMatch) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }
  }

  function resetFilters() {
    for (const k of FILTER_KEYS) params.delete(k);
    params.delete('page');
    params.delete('id');
    for (const k of [...FILTER_KEYS, 'pricePreset']) {
      if (filters.elements[k]) filters.elements[k].value = '';
    }
    reloadOptions('');
    pushParams();
    render();
  }

  function clearCategorySpecificParams(categoryId, source = params) {
    for (let i = 1; i <= 6; i++) source.delete('spec' + i);
    const legacy = ['ram', 'rom', 'os', 'screen', 'cpu', 'camera'];
    if (!['L01', 'L02', 'L04'].includes(categoryId)) {
      for (const key of legacy) source.delete(key);
    } else if (categoryId !== 'L01') {
      source.delete('camera');
    }
  }

  function renderActiveFilters() {
    const chips = [];
    const addMultiChips = (key, label, format = value => value) => {
      for (const value of selectedValues(key)) {
        const text = format(value);
        chips.push(`<span class="filter-chip"><span>${esc(label)}: ${esc(text)}</span><button type="button" class="filter-chip-remove" data-remove-filter="${esc(key)}" data-remove-value="${esc(value)}" aria-label="Bỏ lọc ${esc(label)} ${esc(text)}"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></span>`);
      }
    };
    const q = params.get('q');
    if (q) {
      chips.push(`<span class="filter-chip"><span>Từ khóa: &ldquo;${esc(q)}&rdquo;</span><button type="button" class="filter-chip-remove" data-remove-filter="q" aria-label="Bỏ lọc từ khóa ${esc(q)}"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></span>`);
    }
    const categoryId = params.get('category');
    if (categoryId) {
      const cat = db.categories.find(c => c.id === categoryId);
      const catName = cat ? cat.name : categoryId;
      chips.push(`<span class="filter-chip"><span>Loại: ${esc(catName)}</span><button type="button" class="filter-chip-remove" data-remove-filter="category" aria-label="Bỏ lọc loại ${esc(catName)}"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></span>`);
    }
    addMultiChips('brand', 'Hãng');
    const minVal = params.get('min');
    const maxVal = params.get('max');
    const hasMin = minVal !== null && minVal !== '';
    const hasMax = maxVal !== null && maxVal !== '';
    if (hasMin || hasMax) {
      let priceLabel = '';
      if (hasMin && hasMax) {
        priceLabel = `Giá: ${money(minVal)} - ${money(maxVal)}`;
      } else if (hasMin) {
        priceLabel = `Giá: Từ ${money(minVal)}`;
      } else {
        priceLabel = `Giá: Đến ${money(maxVal)}`;
      }
      chips.push(`<span class="filter-chip"><span>${esc(priceLabel)}</span><button type="button" class="filter-chip-remove" data-remove-filter="price" aria-label="Bỏ lọc khoảng giá"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></span>`);
    }
    addMultiChips('ram', 'RAM');
    addMultiChips('rom', 'Bộ nhớ');
    addMultiChips('os', 'HĐH');
    const screenLabels = { 'duoi-6-inch': 'Dưới 6 inch', 'tu-6-inch': 'Từ 6 inch', 'duoi-11-inch': 'Dưới 11 inch', 'tu-11-inch': 'Từ 11 inch', 'duoi-15-inch': 'Dưới 15 inch', 'tu-15-inch': 'Từ 15 inch' };
    addMultiChips('screen', 'Màn hình', value => screenLabels[value] || value);
    addMultiChips('cpu', 'CPU');
    addMultiChips('camera', 'Camera', value => value === 'dual' ? 'Camera kép / đa camera' : value === 'single' ? 'Camera đơn' : value);
    const specConfig = categorySpecConfig(categoryId);
    for (let i = 0; i < specConfig.length; i++) {
      const name = 'spec' + (i + 1);
      addMultiChips(name, specConfig[i].label);
    }

    if (chips.length > 0) {
      activeFilters.hidden = false;
      activeFilters.style.display = '';
      activeFilters.innerHTML = `<span class="active-filters-title">Đang lọc theo:</span>` +
        chips.join('') +
        `<button type="button" class="btn-clear-all" data-action="reset-filters"><i class="fa-solid fa-trash-can" aria-hidden="true"></i> Xóa tất cả</button>`;
    } else {
      activeFilters.hidden = true;
      activeFilters.style.display = 'none';
      activeFilters.innerHTML = '';
    }
  }

  function render() {
    reload();

    if (!params.has('id')) {
      const hero = document.querySelector('.hero');
      if (hero) hero.style.display = '';
      root.style.display = '';
      const detailSection = document.getElementById('productDetailPage');
      if (detailSection) detailSection.style.display = 'none';
    }

    // Đồng bộ các trường input và select theo tham số trên URL
    for (const key of ['q', 'category', 'brand', 'min', 'max', 'ram', 'rom', 'os', 'screen', 'cpu', 'camera', 'spec1', 'spec2', 'spec3', 'spec4', 'spec5', 'spec6']) {
      if (filters.elements[key]) filters.elements[key].value = params.get(key) || '';
    }
    const currentSort = params.get('sort') || '';
    if (currentSort && currentSort !== 'price-asc' && currentSort !== 'price-desc') params.delete('sort');
    if (filters.elements.sort) {
      filters.elements.sort.value = (currentSort === 'price-asc' || currentSort === 'price-desc') ? currentSort : '';
    }

    // Đồng bộ mức giá nhanh nếu min/max trùng preset
    if (filters.elements.pricePreset) {
      const minP = params.get('min') || '', maxP = params.get('max') || '';
      if (!minP && maxP === '2000000') filters.elements.pricePreset.value = 'duoi-2-trieu';
      else if (minP === '2000000' && maxP === '4000000') filters.elements.pricePreset.value = '2-4-trieu';
      else if (minP === '4000000' && maxP === '7000000') filters.elements.pricePreset.value = '4-7-trieu';
      else if (minP === '7000000' && maxP === '13000000') filters.elements.pricePreset.value = '7-13-trieu';
      else if (minP === '13000000' && !maxP) filters.elements.pricePreset.value = 'tren-13-trieu';
      else if (minP || maxP) filters.elements.pricePreset.value = 'custom';
      else filters.elements.pricePreset.value = '';
    }

    renderActiveFilters();

    const rawMin = (params.get('min') || '').trim();
    const rawMax = (params.get('max') || '').trim();
    const validMin = isValidPrice(rawMin);
    const validMax = isValidPrice(rawMax);
    const reversed = (rawMin !== '' && rawMax !== '' && validMin && validMax && Number(rawMin) > Number(rawMax));
    const invalidPrice = !validMin || !validMax || reversed;

    const errorEl = document.getElementById('filterError');
    if (errorEl) {
      errorEl.textContent = invalidPrice ? 'Khoảng giá không hợp lệ. Giá phải là số nguyên không âm và giá từ không vượt giá đến.' : '';
    }

    const appliedQ = params.get('q') || '';
    const appliedCategory = params.get('category') || '';
    const appliedBrand = selectedValues('brand');
    const appliedRam = selectedValues('ram');
    const appliedRom = selectedValues('rom');
    const appliedOs = selectedValues('os');
    const appliedScreen = selectedValues('screen');
    const appliedCpu = selectedValues('cpu');
    const appliedCamera = selectedValues('camera');
    const appliedSpecs = Array.from({ length: 6 }, (_, index) => selectedValues('spec' + (index + 1)));
    const appliedSpecConfig = categorySpecConfig(appliedCategory);

    // Thứ tự xử lý bắt buộc:
    // Toàn bộ sản phẩm được phép hiển thị → lọc → sắp xếp → phân trang → hiển thị.
    let products = invalidPrice ? [] : getActiveProducts().filter(p => {
      const matchQ = !appliedQ || S.normalize(p.name).includes(S.normalize(appliedQ));
      const matchCat = !appliedCategory || p.categoryId === appliedCategory;
      const matchB = matchesBrand(p.company, appliedBrand);
      const amt = price(p);
      const matchMin = rawMin === '' || amt >= Number(rawMin);
      const matchMax = rawMax === '' || amt <= Number(rawMax);
      const matchRam = matchesRam(p.detail?.ram, appliedRam);
      const matchRom = matchesRom(p.detail?.rom, appliedRom);
      const matchOs = matchesOs(p.detail?.os, appliedOs);
      const matchScr = matchesScreen(p.detail?.screen, appliedScreen);
      const matchCpuVal = matchesCpu(p.detail?.cpu, appliedCpu);
      const matchCam = matchesCamera(p.detail?.camara, appliedCamera);
      const matchSpecs = appliedSpecConfig.every((config, index) =>
        matchesSpec(p, config.key, appliedSpecs[index]),
      );

      return matchQ && matchCat && matchB && matchMin && matchMax && matchRam && matchRom && matchOs && matchScr && matchCpuVal && matchCam && matchSpecs;
    });

    // Sắp xếp theo giá bán thực tế ổn định
    if (currentSort === 'price-asc') {
      products = products.map((p, idx) => ({ p, idx, pr: price(p) }))
        .sort((a, b) => (a.pr - b.pr) || (a.idx - b.idx))
        .map(x => x.p);
    } else if (currentSort === 'price-desc') {
      products = products.map((p, idx) => ({ p, idx, pr: price(p) }))
        .sort((a, b) => (b.pr - a.pr) || (a.idx - b.idx))
        .map(x => x.p);
    }

    // Phân trang
    const totalCount = products.length;
    const count = Math.max(1, Math.ceil(totalCount / size));
    let pageParam = Math.floor(Number(params.get('page')) || 1);
    if (!Number.isSafeInteger(pageParam) || pageParam < 1) pageParam = 1;
    const page = Math.min(count, Math.max(1, pageParam));
    if (page > 1) params.set('page', String(page));
    else params.delete('page');
    replaceCurrentUrl();

    const countEl = document.getElementById('productCount');
    if (countEl) {
      countEl.textContent = `${totalCount} sản phẩm · Trang ${page}/${count}`;
    }

    const pagedProducts = products.slice((page - 1) * size, page * size);
    const listEl = document.getElementById('productList');
    if (listEl) {
      listEl.innerHTML = pagedProducts.map(p => {
        const qty = stock(p), amount = price(p), type = db.categories.find(c => c.id === p.categoryId)?.name || 'Chưa phân loại';
        const ramTxt = p.detail?.ram && p.detail.ram !== 'Không' ? p.detail.ram : '';
        const romTxt = p.detail?.rom && p.detail.rom !== 'Không' ? p.detail.rom : '';
        const categoryBadge = p.detail?.accessoryType || p.detail?.type || p.detail?.size || p.detail?.power || '';
        const badgeSpecs = [ramTxt, romTxt].filter(Boolean).join(' - ') || categoryBadge;
        return `<article class="product-card">
          <a class="product-image" href="${detailURL(p.masp)}"><img src="${esc(image(p))}" alt="${esc(p.name)}" loading="lazy"></a>
          <div class="product-company">${esc(type)} · ${esc(p.company)}${badgeSpecs ? ` <span class="spec-tag">${esc(badgeSpecs)}</span>` : ''}</div>
          <h3 class="product-name"><a href="${detailURL(p.masp)}">${esc(p.name)}</a></h3>
          <div class="product-price">${money(amount)}</div>
          <p>${qty > 0 ? 'Còn ' + qty + ' sản phẩm' : 'Hết hàng'}</p>
          <div class="catalog-actions"><a class="btn btn-outline" href="${detailURL(p.masp)}"><i class="fa-solid fa-circle-info" aria-hidden="true"></i> Chi tiết</a><button class="btn btn-primary" data-buy="${esc(p.masp)}" ${qty <= 0 || amount <= 0 ? 'disabled' : ''}><i class="fa-solid fa-cart-plus" aria-hidden="true"></i> Thêm giỏ</button></div>
        </article>`;
      }).join('') || `<div class="empty-products">
        <p>Không tìm thấy sản phẩm phù hợp với bộ lọc đã chọn.</p>
        <p class="empty-hint">Hãy thử bỏ bớt điều kiện lọc hoặc chọn mức giá khác.</p>
        <button type="button" class="btn btn-outline" data-action="reset-filters"><i class="fa-solid fa-trash-can" aria-hidden="true"></i> Xóa bộ lọc</button>
      </div>`;
    }

    if (pages) {
      if (!totalCount) {
        pages.innerHTML = '';
      } else if (count === 1) {
        pages.innerHTML = '<button class="btn btn-primary" data-page="1" aria-current="page">1</button>';
      } else {
        let pagHtml = '<button class="btn btn-outline" data-page="' + (page - 1) + '" ' + (page <= 1 ? 'disabled aria-disabled="true"' : '') + ' aria-label="Trang trước"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>';
        for (let i = 1; i <= count; i++) {
          pagHtml += '<button class="btn ' + (i === page ? 'btn-primary' : 'btn-outline') + '" data-page="' + i + '" ' + (i === page ? 'aria-current="page"' : '') + '>' + i + '</button>';
        }
        pagHtml += '<button class="btn btn-outline" data-page="' + (page + 1) + '" ' + (page >= count ? 'disabled aria-disabled="true"' : '') + ' aria-label="Trang sau"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>';
        pages.innerHTML = pagHtml;
      }
    }

    if (params.has('id')) detail(params.get('id'));
    if (dataError) notice.textContent = dataError;
  }

  function detailURL(id) {
    const q = new URLSearchParams(params);
    q.set('id', id);
    const target = 'chi_tiet_sp.html?' + q.toString();
    return window.TechStoreDemo?.localMode ? window.TechStoreDemo.transferURL(target) : target;
  }

  function detail(id) {
    const hero = document.querySelector('.hero');
    if (hero) hero.style.display = 'none';
    root.style.display = 'none';
    let section = document.getElementById('productDetailPage');
    if (!section) {
      section = document.createElement('section');
      section.id = 'productDetailPage';
      section.className = 'product-detail-page';
      root.before(section);
    }
    section.style.display = '';

    const back = new URLSearchParams(params);
    back.delete('id');
    const p = (window.__customerProducts || db.products).find(p => p.masp === id && active(p));
    const backTarget = 'index.html' + (back.toString() ? '?' + back.toString() : '');
    const backHref = window.TechStoreDemo?.localMode ? window.TechStoreDemo.transferURL(backTarget) : backTarget + '#san-pham';
    const link = `<a class="detail-back" href="${esc(backHref)}">← Quay lại kết quả</a>`;
    if (!p) {
      section.innerHTML = link + '<h1>Sản phẩm không tồn tại hoặc đã được ẩn</h1>';
      return;
    }
    document.title = p.name + ' | TechStore';
    const labels = {
      screen:'Màn hình', os:'Hệ điều hành', camara:'Camera sau', camaraFront:'Camera trước',
      cpu:'Bộ xử lý', gpu:'Đồ họa', ram:'RAM', rom:'Bộ nhớ', microUSB:'Thẻ nhớ / kết nối', battery:'Pin / nguồn',
      type:'Kiểu', connection:'Kết nối', noiseCancellation:'Chống ồn', size:'Kích thước',
      compatibility:'Tương thích hệ điều hành', waterResistance:'Chống nước', power:'Công suất',
      accessoryType:'Nhóm phụ kiện', dpi:'Độ phân giải cảm biến', layout:'Layout',
      keyType:'Loại phím', ports:'Cổng', chargingStandard:'Chuẩn sạc',
      connectors:'Đầu kết nối', length:'Chiều dài', capacity:'Dung lượng',
    };
    if (p.categoryId === 'L04') {
      labels.camara = 'Webcam';
      labels.rom = 'Lưu trữ';
    }
    const qty = stock(p.masp), amount = price(p);
    section.innerHTML = link + `<div class="detail-container"><div class="detail-image"><img src="${esc(image(p))}" alt="${esc(p.name)}"></div><div class="detail-info"><p>${esc(p.company)} · Mã ${esc(p.masp)}</p><h1>${esc(p.name)}</h1><div class="detail-price">${money(amount)}</div><p>${qty > 0 ? 'Còn ' + qty + ' sản phẩm' : 'Hết hàng'}</p><p class="catalog-description">${esc(p.description)}</p><div class="detail-purchase-actions"><button class="btn btn-primary" data-buy="${esc(p.masp)}" ${qty <= 0 || amount <= 0 ? 'disabled' : ''}><i class="fa-solid fa-cart-plus" aria-hidden="true"></i> Thêm vào giỏ hàng</button><button class="btn btn-outline" data-buy-now="${esc(p.masp)}" ${qty <= 0 || amount <= 0 ? 'disabled' : ''}><i class="fa-solid fa-bolt" aria-hidden="true"></i> Mua ngay</button></div><p class="catalog-feedback" role="status"></p><h2>Thông số kỹ thuật</h2><table class="spec-table"><tbody>${Object.entries(p.detail || {}).filter(([,v]) => v).map(([k,v]) => `<tr><td>${esc(labels[k] || k)}</td><td>${esc(v)}</td></tr>`).join('') || '<tr><td>Thông số đang cập nhật</td></tr>'}</tbody></table></div></div>`;
  }

  const productMenu = document.querySelector('.nav-product-menu');
  const productTrigger = document.querySelector('.nav-product-trigger');
  if (productMenu && productTrigger) {
    productMenu.addEventListener('mouseenter', () => productTrigger.setAttribute('aria-expanded', 'true'));
    productMenu.addEventListener('mouseleave', () => productTrigger.setAttribute('aria-expanded', 'false'));
    productMenu.addEventListener('focusin', () => productTrigger.setAttribute('aria-expanded', 'true'));
    productMenu.addEventListener('focusout', e => { if (!productMenu.contains(e.relatedTarget)) productTrigger.setAttribute('aria-expanded', 'false'); });
  }

  // Submit form khi bấm Tìm kiếm hoặc Enter
  filters.addEventListener('submit', e => {
    e.preventDefault();
    params.delete('page');
    params.delete('id');
    for (const key of FILTER_KEYS) {
      const el = filters.elements[key];
      if (!el) continue;
      if (MULTI_FILTER_KEYS.has(key) && multiFilterUi.has(key)) continue;
      const v = el.value.trim();
      if (key === 'sort') {
        if (v === 'price-asc' || v === 'price-desc') params.set('sort', v);
        else params.delete('sort');
      } else if (v) {
        params.set(key, v);
      } else {
        params.delete(key);
      }
    }
    pushParams();
    render();
  });

  // Thanh tìm kiếm ở đầu trang dùng cùng URL/state với bộ lọc, kể cả khi bắt đầu từ trang chi tiết.
  const headerSearch = document.getElementById('headerSearch');
  const headerSearchInput = document.getElementById('headerSearchInput');
  if (headerSearch && headerSearchInput) {
    headerSearchInput.value = params.get('q') || '';
    headerSearch.addEventListener('submit', e => {
      e.preventDefault();
      const query = headerSearchInput.value.trim();
      if (query) params.set('q', query);
      else params.delete('q');
      params.delete('page');
      params.delete('id');
      pushParams();
      render();
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // Xử lý thay đổi khoảng giá nhanh (Price Preset)
  if (filters.elements.pricePreset) {
    filters.elements.pricePreset.addEventListener('change', () => {
      const preset = filters.elements.pricePreset.value;
      if (preset === 'duoi-2-trieu') {
        params.delete('min');
        params.set('max', '2000000');
      } else if (preset === '2-4-trieu') {
        params.set('min', '2000000');
        params.set('max', '4000000');
      } else if (preset === '4-7-trieu') {
        params.set('min', '4000000');
        params.set('max', '7000000');
      } else if (preset === '7-13-trieu') {
        params.set('min', '7000000');
        params.set('max', '13000000');
      } else if (preset === 'tren-13-trieu') {
        params.set('min', '13000000');
        params.delete('max');
      } else if (preset === '') {
        params.delete('min');
        params.delete('max');
      }
      params.delete('page');
      params.delete('id');
      pushParams();
      render();
    });
  }

  // Đổi loại sản phẩm: cập nhật danh mục tùy chọn trước khi áp dụng
  if (filters.elements.category) {
    filters.elements.category.addEventListener('change', () => {
      const newCategory = filters.elements.category.value;
      if (newCategory) params.set('category', newCategory);
      else params.delete('category');

      clearCategorySpecificParams(newCategory);
      reloadOptions(newCategory);
      params.delete('page');
      params.delete('id');
      pushParams();
      render();
    });
  }

  // Đăng ký sự kiện thay đổi cho tất cả các select còn lại
  const autoChangeKeys = ['brand', 'ram', 'rom', 'os', 'screen', 'cpu', 'camera', 'spec1', 'spec2', 'spec3', 'spec4', 'spec5', 'spec6', 'sort'];
  for (const k of autoChangeKeys) {
    if (filters.elements[k]) {
      filters.elements[k].addEventListener('change', () => {
        const val = filters.elements[k].value.trim();
        if (k === 'sort') {
          if (val === 'price-asc' || val === 'price-desc') params.set('sort', val);
          else params.delete('sort');
        } else if (val) {
          replaceSelectedValues(k, [val]);
        } else {
          params.delete(k);
        }
        if (k === 'spec1' && params.get('category') === 'L03') {
          for (let i = 2; i <= 6; i++) params.delete('spec' + i);
        }
        params.delete('page');
        params.delete('id');
        pushParams();
        render();
      });
    }
  }

  // Xử lý các tương tác click
  document.addEventListener('click', async e => {
    const advancedToggle = e.target.closest('[data-action="toggle-advanced"]');
    if (advancedToggle) {
      const open = filters.classList.toggle('advanced-open');
      advancedToggle.setAttribute('aria-expanded', String(open));
      advancedToggle.lastElementChild.className = open ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down';
      return;
    }
    // Xóa tất cả bộ lọc
    const resetBtn = e.target.closest('[data-action="reset-filters"]');
    if (resetBtn) {
      e.preventDefault();
      resetFilters();
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    // Bỏ một nhãn điều kiện đang lọc
    const removeBtn = e.target.closest('[data-remove-filter]');
    if (removeBtn) {
      e.preventDefault();
      const filterKey = removeBtn.dataset.removeFilter;
      if (filterKey === 'price') {
        params.delete('min');
        params.delete('max');
        if (filters.elements.min) filters.elements.min.value = '';
        if (filters.elements.max) filters.elements.max.value = '';
        if (filters.elements.pricePreset) filters.elements.pricePreset.value = '';
      } else if (filterKey === 'category') {
        params.delete('category');
        clearCategorySpecificParams('');
        if (filters.elements.category) filters.elements.category.value = '';
        reloadOptions('');
      } else {
        const removeValue = removeBtn.dataset.removeValue;
        if (removeValue !== undefined && MULTI_FILTER_KEYS.has(filterKey)) {
          replaceSelectedValues(filterKey, selectedValues(filterKey).filter(value => normalizeComparable(value) !== normalizeComparable(removeValue)));
        } else {
          params.delete(filterKey);
        }
        if (filters.elements[filterKey]) filters.elements[filterKey].value = selectedValues(filterKey)[0] || '';
      }
      params.delete('page');
      pushParams();
      render();
      return;
    }

    // Nút quay lại từ chi tiết sản phẩm trên cùng trang index.html
    const backLink = e.target.closest('.detail-back');
    if (backLink && !/chi_tiet_sp\.html$/i.test(location.pathname)) {
      e.preventDefault();
      params.delete('id');
      pushParams();
      render();
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    // Điều hướng loại sản phẩm từ header
    const categoryLink = e.target.closest('[data-nav-category]');
    if (categoryLink) {
      const isDetailPage = /chi_tiet_sp\.html$/i.test(location.pathname);
      const categoryId = categoryLink.dataset.navCategory || '';

      const nextParams = new URLSearchParams(params);
      nextParams.delete('id');
      nextParams.delete('page');
      if (categoryId) nextParams.set('category', categoryId);
      else nextParams.delete('category');
      clearCategorySpecificParams(categoryId, nextParams);

      // Kiểm tra tính hợp lệ của các tùy chọn khi đổi loại
      const opts = getAvailableOptions(getActiveProducts(), categoryId);
      replaceValuesOn(nextParams, 'brand', selectedValues('brand', nextParams).filter(value => opts.brands.some(x => normalizeComparable(x) === normalizeComparable(value))));
      replaceValuesOn(nextParams, 'ram', selectedValues('ram', nextParams).filter(value => opts.rams.some(x => canonicalCapacity(x).toLowerCase() === canonicalCapacity(value).toLowerCase())));
      replaceValuesOn(nextParams, 'rom', selectedValues('rom', nextParams).filter(value => opts.roms.some(x => canonicalCapacity(x).toLowerCase() === canonicalCapacity(value).toLowerCase())));

      const searchStr = nextParams.toString() ? '?' + nextParams.toString() : '';
      const targetUrl = 'index.html' + searchStr + '#san-pham';
      const finalHref = window.TechStoreDemo?.localMode ? window.TechStoreDemo.transferURL(targetUrl) : targetUrl;

      if (isDetailPage) {
        window.location.href = finalHref;
        return;
      }

      e.preventDefault();
      params.delete('id');
      params.delete('page');
      if (categoryId) params.set('category', categoryId);
      else params.delete('category');
      clearCategorySpecificParams(categoryId);
      replaceSelectedValues('brand', selectedValues('brand').filter(value => opts.brands.some(x => normalizeComparable(x) === normalizeComparable(value))));
      replaceSelectedValues('ram', selectedValues('ram').filter(value => opts.rams.some(x => canonicalCapacity(x).toLowerCase() === canonicalCapacity(value).toLowerCase())));
      replaceSelectedValues('rom', selectedValues('rom').filter(value => opts.roms.some(x => canonicalCapacity(x).toLowerCase() === canonicalCapacity(value).toLowerCase())));

      try {
        history.pushState(null, '', finalHref);
      } catch (_) {}
      render();
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const trigger = document.querySelector('.nav-product-trigger');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
      return;
    }

    // Chuyển trang
    const pageBtn = e.target.closest('[data-page]');
    if (pageBtn) {
      params.set('page', pageBtn.dataset.page);
      pushParams();
      render();
      root.scrollIntoView();
      return;
    }

    // Mua ngay hoặc Thêm vào giỏ
    const buyNow = e.target.closest('[data-buy-now]');
    const buy = e.target.closest('[data-buy]') || buyNow;
    if (!buy) return;
    const feedback = document.querySelector('.catalog-feedback') || notice;
    buy.disabled = true;
    try {
      reload();
      const requestedId = buy.dataset.buy ?? buy.dataset.buyNow;
      const p = (window.__customerProducts || db.products).find(p => String(p.masp) === String(requestedId) && active(p));
      if (!p || stock(p) <= 0 || price(p) <= 0) throw Error('Sản phẩm không còn khả dụng. Vui lòng tải lại danh sách.');
      if (!window.TechStoreDemo?.getAccount?.()) {
        window.openModal('login');
        throw Error('Vui lòng đăng nhập tài khoản khách hàng trước khi mua hàng.');
      }
      if (!window.TechStoreCart?.add) throw Error('Chức năng giỏ hàng chưa được tải. Hãy tải lại trang.');
      await window.TechStoreCart.add({ productId: p.masp, quantity: 1 });
      if (buyNow) { window.location.href = 'don-hang.html?checkout=1'; return; }
      feedback.textContent = 'Đã thêm sản phẩm vào giỏ hàng.';
    } catch (error) {
      feedback.textContent = location.protocol === 'file:' && !window.TechStoreCart
        ? 'Cần đăng nhập để mua hàng. Mở bản chạy Node.js để dùng tài khoản, hoặc kết nối module giỏ hàng TV4.'
        : error.message;
    } finally {
      buy.disabled = false;
    }
  });

  window.addEventListener('popstate', () => {
    syncParamsFromLocation();
    render();
  });
  window.addEventListener('storage', e => {
    if (e.key === S.KEY) render();
  });

  function loadProducts() {
    try {
      reload();
      window.__customerProducts = db.products;
      dataError = '';
      render();
    } catch (e) {
      dataError = 'Không thể đọc dữ liệu sản phẩm trong Local Storage: ' + e.message;
      window.__customerProducts = [];
      render();
    }
  }

  initMultiFilterUI();
  window.addEventListener('pageshow', loadProducts);
})();
