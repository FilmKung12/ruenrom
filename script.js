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


/* ========================= */
/* ระบบแบ่งหน้า (Pagination) สำหรับหน้าศิลปิน */
/* ========================= */
const artistsPerPage = 20; 

// 🌟 แก้ไข: ให้ระบบเช็กว่าจำหน้าไหนไว้ ถ้ารีเฟรชให้ดึงมาใช้ ถ้าไม่มีให้เริ่มหน้า 1
let currentArtistPage = parseInt(sessionStorage.getItem('savedArtistPage')) || 1;

// ฟังก์ชันโชว์ศิลปินแบบเรียงปกติ (และแบ่งหน้า)
function showArtists() {
    const container = document.getElementById("artists");
    if (!container) return;

    // คำนวณจุดเริ่มต้นและสิ้นสุดของข้อมูลในหน้านี้
    const startIndex = (currentArtistPage - 1) * artistsPerPage;
    const endIndex = startIndex + artistsPerPage;

    // ดึงเฉพาะข้อมูลของหน้านี้
    const artistsToShow = filteredArtists.slice(startIndex, endIndex);

    let htmlContent = "";

    if (filteredArtists.length === 0) {
        container.innerHTML = "<p style='grid-column: 1 / -1; text-align: center; color: #777; margin-top: 50px;'>ไม่พบศิลปินที่คุณค้นหา</p>";
        // ล้างปุ่มเปลี่ยนหน้าทิ้ง
        const paginationContainer = document.getElementById("pagination");
        if (paginationContainer) paginationContainer.innerHTML = "";
        return;
    }

    artistsToShow.forEach((a) => {
        // 🌟 แก้ไข: เติม \ หน้าเครื่องหมาย ' เพื่อกันโค้ดพัง (เช่น Jetset'er)
        const safeName = a.name.replace(/'/g, "\\'"); 
        
        htmlContent += `
            <div class="artist-card" onclick="openArtist('${safeName}')">
                <img src="${a.image}" alt="${a.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/150'">
                <p>${a.name}</p>
            </div>
        `;
    });

    container.innerHTML = htmlContent;

    // เรียกสร้างปุ่มเปลี่ยนหน้าด้านล่างสุด
    renderArtistPagination();
}

// ฟังก์ชันสร้างปุ่มตัวเลขหน้า (1, 2, 3...)
function renderArtistPagination() {
    const paginationContainer = document.getElementById("pagination");
    if (!paginationContainer) return; // ถ้าในหน้า index.html ไม่มีกล่องนี้ก็ไม่เป็นไร

    paginationContainer.innerHTML = ""; // ล้างปุ่มเก่า

    // หาจำนวนหน้าทั้งหมด
    const totalPages = Math.ceil(filteredArtists.length / artistsPerPage);

    if (totalPages <= 1) return; // ถ้ามีหน้าเดียว ซ่อนปุ่มไปเลย

    // ปุ่ม "« กลับ"
    const prevBtn = document.createElement("button");
    prevBtn.innerHTML = "« กลับ";
    prevBtn.className = "page-btn";
    prevBtn.disabled = currentArtistPage === 1;
    prevBtn.onclick = () => {
        if (currentArtistPage > 1) {
            currentArtistPage--;
            sessionStorage.setItem('savedArtistPage', currentArtistPage); // 🌟 จำเลขหน้า
            showArtists();
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };
    paginationContainer.appendChild(prevBtn);

    // ปุ่มตัวเลขหน้า
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement("button");
        pageBtn.innerText = i;
        pageBtn.className = `page-btn ${i === currentArtistPage ? "active" : ""}`;
        pageBtn.onclick = () => {
            currentArtistPage = i;
            sessionStorage.setItem('savedArtistPage', currentArtistPage); // 🌟 จำเลขหน้า
            showArtists();
            window.scrollTo({ top: 0, behavior: "smooth" });
        };
        paginationContainer.appendChild(pageBtn);
    }
    

    // ปุ่ม "ถัดไป »"
    const nextBtn = document.createElement("button");
    nextBtn.innerHTML = "ถัดไป »";
    nextBtn.className = "page-btn";
    nextBtn.disabled = currentArtistPage === totalPages;
    nextBtn.onclick = () => {
        if (currentArtistPage < totalPages) {
            currentArtistPage++;
            sessionStorage.setItem('savedArtistPage', currentArtistPage); // 🌟 จำเลขหน้า
            showArtists();
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };
    paginationContainer.appendChild(nextBtn);
}

// ฟังก์ชันโชว์ศิลปินแบบสุ่ม (แก้ไขใหม่เพื่อให้เติมปุ่ม "ดูทั้งหมด" ในมือถือ)
function showRandomArtists(limit) {
    const container = document.getElementById("artists");
    if (!container) return;

    const shuffledArtists = [...allArtists].sort(() => 0.5 - Math.random());
    const list = shuffledArtists.slice(0, limit);

    let htmlContent = "";

    // 1. สร้าง HTML ของศิลปิน 5 คนแรกตามปกติ
    list.forEach((a) => {
        // 🌟 แก้ไข: เติม \ หน้าเครื่องหมาย ' เช่นกัน
        const safeName = a.name.replace(/'/g, "\\'");
        
        htmlContent += `
            <div class="artist-card" onclick="openArtist('${safeName}')">
                <img src="${a.image}" alt="${a.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/150'">
                <p>${a.name}</p>
            </div>
        `;
    });

    // 🌟 2. โค้ดส่วนที่เพิ่มใหม่: สร้างการ์ดใบที่ 6 (ปุ่มดูทั้งหมด)
    // เราจะใช้ CSS (ที่ให้ไปก่อนหน้านี้) เป็นคนซ่อนปุ่มนี้ในคอม และโชว์ในมือถือครับ
    const viewAllCardHTML = `
        <a href="artists.html" class="artist-card view-all-card">
            <div class="circle">➔</div>
            <span class="text">ดูทั้งหมด</span>
        </a>
    `;

    // 3. เอาปุ่มดูทั้งหมด ไปต่อท้ายศิลปิน 5 คน
    htmlContent += viewAllCardHTML;

    // 4. พ่น HTML ทั้งหมด (5 ศิลปิน + 1 ปุ่ม) ลงในหน้าเว็บ
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

        // ใส่ไว้ในส่วนของการค้นหา (searchArtistInput)
        currentArtistPage = 1;
        sessionStorage.setItem('savedArtistPage', 1); // 🌟 สั่งให้ความจำกลับไปหน้า 1
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

    // ใส่ไว้ท้ายฟังก์ชัน applyArtistSort()
        currentArtistPage = 1;
        sessionStorage.setItem('savedArtistPage', 1); // 🌟 สั่งให้ความจำกลับไปหน้า 1
        showArtists();
}