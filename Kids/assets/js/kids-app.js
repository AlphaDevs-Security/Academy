/* ============================================
   AlphaDevs Junior — Kids Course App Logic
   Simple, no license, just progress + stickers
   ============================================ */

const KIDS_STORAGE = 'alphadevs_junior_progress_v1';

const KID_DAYS = [
    { num: 1, slug: 'day1', title: 'מי זה AI?', desc: 'נכיר את אלפי הרובוט ונבין מה זה בכלל בינה מלאכותית.', emoji: '🤖', sticker: '🌟', time: '15 דק׳', color: 'day-1' },
    { num: 2, slug: 'day2', title: 'איך AI לומד?', desc: 'משחקים שמסבירים איך מחשב יודע לזהות חתולים מכלבים.', emoji: '🧠', sticker: '🎓', time: '15 דק׳', color: 'day-2' },
    { num: 3, slug: 'day3', title: 'מה AI יודע ומה לא?', desc: 'AI חזק במלל, חלש ברגשות. נראה איפה הוא מצליח ואיפה לא.', emoji: '⚖️', sticker: '🏆', time: '20 דק׳', color: 'day-3' },
    { num: 4, slug: 'day4', title: 'איך מדברים עם AI?', desc: 'שאלות טובות, סיפורים, ציורים — איך לקבל תוצאות מגניבות.', emoji: '💬', sticker: '⭐', time: '20 דק׳', color: 'day-4' },
    { num: 5, slug: 'day5', title: 'הפרויקט שלי!', desc: 'יוצרים יחד פרויקט אמיתי עם AI — סיפור, חידה, או משחק.', emoji: '🚀', sticker: '🎉', time: '25 דק׳', color: 'day-5' }
];

/* ---------- Progress storage ---------- */
function loadKidsProgress() {
    try {
        const raw = localStorage.getItem(KIDS_STORAGE);
        return raw ? JSON.parse(raw) : { completedDays: [], stickers: [], childName: null };
    } catch (e) {
        return { completedDays: [], stickers: [], childName: null };
    }
}

function saveKidsProgress(p) {
    try { localStorage.setItem(KIDS_STORAGE, JSON.stringify(p)); } catch(e) {}
}

function isKidDayUnlocked(num) {
    if (num === 1) return true;
    const p = loadKidsProgress();
    return p.completedDays.includes(num - 1);
}

function isKidDayDone(num) {
    return loadKidsProgress().completedDays.includes(num);
}

function markKidDayComplete(num) {
    const p = loadKidsProgress();
    if (!p.completedDays.includes(num)) {
        p.completedDays.push(num);
        const day = KID_DAYS.find(d => d.num === num);
        if (day && !p.stickers.includes(day.sticker)) {
            p.stickers.push(day.sticker);
        }
        saveKidsProgress(p);
    }
}

/* ---------- Render: Day Cards ---------- */
function renderKidDays(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = KID_DAYS.map(day => {
        const unlocked = isKidDayUnlocked(day.num);
        const done = isKidDayDone(day.num);

        const cta = done ? `<span class="kid-day-cta">✅ כל הכבוד!</span>`
            : unlocked ? `<span class="kid-day-cta">בואו נתחיל ←</span>`
            : `<span class="kid-day-cta">🔒 נעול</span>`;

        const lockedBadge = !unlocked ? `<span class="locked-badge">🔒 סיים יום ${day.num - 1} קודם</span>` : '';

        const tagName = unlocked ? 'a' : 'div';
        const hrefAttr = unlocked ? `href="days/${day.slug}.html"` : '';

        return `
            <${tagName} ${hrefAttr} class="kid-day-card ${day.color} ${done ? 'completed' : ''} ${!unlocked ? 'locked' : ''}">
                ${lockedBadge}
                <span class="kid-day-num">יום ${day.num}</span>
                <div class="kid-day-emoji">${day.emoji}</div>
                <h3>${day.title}</h3>
                <p class="day-desc">${day.desc}</p>
                <div class="kid-day-meta">
                    <span class="time">⏱ ${day.time}</span>
                    ${cta}
                </div>
            </${tagName}>`;
    }).join('');
}

/* ---------- Render: Sticker Collection ---------- */
function renderKidStickers(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const p = loadKidsProgress();
    container.innerHTML = KID_DAYS.map(day => {
        const earned = p.stickers.includes(day.sticker);
        return `<div class="sticker ${earned ? 'earned' : 'locked'}">${earned ? day.sticker : '?'}</div>`;
    }).join('');
}

/* ---------- Counter in topbar ---------- */
function updateKidStickersCounter() {
    const el = document.getElementById('stickers-num');
    if (!el) return;
    el.textContent = loadKidsProgress().stickers.length;
}

/* ---------- Sticker Earned Modal ---------- */
function showStickerEarned(emoji, dayTitle, nextNum) {
    const overlay = document.createElement('div');
    overlay.className = 'sticker-earned-overlay show';
    const nextBtn = nextNum && nextNum <= 5
        ? `<a href="day${nextNum}.html" class="btn-big btn-blue">המשיכו ליום ${nextNum} ←</a>`
        : `<a href="../index.html" class="btn-big btn-rainbow">חזרה לדף הבית 🏠</a>`;

    overlay.innerHTML = `
        <div class="sticker-earned-card">
            <div class="sticker-earned-emoji">${emoji}</div>
            <h2>קיבלת מדבקה! 🎉</h2>
            <p>סיימת בהצלחה את "${dayTitle}". המדבקה שלך נכנסה לאוסף.</p>
            ${nextBtn}
            <button onclick="this.closest('.sticker-earned-overlay').remove()" class="btn-big" style="background:transparent;color:var(--text-soft);box-shadow:none;margin-top:10px;font-size:0.95rem;">סגור</button>
        </div>
    `;
    document.body.appendChild(overlay);
    confetti();
}

/* ---------- Confetti effect ---------- */
function confetti() {
    const colors = ['#fbbf24', '#ec4899', '#3b82f6', '#10b981', '#a855f7', '#f97316'];
    for (let i = 0; i < 50; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + 'vw';
        piece.style.top = -20 + 'px';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        piece.style.animationDuration = (2 + Math.random() * 2) + 's';
        piece.style.animationDelay = Math.random() * 0.5 + 's';
        document.body.appendChild(piece);
        setTimeout(() => piece.remove(), 5000);
    }
}

/* ---------- Quiz engine (Kids version) ---------- */
let kidQuizState = { questions: [], answers: {}, dayNum: null };

function renderKidQuiz(containerId, dayNum, questions) {
    kidQuizState = { questions, answers: {}, dayNum };
    const container = document.getElementById(containerId);
    if (!container) return;

    const optEmojis = ['🅰️', '🅱️', '🆎', '🆑'];
    container.innerHTML = `
        <div class="kids-quiz-header">
            <div class="quiz-emoji">🎯</div>
            <h3>מבחן קליל</h3>
            <p>תענה נכון על כל השאלות וקבל מדבקה!</p>
        </div>
        <div id="kid-questions">
            ${questions.map((q, i) => `
                <div class="kids-question" id="kq-${i}">
                    <div class="q-text">${i+1}. ${q.q}</div>
                    <div class="kids-options">
                        ${q.options.map((opt, oi) => `
                            <button class="kids-option" onclick="kidAnswer(${i}, ${oi})" data-q="${i}" data-o="${oi}" type="button">
                                <span class="opt-emoji">${optEmojis[oi]}</span>
                                <span>${opt}</span>
                            </button>
                        `).join('')}
                    </div>
                    <div class="quiz-feedback" id="kq-fb-${i}"></div>
                </div>
            `).join('')}
        </div>
        <div style="text-align:center;margin-top:24px;">
            <button class="btn-big btn-yellow" onclick="submitKidQuiz()" type="button">סיימתי! בדוק אותי 🎯</button>
        </div>
        <div id="kid-quiz-result" style="margin-top:20px;"></div>
    `;
}

function kidAnswer(qIdx, optIdx) {
    kidQuizState.answers[qIdx] = optIdx;
    const buttons = document.querySelectorAll(`#kq-${qIdx} .kids-option`);
    buttons.forEach(b => b.classList.remove('selected'));
    document.querySelector(`#kq-${qIdx} .kids-option[data-o="${optIdx}"]`).classList.add('selected');
}

function submitKidQuiz() {
    const total = kidQuizState.questions.length;
    let correct = 0;

    kidQuizState.questions.forEach((q, i) => {
        const userAns = kidQuizState.answers[i];
        const buttons = document.querySelectorAll(`#kq-${i} .kids-option`);
        buttons.forEach(b => b.disabled = true);

        if (userAns === q.correct) {
            correct++;
            const btn = document.querySelector(`#kq-${i} .kids-option[data-o="${q.correct}"]`);
            if (btn) btn.classList.add('correct');
            const fb = document.getElementById(`kq-fb-${i}`);
            fb.classList.add('show', 'right');
            fb.innerHTML = `✅ <b>נכון!</b> ${q.explain || ''}`;
        } else {
            if (userAns !== undefined) {
                const wrong = document.querySelector(`#kq-${i} .kids-option[data-o="${userAns}"]`);
                if (wrong) wrong.classList.add('wrong');
            }
            const correctBtn = document.querySelector(`#kq-${i} .kids-option[data-o="${q.correct}"]`);
            if (correctBtn) correctBtn.classList.add('correct');
            const fb = document.getElementById(`kq-fb-${i}`);
            fb.classList.add('show', 'almost');
            fb.innerHTML = `🤔 <b>כמעט!</b> התשובה הנכונה היא בירוק. ${q.explain || ''}`;
        }
    });

    const score = correct / total;
    const resultEl = document.getElementById('kid-quiz-result');
    if (score >= 0.6) {
        // Pass — earn sticker
        markKidDayComplete(kidQuizState.dayNum);
        const day = KID_DAYS.find(d => d.num === kidQuizState.dayNum);
        resultEl.innerHTML = `
            <div style="background:var(--kid-green-soft);padding:20px;border-radius:16px;text-align:center;">
                <div style="font-size:3rem;">🎉</div>
                <h3 style="color:#064e3b;">כל הכבוד! ענית נכון על ${correct} מתוך ${total}.</h3>
            </div>
        `;
        setTimeout(() => {
            showStickerEarned(day.sticker, day.title, kidQuizState.dayNum + 1);
        }, 800);
    } else {
        resultEl.innerHTML = `
            <div style="background:var(--kid-yellow-soft);padding:20px;border-radius:16px;text-align:center;">
                <div style="font-size:3rem;">📚</div>
                <h3 style="color:#78350f;">ענית נכון על ${correct} מתוך ${total}. צריך לפחות ${Math.ceil(total*0.6)}.</h3>
                <p style="color:#78350f;margin-top:8px;">חזרו לחומר וננסה שוב!</p>
                <button onclick="location.reload()" class="btn-big btn-yellow" style="margin-top:14px;">נסו שוב 🔄</button>
            </div>
        `;
    }
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
    renderKidDays('kid-days-grid');
    renderKidStickers('sticker-grid');
    updateKidStickersCounter();
});
