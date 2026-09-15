# Design Reference — heynesh.com

> Referensi desain dari **https://heynesh.com/** — Portofolio Webflow Developer (Nenad Popadic / NESH®).
> Sumber: Webflow build, dilisensikan sebagai referensi visual untuk proyek ini.

---

## 1. Gambaran Umum (Design Direction)

- **Gaya:** Editorial, bersih, "expensive & premium", dark-on-light dengan aksen neon kuning.
- **Vibe:** Personal brand / solo specialist developer. Sangat terstruktur, banyak whitespace, tipografi besar sebagai hero.
- **Skema warna dasar:** Latar *warm off-white / cream* (#D5CFBE & #F8F7F3), teks hitam, aksen **kuning neon** (#FFFF23).
- **Platform:** Dibangun di Webflow, menggunakan **Lenis smooth scroll**, **GSAP** (ScrollTrigger), dan **Swiper** (testimonial slider).

---

## 2. Warna (Color Palette)

| Token | Nilai | Penggunaan |
|---|---|---|
| `--yellow` (aksen utama) | `#FFFF23` | Tombol CTA, bullet aktif, hover state, logo aksen, garis highlight |
| `--black` | `#000000` | Teks utama pada section terang |
| `--white` | `#FFFFFF` | Teks pada section gelap |
| Latar cream utama (body) | `#D5CFBE` | Background utama halaman |
| Off-white terang | `#F8F7F3` | Section kartu / kontras |
| Cream kartu | `#DFDECE`, `#E4E0CE`, `#EBEADA` | Card, pill, FAQ, nav |
| Cream gelap | `#C9C8BA` | Hover nav/social |
| Hijau zaitun muted | `#A8A684`, `#CECDBB`, `#D5CFBE` | Elemen sekunder |
| Abu-abu gelap | `#2F2F2F`, `#5E5E5E` | Card arrow dim state, nav dark |
| Hover arrow card | `#8C8C8C` | Dim state pada work card |
| Kuning muda sekunder | `#FFFF69` | Variasi aksen |
| Biru (misc icon) | `#0082F3`, `#3898EC` | Elemen ikon kecil |

### Gradient Teks Judul (Heading)
- **Terang (dark heading):** `linear-gradient(266deg, #3D3D3D 11.86%, #000 92.59%)`
- **Putih (light heading):** `linear-gradient(89deg, #D5D5D5 7.42%, #FFF 95.11%)`
- Di-apply via `background-clip: text; -webkit-text-fill-color: transparent;`

---

## 3. Tipografi (Typography)

| Elemen | Font | Ukuran (desktop) | Detail |
|---|---|---|---|
| `body` | **PP Neue Montreal** (Book / Regular) | `clamp(0.75rem, 1.18vw, 1.5rem)` | `line-height: 1.6` |
| `h1` / Hero heading | **"Tr 3 A"** (serif display) | `clamp(3rem, 5.3vw, 5.5rem)` | display serif, kontras dgn body sans |
| `h2` | **"Tr 3 A"** | `clamp(2.5rem, 4.58vw, 5rem)` | section heading |
| Judul besar (what you get) | **"Tr 3 A"** | `clamp(3.5rem, 4.72vw, 5.5rem)` | |
| Angka besar (experience counter) | **PP Neue Montreal** | `clamp(4rem, 5.69vw, 6.25rem)` | bold |
| `work-card-heading` | PP Neue Montreal | `clamp(1.25rem, 1.94vw, 3rem)` | bold |
| `about-card-heading` | PP Neue Montreal | `clamp(1rem, 1.67vw, 2.25rem)` | |
| `service-price-item` | PP Neue Montreal | `clamp(1.125rem, 1.67vw, 2rem)` | bold |
| `faq-toggle` | PP Neue Montreal | `clamp(0.75rem, 1.32vw, 1.75rem)` | |
| Teks kecil / label | PP Neue Montreal | `clamp(0.5rem, 0.9vw, 1.175rem)` | uppercase labels, meta |

**Catatan tipografi:**
- Weight yang dipakai: `500` (medium) dan `700` (bold).
- **Letter-spacing negatif** pada heading besar: `-0.23vw` s/d `-0.25vw` (tracking ketat = mahal).
- `line-height` heading display: `0.9`–`1.1` (sangat rapat).
- Kombinasi **serif display** (Tr 3 A) untuk judul + **sans modern** (PP Neue Montreal) untuk body → ciri khas desain premium.

---

## 4. Layout & Grid

- **Skala spacing berbasis viewport** (`vw`) — elemen mengikuti lebar layar.
- Padding section besar: `10vw`–`15vw` (atas/bawah), `1.39vw` (samping dalam container dengan offset kiri `21vw`).
- Container utama tidak full-width: memakai **offset margin kiri besar** (mis. `padding-left: 21vw`) → editorial asymmetric layout.
- Ukuran elemen memakai `clamp()` agar responsif mulus (mis. `clamp(200px, 24.64vw, 420px)` untuk hero card).
- **Border-radius umum:** `0.56vw`–`0.83vw` (pill/kartu), `100%` (avatar/icon), `5vw` (kartu besar).

---

## 5. Komponen & Section (Page Structure)

### a. Sticky Navbar (marquee bar)
- Bar atas berisi logo "NESH®", tautan sosial, dan **Book a Call**.
- Ada **marquee berjalan** (animasi `translateX` 25s infinite) menampilkan nama klien: Happy Ring, Semicon Bio, dll.
- Navbar **backdrop blur** (`backdrop-filter: blur(15px)`) dengan latar `#DFDECECC` (cream transparan).

### b. Hero Section
- Heading besar: **"Webflow, Applied Differently."** (3 baris, serif display).
- Foto profil di tengah (asimetris, dua kartu stats: `80+ Projects`, `Years of experience`).
- Label badge: **Creative / Reliable / Strategist / Builder / Efficient**.
- CTA: **Book a Call** (kuning) + **About Me** (ghost/secondary).
- Entrance animation: elemen di-mask (`opacity: 0`) lalu reveal via GSAP.

### c. About Me / Journey (timeline tahun)
- Judul: **"About Me (&) My Journey"**.
- Timeline vertikal: `'19` s/d `'26`, masing-masing kartu berisi tahun besar, caption (`@stefan · 7 years ago`), foto, dan "Read more" (expand detail).
- Kartu: cream `#DFDECECC`, `border-radius: 0.83vw`, backdrop blur, `padding: 2.08vw`.
- Tahun besar pakai `clamp(4rem, 5.56vw, 6.25rem)`.

### d. Selected Work (Portfolio)
- Judul: **"Built in Webflow, Made to Perform"**.
- List 9 proyek: 1910.ai, SemiconBio, Happy Ring, PSSLTD, Lilipad, Omicron, Puck, Alosant, RAY AI.
- Setiap baris: **nomor (01–09)**, **tag skill** (CMS, GSAP, SEO, API, Motion, Components, Webflow, Performance, Localization), judul proyek, deskripsi, foto, dan **panah** (ikon).
- **Hover effect khusus (desktop):**
  - Saat hover satu kartu → semua kartu lain di-dim overlay (`#2F2F2F`, opacity naik), kartu yang di-hover tetap terang.
  - Arrow pada kartu hover berubah jadi **kuning `#FFFF23`**, arrow pada kartu lain jadi abu-abu `#8C8C8C`.

### e. What You Get (Capabilities Overview)
- Judul besar display: **"What You Get?"** + paragraph abstrak dengan jarak kata acak (bukan justify).
- Grid kartu kemampuan:
  1. Webflow Development
  2. Custom Integrations
  3. SEO-Ready Setup
  4. Creative & Interactive Motion (GSAP)
  5. Performance & Technical Optimization

### f. Services / Pricing (3 paket)
- Judul: **"Solutions That Deliver"**.
  1. **Ongoing Support** — `$3,000 / 30 hours` (per bulan)
  2. **Starter Build** — `$5,000`
  3. **Custom Project** — "Book a Call"
- Harga besar bold, list fitur dengan bullet, CTA per kartu.
- Background section cenderung gelap (hitam) → judul pakai gradient putih.

### g. CTA Section (Transform)
- Judul: **"Transform Your Webflow Experience Journey"**.
- Ajak bicara: "Have something in mind?" + tombol **Let's Talk** (kuning).

### h. Testimonials (Swiper slider)
- Judul: **"From People I've Worked with"**.
- **Swiper** dengan `cursor: none`, pagination pill custom (`border: 1px solid rgba(255,255,255,0.2)`, bullet aktif = kuning lebar `2.5vw`).
- Tiap slide: quote besar, foto avatar, nama, posisi, company link.
- Hint: **"drag / click"** di bagian bawah.

### i. FAQ (Accordion)
- Judul: **"Got any questions?"**.
- Accordion: toggle `grid-template-rows: 1fr` saat open, ikon plus berputar (`rotate: 90deg`), hover icon jadi `#EDECDA`.

### j. Footer
- Logo NESH®, copyright icon, tautan email `nenad@popadic.co` (dengan **copy-to-clipboard**).
- Tautan: home, about me, projects, what you get, services, clients, faq.

---

## 6. Animasi & Interaksi

| Elemen | Animasi |
|---|---|
| Smooth scroll | **Lenis** (semua scroll) |
| Entrance hero | Elemen di-mask + **GSAP** reveal (opacity, line-mask) |
| Text heading | Split ke karakter / baris (`line-mask`, `.anim-char`), slide up saat masuk viewport |
| Number counter | Angka ("80+", "Years") dihitung naik dengan **digit roll** (`data-number-count`, `.digit-track`) |
| Marquee klien | `translateX(-100%)` loop 25s linear infinite |
| Hover button/CTA | Slide-up text (mask overflow), panah bergeser `margin-left: 100%` |
| Work card hover | Dim semua kartu + overlay, hanya kartu hover terang; arrow kuning |
| Scroll blur | Element tertentu di-blur saat scroll (`data-tl-to*="blur"`), diperbaiki untuk Safari |
| FAQ | Accordion grid-rows + ikon rotate |
| Testimonial | Swiper slider, pagination pill kuning |
| Hover nav | Background pill jadi `#C9C8BA`, icon jadi kuning |

---

## 7. Konten untuk Diterapkan (Blueprint)

- **Struktur section (urutan):**
  1. Navbar (marquee klien)
  2. Hero ("Webflow, Applied Differently." + stats + badge)
  3. About / Journey timeline
  4. Selected Work (list proyek)
  5. What You Get (capabilities)
  6. Services (3 paket harga)
  7. CTA (Transform)
  8. Testimonials (slider)
  9. FAQ (accordion)
  10. Footer

- **Header/Logo:** "NESH®" (nama + registered mark).
- **CTA utama:** "Book a Call" → tautan ke Cal.com.
- **Contact:** `nenad@popadic.co`.

---

## 8. Catatan Implementasi (agar terlihat "mahal")

1. Gunakan **serif display** untuk heading + **sans geometris** untuk body (kontras tipografis).
2. Warna netral hangat (cream/off-white) bukan putih murni — hindari feel "template AI".
3. Satu **warna aksen kuat** (kuning neon) dipakai hemat: CTA, hover, highlight.
4. **Letter-spacing negatif** & `line-height` rapat pada heading besar.
5. Spacing besar berbasis `vw` + layout asimetris (offset kiri).
6. Motion yang halus & berurutan (entrance reveal, counter, hover micro-interaction).
