/**
 * Memory Card Game - JavaScript Logic
 * เกมจับคู่การ์ด Emoji ฝึกความจำ
 */

(function () {
    "use strict";

    /* ===== ค่าคงที่ (Constants) ===== */

    /** Emoji ที่ใช้เป็นหน้าการ์ด (8 คู่ = 16 ใบ) */
    var EMOJIS = ["🍎", "🍊", "🍋", "🍇", "🐱", "🌸", "🎵", "⭐"];

    /** จำนวนคู่ทั้งหมด */
    var TOTAL_PAIRS = EMOJIS.length;

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

    /* ===== ฟังก์ชันหลัก (Core Functions) ===== */

    /**
     * สลับลำดับ Array แบบสุ่ม (Fisher-Yates Shuffle Algorithm)
     * @param {Array} array - Array ที่ต้องการสลับ
     * @returns {Array} - Array ที่สลับแล้ว
     */
    function shuffleArray(array) {
        var shuffled = array.slice(); // สร้าง copy ไม่แก้ต้นฉบับ
        for (var i = shuffled.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = shuffled[i];
            shuffled[i] = shuffled[j];
            shuffled[j] = temp;
        }
        return shuffled;
    }

    /**
     * สร้างการ์ดใบเดียว
     * @param {string} emoji - Emoji ที่จะแสดงบนการ์ด
     * @param {number} index - ลำดับการ์ด
     * @returns {HTMLElement} - Element ของการ์ด
     */
    function createCard(emoji, index) {
        var card = document.createElement("div");
        card.className = "game-card";
        card.dataset.emoji = emoji;
        card.dataset.index = index;

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

        // ผูก Event: คลิกเพื่อเปิดการ์ด
        card.addEventListener("click", function () {
            handleCardClick(card);
        });

        return card;
    }

    /**
     * สร้างกระดานเกมใหม่ (สร้างการ์ด 16 ใบ)
     */
    function createBoard() {
        // สร้าง Array ของ Emoji คู่ (แต่ละตัว 2 ใบ) แล้วสลับ
        var cardEmojis = shuffleArray(EMOJIS.concat(EMOJIS));

        // ล้างกระดานเก่า
        gameBoard.innerHTML = "";

        // สร้างการ์ดแต่ละใบ
        for (var i = 0; i < cardEmojis.length; i++) {
            var card = createCard(cardEmojis[i], i);
            gameBoard.appendChild(card);
        }
    }

    /* ===== การจัดการเกม (Game Logic) ===== */

    /**
     * จัดการเมื่อผู้เล่นคลิกการ์ด
     * @param {HTMLElement} card - การ์ดที่ถูกคลิก
     */
    function handleCardClick(card) {
        // ป้องกัน: ถ้ายังไม่เริ่มเกม, การ์ดเปิดแล้ว, หรือจับคู่แล้ว
        if (!isPlaying) return;
        if (card.classList.contains("game-card--flipped")) return;
        if (card.classList.contains("game-card--matched")) return;

        // เปิดการ์ด
        card.classList.add("game-card--flipped");

        if (firstCard === null) {
            // เปิดใบแรก
            firstCard = card;
        } else if (secondCard === null) {
            // เปิดใบที่สอง
            secondCard = card;
            moveCount++;
            movesDisplay.textContent = moveCount;

            // ล็อคกระดานขณะตรวจสอบ
            gameBoard.classList.add("game-board--locked");

            // ตรวจสอบว่าตรงกันหรือไม่
            checkMatch();
        }
    }

    /**
     * ตรวจสอบว่าการ์ด 2 ใบตรงกันหรือไม่
     */
    function checkMatch() {
        var isMatch = firstCard.dataset.emoji === secondCard.dataset.emoji;

        if (isMatch) {
            // จับคู่สำเร็จ!
            handleMatch();
        } else {
            // ไม่ตรงกัน → คว่ำการ์ดกลับ
            handleMismatch();
        }
    }

    /**
     * จัดการเมื่อจับคู่สำเร็จ
     */
    function handleMatch() {
        firstCard.classList.add("game-card--matched");
        secondCard.classList.add("game-card--matched");

        matchedPairs++;
        pairsDisplay.textContent = matchedPairs + " / " + TOTAL_PAIRS;

        // รีเซ็ตตัวแปรชั่วคราว
        firstCard = null;
        secondCard = null;
        gameBoard.classList.remove("game-board--locked");

        // ตรวจสอบว่าชนะหรือยัง
        if (matchedPairs === TOTAL_PAIRS) {
            handleWin();
        }
    }

    /**
     * จัดการเมื่อจับคู่ไม่ตรง (คว่ำการ์ดกลับหลังจาก 0.8 วินาที)
     */
    function handleMismatch() {
        setTimeout(function () {
            firstCard.classList.remove("game-card--flipped");
            secondCard.classList.remove("game-card--flipped");

            firstCard = null;
            secondCard = null;
            gameBoard.classList.remove("game-board--locked");
        }, 800);
    }

    /**
     * จัดการเมื่อชนะเกม
     */
    function handleWin() {
        stopTimer();
        isPlaying = false;

        // แสดงข้อความชนะ
        var timeStr = formatTime(secondsElapsed);
        winMessage.textContent =
            "คุณจับคู่ครบ " + TOTAL_PAIRS + " คู่ " +
            "ใช้เวลา " + timeStr + " " +
            "เปิดการ์ด " + moveCount + " ครั้ง!";

        gameWin.hidden = false;
    }

    /* ===== ตัวจับเวลา (Timer) ===== */

    /**
     * เริ่มจับเวลา
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
     * หยุดจับเวลา
     */
    function stopTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    /**
     * แปลงวินาทีเป็นรูปแบบ MM:SS
     * @param {number} totalSeconds - จำนวนวินาที
     * @returns {string} - เวลาในรูปแบบ "MM:SS"
     */
    function formatTime(totalSeconds) {
        var minutes = Math.floor(totalSeconds / 60);
        var seconds = totalSeconds % 60;
        var mm = minutes < 10 ? "0" + minutes : minutes;
        var ss = seconds < 10 ? "0" + seconds : seconds;
        return mm + ":" + ss;
    }

    /* ===== เริ่ม / รีสตาร์ทเกม ===== */

    /**
     * เริ่มเกมใหม่: รีเซ็ตทุกอย่างแล้วสร้างกระดานใหม่
     */
    function startGame() {
        // รีเซ็ตสถานะ
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
