/**
 * gpa.js - Logic for the GPA Calculator
 * จัดการการคำนวณเกรด และการเพิ่ม/ลบรายวิชา (DOM Manipulation)
 */

(function () {
    "use strict";

    /* ===== ค่าคงที่สำหรับเกรด (Grade values) ===== */
    var GRADE_POINTS = {
        "A": 4.0,
        "B+": 3.5,
        "B": 3.0,
        "C+": 2.5,
        "C": 2.0,
        "D+": 1.5,
        "D": 1.0,
        "F": 0.0
    };

    /* ===== อ้างอิง DOM Elements ===== */
    var courseList = document.getElementById("courseList");
    var addCourseBtn = document.getElementById("addCourseBtn");
    var clearAllBtn = document.getElementById("clearAllBtn");
    var totalCreditsEl = document.getElementById("totalCredits");
    var gpaxScoreEl = document.getElementById("gpaxScore");
    var gpaMessageEl = document.getElementById("gpaMessage");

    // ถ้าระบบหา Element ไม่ครบ ให้หยุดการทำงาน (Error handling)
    if (!courseList || !addCourseBtn) {
        console.error("GPA Calculator: ไม่พบ DOM Elements ที่จำเป็น");
        return;
    }

    /* ===== เริ่มต้นฟังก์ชัน ===== */

    // เปิดการแสดงผลแอป ถ้ารัน JS ผ่าน
    document.body.classList.add("gpa-ready");

    // ล้างข้อมูลตัวอย่างและเริ่มด้วย 1 แถวว่างเปล่า
    init();

    /* ===== ฟังก์ชันหลัก ===== */

    function init() {
        courseList.innerHTML = "";
        // เพิ่ม 3 วิชาเป็นค่าตั้งต้นให้ User เห็นภาพชัดเจน
        addCourseRow();
        addCourseRow();
        addCourseRow();
        calculateGPA();
    }

    /**
     * สร้างแถวกรอกข้อมูลวิชาใหม่ (Create DOM Elements)
     */
    function addCourseRow() {
        // สร้างกล่องบรรจุ 1 แถว
        var row = document.createElement("div");
        row.className = "gpa-course-row";

        /* 1. ชื่อวิชา (Input Text) */
        var nameCol = document.createElement("div");
        var nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.placeholder = "ชื่อวิชา หรือ รหัสวิชา";
        nameInput.className = "gpa-input gpa-input-name";
        nameCol.appendChild(nameInput);

        /* 2. หน่วยกิต (Select) */
        var creditCol = document.createElement("div");
        var creditSelect = document.createElement("select");
        creditSelect.className = "gpa-input gpa-input-credit";

        // ใส่ Option สำหรับหน่วยกิต ตั้งแต่ 1 ถึง 6
        var creditOptions = [
            { value: "0", text: "เลือก" },
            { value: "1", text: "1.0" },
            { value: "2", text: "2.0" },
            { value: "3", text: "3.0" },
            { value: "4", text: "4.0" },
            { value: "5", text: "5.0" },
            { value: "6", text: "6.0" }
        ];

        for (var i = 0; i < creditOptions.length; i++) {
            var opt = document.createElement("option");
            opt.value = creditOptions[i].value;
            opt.text = creditOptions[i].text;
            creditSelect.appendChild(opt);
        }

        // เมื่อเปลี่ยนหน่วยกิต ให้คำนวณใหม่
        creditSelect.addEventListener("change", calculateGPA);
        creditCol.appendChild(creditSelect);

        /* 3. เกรด (Select) */
        var gradeCol = document.createElement("div");
        var gradeSelect = document.createElement("select");
        gradeSelect.className = "gpa-input gpa-input-grade";

        var gradeOptions = [
            { value: "", text: "เกรด" },
            { value: "A", text: "A (4.0)" },
            { value: "B+", text: "B+ (3.5)" },
            { value: "B", text: "B (3.0)" },
            { value: "C+", text: "C+ (2.5)" },
            { value: "C", text: "C (2.0)" },
            { value: "D+", text: "D+ (1.5)" },
            { value: "D", text: "D (1.0)" },
            { value: "F", text: "F (0.0)" }
        ];

        for (var j = 0; j < gradeOptions.length; j++) {
            var gOpt = document.createElement("option");
            gOpt.value = gradeOptions[j].value;
            gOpt.text = gradeOptions[j].text;
            gradeSelect.appendChild(gOpt);
        }

        // เมื่อเปลี่ยนเกรด ให้คำนวณใหม่
        gradeSelect.addEventListener("change", calculateGPA);
        gradeCol.appendChild(gradeSelect);

        /* 4. ปุ่มลบวิชา (Button) */
        var actionCol = document.createElement("div");
        actionCol.className = "gpa-row-actions";
        var removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "gpa-btn-remove";
        removeBtn.innerHTML = "🗑️";
        removeBtn.title = "ลบวิชานี้";

        // ลบแถวนี้ทิ้งเมื่อคลิก
        removeBtn.addEventListener("click", function () {
            courseList.removeChild(row);
            calculateGPA(); // ลบแล้วต้องคำนวณใหม่
        });

        actionCol.appendChild(removeBtn);

        /* เอาทั้งหมดมาใส่ใน Row */
        row.appendChild(nameCol);
        row.appendChild(creditCol);
        row.appendChild(gradeCol);
        row.appendChild(actionCol);

        /* นำ Row ไปแสดงในหน้าเว็บ */
        courseList.appendChild(row);
    }

    /**
     * คำนวณ GPAX จากแถวทั้งหมดที่มี
     * สูตร: (หน่วยกิต1 * เกรด1) + (หน่วยกิต2 * เกรด2) + ... / ผลรวมหน่วยกิตทั้งหมด
     */
    function calculateGPA() {
        var rows = courseList.querySelectorAll(".gpa-course-row");
        var totalPoints = 0;
        var totalCredits = 0;
        var hasValidEntry = false;

        for (var i = 0; i < rows.length; i++) {
            var creditSelect = rows[i].querySelector(".gpa-input-credit");
            var gradeSelect = rows[i].querySelector(".gpa-input-grade");

            var credit = parseFloat(creditSelect.value);
            var gradeStr = gradeSelect.value;

            // ถ้าเลือกทั้งหน่วยกิตและเกรด
            if (credit > 0 && gradeStr !== "") {
                var gradePoint = GRADE_POINTS[gradeStr];

                totalPoints += (credit * gradePoint);
                totalCredits += credit;
                hasValidEntry = true;
            }
        }

        // แสดงผล
        totalCreditsEl.textContent = totalCredits.toFixed(1);

        if (totalCredits > 0) {
            var gpax = totalPoints / totalCredits;
            gpaxScoreEl.textContent = gpax.toFixed(2);
            updateMessage(gpax);
        } else {
            gpaxScoreEl.textContent = "0.00";
            resetMessage();

            if (hasValidEntry) {
                // กรอกข้อมูลผิดพลาด (เช่น ใส่เกรดแต่ไม่เลือกหน่วยกิต)
                gpaxScoreEl.textContent = "Error";
            }
        }
    }

    /**
     * อัปเดตข้อความให้กำลังใจตามเกรดที่คำนวณได้
     */
    function updateMessage(gpax) {
        // เคลียร์คลาสเก่าก่อน
        gpaMessageEl.classList.remove("honors", "warning");

        if (gpax >= 3.6) {
            gpaMessageEl.textContent = "🎉 ยอดเยี่ยม! มีสิทธิ์ได้เกียรตินิยมอันดับ 1 นะเนี่ย";
            gpaMessageEl.classList.add("honors");
        } else if (gpax >= 3.25) {
            gpaMessageEl.textContent = "✨ เก่งมาก! เล็งเกียรตินิยมอันดับ 2 ไว้ได้เลย";
            gpaMessageEl.classList.add("honors");
        } else if (gpax >= 2.75) {
            gpaMessageEl.textContent = "👍 เยี่ยม! รักษาระดับไว้นะครับ";
        } else if (gpax >= 2.0) {
            gpaMessageEl.textContent = "💪 สู้ต่อไป! ยังมีโอกาสดึงเกรดขึ้นได้อีกเยอะ";
        } else {
            gpaMessageEl.textContent = "⚠️ ระวังติดโปร! ต้องขยันอ่านหนังสือเพิ่มแล้วนะ";
            gpaMessageEl.classList.add("warning");
        }
    }

    function resetMessage() {
        gpaMessageEl.textContent = "กรอกหน่วยกิตและเกรดเพื่อคำนวณ";
        gpaMessageEl.classList.remove("honors", "warning");
    }

    /* ===== Event Listeners สำหรับปุ่มด้านล่าง ===== */

    addCourseBtn.addEventListener("click", function () {
        addCourseRow();
    });

    clearAllBtn.addEventListener("click", function () {
        // แจ้งเตือนยืนยันก่อนลบ (Best practice)
        if (confirm("คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลทั้งหมด?")) {
            init();
        }
    });

})();
