// ฟังก์ชันสำหรับสลับเปิด/ปิด เมนูบนมือถือ (ที่คุณมีอยู่แล้ว)
function toggleMenu() {
    const menu = document.getElementById('menu');
    menu.classList.toggle('show');
}

// 🌟 โค้ดส่วนที่เพิ่มใหม่: ตรวจจับการคลิกพื้นที่ว่างเพื่อปิดเมนู
document.addEventListener('click', function(event) {
    const menu = document.getElementById('menu');
    const menuBtn = document.querySelector('.menu-btn');

    // เช็กว่าเมนูกำลังเปิดอยู่หรือไม่
    if (menu.classList.contains('show')) {
        // เช็กว่าจุดที่คลิก ไม่ได้อยู่ข้างในเมนู และ ไม่ใช่ปุ่มเปิดเมนู (☰)
        if (!menu.contains(event.target) && !menuBtn.contains(event.target)) {
            // ถ้าใช่ ให้ดึงคลาส show ออกเพื่อปิดเมนู
            menu.classList.remove('show');
        }
    }
});

/* ========================= */
/* เมนู active อัตโนมัติ (แก้ตัวแปรซ้ำแล้ว) */
/* ========================= */
const currentFileName = window.location.pathname.split("/").pop() || "index.html";
const activeMenuLinks = document.querySelectorAll(".menu a"); // เปลี่ยนชื่อตัวแปรกันเหนียว

activeMenuLinks.forEach(link => {
    const linkPage = link.getAttribute("href");
    if (linkPage === currentFileName || (currentFileName === "" && linkPage === "index.html")) {
        link.classList.add("active");
    }
});

/* ========================= */
/* เพลงล่าสุด (ดึงจาก Google Sheets) */
/* ========================= */
const songURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTTjsN_4lIaiWM42Eg_nnZjQQSkzhrfqypd98ybfyZclxeoaMHZeOIzAXnNT2B-0-0eVkkpJl1JMrDJ/pub?output=csv";

fetch(songURL)
    .then(res => res.text())
    .then(data => {
        const rows = data.trim().split("\n").slice(1);
        const latest = rows.slice(-10).reverse();
        const container = document.getElementById("songs");

        if (!container) return;

        let htmlContent = "";

        latest.forEach(row => {
            const col = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
            if (col && col.length >= 3) {
                const song = col[1].replace(/^"|"$/g, '').trim();
                const artist = col[2].replace(/^"|"$/g, '').trim();

                htmlContent += `
                    <div class="card">
                        <div class="song-name">${song}</div>
                        <div class="artist">${artist}</div>
                    </div>
                `;
            }
        });

        container.innerHTML = htmlContent;
    })
    .catch(error => console.error("Error fetching songs:", error));

/* ========================= */
/* ศิลปิน (ดึงจาก Google Sheets) & ระบบค้นหา + จัดเรียง */
/* ========================= */
const artistURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSn2Ap5lMqWSJirKsmDppkUPOQvEN4gActX2KGUOts3Ah-gWPFQtjgmiTCN2GvfZUwCG5JpSVH8cSeY/pub?gid=1450014104&single=true&output=csv";
let allArtists = [];
let filteredArtists = [];

fetch(artistURL)
    .then(res => res.text())
    .then(csv => {
        const rows = csv.trim().split(/\r?\n/).slice(1);

        rows.forEach((row, index) => {
            const col = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
            if (col && col.length >= 2) {
                allArtists.push({
                    originalIndex: index,
                    name: col[0].replace(/^"|"$/g, '').trim(),
                    image: col[1] ? col[1].replace(/^"|"$/g, '').trim() : "https://via.placeholder.com/200"
                });
            }
        });

        const artistContainer = document.getElementById("artists");
        if (artistContainer) {
            const isHomePage = document.querySelector('.artist-header');

            if (isHomePage) {
                showRandomArtists(5);
            } else {
                filteredArtists = [...allArtists];
                applyArtistSort();
            }
        }
    })
    .catch(error => console.error("Error fetching artists:", error));

// ฟังก์ชันโชว์ศิลปินแบบเรียงปกติ
function showArtists() {
    const container = document.getElementById("artists");
    if (!container) return;

    let htmlContent = "";

    if (filteredArtists.length === 0) {
        container.innerHTML = "<p style='grid-column: 1 / -1; text-align: center; color: #777;'>ไม่พบศิลปินที่คุณค้นหา</p>";
        return;
    }

    filteredArtists.forEach((a) => {
        htmlContent += `
            <div class="artist-card" onclick="openArtist('${a.name}')">
                <img src="${a.image}" alt="${a.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/150'">
                <p>${a.name}</p>
            </div>
        `;
    });
    container.innerHTML = htmlContent;
}

// ฟังก์ชันโชว์ศิลปินแบบสุ่ม
function showRandomArtists(limit) {
    const container = document.getElementById("artists");
    if (!container) return;

    const shuffledArtists = [...allArtists].sort(() => 0.5 - Math.random());
    const list = shuffledArtists.slice(0, limit);

    let htmlContent = "";
    list.forEach((a) => {
        htmlContent += `
            <div class="artist-card" onclick="openArtist('${a.name}')">
                <img src="${a.image}" alt="${a.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/150'">
                <p>${a.name}</p>
            </div>
        `;
    });
    container.innerHTML = htmlContent;
}

/* ========================= */
/* ระบบทำงานของกล่องค้นหาศิลปิน */
/* ========================= */
const searchArtistInput = document.getElementById("searchArtistInput");
const clearArtistSearchBtn = document.getElementById("clearArtistSearch");

if (searchArtistInput) {
    searchArtistInput.addEventListener("input", function() {
        const keyword = this.value.toLowerCase().trim();

        if (clearArtistSearchBtn) {
            clearArtistSearchBtn.style.display = keyword.length > 0 ? "block" : "none";
        }

        if (keyword === "") {
            filteredArtists = [...allArtists];
        } else {
            filteredArtists = allArtists.filter(artist =>
                artist.name.toLowerCase().includes(keyword)
            );
        }

        showArtists();
    });
}

if (clearArtistSearchBtn) {
    clearArtistSearchBtn.addEventListener("click", function() {
        if (searchArtistInput) {
            searchArtistInput.value = "";
            searchArtistInput.dispatchEvent(new Event("input"));
        }
    });
}

/* ========================= */
/* การจัดการเมื่อคลิกเลือกศิลปิน */
/* ========================= */
function openArtist(artistName) {
    localStorage.setItem("currentArtist", artistName);
    window.location.href = `artist-detail.html?artist=${encodeURIComponent(artistName)}`;
}

/* ========================= */
/* 🌙 ระบบ Warm Dark Mode (แก้บั๊กสลับไอคอนแล้ว) */
/* ========================= */
document.addEventListener('DOMContentLoaded', () => {
    const darkMode = localStorage.getItem('darkMode');
    // 🌟 เปลี่ยนมาหาจาก class แทน id และรองรับทุกหน้า
    const darkModeBtns = document.querySelectorAll('.dark-mode-btn');

    if (darkMode === 'enabled') {
        document.body.classList.add('dark-mode');
        darkModeBtns.forEach(btn => btn.textContent = '☀️');
    } else {
        darkModeBtns.forEach(btn => btn.textContent = '🌙');
    }
});

function toggleDarkMode() {
    const body = document.body;
    const darkModeBtns = document.querySelectorAll('.dark-mode-btn');

    body.classList.toggle('dark-mode');

    if (body.classList.contains('dark-mode')) {
        localStorage.setItem('darkMode', 'enabled');
        darkModeBtns.forEach(btn => btn.textContent = '☀️');
    } else {
        localStorage.setItem('darkMode', 'disabled');
        darkModeBtns.forEach(btn => btn.textContent = '🌙');
    }
}

/* ========================= */
/* ⬆️ ปุ่มเลื่อนขึ้นบนสุด (Scroll to Top) */
/* ========================= */
document.addEventListener('DOMContentLoaded', () => {
    const scrollTopBtn = document.createElement('button');
    scrollTopBtn.innerHTML = '↑';
    scrollTopBtn.className = 'scroll-to-top';
    scrollTopBtn.setAttribute('aria-label', 'เลื่อนขึ้นบนสุด');
    document.body.appendChild(scrollTopBtn);

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollTopBtn.classList.add('show');
        } else {
            scrollTopBtn.classList.remove('show');
        }
    });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});

/* ========================= */
/* 🔥 ระบบจัดเรียงศิลปิน (SORT) */
/* ========================= */
function applyArtistSort() {
    const sortSelect = document.getElementById("artistSortSelect");

    if (!sortSelect) {
        showArtists();
        return;
    }

    const sortValue = sortSelect.value;

    if (sortValue === "name-asc") {
        filteredArtists.sort((a, b) => a.name.localeCompare(b.name, 'th'));
    } else if (sortValue === "name-desc") {
        filteredArtists.sort((a, b) => b.name.localeCompare(a.name, 'th'));
    } else if (sortValue === "newest") {
        filteredArtists.sort((a, b) => b.originalIndex - a.originalIndex);
    } else if (sortValue === "default") {
        filteredArtists.sort((a, b) => a.originalIndex - b.originalIndex);
    }

    showArtists();
}