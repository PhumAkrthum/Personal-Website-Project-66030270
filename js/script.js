/**
 * script.js - สคริปต์หลักของเว็บไซต์ส่วนตัว
 *
 * ไฟล์นี้จัดการ:
 * - การไฮไลท์เมนู Navigation ให้ตรงกับหน้าปัจจุบัน
 * - ระบบดึงปี พ.ศ. อัตโนมัติสำหรับ Footer
 */

(function () {
    "use strict";

    /* ===== Active Navigation Highlight ===== */

    /**
     * ไฮไลท์ลิงก์ใน Navigation ที่ตรงกับหน้าที่กำลังเปิดอยู่
     * โดยเปรียบเทียบ href ของแต่ละลิงก์กับ URL ของหน้าปัจจุบัน
     */
    function highlightActiveNav() {
        var navLinks = document.querySelectorAll(".nav__link");
        // ดึงชื่อไฟล์จาก URL ปัจจุบัน (เช่น "index.html", "cv.html")
        var currentPage = window.location.pathname.split("/").pop() || "index.html";

        for (var i = 0; i < navLinks.length; i++) {
            var linkHref = navLinks[i].getAttribute("href");

            // ลบ class active ออกก่อน แล้วเพิ่มเฉพาะลิงก์ที่ตรง
            navLinks[i].classList.remove("nav__link--active");
            if (linkHref === currentPage) {
                navLinks[i].classList.add("nav__link--active");
            }
        }
    }

    /* ===== Dynamic Footer Year ===== */

    /**
     * อัปเดตปีใน Footer ให้เป็นปีปัจจุบัน แทนที่จะ hardcode ไว้
     * จะหาข้อความ "2026" (หรือปีเดิม) แล้วแทนที่ด้วยปีใหม่
     */
    function updateFooterYear() {
        var footerText = document.querySelector(".footer__text");
        if (!footerText) return; // Guard: ถ้าไม่พบ footer ก็ไม่ทำอะไร

        var currentYear = new Date().getFullYear();
        footerText.textContent = footerText.textContent.replace(
            /\d{4}/,
            String(currentYear)
        );
    }

    /* ===== เรียกใช้งาน ===== */

    highlightActiveNav();
    updateFooterYear();

})();
