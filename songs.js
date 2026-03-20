const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTTjsN_4lIaiWM42Eg_nnZjQQSkzhrfqypd98ybfyZclxeoaMHZeOIzAXnNT2B-0-0eVkkpJl1JMrDJ/pub?output=csv";

let songs = []; // เก็บข้อมูลต้นฉบับจาก Sheet เสมอ (ไม่ถูกแก้ไขการเรียงลำดับ)
let filteredSongs = []; // เก็บข้อมูลที่ผ่านการค้นหา หรือ ผ่านการจัดเรียงแล้ว

let currentPage = 1;
const songsPerPage = 100;

/* ========================= */
/* โหลดข้อมูลจาก Google Sheet */
/* ========================= */
fetch(sheetURL)
    .then(res => res.text())
    .then(csv => {
        const rows = csv.trim().split("\n").slice(1);

        // แก้ไขการแยกคอลัมน์ให้รองรับชื่อที่มีเครื่องหมายลูกน้ำ (,)
        songs = rows.map((row, originalIndex) => {
            const cols = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
            if (cols && cols.length >= 3) {
                return {
                    // แอบเก็บ originalIndex ไว้ เผื่อผู้ใช้กดเรียงกลับเป็นค่าเริ่มต้น (default)
                    originalIndex: originalIndex,
                    number: cols[0].replace(/^"|"$/g, '').trim(),
                    title: cols[1].replace(/^"|"$/g, '').trim(),
                    artist: cols[2].replace(/^"|"$/g, '').trim()
                };
            }
            return null;
        }).filter(song => song !== null); // กรองแถวที่ข้อมูลไม่ครบออก

        filteredSongs = [...songs]; // Copy ข้อมูลตั้งต้นมาไว้ใน filteredSongs
        showPage(1);
    })
    .catch(err => console.error("Error loading songs:", err));

/* ========================= */
/* แสดงเพลงตามหน้า (Pagination) */
/* ========================= */
function showPage(page) {
    currentPage = page;

    const start = (page - 1) * songsPerPage;
    const end = start + songsPerPage;
    const pageSongs = filteredSongs.slice(start, end);

    const list = document.getElementById("song-list");
    if (!list) return;

    list.innerHTML = pageSongs.map((song, index) => `
        <div class="song-card">
            <div class="song-number">${start + index + 1}</div>
            <div class="song-title">${song.title}</div>
            <div class="song-artist">${song.artist}</div>
        </div>
    `).join("");

    renderPagination();
}

/* ========================= */
/* สร้างปุ่มเปลี่ยนหน้า (อัปเกรดมีจุดไข่ปลา) */
/* ========================= */
function renderPagination() {
    const totalPages = Math.ceil(filteredSongs.length / songsPerPage);
    const container = document.getElementById("pagination");

    if (!container) return;

    // ถ้ามีหน้าเดียว หรือไม่มีข้อมูล ไม่ต้องแสดงปุ่ม
    if (totalPages <= 1) {
        container.innerHTML = "";
        return;
    }

    let html = "";

    // ปุ่มย้อนกลับ (←) จะโชว์เมื่อไม่ได้อยู่หน้า 1
    if (currentPage > 1) {
        html += `<button onclick="showPage(${currentPage - 1})">←</button>`;
    }

    // คำนวณว่าจะโชว์เลขหน้าอะไรบ้าง
    let pagesToShow = [];
    for (let i = 1; i <= totalPages; i++) {
        // เงื่อนไข: โชว์หน้า 1, หน้าสุดท้าย, และหน้าที่อยู่ติดกับหน้าปัจจุบัน (หน้า-หลัง อย่างละ 1)
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            pagesToShow.push(i);
        }
    }

    // วาดปุ่มเลขหน้า และเติม ... ในช่องว่าง
    let lastAdded = 0;
    for (let page of pagesToShow) {
        if (page - lastAdded > 1) {
            // ถ้าเลขกระโดดข้าม ให้ใส่ ...
            html += `<span style="display:inline-flex; align-items:center; color:#7B4F2C; padding: 0 5px; font-weight:bold;">...</span>`;
        }

        if (page === currentPage) {
            html += `<button class="active">${page}</button>`;
        } else {
            html += `<button onclick="showPage(${page})">${page}</button>`;
        }
        lastAdded = page;
    }

    // ปุ่มถัดไป (→) จะโชว์เมื่อยังไม่ถึงหน้าสุดท้าย
    if (currentPage < totalPages) {
        html += `<button onclick="showPage(${currentPage + 1})">→</button>`;
    }

    container.innerHTML = html;
}
/* ========================= */
/* ระบบค้นหา (SEARCH) */
/* ========================= */
const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearch");

if (searchInput) {
    searchInput.addEventListener("input", function() {
        const keyword = this.value.toLowerCase().trim();

        if (clearSearchBtn) {
            clearSearchBtn.style.display = keyword.length > 0 ? "block" : "none";
        }

        if (keyword === "") {
            filteredSongs = [...songs];
        } else {
            filteredSongs = songs.filter(song =>
                song.title.toLowerCase().includes(keyword) ||
                song.artist.toLowerCase().includes(keyword)
            );
        }

        // เมื่อค้นหาเสร็จ ต้องสั่งให้เรียงลำดับใหม่ด้วย (ในกรณีที่ User ค้าง Dropdown ไว้)
        applySort(false);
    });
}

if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", function() {
        if (searchInput) {
            searchInput.value = "";
            searchInput.dispatchEvent(new Event("input"));
        }
    });
}

/* ========================= */
/* ระบบจัดเรียง (SORT) */
/* ========================= */
// resetPage เป็น boolean ที่บอกว่า เรียงเสร็จแล้วต้องกลับไปหน้า 1 ไหม (ค่าปกติคือ true)
function applySort(resetPage = true) {
    const sortSelect = document.getElementById("sortSelect");
    if (!sortSelect) return;

    const sortValue = sortSelect.value;

    if (sortValue === "title-asc") {
        filteredSongs.sort((a, b) => a.title.localeCompare(b.title, 'th'));
    } else if (sortValue === "title-desc") {
        filteredSongs.sort((a, b) => b.title.localeCompare(a.title, 'th'));
    } else if (sortValue === "artist-asc") {
        filteredSongs.sort((a, b) => a.artist.localeCompare(b.artist, 'th'));
    } else if (sortValue === "default") {
        // เรียงกลับตามลำดับดั้งเดิมตอนโหลดมาจาก Google Sheet
        filteredSongs.sort((a, b) => a.originalIndex - b.originalIndex);
    }

    // วาดรายการเพลงใหม่ (กลับไปหน้า 1 เสมอถ้ากดจัดเรียงใหม่)
    if (resetPage) {
        showPage(1);
    } else {
        showPage(currentPage);
    }
}