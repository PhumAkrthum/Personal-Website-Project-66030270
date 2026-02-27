/**
 * Memory Card Game - JavaScript Logic
 * เกมจับคู่การ์ด Emoji ฝึกความจำ
 *
 * คุณสมบัติ:
 * - การ์ด 4x4 (8 คู่ Emoji) ที่สลับตำแหน่งแบบสุ่ม
 * - จับเวลา, นับจำนวนครั้งที่เปิด, นับคู่ที่จับคู่ได้
 * - บันทึกสถิติดีที่สุดด้วย localStorage
 * - รองรับการเล่นด้วยคีย์บอร์ด (Accessibility)
 */

(function () {
    "use strict";

    /* ===== ค่าคงที่ (Constants) ===== */

    /** Emoji ที่ใช้เป็นหน้าการ์ด (8 คู่ = 16 ใบ) */
    var EMOJIS = ["🍎", "🍊", "🍋", "🍇", "🐱", "🌸", "🎵", "⭐"];

    /** จำนวนคู่ทั้งหมด */
    var TOTAL_PAIRS = EMOJIS.length;

    /** เวลาหน่วง ก่อนคว่ำการ์ดกลับ เมื่อจับคู่ไม่ตรง (มิลลิวินาที) */
    var MISMATCH_DELAY = 800;

    /** Key สำหรับเก็บสถิติดีที่สุดใน localStorage */
    var STORAGE_KEY = "memoryCardBestScore";

    /* ===== ตัวแปรสถานะเกม (Game State) ===== */

    var firstCard = null;       // การ์ดใบแรกที่เปิด
    var secondCard = null;      // การ์ดใบที่สองที่เปิด
    var matchedPairs = 0;       // จำนวนคู่ที่จับได้
    var moveCount = 0;          // จำนวนครั้งที่เปิด
    var timerInterval = null;   // ตัวจับเวลา
    var secondsElapsed = 0;     // เวลาที่ผ่านไป (วินาที)
    var isPlaying = false;      // สถานะว่ากำลังเล่นอยู่หรือไม่

    /* ===== อ้างอิง DOM Elements ===== */

    var gameBoard = document.getElementById("gameBoard");
    var timerDisplay = document.getElementById("timer");
    var movesDisplay = document.getElementById("moves");
    var pairsDisplay = document.getElementById("pairs");
    var startBtn = document.getElementById("startBtn");
    var gameWin = document.getElementById("gameWin");
    var winMessage = document.getElementById("winMessage");
    var restartBtn = document.getElementById("restartBtn");

    /* ===== ตรวจสอบ DOM Elements (Error Handling) ===== */

    /**
     * ตรวจสอบว่า DOM Elements ที่จำเป็นมีอยู่จริงหรือไม่
     * ถ้าไม่พบ Element ที่จำเป็น จะแสดง Error ใน Console แล้วหยุดทำงาน
     * @returns {boolean} - true ถ้า Elements ครบ, false ถ้าไม่ครบ
     */
    function validateDOMElements() {
        var requiredElements = {
            gameBoard: gameBoard,
            timer: timerDisplay,
            moves: movesDisplay,
            pairs: pairsDisplay,
            startBtn: startBtn,
            gameWin: gameWin,
            winMessage: winMessage,
            restartBtn: restartBtn
        };

        var allFound = true;
        for (var id in requiredElements) {
            if (!requiredElements[id]) {
                console.error("Memory Card Game: ไม่พบ Element #" + id);
                allFound = false;
            }
        }
        return allFound;
    }

    // หยุดทำงานถ้าขาด DOM Elements ที่จำเป็น
    if (!validateDOMElements()) {
        console.error("Memory Card Game: ไม่สามารถเริ่มเกมได้ กรุณาตรวจสอบ HTML");
        return;
    }

    /* ===== ฟังก์ชันช่วย (Utility Functions) ===== */

    /**
     * สลับลำดับ Array แบบสุ่ม (Fisher-Yates Shuffle Algorithm)
     * ไม่แก้ไข Array ต้นฉบับ จะสร้าง copy ใหม่
     * @param {Array} array - Array ที่ต้องการสลับ
     * @returns {Array} - Array ใหม่ที่สลับลำดับแล้ว
     */
    function shuffleArray(array) {
        var shuffled = array.slice();
        for (var i = shuffled.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = shuffled[i];
            shuffled[i] = shuffled[j];
            shuffled[j] = temp;
        }
        return shuffled;
    }

    /**
     * แปลงวินาทีเป็นรูปแบบ MM:SS
     * @param {number} totalSeconds - จำนวนวินาที
     * @returns {string} - เวลาในรูปแบบ "MM:SS"
     */
    function formatTime(totalSeconds) {
        var minutes = Math.floor(totalSeconds / 60);
        var seconds = totalSeconds % 60;
        var mm = minutes < 10 ? "0" + minutes : String(minutes);
        var ss = seconds < 10 ? "0" + seconds : String(seconds);
        return mm + ":" + ss;
    }

    /* ===== localStorage: สถิติดีที่สุด ===== */

    /**
     * อ่านสถิติดีที่สุดจาก localStorage
     * ใช้ try-catch เพื่อป้องกัน Error กรณีเบราว์เซอร์บล็อก localStorage
     * @returns {object|null} - { moves, time } หรือ null ถ้ายังไม่มีสถิติ
     */
    function getBestScore() {
        try {
            var data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            // กรณี localStorage ถูกปิดหรือ JSON parse ผิดพลาด
            console.warn("Memory Card Game: ไม่สามารถอ่าน localStorage ได้", e);
            return null;
        }
    }

    /**
     * บันทึกสถิติดีที่สุดลง localStorage (เก็บเฉพาะเมื่อทำ moves น้อยที่สุด)
     * @param {number} moves - จำนวนครั้งที่เปิดการ์ด
     * @param {number} time - เวลาที่ใช้ (วินาที)
     */
    function saveBestScore(moves, time) {
        try {
            var current = getBestScore();
            // บันทึกเมื่อ: ยังไม่มีสถิติ หรือ moves น้อยกว่าเดิม
            if (!current || moves < current.moves) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({
                    moves: moves,
                    time: time
                }));
            }
        } catch (e) {
            console.warn("Memory Card Game: ไม่สามารถบันทึก localStorage ได้", e);
        }
    }

    /* ===== สร้างการ์ด (Card Creation) ===== */

    /**
     * สร้าง DOM Element ของการ์ดใบเดียว
     * แต่ละการ์ดมี 2 ด้าน: หลัง (❓) และ หน้า (Emoji)
     * รองรับทั้งการคลิกเมาส์และการกด Enter (Accessibility)
     * @param {string} emoji - Emoji ที่จะแสดงบนหน้าการ์ด
     * @param {number} index - ลำดับการ์ดบนกระดาน
     * @returns {HTMLElement} - Element ของการ์ด
     */
    function createCard(emoji, index) {
        var card = document.createElement("div");
        card.className = "game-card";
        card.dataset.emoji = emoji;
        card.dataset.index = index;

        // Accessibility: ทำให้การ์ด focus ได้ด้วย Tab + กด Enter ได้
        card.setAttribute("tabindex", "0");
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", "การ์ดใบที่ " + (index + 1));

        var inner = document.createElement("div");
        inner.className = "game-card__inner";

        // หลังการ์ด (แสดงตอนคว่ำ)
        var back = document.createElement("div");
        back.className = "game-card__back";
        back.textContent = "❓";

        // หน้าการ์ด (แสดง Emoji ตอนเปิด)
        var front = document.createElement("div");
        front.className = "game-card__front";
        front.textContent = emoji;

        inner.appendChild(back);
        inner.appendChild(front);
        card.appendChild(inner);

        // Event: คลิกเมาส์เพื่อเปิดการ์ด
        card.addEventListener("click", function () {
            handleCardClick(card);
        });

        // Event: กดปุ่ม Enter หรือ Space เพื่อเปิดการ์ด (Keyboard Accessibility)
        card.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault(); // ป้องกัน Space scroll หน้า
                handleCardClick(card);
            }
        });

        return card;
    }

    /**
     * สร้างกระดานเกมใหม่ (สร้างการ์ด 16 ใบ ลงใน Grid 4x4)
     */
    function createBoard() {
        // สร้าง Array ของ Emoji คู่ (แต่ละตัว 2 ใบ) แล้วสลับ
        var cardEmojis = shuffleArray(EMOJIS.concat(EMOJIS));

        // ล้างกระดานเก่า
        gameBoard.innerHTML = "";

        // สร้างการ์ดแต่ละใบแล้วเพิ่มลงกระดาน
        for (var i = 0; i < cardEmojis.length; i++) {
            gameBoard.appendChild(createCard(cardEmojis[i], i));
        }
    }

    /* ===== การจัดการเกม (Game Logic) ===== */

    /**
     * จัดการเมื่อผู้เล่นคลิกการ์ด
     * มี Guard clauses ป้องกันการคลิกซ้ำ/คลิกผิดสถานะ
     * @param {HTMLElement} card - การ์ดที่ถูกคลิก
     */
    function handleCardClick(card) {
        // Guard: ยังไม่เริ่มเกม
        if (!isPlaying) return;
        // Guard: การ์ดใบนี้เปิดอยู่แล้ว
        if (card.classList.contains("game-card--flipped")) return;
        // Guard: การ์ดใบนี้จับคู่แล้ว
        if (card.classList.contains("game-card--matched")) return;
        // Guard: ป้องกันคลิกการ์ดใบเดียวกันซ้ำ
        if (firstCard === card) return;

        // เปิดการ์ด
        card.classList.add("game-card--flipped");

        if (firstCard === null) {
            // ยังไม่ได้เปิดใบไหน → จำไว้เป็นใบแรก
            firstCard = card;
        } else if (secondCard === null) {
            // เปิดใบแรกไปแล้ว → นี่คือใบที่สอง
            secondCard = card;
            moveCount++;
            movesDisplay.textContent = moveCount;

            // ล็อคกระดานขณะตรวจสอบ ป้องกันคลิกระหว่างรอ
            gameBoard.classList.add("game-board--locked");

            // ตรวจสอบว่าตรงกันหรือไม่
            checkMatch();
        }
    }

    /**
     * ตรวจสอบว่าการ์ด 2 ใบที่เปิดมี Emoji ตรงกันหรือไม่
     * แล้วเรียกฟังก์ชันที่เหมาะสม
     */
    function checkMatch() {
        var isMatch = firstCard.dataset.emoji === secondCard.dataset.emoji;

        if (isMatch) {
            handleMatch();
        } else {
            handleMismatch();
        }
    }

    /**
     * จัดการเมื่อจับคู่สำเร็จ:
     * เพิ่ม class --matched, อัปเดตจำนวนคู่, ตรวจสอบ win
     */
    function handleMatch() {
        firstCard.classList.add("game-card--matched");
        secondCard.classList.add("game-card--matched");

        // อัปเดต aria-label ให้รู้ว่าจับคู่แล้ว (Accessibility)
        firstCard.setAttribute("aria-label", "จับคู่แล้ว: " + firstCard.dataset.emoji);
        secondCard.setAttribute("aria-label", "จับคู่แล้ว: " + secondCard.dataset.emoji);

        matchedPairs++;
        pairsDisplay.textContent = matchedPairs + " / " + TOTAL_PAIRS;

        // รีเซ็ตตัวแปรชั่วคราว แล้วปลดล็อคกระดาน
        resetTempCards();

        // ตรวจสอบว่าครบทุกคู่ = ชนะ
        if (matchedPairs === TOTAL_PAIRS) {
            handleWin();
        }
    }

    /**
     * จัดการเมื่อจับคู่ไม่ตรง:
     * รอ MISMATCH_DELAY ms แล้วคว่ำการ์ดกลับ
     */
    function handleMismatch() {
        setTimeout(function () {
            // ตรวจสอบว่าการ์ดยังอยู่ก่อนแก้ไข (ป้องกัน error กรณี restart ระหว่างรอ)
            if (firstCard) firstCard.classList.remove("game-card--flipped");
            if (secondCard) secondCard.classList.remove("game-card--flipped");

            resetTempCards();
        }, MISMATCH_DELAY);
    }

    /**
     * รีเซ็ตตัวแปรชั่วคราว (firstCard, secondCard) แล้วปลดล็อคกระดาน
     * ใช้ร่วมกันทั้ง handleMatch() และ handleMismatch()
     */
    function resetTempCards() {
        firstCard = null;
        secondCard = null;
        gameBoard.classList.remove("game-board--locked");
    }

    /**
     * จัดการเมื่อชนะเกม:
     * หยุด Timer, แสดงข้อความผลลัพธ์, บันทึก best score
     */
    function handleWin() {
        stopTimer();
        isPlaying = false;

        // สร้างข้อความผลลัพธ์
        var timeStr = formatTime(secondsElapsed);
        var resultText =
            "คุณจับคู่ครบ " + TOTAL_PAIRS + " คู่ " +
            "ใช้เวลา " + timeStr + " " +
            "เปิดการ์ด " + moveCount + " ครั้ง!";

        // ตรวจสอบ best score
        var best = getBestScore();
        saveBestScore(moveCount, secondsElapsed);

        if (best && moveCount < best.moves) {
            resultText += " 🏆 สถิติใหม่!";
        } else if (best) {
            resultText += " (สถิติดีที่สุด: " + best.moves + " ครั้ง)";
        }

        winMessage.textContent = resultText;
        gameWin.hidden = false;
    }

    /* ===== ตัวจับเวลา (Timer) ===== */

    /**
     * เริ่มจับเวลานับจาก 0
     * อัปเดตหน้าจอทุก 1 วินาที
     */
    function startTimer() {
        secondsElapsed = 0;
        timerDisplay.textContent = "00:00";

        timerInterval = setInterval(function () {
            secondsElapsed++;
            timerDisplay.textContent = formatTime(secondsElapsed);
        }, 1000);
    }

    /**
     * หยุดจับเวลา ล้าง interval ป้องกัน memory leak
     */
    function stopTimer() {
        if (timerInterval !== null) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    /* ===== เริ่ม / รีสตาร์ทเกม ===== */

    /**
     * เริ่มเกมใหม่: รีเซ็ตสถานะ, UI, Timer แล้วสร้างกระดานใหม่
     */
    function startGame() {
        // รีเซ็ตสถานะเกม
        firstCard = null;
        secondCard = null;
        matchedPairs = 0;
        moveCount = 0;
        isPlaying = true;

        // รีเซ็ต UI
        movesDisplay.textContent = "0";
        pairsDisplay.textContent = "0 / " + TOTAL_PAIRS;
        gameWin.hidden = true;
        startBtn.textContent = "🔄 เริ่มใหม่";

        // หยุด Timer เก่า แล้วเริ่มใหม่
        stopTimer();
        startTimer();

        // สร้างกระดานใหม่
        createBoard();
    }

    /* ===== ผูก Event Listeners ===== */

    startBtn.addEventListener("click", startGame);
    restartBtn.addEventListener("click", startGame);

})();
