/* ============================================
   AlphaDevs Academy — Core App Logic
   - Progress tracking (localStorage)
   - Quiz engine
   - Day locking system
   - Navigation helpers
   ============================================ */

const STORAGE_KEY = 'alphadevs_academy_progress_v1';
const PASS_THRESHOLD = 0.7; // 70% נדרש למעבר

const COURSE_STRUCTURE = [
    { num: 1, slug: 'day1', titleKey: 'day1.title', descKey: 'day1.desc', title: 'יסודות הצ׳אט עם Cowork', desc: 'איך מדברים עם קלוד, מה הוא יודע לעשות, ואיך כותבים פרומפט שעובד.', icon: '💬', duration: '40', lessons: 4 },
    { num: 2, slug: 'day2', titleKey: 'day2.title', descKey: 'day2.desc', title: 'קבצים, מסמכים, והעולם הדיגיטלי', desc: 'יצירה ועריכה של Word, Excel, PDF ומצגות. ניהול תיקיית עבודה.', icon: '📂', duration: '50', lessons: 5 },
    { num: 3, slug: 'day3', titleKey: 'day3.title', descKey: 'day3.desc', title: 'סקילים — מומחים מובנים', desc: 'מה זה Skill, איך מפעילים אותו, ואיך הוא הופך אותך לאלופה.', icon: '🎯', duration: '45', lessons: 4 },
    { num: 4, slug: 'day4', titleKey: 'day4.title', descKey: 'day4.desc', title: 'פלאגינים וחיבורים חיצוניים', desc: 'חיבור Gmail, Calendar, Drive, Monday — והפיכת קלוד לעמית-עבודה אמיתי.', icon: '🔌', duration: '55', lessons: 5 },
    { num: 5, slug: 'day5', titleKey: 'day5.title', descKey: 'day5.desc', title: 'זיכרון, פרויקטים, וארטיפקטים', desc: 'איך לעבוד לאורך זמן: זיכרון מתמשך, פרויקטים, ודשבורדים חיים.', icon: '🧠', duration: '50', lessons: 4 },
    { num: 6, slug: 'day6', titleKey: 'day6.title', descKey: 'day6.desc', title: 'אג׳נטים — לבנות עוזרים מותאמים אישית', desc: 'מה זה אג׳נט, ההבדל מסקיל, ואיך לבנות אחד שיעבוד בשבילך.', icon: '🤖', duration: '60', lessons: 5 },
    { num: 7, slug: 'day7', titleKey: 'day7.title', descKey: 'day7.desc', title: 'אוטומציה, תזמון, וטריקים מקצועיים', desc: 'משימות מתוזמנות, חיבורים מתקדמים, ו-10 הטריקים שיהפכו אותך למקצוענית.', icon: '🚀', duration: '60', lessons: 5 }
];

// Helper: get localized text if i18n is loaded, else fallback to default
function tr(key, fallback) {
    if (typeof t === 'function') return t(key, fallback);
    return fallback;
}

/* ---------- Progress State ---------- */

function loadProgress() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return defaultProgress();
        const parsed = JSON.parse(raw);
        return { ...defaultProgress(), ...parsed };
    } catch (e) {
        return defaultProgress();
    }
}

function defaultProgress() {
    return {
        startedAt: null,
        completedDays: [],     // [1, 2, 3]
        scores: {},            // { 1: 85, 2: 100 }
        lastVisited: null,
        studentName: null
    };
}

function saveProgress(progress) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
        console.warn('Could not save progress', e);
    }
}

function markDayComplete(dayNum, score) {
    const p = loadProgress();
    if (!p.startedAt) p.startedAt = new Date().toISOString();
    if (!p.completedDays.includes(dayNum)) {
        p.completedDays.push(dayNum);
        p.completedDays.sort((a, b) => a - b);
    }
    p.scores[dayNum] = score;
    p.lastVisited = dayNum;
    saveProgress(p);
}

function isDayUnlocked(dayNum) {
    if (dayNum === 1) return true;
    const p = loadProgress();
    return p.completedDays.includes(dayNum - 1);
}

function isDayCompleted(dayNum) {
    const p = loadProgress();
    return p.completedDays.includes(dayNum);
}

function getProgressPercent() {
    const p = loadProgress();
    return Math.round((p.completedDays.length / COURSE_STRUCTURE.length) * 100);
}

function resetProgress() {
    const msg = tr('progress.reset_confirm', 'לאפס את כל ההתקדמות? כל המבחנים יצטרכו להיעשות שוב.');
    if (confirm(msg)) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    }
}

/* ---------- Render: Home Page Cards ---------- */

function renderDayCards(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const p = loadProgress();

    const dayWord = tr('day_card.day', 'יום');
    const lessonsWord = tr('day_card.lessons', 'שיעורים');
    const minutesWord = tr('common.minutes_short', 'דק׳');
    const completedText = tr('day_card.completed_view', 'הושלם — צפי שוב');
    const startText = tr('day_card.start', 'התחילי');
    const lockedText = tr('day_card.locked', 'נעול');
    const lockedMsg = tr('day_card.locked_msg', 'השלימי את היום הקודם כדי לפתוח');

    container.innerHTML = COURSE_STRUCTURE.map(day => {
        const unlocked = isDayUnlocked(day.num);
        const completed = isDayCompleted(day.num);
        const score = p.scores[day.num];

        const title = day.titleKey ? tr(day.titleKey, day.title) : day.title;
        const desc = day.descKey ? tr(day.descKey, day.desc) : day.desc;

        const statusIcon = completed
            ? `<div class="day-status-icon" style="background:var(--success-light);color:var(--success);">${iconCheck()}</div>`
            : unlocked
                ? `<div class="day-status-icon" style="background:var(--brand-50);color:var(--brand-600);">${iconPlay()}</div>`
                : `<div class="day-status-icon" style="background:var(--slate-100);color:var(--slate-400);">${iconLock()}</div>`;

        const cta = completed
            ? `<span class="day-cta" style="color:var(--success);">${iconCheck()} ${completedText}</span>`
            : unlocked
                ? `<span class="day-cta">${startText} ${iconArrowLeft()}</span>`
                : `<span class="day-cta muted">${iconLock()} ${lockedText}</span>`;

        const lockOverlay = !unlocked ? `
            <div class="lock-overlay">
                <div style="text-align:center;color:var(--text-subtle);">
                    <div style="font-size:2rem;margin-bottom:8px;">🔒</div>
                    <div style="font-weight:700;font-size:0.9rem;">${lockedMsg}</div>
                </div>
            </div>` : '';

        const hrefAttr = unlocked ? `href="days/${day.slug}.html"` : '';
        const tagName = unlocked ? 'a' : 'div';

        return `
        <${tagName} ${hrefAttr} class="day-card ${completed ? 'completed' : ''} ${!unlocked ? 'locked' : ''}">
            ${lockOverlay}
            <div class="day-header">
                <span class="day-num">${dayWord} ${day.num}</span>
                ${statusIcon}
            </div>
            <div style="font-size:2.2rem;line-height:1;">${day.icon}</div>
            <h3>${title}</h3>
            <p class="day-desc">${desc}</p>
            <div class="day-meta">
                <span class="meta-item">${iconClock()} ${day.duration} ${minutesWord}</span>
                <span class="meta-item">${iconBook()} ${day.lessons} ${lessonsWord}</span>
                ${score !== undefined ? `<span class="meta-item" style="color:var(--success);font-weight:700;">${score}%</span>` : ''}
                ${cta}
            </div>
        </${tagName}>`;
    }).join('');
}

// Re-render cards when language changes
window.addEventListener('storage', (e) => {
    if (e.key === 'alphadevs_academy_lang_v1') {
        renderDayCards('days-grid');
    }
});

function renderProgressPill(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const p = loadProgress();
    const pct = getProgressPercent();
    const daysWord = tr('progress.days', 'ימים');
    el.innerHTML = `<span class="dot"></span> ${p.completedDays.length}/${COURSE_STRUCTURE.length} ${daysWord} · ${pct}%`;
}

/* ---------- Quiz Engine ---------- */

let quizState = { questions: [], answers: {}, submitted: false, dayNum: null };

function renderQuiz(containerId, dayNum, questions) {
    quizState = { questions, answers: {}, submitted: false, dayNum };
    const container = document.getElementById(containerId);
    if (!container) return;

    const badgeTmpl = tr('quiz.badge_day', 'מבחן יום {n}');
    const quizTitle = tr('quiz.title', 'מבחן סיכום');
    const quizDesc = tr('quiz.desc', 'צריך לפחות 70% כדי לעבור הלאה. אפשר לנסות שוב.');
    const submitBtn = tr('quiz.submit', 'בדקי את עצמך ←');

    container.innerHTML = `
        <div class="quiz-header">
            <span class="quiz-badge">${iconQuiz()} ${badgeTmpl.replace('{n}', dayNum)}</span>
            <h2>${quizTitle}</h2>
            <p class="muted">${quizDesc}</p>
        </div>
        <div id="quiz-questions">
            ${questions.map((q, i) => renderQuestion(q, i)).join('')}
        </div>
        <div class="quiz-submit">
            <button class="btn btn-primary btn-lg" onclick="submitQuiz()">${submitBtn} ${iconArrowLeft()}</button>
        </div>
        <div id="quiz-result" class="quiz-result"></div>
    `;
}

function renderQuestion(q, idx) {
    const lang = (typeof getLang === 'function') ? getLang() : 'he';
    const letters = lang === 'he'
        ? ['א', 'ב', 'ג', 'ד', 'ה']
        : ['A', 'B', 'C', 'D', 'E'];
    const explainLabel = tr('quiz.explanation_label', 'הסבר');
    return `
        <div class="quiz-question" id="q-${idx}">
            <div class="quiz-q-header">
                <span class="quiz-q-num">${idx + 1}</span>
                <div class="quiz-q-text">${q.q}</div>
            </div>
            <div class="quiz-options">
                ${q.options.map((opt, oi) => `
                    <button class="quiz-option" onclick="selectAnswer(${idx}, ${oi})" data-q="${idx}" data-o="${oi}">
                        <span class="opt-letter">${letters[oi]}</span>
                        <span>${opt}</span>
                    </button>
                `).join('')}
            </div>
            <div class="quiz-explanation" id="exp-${idx}">
                <b>${explainLabel}:</b> ${q.explanation || ''}
            </div>
        </div>
    `;
}

function selectAnswer(qIdx, optIdx) {
    if (quizState.submitted) return;
    quizState.answers[qIdx] = optIdx;
    document.querySelectorAll(`#q-${qIdx} .quiz-option`).forEach(b => b.classList.remove('selected'));
    document.querySelector(`#q-${qIdx} .quiz-option[data-o="${optIdx}"]`).classList.add('selected');
    document.getElementById(`q-${qIdx}`).classList.add('answered');
}

function submitQuiz() {
    const total = quizState.questions.length;
    const answered = Object.keys(quizState.answers).length;
    if (answered < total) {
        const missing = total - answered;
        const tmpl = tr('quiz.missing_confirm', 'לא ענית על {n} שאלות. להגיש בכל זאת?');
        if (!confirm(tmpl.replace('{n}', missing))) return;
    }
    quizState.submitted = true;

    let correct = 0;
    quizState.questions.forEach((q, idx) => {
        const userAns = quizState.answers[idx];
        const correctAns = q.correct;
        const buttons = document.querySelectorAll(`#q-${idx} .quiz-option`);
        buttons.forEach(b => b.disabled = true);
        if (userAns === correctAns) {
            correct++;
            const btn = document.querySelector(`#q-${idx} .quiz-option[data-o="${correctAns}"]`);
            if (btn) btn.classList.add('correct');
        } else {
            if (userAns !== undefined) {
                const wrongBtn = document.querySelector(`#q-${idx} .quiz-option[data-o="${userAns}"]`);
                if (wrongBtn) wrongBtn.classList.add('incorrect');
            }
            const correctBtn = document.querySelector(`#q-${idx} .quiz-option[data-o="${correctAns}"]`);
            if (correctBtn) correctBtn.classList.add('correct');
        }
        document.getElementById(`exp-${idx}`).classList.add('show');
    });

    const score = Math.round((correct / total) * 100);
    const passed = score >= PASS_THRESHOLD * 100;
    const resultEl = document.getElementById('quiz-result');
    resultEl.className = `quiz-result show ${passed ? 'passed' : 'failed'}`;

    if (passed) {
        markDayComplete(quizState.dayNum, score);
        const nextDay = quizState.dayNum + 1;
        const nextHref = nextDay <= 7 ? `day${nextDay}.html` : '../certificate.html';
        const continueLabel = tr('quiz.continue_to', 'המשיכי ליום');
        const certLabel = tr('quiz.get_certificate', 'קבלי תעודת סיום 🎓');
        const nextLabel = nextDay <= 7 ? `${continueLabel} ${nextDay} ${iconArrowLeft()}` : certLabel;
        const passedTitle = tr('quiz.passed_title', 'כל הכבוד! עברת את המבחן 🎉');
        const correctTmpl = tr('quiz.correct_count', '{c} מתוך {t} תשובות נכונות. יום {d} סומן כהושלם.');
        const correctText = correctTmpl.replace('{c}', correct).replace('{t}', total).replace('{d}', quizState.dayNum);
        const backHome = tr('quiz.back_home', 'חזרה לדף הבית');
        resultEl.innerHTML = `
            <div class="quiz-result-icon">${iconCheck()}</div>
            <h3>${passedTitle}</h3>
            <div class="quiz-score">${score}%</div>
            <p class="muted">${correctText}</p>
            <div class="quiz-actions">
                <a href="${nextHref}" class="btn btn-primary">${nextLabel}</a>
                <a href="../index.html" class="btn btn-secondary">${backHome}</a>
            </div>
        `;
    } else {
        const failedTitle = tr('quiz.failed_title', 'כמעט שם!');
        const failedTmpl = tr('quiz.failed_text', '{c} מתוך {t} תשובות נכונות. צריך 70% לפחות. סקרי שוב את החומר ונסי שוב — את יודעת את זה.');
        const failedText = failedTmpl.replace('{c}', correct).replace('{t}', total);
        const tryAgain = tr('quiz.try_again', 'נסי שוב 🔄');
        const backToContent = tr('quiz.back_to_content', 'חזרי לחומר');
        resultEl.innerHTML = `
            <div class="quiz-result-icon">📚</div>
            <h3>${failedTitle}</h3>
            <div class="quiz-score">${score}%</div>
            <p class="muted">${failedText}</p>
            <div class="quiz-actions">
                <button class="btn btn-primary" onclick="location.reload()">${tryAgain}</button>
                <a href="#top" class="btn btn-secondary">${backToContent}</a>
            </div>
        `;
    }
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* ---------- TOC active state on scroll ---------- */

function initTOCObserver() {
    const sections = document.querySelectorAll('.section[id]');
    if (!sections.length) return;
    const tocLinks = document.querySelectorAll('.toc-list a');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                tocLinks.forEach(a => a.classList.remove('active'));
                const link = document.querySelector(`.toc-list a[href="#${entry.target.id}"]`);
                if (link) link.classList.add('active');
            }
        });
    }, { rootMargin: '-20% 0px -70% 0px' });
    sections.forEach(s => observer.observe(s));
}

/* ---------- Lesson nav (prev/next) ---------- */

function renderLessonNav(containerId, currentDay) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const prev = COURSE_STRUCTURE.find(d => d.num === currentDay - 1);
    const next = COURSE_STRUCTURE.find(d => d.num === currentDay + 1);
    const nextUnlocked = isDayCompleted(currentDay);

    const prevHTML = prev ? `
        <a href="${prev.slug}.html" class="lesson-nav-btn prev">
            <span class="nav-direction">${iconArrowRight()} יום ${prev.num} — הקודם</span>
            <span class="nav-title">${prev.title}</span>
        </a>` : '<div></div>';

    const nextHTML = next ? `
        <a href="${nextUnlocked ? next.slug + '.html' : '#'}" class="lesson-nav-btn next ${!nextUnlocked ? 'disabled' : ''}">
            <span class="nav-direction">יום ${next.num} — הבא ${iconArrowLeft()}</span>
            <span class="nav-title">${nextUnlocked ? next.title : '🔒 השלימי את המבחן'}</span>
        </a>`
        : `<a href="../certificate.html" class="lesson-nav-btn next">
            <span class="nav-direction">סיום הקורס 🎓</span>
            <span class="nav-title">קבלי תעודה</span>
        </a>`;

    container.innerHTML = prevHTML + nextHTML;
}

/* ---------- SVG Icons (inline for performance) ---------- */
function iconCheck()   { return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'; }
function iconLock()    { return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>'; }
function iconPlay()    { return '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>'; }
function iconArrowLeft()  { return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><polyline points="15 18 9 12 15 6"></polyline></svg>'; }
function iconArrowRight() { return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><polyline points="9 18 15 12 9 6"></polyline></svg>'; }
function iconClock()   { return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>'; }
function iconBook()    { return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>'; }
function iconQuiz()    { return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'; }

/* ============================================
   LICENSE / AUTH / WATERMARK / ANTI-SHARE
   ============================================ */

const LICENSE_KEY_STORAGE = 'alphadevs_academy_license_v1';

// Owner master key — Lior, AlphaDevs founder
// Owner: full access, no watermark, gold OWNER badge
const OWNER_KEY = 'AD-LL2680';
const OWNER_EMAIL = 'lior@alphadevs.co';
const OWNER_NAME = 'לאור לסרי';

// Manager keys — internal team with admin privileges
// Manager: full access, no watermark, blue MANAGER badge
// To add: append { key: 'AD-XXXXXX', email: '...', name: '...' }
const MANAGERS = [
    { key: 'AD-NAT001', email: 'natalia@alphadevs.co', name: 'נטליה' }
];

// Pre-registered students — for direct invitations from Lior
// Students get standard experience: watermark on, anti-share on
// To add: append { key: 'AD-XXXXXX', email: '...', name: '...' }
const PRE_REG_STUDENTS = [
    { key: 'AD-REEMA1', email: 'reema@alphadevs.co', name: 'רימה' }
];

function isOwner(key, email) {
    if (!key || !email) return false;
    return key.toUpperCase() === OWNER_KEY && email.toLowerCase() === OWNER_EMAIL;
}

function isManager(key, email) {
    if (!key || !email) return false;
    return MANAGERS.some(m =>
        m.key.toUpperCase() === key.toUpperCase() &&
        m.email.toLowerCase() === email.toLowerCase()
    );
}

function isAdmin(key, email) {
    return isOwner(key, email) || isManager(key, email);
}

function getRole(key, email) {
    if (isOwner(key, email)) return 'owner';
    if (isManager(key, email)) return 'manager';
    return 'student';
}

// Demo license keys (in production, generated server-side after payment)
// Format: AD-XXXXXX (6 chars)
// In real deployment, validation hits the server.
function isValidLicenseKey(key, email) {
    if (!key || !email) return false;
    if (!key.match(/^AD-[A-Z0-9]{6}$/i)) return false;
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return false;
    // Demo: accept any properly-formatted key
    // In production: validate against your DB / Stripe customer
    return true;
}

// Magic URL auto-login — supports multiple formats:
//   ?owner=AD-LL2680                                    (legacy)
//   ?key=AD-XXXXXX&email=foo@bar.com&name=Name          (generic)
function checkMagicUrl() {
    const params = new URLSearchParams(window.location.search);

    // Legacy owner format
    const ownerKey = params.get('owner');
    if (ownerKey && ownerKey.toUpperCase() === OWNER_KEY) {
        saveLicense(OWNER_EMAIL, OWNER_KEY, OWNER_NAME);
        cleanUrlParams();
        return true;
    }

    // Generic format
    const key = params.get('key');
    const email = params.get('email');
    const name = params.get('name');
    if (key && email && name) {
        const upperKey = key.toUpperCase();
        const lowerEmail = email.toLowerCase();

        // Validate against known users
        if (isOwner(upperKey, lowerEmail)) {
            saveLicense(OWNER_EMAIL, OWNER_KEY, OWNER_NAME);
            cleanUrlParams();
            return true;
        }
        const mgr = MANAGERS.find(m => m.key.toUpperCase() === upperKey && m.email.toLowerCase() === lowerEmail);
        if (mgr) {
            saveLicense(mgr.email, mgr.key, mgr.name);
            cleanUrlParams();
            return true;
        }
        const stu = PRE_REG_STUDENTS.find(s => s.key.toUpperCase() === upperKey && s.email.toLowerCase() === lowerEmail);
        if (stu) {
            saveLicense(stu.email, stu.key, stu.name);
            cleanUrlParams();
            return true;
        }
        // Unknown user but valid format — save anyway as student
        if (upperKey.match(/^AD-[A-Z0-9]{6}$/) && lowerEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            saveLicense(lowerEmail, upperKey, decodeURIComponent(name));
            cleanUrlParams();
            return true;
        }
    }
    return false;
}

function cleanUrlParams() {
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, '', cleanUrl);
}

function getLicense() {
    try {
        const raw = localStorage.getItem(LICENSE_KEY_STORAGE);
        return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
}

function saveLicense(email, key, name) {
    localStorage.setItem(LICENSE_KEY_STORAGE, JSON.stringify({
        email, key, name,
        activatedAt: new Date().toISOString()
    }));
}

function clearLicense() {
    localStorage.removeItem(LICENSE_KEY_STORAGE);
    location.reload();
}

function showLicenseModal() {
    if (document.getElementById('license-overlay')) return;

    const title = tr('license.title', 'גישה לקורס');
    const lead = tr('license.lead', 'הקורס הוא רכוש פרטי של מי שרכש. בבקשה הזן את הפרטים שקיבלת במייל אחרי הרכישה.');
    const nameLabel = tr('license.name_label', 'שם מלא');
    const namePlaceholder = tr('license.name_placeholder', 'השם שבו נרשמת');
    const emailLabel = tr('license.email_label', 'מייל');
    const keyLabel = tr('license.key_label', 'מפתח רישוי (License Key)');
    const submit = tr('license.submit', 'היכנסי לקורס');
    const help = tr('license.help', 'שכחת מפתח?');
    const helpExample = tr('license.help_example', 'לדוגמה: AD-DEMO01 — לכל מפתח בפורמט תקין');

    const overlay = document.createElement('div');
    overlay.id = 'license-overlay';
    overlay.className = 'license-overlay';
    overlay.innerHTML = `
        <div class="license-card">
            <div style="font-size:3rem;margin-bottom:14px;">🔐</div>
            <h2>${title}</h2>
            <p class="lead muted">${lead}</p>
            <form class="license-form" id="license-form">
                <label>${nameLabel}</label>
                <input type="text" id="lic-name" placeholder="${namePlaceholder}" required autocomplete="name">
                <label>${emailLabel}</label>
                <input type="email" id="lic-email" placeholder="example@email.com" required autocomplete="email" dir="ltr">
                <label>${keyLabel}</label>
                <input type="text" id="lic-key" placeholder="AD-XXXXXX" required style="direction:ltr;text-transform:uppercase;font-family:'JetBrains Mono',monospace;">
                <div class="license-error" id="lic-error"></div>
                <button type="submit" class="btn btn-primary">${submit} ${iconArrowLeft()}</button>
            </form>
            <div class="help">
                ${help} <a href="mailto:support@alphadevs.co">support@alphadevs.co</a><br>
                <span style="font-size:0.78rem;">${helpExample}</span>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('license-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('lic-name').value.trim();
        const email = document.getElementById('lic-email').value.trim().toLowerCase();
        const key = document.getElementById('lic-key').value.trim().toUpperCase();
        const errEl = document.getElementById('lic-error');

        if (!isValidLicenseKey(key, email)) {
            errEl.textContent = tr('license.error_invalid', 'פרטים לא תקינים. בדקי את המפתח (פורמט: AD-XXXXXX) ואת המייל.');
            errEl.classList.add('show');
            return;
        }

        saveLicense(email, key, name);
        overlay.remove();
        applyWatermarks();
    });
}

function applyWatermarks() {
    const lic = getLicense();
    if (!lic) return;
    const role = getRole(lic.key, lic.email);
    const isAdminUser = role === 'owner' || role === 'manager';

    // Bottom-left small watermark — admins get colored badges
    if (!document.querySelector('.user-watermark')) {
        const wm = document.createElement('div');
        wm.className = 'user-watermark';
        if (role === 'owner') {
            wm.innerHTML = '👑 OWNER · ' + lic.email;
            wm.style.background = 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(236,72,153,0.15))';
            wm.style.borderColor = 'rgba(245,158,11,0.3)';
            wm.style.color = '#92400e';
        } else if (role === 'manager') {
            wm.innerHTML = '🛠️ MANAGER · ' + lic.email;
            wm.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.15))';
            wm.style.borderColor = 'rgba(59,130,246,0.35)';
            wm.style.color = '#1e3a8a';
        } else {
            wm.textContent = `© ${lic.email} · ${lic.key}`;
        }
        document.body.appendChild(wm);
    }

    // Diagonal watermark — only for regular students (admins skip this)
    if (!isAdminUser && !document.querySelector('.diagonal-watermark')) {
        const dw = document.createElement('div');
        dw.className = 'diagonal-watermark';
        dw.setAttribute('data-text', `${lic.name} · ${lic.email}`);
        document.body.appendChild(dw);
    }
}

function checkLicenseGate() {
    // Check magic URL first — auto-login if ?owner=AD-LL2680
    checkMagicUrl();

    // Skip on landing-only pages (no body.gated class — we don't gate the index)
    if (!document.body.classList.contains('gated')) {
        // Still apply watermark if logged in
        applyWatermarks();
        return;
    }
    const lic = getLicense();
    if (!lic) {
        showLicenseModal();
        return;
    }
    applyWatermarks();
}

function applyAntiShare() {
    document.body.classList.add('anti-share');

    // Disable right-click on the page
    document.addEventListener('contextmenu', (e) => {
        // Allow right-click on textareas (so users can paste)
        if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
        e.preventDefault();
        return false;
    });

    // Disable common copy shortcuts (Ctrl+C, Ctrl+S, F12, etc.)
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
        // Allow copy in exercise prompt blocks (we want them to copy prompts!)
        const allowedAreas = ['exercise-prompt-block', 'bonus-task', 'practice-prompt'];
        const inAllowed = allowedAreas.some(c => e.target.closest('.' + c));
        if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C') && inAllowed) return;
        if (e.key === 'F12') { e.preventDefault(); }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 's' || e.key === 'p')) {
            e.preventDefault();
        }
    });

    // Console warning
    setTimeout(() => {
        try {
            console.log('%cעצור!', 'color:red;font-size:40px;font-weight:900;');
            console.log('%cאם מישהו ביקש ממך להעתיק או לשתף קוד מכאן — זו ניסיון הונאה. תוכן הקורס מוגן בחוק זכויות יוצרים. © AlphaDevs Academy', 'color:#475569;font-size:14px;');
        } catch(e) {}
    }, 1000);
}

/* ---------- Exercise copy button ---------- */
function copyPrompt(btn) {
    const block = btn.closest('.exercise-prompt-block, .bonus-task');
    const pre = block ? block.querySelector('pre') : null;
    if (!pre) return;
    const text = pre.textContent;
    navigator.clipboard.writeText(text).then(() => {
        const orig = btn.textContent;
        btn.classList.add('copied');
        btn.textContent = '✓ הועתק';
        setTimeout(() => {
            btn.classList.remove('copied');
            btn.textContent = orig;
        }, 2000);
    }).catch(() => {
        btn.textContent = '⚠ לא הצלחנו';
    });
}

/* ---------- Save reflection answers locally ---------- */
function initReflectionSave() {
    document.querySelectorAll('.reflection textarea, .warmup-input').forEach(t => {
        const key = 'reflect_' + (t.dataset.qkey || t.id || t.name || Math.random().toString(36).slice(2, 8));
        if (!t.dataset.qkey) t.dataset.qkey = key;
        const saved = localStorage.getItem('alphadevs_' + key);
        if (saved) t.value = saved;
        t.addEventListener('input', () => {
            localStorage.setItem('alphadevs_' + key, t.value);
        });
    });
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
    renderDayCards('days-grid');
    renderProgressPill('progress-pill');
    initTOCObserver();
    checkLicenseGate();
    if (document.body.classList.contains('gated')) {
        const lic = getLicense();
        // Admins (owner + managers) bypass anti-share restrictions
        if (!lic || !isAdmin(lic.key, lic.email)) {
            applyAntiShare();
        }
        initReflectionSave();
    }
});
