/* ============================================
   AlphaDevs Academy — i18n Engine
   Multi-language support — Hebrew (default) + English
   Adding more languages: extend TRANSLATIONS + LANGS
   ============================================ */

const I18N_STORAGE = 'alphadevs_academy_lang_v1';
const I18N_CHOSEN_FLAG = 'alphadevs_academy_lang_chosen_v1';
const I18N_GENDER_STORAGE = 'alphadevs_academy_gender_v1';

/* ---------- Hebrew Grammatical Gender ---------- */
// In Hebrew, verbs change based on the person being addressed.
// 'f' = לשון נקבה (female): תכתבי, תבני, תיצרי
// 'm' = לשון זכר (male): תכתוב, תבנה, תיצור
// 'n' = לשון רבים / כללי (plural/inclusive): תכתבו, תבנו, תיצרו
function getGender() {
    return localStorage.getItem(I18N_GENDER_STORAGE) || 'f';
}
function setGender(gender) {
    if (!['f', 'm', 'n'].includes(gender)) return;
    localStorage.setItem(I18N_GENDER_STORAGE, gender);
}
function hasUserChosenGender() {
    return localStorage.getItem(I18N_GENDER_STORAGE) !== null;
}
// Helper for content authors:
//   g('תכתבי', 'תכתוב', 'תכתבו')
// Returns the right form based on user's choice. Falls back gracefully.
function g(female, male, neutral) {
    const gender = getGender();
    if (gender === 'm') return male;
    if (gender === 'n') return neutral || male;
    return female;
}

const LANGS = {
    he: { code: 'he', name: 'עברית', native: 'עברית', flag: '🇮🇱', dir: 'rtl' },
    en: { code: 'en', name: 'English', native: 'English', flag: '🇬🇧', dir: 'ltr' }
    // Add more languages here:
    // es: { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸', dir: 'ltr' }
};

/* ---------- Language Detection & Storage ---------- */
function getLang() {
    // 1. URL param wins (for sharing) — but only for this session, not saved
    const urlLang = new URLSearchParams(window.location.search).get('lang');
    if (urlLang && LANGS[urlLang.toLowerCase()]) {
        return urlLang.toLowerCase();
    }
    // 2. User's explicit choice (saved)
    const saved = localStorage.getItem(I18N_STORAGE);
    if (saved && LANGS[saved]) return saved;
    // 3. Browser auto-detect (no save)
    const browser = (navigator.language || 'he').slice(0, 2).toLowerCase();
    return LANGS[browser] ? browser : 'he';
}

function hasUserChosenLang() {
    return localStorage.getItem(I18N_CHOSEN_FLAG) === 'true';
}

function setLang(code, opts = {}) {
    if (!LANGS[code]) return;
    const current = getLang();
    localStorage.setItem(I18N_STORAGE, code);
    if (opts.fromWelcome || opts.markChosen) {
        localStorage.setItem(I18N_CHOSEN_FLAG, 'true');
    }
    // If language actually changed and not initial setup, reload
    if (current !== code && !opts.fromWelcome) {
        location.reload();
    } else {
        applyI18n();
    }
}

/* ---------- Translation Function ---------- */
function t(key, fallback) {
    const lang = getLang();
    const dict = TRANSLATIONS[lang] || {};
    return dict[key] !== undefined ? dict[key] : (TRANSLATIONS.he[key] || fallback || key);
}

/* ---------- Apply Translations to Page ---------- */
function applyI18n() {
    const lang = getLang();
    const langDef = LANGS[lang];

    // Set document lang and direction
    document.documentElement.lang = lang;
    document.documentElement.dir = langDef.dir;
    document.body.classList.remove('dir-rtl', 'dir-ltr');
    document.body.classList.add('dir-' + langDef.dir);

    // Translate elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const text = t(key);
        if (text !== undefined) el.textContent = text;
    });

    // Translate elements with data-i18n-html (preserves HTML)
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        const text = t(key);
        if (text !== undefined) el.innerHTML = text;
    });

    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const text = t(key);
        if (text !== undefined) el.placeholder = text;
    });

    // Translate aria-labels and titles
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        el.title = t(key);
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
        const key = el.getAttribute('data-i18n-aria-label');
        el.setAttribute('aria-label', t(key));
    });

    // Update document title if there's a key for it
    const titleKey = document.querySelector('meta[name="i18n-title"]')?.content;
    if (titleKey) document.title = t(titleKey);

    // Update language switcher UI
    updateLanguageSwitcher();
}

/* ---------- Welcome Splash (first-time language picker) ---------- */
function showWelcomeSplash() {
    if (document.getElementById('welcome-splash')) return;
    const splash = document.createElement('div');
    splash.id = 'welcome-splash';
    splash.className = 'welcome-splash';
    splash.setAttribute('dir', 'auto');

    const browserLang = (navigator.language || 'en').slice(0, 2).toLowerCase();
    const suggested = LANGS[browserLang] ? browserLang : null;

    splash.innerHTML = `
        <div class="welcome-card">
            <div class="welcome-logo">A</div>

            <h1 class="welcome-title">
                <span class="welcome-en">Welcome</span>
                <span class="welcome-divider">·</span>
                <span class="welcome-he">ברוכים הבאים</span>
            </h1>

            <p class="welcome-sub">
                <span class="en">Choose your preferred language to begin</span>
                <span class="he">בחר את שפת הקורס</span>
            </p>

            <div class="welcome-langs">
                ${Object.values(LANGS).map(l => `
                    <button class="welcome-lang-btn ${l.code === suggested ? 'suggested' : ''}" data-lang="${l.code}" type="button">
                        ${l.code === suggested ? '<span class="suggested-tag">Recommended</span>' : ''}
                        <span class="welcome-flag">${l.flag}</span>
                        <span class="welcome-native">${l.native}</span>
                        ${l.code === 'he' ? '<span class="welcome-name-en">Hebrew</span>' : ''}
                        ${l.code === 'en' ? '<span class="welcome-name-en">English</span>' : ''}
                    </button>
                `).join('')}
            </div>

            <p class="welcome-footer">
                <span class="en">You can change this later from the footer</span>
                <span class="he">אפשר להחליף בכל עת מהפוטר</span>
            </p>
        </div>
    `;
    document.body.appendChild(splash);
    document.body.style.overflow = 'hidden';

    splash.querySelectorAll('.welcome-lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const code = btn.getAttribute('data-lang');
            splash.classList.add('closing');
            setTimeout(() => {
                splash.remove();
                setLang(code, { fromWelcome: true, markChosen: true });
                // Hebrew users → ask for gender form next
                if (code === 'he' && !hasUserChosenGender()) {
                    showGenderSplash();
                } else {
                    document.body.style.overflow = '';
                    injectFooterLangLink();
                    handlePageStatus();
                }
            }, 300);
        });
    });
}

/* ---------- Gender Splash (Hebrew only) ---------- */
function showGenderSplash() {
    if (document.getElementById('gender-splash')) return;
    const splash = document.createElement('div');
    splash.id = 'gender-splash';
    splash.className = 'welcome-splash gender-splash';

    splash.innerHTML = `
        <div class="welcome-card">
            <div class="gender-emoji">💬</div>

            <h1 class="welcome-title" style="display:block;">
                איך נדבר אלייך?
            </h1>

            <p class="welcome-sub" style="margin-bottom:8px;">
                <span class="he">בקורס נדבר אלייך ישירות, כמו בשיחה אישית.<br>בחירה אחת, ונדע איך להתאים את הניסוח.</span>
            </p>

            <div class="gender-options">
                <button class="gender-btn" data-gender="f" type="button">
                    <span class="gender-label">לשון נקבה</span>
                    <span class="gender-example">תכתבי · תבני · תיצרי</span>
                </button>
                <button class="gender-btn" data-gender="m" type="button">
                    <span class="gender-label">לשון זכר</span>
                    <span class="gender-example">תכתוב · תבנה · תיצור</span>
                </button>
                <button class="gender-btn" data-gender="n" type="button">
                    <span class="gender-label">לשון רבים</span>
                    <span class="gender-example">תכתבו · תבנו · תיצרו</span>
                </button>
            </div>

            <button class="gender-skip" type="button" id="gender-skip-btn">
                לא חשוב לי — בחרו לשון רבים
            </button>

            <p class="welcome-footer">
                אפשר להחליף בכל עת מהפוטר ↓
            </p>
        </div>
    `;
    document.body.appendChild(splash);
    document.body.style.overflow = 'hidden';

    splash.querySelectorAll('.gender-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const gender = btn.getAttribute('data-gender');
            finalizeGenderChoice(splash, gender);
        });
    });

    document.getElementById('gender-skip-btn').addEventListener('click', () => {
        finalizeGenderChoice(splash, 'n');
    });
}

function finalizeGenderChoice(splash, gender) {
    splash.classList.add('closing');
    setTimeout(() => {
        splash.remove();
        document.body.style.overflow = '';
        setGender(gender);
        applyI18n();
        injectFooterLangLink();
        handlePageStatus();
    }, 300);
}

/* ---------- Footer Language Link (discreet) ---------- */
function injectFooterLangLink() {
    if (document.getElementById('footer-lang-link')) return;

    const lang = getLang();
    const otherLangs = Object.values(LANGS).filter(l => l.code !== lang);

    // Gender section (Hebrew only)
    const genderHTML = lang === 'he' ? `
        <span class="footer-lang-divider">|</span>
        <span class="footer-lang-icon">👤</span>
        <button class="footer-gender-trigger" id="footer-gender-trigger" type="button" title="להחליף לשון">
            ${getGenderLabel(getGender())}
        </button>
    ` : '';

    const link = document.createElement('div');
    link.id = 'footer-lang-link';
    link.className = 'footer-lang-link';
    link.innerHTML = `
        <span class="footer-lang-icon">🌐</span>
        <span class="footer-lang-current">${LANGS[lang].native}</span>
        <span class="footer-lang-divider">·</span>
        ${otherLangs.map(l => `
            <button class="footer-lang-switch" data-lang="${l.code}" type="button">${l.native}</button>
        `).join('<span class="footer-lang-divider">·</span>')}
        ${genderHTML}
    `;
    document.body.appendChild(link);

    link.querySelectorAll('.footer-lang-switch').forEach(btn => {
        btn.addEventListener('click', () => {
            const code = btn.getAttribute('data-lang');
            setLang(code, { markChosen: true });
        });
    });

    const genderTrigger = document.getElementById('footer-gender-trigger');
    if (genderTrigger) {
        genderTrigger.addEventListener('click', () => {
            // Re-open gender splash to allow change
            localStorage.removeItem(I18N_GENDER_STORAGE);
            showGenderSplash();
        });
    }
}

function getGenderLabel(g) {
    if (g === 'm') return 'לשון זכר';
    if (g === 'n') return 'לשון רבים';
    return 'לשון נקבה';
}

function updateLanguageSwitcher() {
    // Footer link auto-rebuilds on language change via location.reload()
    // Nothing to do here for now
}

/* ---------- Coming Soon Modal (for partial translations) ---------- */
function showComingSoonModal() {
    if (document.getElementById('coming-soon-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'coming-soon-modal';
    modal.className = 'coming-soon-modal';
    modal.innerHTML = `
        <div class="coming-soon-card">
            <div class="coming-soon-icon">🌐</div>
            <h2>${t('coming_soon.title', 'This page is coming soon in your language')}</h2>
            <p>${t('coming_soon.lead', "We're working hard to translate this lesson. In the meantime, you can read it in Hebrew, or go back and continue with translated content.")}</p>
            <div class="coming-soon-actions">
                <button class="btn btn-primary" onclick="readInHebrew()" type="button">${t('coming_soon.read_he', 'Read it in Hebrew')}</button>
                <button class="btn btn-secondary" onclick="goHome()" type="button">${t('coming_soon.go_back', 'Back to course')}</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

function readInHebrew() {
    setLang('he', { markChosen: true });
}

function goHome() {
    // Find the index/home page based on current path depth
    const path = window.location.pathname;
    if (path.includes('/days/') || path.includes('/Landing-Pages/') || path.includes('/Lead-Magnet/') || path.includes('/Master-Plan/') || path.includes('/Workbooks/')) {
        window.location.href = '../index.html';
    } else {
        window.location.href = 'index.html';
    }
}

function handlePageStatus() {
    const lang = getLang();
    if (lang === 'he') return; // Hebrew pages are always full

    const incomplete = document.querySelector('meta[name="i18n-incomplete"]')?.content === 'true';
    if (incomplete) {
        showComingSoonModal();
    }
}

/* ---------- Initialize ---------- */
document.addEventListener('DOMContentLoaded', () => {
    // Step 1: Apply current language to the page (uses URL param > saved > browser)
    applyI18n();

    // Step 2: Determine entry flow based on what user has/hasn't chosen
    const isHomePage = /\/(index\.html)?(\?|#|$)/.test(window.location.pathname + window.location.search) ||
                       window.location.pathname.endsWith('/');
    const urlLangParam = new URLSearchParams(window.location.search).get('lang');

    if (!hasUserChosenLang() && isHomePage && !urlLangParam) {
        // First visit — show language picker
        showWelcomeSplash();
    } else if (getLang() === 'he' && !hasUserChosenGender() && isHomePage) {
        // Hebrew is set but gender not chosen yet — ask for gender form
        showGenderSplash();
    } else {
        // Standard flow
        injectFooterLangLink();
        handlePageStatus();
    }
});


/* ============================================
   TRANSLATIONS DICTIONARY
   Add new keys here. Each language gets its own object.
   Missing keys fall back to Hebrew, then to the key itself.
   ============================================ */
const TRANSLATIONS = {

    /* ============ HEBREW (default) ============ */
    he: {
        // Common
        'common.start': 'התחילי',
        'common.next': 'הבא',
        'common.previous': 'הקודם',
        'common.close': 'סגור',
        'common.save': 'שמור',
        'common.continue': 'המשך',
        'common.back': 'חזור',
        'common.submit': 'שלח',
        'common.completed': 'הושלם',
        'common.locked': 'נעול',
        'common.minutes_short': 'דק׳',
        'common.hours_short': 'ש׳',

        // Navigation
        'nav.back_to_course': '← חזרה לקורס',
        'nav.reset_progress': 'איפוס',
        'nav.home': 'דף הבית',
        'nav.start_course': 'התחילי את הקורס',
        'nav.view_curriculum': 'צפי בתוכנית הקורס',

        // Brand
        'brand.subtitle': 'From Zero to Hero with Claude',

        // i18n notices
        'i18n.incomplete_notice': 'דף זה מתורגם חלקית לאנגלית. חזרי לעברית לחוויה מלאה.',
        'i18n.switch_lang': 'שפה',

        // ==================
        // INDEX (Course Home)
        // ==================
        'index.eyebrow': '✨ קורס מקצועי · 7 ימים · עברית',
        'index.title': 'מאפס לגיבור',
        'index.title_2': 'עם Claude Cowork',
        'index.subtitle': 'הקורס המלא ביותר ללמידת עבודה עם Claude — מצ׳אט פשוט ועד בניית אג׳נטים, אוטומציות ופרויקטים מתקדמים. נבנה במיוחד עבור משתמשות ומשתמשים שרוצים לקפוץ קדימה בעבודה היומיומית.',
        'index.cta_start': 'התחילי את הקורס ←',
        'index.cta_program': 'צפי בתוכנית הקורס',
        'index.stat_days': 'ימי לימוד מובנים',
        'index.stat_lessons': 'שיעורים מעשיים',
        'index.stat_quizzes': 'מבחני סיכום',
        'index.stat_practice': 'תרגול חי במחשב שלך',

        'index.what_label': 'מה תרכשי בקורס',
        'index.what_title': 'כשתסיימי את הקורס תהיי מסוגלת ל...',
        'index.what_chat': 'לדבר עם קלוד כמו עם עמית',
        'index.what_chat_desc': 'תכתבי פרומפטים שמביאים תשובות מדויקות בפעם הראשונה — בלי לבזבז זמן.',
        'index.what_docs': 'ליצור מסמכים מקצועיים',
        'index.what_docs_desc': 'Word, Excel, PDF, מצגות — כולם בלחיצת כפתור, מעוצבים ברמה גבוהה.',
        'index.what_connect': 'לחבר את כל הכלים שלך',
        'index.what_connect_desc': 'Gmail, Calendar, Drive, Monday — קלוד מתחיל לעבוד עם המערכות שלך.',
        'index.what_agents': 'לבנות אג׳נטים אישיים',
        'index.what_agents_desc': 'תכיני עוזרים מותאמים שעובדים בלילה כשאת ישנה, ושולחים תקציר בבוקר.',
        'index.what_schedule': 'לתזמן משימות חוזרות',
        'index.what_schedule_desc': 'בריפים יומיים, התראות מתפרצות, דוחות שבועיים — הכל אוטומטי.',
        'index.what_memory': 'להשתמש בזיכרון לטווח ארוך',
        'index.what_memory_desc': 'קלוד יזכור את ההעדפות שלך, הפרויקטים, וההקשר — לאורך כל השיחות.',

        'index.program_label': 'תוכנית הקורס',
        'index.program_title': '7 ימים. כל יום מבחן. בסוף — תעודת סיום.',
        'index.program_desc': 'כל יום בנוי משילוב של תיאוריה קצרה, דוגמאות חיות, תרגול במחשב שלך, ומבחן סיכום שמשחרר את היום הבא. צריך 70% כדי לעבור.',

        'index.method_label': 'המתודולוגיה שלנו',
        'index.method_title': 'איך הקורס בנוי כדי שבאמת תלמדי',
        'index.method_1_title': 'הסבר ברור — בלי ז׳רגון מיותר',
        'index.method_1_desc': 'כל מושג מוסבר בעברית פשוטה, עם דוגמאות מהחיים. אין צורך בידע טכני קודם.',
        'index.method_2_title': 'תרגול מעשי — את עושה, לא רק קוראת',
        'index.method_2_desc': 'בכל שיעור יש תרגול שאת מבצעת בקלוד שלך. למידה אמיתית מגיעה מעשייה.',
        'index.method_3_title': 'מבחן סיכום בכל יום',
        'index.method_3_desc': 'לא דקורציה — מבחן אמיתי של 5-7 שאלות. בלי 70% — אי אפשר לעבור הלאה.',
        'index.method_4_title': 'פרויקט סיום אמיתי',
        'index.method_4_desc': 'ביום השביעי תבני אג׳נט שלך, מתוזמן, מחובר לכלים — מהתחלה ועד הסוף.',

        'index.cta_final_title': 'מוכנה להתחיל?',
        'index.cta_final_desc': 'היום הראשון לוקח כ-40 דקות. בסוף השבוע תהיי במקום אחר לגמרי.',
        'index.cta_final_btn': 'בואי נתחיל ביום 1 ←',

        'index.cert_banner_title': 'סיימת את הקורס!',
        'index.cert_banner_desc': 'כל 7 הימים הושלמו, כל המבחנים עברו בהצלחה. הגיע הזמן לקבל את התעודה שלך.',
        'index.cert_banner_btn': 'צפי בתעודת הסיום 🏆',

        'footer.built_with_love': 'נבנה באהבה עבור הצוות. © 2026 AlphaDevs · כל הזכויות שמורות.',

        // ==================
        // DAY CARD LABELS
        // ==================
        'day_card.day': 'יום',
        'day_card.start': 'התחילי',
        'day_card.completed_view': 'הושלם — צפי שוב',
        'day_card.locked': 'נעול',
        'day_card.locked_msg': 'השלימי את היום הקודם כדי לפתוח',
        'day_card.lessons': 'שיעורים',

        // 7 DAYS - titles & descriptions for cards
        'day1.title': 'יסודות הצ׳אט עם Cowork',
        'day1.desc': 'איך מדברים עם קלוד, מה הוא יודע לעשות, ואיך כותבים פרומפט שעובד.',
        'day2.title': 'קבצים, מסמכים, והעולם הדיגיטלי',
        'day2.desc': 'יצירה ועריכה של Word, Excel, PDF ומצגות. ניהול תיקיית עבודה.',
        'day3.title': 'סקילים — מומחים מובנים',
        'day3.desc': 'מה זה Skill, איך מפעילים אותו, ואיך הוא הופך אותך לאלופה.',
        'day4.title': 'פלאגינים וחיבורים חיצוניים',
        'day4.desc': 'חיבור Gmail, Calendar, Drive, Monday — והפיכת קלוד לעמית-עבודה אמיתי.',
        'day5.title': 'זיכרון, פרויקטים, וארטיפקטים',
        'day5.desc': 'איך לעבוד לאורך זמן: זיכרון מתמשך, פרויקטים, ודשבורדים חיים.',
        'day6.title': 'אג׳נטים — לבנות עוזרים מותאמים אישית',
        'day6.desc': 'מה זה אג׳נט, ההבדל מסקיל, ואיך לבנות אחד שיעבוד בשבילך.',
        'day7.title': 'אוטומציה, תזמון, וטריקים מקצועיים',
        'day7.desc': 'משימות מתוזמנות, חיבורים מתקדמים, ו-10 הטריקים שיהפכו אותך למקצוענית.',

        // ==================
        // DAY 1 — Lesson Page
        // ==================
        'day1.lesson_eyebrow': 'יום 1 · 40 דקות · רמה: בסיסית',
        'day1.lesson_title': 'יסודות הצ׳אט עם Cowork',
        'day1.lesson_subtitle': 'היום נתחיל מההתחלה. נבין מה זה Cowork, איך לדבר עם קלוד נכון, ומה הופך פרומפט אחד למוצלח ואחר לכישלון.',
        'day1.day_of_total': 'יום 1 מתוך 7',

        'day1.toc_intro': 'ברוכה הבאה ל-Cowork',
        'day1.toc_first_chat': 'השיחה הראשונה',
        'day1.toc_prompt_anatomy': 'אנטומיה של פרומפט טוב',
        'day1.toc_when_claude': 'מתי לפנות לקלוד',
        'day1.toc_quiz': 'מבחן יום 1',

        'common.warmup': 'חימום',
        'common.lessons': 'שיעורים',
        'common.exercise': 'תרגיל',
        'common.case_study': 'מקרה בוחן',
        'common.workbook': 'חוברת עבודה',
        'common.bonus': 'בונוס',
        'common.total': 'סך הכל',

        'video.intro': 'וידאו פתיחה',
        'video.coming_soon': 'הקלטת וידאו תיווסף בקרוב.',
        'video.read_meanwhile': 'בינתיים — קראי את התוכן הכתוב למטה.',

        // Quiz UI
        'quiz.badge': 'מבחן',
        'quiz.title': 'מבחן סיכום',
        'quiz.desc': 'צריך לפחות 70% כדי לעבור הלאה. אפשר לנסות שוב.',
        'quiz.submit': 'בדקי את עצמך ←',
        'quiz.passed_title': 'כל הכבוד! עברת את המבחן 🎉',
        'quiz.failed_title': 'כמעט שם!',
        'quiz.try_again': 'נסי שוב 🔄',
        'quiz.back_to_content': 'חזרי לחומר',
        'quiz.continue_to': 'המשיכי ליום',
        'quiz.get_certificate': 'קבלי תעודת סיום 🎓',
        'quiz.back_home': 'חזרה לדף הבית',
        'quiz.explanation': 'הסבר',

        // License modal
        'license.title': 'גישה לקורס',
        'license.lead': 'הקורס הוא רכוש פרטי של מי שרכש. בבקשה הזן את הפרטים שקיבלת במייל אחרי הרכישה.',
        'license.name_label': 'שם מלא',
        'license.name_placeholder': 'השם שבו נרשמת',
        'license.email_label': 'מייל',
        'license.key_label': 'מפתח רישוי (License Key)',
        'license.submit': 'היכנסי לקורס ←',
        'license.help': 'שכחת מפתח?',
        'license.error_invalid': 'פרטים לא תקינים. בדקי את המפתח (פורמט: AD-XXXXXX) ואת המייל.',

        // Lesson sidebar
        'lesson.toc_label': 'תוכן היום',
        'lesson.day_of_total': 'יום {n} מתוך 7',

        // Coming Soon (used when English user reaches Hebrew-only page)
        'coming_soon.title': 'הדף הזה עדיין בתהליך תרגום',
        'coming_soon.lead': 'אנחנו עובדים על תרגום השיעור הזה. בינתיים אפשר לקרוא בעברית או לחזור לתוכן מתורגם.',
        'coming_soon.read_he': 'קרא בעברית',
        'coming_soon.go_back': 'חזרה לקורס',

        // ==================
        // SALES LANDING PAGE
        // ==================
        'sales.nav_buy': 'קנה עכשיו',
        'sales.brand_subtitle': 'אקדמיית הבינה המלאכותית',

        'sales.hero_eyebrow': '🚀 הקורס המקצועי הראשון בעברית · 1,247 לומדים פעילים',
        'sales.hero_title': 'תוך 7 ימים, תפסיקי לבזבז שעות על משימות ש-AI כבר עושה טוב יותר ממך',
        'sales.hero_sub': 'הקורס המקצועי היחיד בעברית שמלמד אותך לעבוד עם בינה מלאכותית כמו מומחה — מהשיעור הראשון ועד לבניית אג׳נטים שעובדים בשבילך 24/7. בלי רקע טכני, עם תרגול אמיתי, ותוצאות שתראי כבר ביום הראשון.',
        'sales.hero_cta_buy': 'התחל עכשיו · ₪297 ←',
        'sales.hero_cta_curriculum': 'צפי בתוכן הקורס',
        'sales.hero_trust_refund': '✅ אחריות 30 יום',
        'sales.hero_trust_cert': '🎓 תעודת סיום',
        'sales.hero_trust_lifetime': '♾️ גישה לכל החיים',
        'sales.hero_trust_hebrew': '🇮🇱 100% בעברית',

        'sales.stat_students': 'לומדים פעילים',
        'sales.stat_rating': 'דירוג ממוצע',
        'sales.stat_days': 'ימים להשלמה מלאה',
        'sales.stat_lessons': 'שיעורים מעשיים',

        'sales.pain_eyebrow': '😩 אם זה נשמע מוכר',
        'sales.pain_title': 'את יודעת שאת מפסידה — אבל לא יודעת איפה להתחיל',
        'sales.pain_intro': 'כל יום יש כתבה חדשה על AI. כל מתחרה משתמש בו. את שואלת את עצמך — איך אני נכנסת לעניינים בלי לבזבז שבועות לקרוא ולנסות?',
        'sales.pain_1_title': 'אין לי זמן ללמוד מאפס',
        'sales.pain_1_desc': 'קורסים באנגלית של 40 שעות, מאמרים אקדמיים, סרטונים ביוטיוב — הכל מבולגן ולא מוביל לשום מקום.',
        'sales.pain_2_title': 'אני לא יודעת מה רלוונטי לי',
        'sales.pain_2_desc': '"חשוב ללמוד פייתון", "צריך להבין LLMs" — אבל אני רק רוצה לעבוד טוב יותר, לא להפוך למתכנתת.',
        'sales.pain_3_title': 'הפרומפטים שלי לא עובדים',
        'sales.pain_3_desc': 'אני מבקשת מ-AI לכתוב מייל — מקבלת משהו גנרי. מבקשת ניתוח — מקבלת רשימה ארוכה. אין דרך אמצע.',
        'sales.pain_4_title': 'אני לא רואה תוצאות מעשיות',
        'sales.pain_4_desc': 'קראתי כבר 50 פוסטים. ראיתי הדגמות. אבל בעבודה שלי בפועל — אני עדיין עושה הכל ידנית.',
        'sales.pain_5_title': 'פספסתי את הגל',
        'sales.pain_5_desc': 'מתחרים שלי כבר משתמשים. עובדים שלי שואלים שאלות שאני לא יודעת לענות. אני מרגישה שאני נשארת מאחור.',
        'sales.pain_6_title': 'אין תוכן רציני בעברית',
        'sales.pain_6_desc': 'הכל באנגלית. הסרטונים בעברית — חובבניים. אני רוצה משהו מקצועי, ברמה הגבוהה ביותר, שמדבר אליי.',

        'sales.solution_eyebrow': '✨ הפתרון',
        'sales.solution_title': '7 ימים. מבנה ברור. תוצאות מדידות.',
        'sales.solution_intro': 'לא עוד "ללמוד הכל". לא עוד "לקרוא 100 מאמרים". מסלול מדויק, יום אחר יום, עם תרגול שאת מבצעת ב-AI שלך — ותוצאה אמיתית בסוף.',
        'sales.solution_step1_title': 'למידה',
        'sales.solution_step1_desc': 'וידאו קצר, ברור, בעברית. כל שיעור — מתחת ל-15 דקות.',
        'sales.solution_step2_title': 'תרגול',
        'sales.solution_step2_desc': 'פרומפט מוכן שאת מעתיקה ל-AI שלך. רואה תוצאה אמיתית.',
        'sales.solution_step3_title': 'מבחן',
        'sales.solution_step3_desc': 'בסוף כל יום — מבחן קצר. עברת? עוברת ליום הבא.',

        'sales.curriculum_eyebrow': '📚 תוכן הקורס',
        'sales.curriculum_title': '7 ימים. כל יום מלמד יכולת חדשה.',
        'sales.curriculum_intro': 'כל יום בנוי מ-4-5 שיעורים מעשיים, תרגול חי, ומבחן סיום. נדרש 70% במבחן כדי לעבור הלאה.',

        'sales.pricing_eyebrow': '💎 מחירים',
        'sales.pricing_title': 'בחרי את התוכנית המתאימה לך',
        'sales.pricing_intro': 'תשלום חד-פעמי. גישה לכל החיים. אחריות 30 יום ללא שאלות.',
        'sales.tier_starter': 'STARTER',
        'sales.tier_starter_desc': 'לטעימה — 2 ימים ראשונים',
        'sales.tier_starter_btn': 'התחל עם Starter',
        'sales.tier_starter_li1': 'ימים 1-2 מהקורס המלא',
        'sales.tier_starter_li2': '2 מבחני סיכום',
        'sales.tier_starter_li3': 'גישה ל-30 יום',
        'sales.tier_starter_li4': 'אחריות 30 יום',
        'sales.tier_pro': 'PRO',
        'sales.tier_pro_desc': 'המוצר העיקרי — הקורס המלא',
        'sales.tier_pro_btn': 'קנה Pro עכשיו',
        'sales.tier_pro_li1': 'כל 7 ימי הקורס',
        'sales.tier_pro_li2': '32 שיעורים מעשיים',
        'sales.tier_pro_li3': '7 מבחני סיכום',
        'sales.tier_pro_li4': 'תעודת סיום מקצועית',
        'sales.tier_pro_li5': 'גישה לכל החיים',
        'sales.tier_pro_li6': 'בונוס: ספריית 50 פרומפטים מנצחים',
        'sales.tier_pro_li7': 'בונוס: 5 תבניות אג׳נטים מוכנות',
        'sales.tier_proplus': 'PRO+',
        'sales.tier_proplus_desc': 'הקורס + קהילה לשנה',
        'sales.tier_proplus_btn': 'בחר Pro+',
        'sales.tier_proplus_li1': 'כל מה שב-Pro',
        'sales.tier_proplus_li2': 'קהילת WhatsApp פרטית',
        'sales.tier_proplus_li3': 'שאלות ותשובות חודשיות (זום)',
        'sales.tier_proplus_li4': 'עדכוני קורס לחיים',
        'sales.tier_proplus_li5': 'הנחה 50% על קורסים עתידיים',
        'sales.tier_business': 'BUSINESS',
        'sales.tier_business_unit': '/ 5 משתמשים',
        'sales.tier_business_desc': 'לארגונים וחברות',
        'sales.tier_business_btn': 'בקש הצעה',
        'sales.tier_business_li1': '5 רישיונות לעובדים',
        'sales.tier_business_li2': 'דשבורד מנהל עם דוחות התקדמות',
        'sales.tier_business_li3': 'אונבורדינג מותאם',
        'sales.tier_business_li4': 'חשבונית מס עם מע"מ',
        'sales.tier_business_li5': 'תמיכה ייעודית',
        'sales.tier_featured_label': '⭐ הכי פופולרי',
        'sales.pricing_guarantee': '🛡️ אחריות מלאה 30 יום · אם לא אהבת — כסף חזרה ללא שאלות',

        'sales.testimonials_eyebrow': '💬 מה אומרים הלומדים',
        'sales.testimonials_title': '1,247 לומדים. 4.9/5 דירוג ממוצע.',
        'sales.testi1_quote': 'בכמה ימים הצלחתי לעשות יותר ממה שניסיתי לבד שלושה חודשים. הקורס מסביר את הדברים בצורה כל כך פשוטה שזה כמעט מצחיק שלא חשבתי על זה לבד.',
        'sales.testi1_role': 'סמנכ"לית שיווק, חברת SaaS',
        'sales.testi2_quote': 'בניתי לעצמי אג׳נט שעוקב אחרי המיילים בבוקר ושולח לי סיכום. חוסכת לי 45 דקות ביום. כל יום. שווה את הקורס פי 100.',
        'sales.testi2_role': 'עו"ד עצמאית',
        'sales.testi3_quote': 'עברתי קורסים בעולם, גם בערך אקדמי. זה הקורס הכי מעשי שעשיתי. ביום השני כבר התחלתי להשתמש במה שלמדתי בעבודה.',
        'sales.testi3_role': 'יועץ עסקי בכיר',
        'sales.testi4_quote': 'חששתי שאני לא טכנולוגית מספיק. התברר שזה בכלל לא נושא — הקורס בנוי בדיוק לאנשים כמוני. עכשיו אני מלמדת את הצוות שלי.',
        'sales.testi4_role': 'מנהלת משאבי אנוש',
        'sales.testi5_quote': 'קניתי את Pro+ בגלל הקהילה. אבל גם הקורס עצמו מעולה. שווה כל שקל ועוד.',
        'sales.testi5_role': 'מייסד סטארט-אפ',
        'sales.testi6_quote': 'לאחר שנים שאני מנסה ללמוד AI לבד, סוף סוף יש לי מסלול ברור. תוצאות אמיתיות. אני ממליצה לכל מי שמנהלת עסק.',
        'sales.testi6_role': 'בעלת עסק',

        'sales.faq_eyebrow': '❓ שאלות נפוצות',
        'sales.faq_title': 'כל מה שאת רוצה לדעת לפני שאת קונה',
        'sales.faq_q1': 'צריך ידע טכני קודם?',
        'sales.faq_a1': 'לא. הקורס בנוי במיוחד לאנשי עסקים בלי רקע טכני. ההסברים בעברית פשוטה, עם דוגמאות מהחיים. אם את יודעת להשתמש ב-Word ולשלוח מייל — את מוכנה לקורס.',
        'sales.faq_q2': 'כמה זמן ייקח לי לסיים?',
        'sales.faq_a2': 'כ-6 שעות סך הכל לקורס המלא. את יכולה לעבור יום אחד ביום, או יותר מהיר. אין לחץ זמן. הגישה היא לכל החיים.',
        'sales.faq_q3': 'איזה כלי AI אני צריכה כדי לעבור את הקורס?',
        'sales.faq_a3': 'הקורס מתמקד ב-Claude (האפליקציה הכי מתקדמת היום). יש גם גרסה חינמית. רוב מה שתלמדי יעבוד גם ב-ChatGPT ובכלי AI אחרים — העקרונות זהים.',
        'sales.faq_q4': 'מה קורה אם לא אהבתי?',
        'sales.faq_a4': 'תוך 30 יום, מקבלת החזר מלא. בלי שאלות. בלי תנאים. שלחי מייל אחד ל-support@alphadevs.co — וזהו. הכסף חוזר תוך 3-5 ימי עסקים.',
        'sales.faq_q5': 'איך מקבלים גישה לקורס אחרי הקנייה?',
        'sales.faq_a5': 'תוך דקה מהתשלום מקבלים מייל עם קישור ושם משתמש. נכנסים, צופים בשיעור הראשון, ומתחילים. הכל אוטומטי.',
        'sales.faq_q6': 'אפשר לחלק את התשלום?',
        'sales.faq_a6': 'כן. הסליקה תומכת בעד 12 תשלומים. תוך כדי הקנייה תוכלי לבחור את מספר התשלומים.',
        'sales.faq_q7': 'האם אקבל חשבונית מס?',
        'sales.faq_a7': 'חשבונית מס/קבלה אוטומטית במייל תוך דקה מהתשלום. אם את צריכה חשבונית למפעל/חברה — תוכלי להזין מספר עוסק/ע.פ. בעת הקנייה.',
        'sales.faq_q8': 'מה ההבדל בין Pro ל-Pro+?',
        'sales.faq_a8': 'Pro = כל הקורס + תעודה + בונוסים. Pro+ = כל זה + קהילת WhatsApp פעילה + שיחות זום חודשיות + עדכוני קורס לכל החיים. אם את אדם שאוהב להיות בקהילה ולקבל ליווי — Pro+. אם את לבד אוהבת — Pro מספיק.',
        'sales.faq_q9': 'האם הקורס מתעדכן?',
        'sales.faq_a9': 'כן. עולם ה-AI משתנה כל הזמן. אנחנו מעדכנים את הקורס באופן שוטף. לקוני Pro+ — הגישה לעדכונים היא לחיים.',
        'sales.faq_q10': 'יש קורס לעובדים שלי?',
        'sales.faq_a10': 'חבילת BUSINESS — ₪1,997 ל-5 משתמשים, ₪7,500 ל-25. כוללת דשבורד מנהל, דוחות התקדמות, ואופציה לאונבורדינג מותאם. צרי קשר ונבנה לך פתרון מותאם.',

        'sales.final_title': 'מוכנה להתחיל?',
        'sales.final_desc': 'היום הראשון לוקח 40 דקות. בסוף השבוע — את במקום אחר לגמרי. אל תוותרי על זה עוד שבוע.',
        'sales.final_cta': 'קנה את הקורס עכשיו · ₪297 ←',
        'sales.final_trust': '🛡️ אחריות 30 יום ללא שאלות · 🎓 תעודת סיום · ♾️ גישה לכל החיים',
        'sales.footer': '© 2026 AlphaDevs Academy · נבנה באהבה בישראל'
    },

    /* ============ ENGLISH ============ */
    en: {
        // Common
        'common.start': 'Start',
        'common.next': 'Next',
        'common.previous': 'Previous',
        'common.close': 'Close',
        'common.save': 'Save',
        'common.continue': 'Continue',
        'common.back': 'Back',
        'common.submit': 'Submit',
        'common.completed': 'Completed',
        'common.locked': 'Locked',
        'common.minutes_short': 'min',
        'common.hours_short': 'h',

        // Navigation
        'nav.back_to_course': '← Back to course',
        'nav.reset_progress': 'Reset',
        'nav.home': 'Home',
        'nav.start_course': 'Start the course',
        'nav.view_curriculum': 'View curriculum',

        // Brand
        'brand.subtitle': 'From Zero to Hero with Claude',

        // i18n notices
        'i18n.incomplete_notice': 'This page is partially translated. Switch to Hebrew for the full experience.',
        'i18n.switch_lang': 'Language',

        // INDEX
        'index.eyebrow': '✨ Professional Course · 7 Days',
        'index.title': 'From Zero to Hero',
        'index.title_2': 'with Claude Cowork',
        'index.subtitle': 'The most comprehensive course for learning to work with Claude — from simple chat to building agents, automations, and advanced projects. Built specifically for users who want to leap forward in their daily work.',
        'index.cta_start': 'Start the course →',
        'index.cta_program': 'View course curriculum',
        'index.stat_days': 'Structured learning days',
        'index.stat_lessons': 'Hands-on lessons',
        'index.stat_quizzes': 'Comprehension quizzes',
        'index.stat_practice': 'Live practice on your computer',

        'index.what_label': 'What you\'ll gain',
        'index.what_title': 'When you finish this course, you\'ll be able to...',
        'index.what_chat': 'Talk to Claude like a colleague',
        'index.what_chat_desc': 'Write prompts that get accurate answers the first time — no wasted time.',
        'index.what_docs': 'Create professional documents',
        'index.what_docs_desc': 'Word, Excel, PDF, presentations — all at the click of a button, professionally designed.',
        'index.what_connect': 'Connect all your tools',
        'index.what_connect_desc': 'Gmail, Calendar, Drive, Monday — Claude starts working with your systems.',
        'index.what_agents': 'Build personal agents',
        'index.what_agents_desc': 'Create custom assistants that work overnight while you sleep, sending you a summary in the morning.',
        'index.what_schedule': 'Schedule recurring tasks',
        'index.what_schedule_desc': 'Daily briefs, real-time alerts, weekly reports — all automatic.',
        'index.what_memory': 'Use long-term memory',
        'index.what_memory_desc': 'Claude remembers your preferences, projects, and context — across all conversations.',

        'index.program_label': 'Course Program',
        'index.program_title': '7 days. A quiz each day. At the end — a certificate.',
        'index.program_desc': 'Each day combines short theory, live examples, hands-on practice on your computer, and a final quiz that unlocks the next day. You need 70% to pass.',

        'index.method_label': 'Our Methodology',
        'index.method_title': 'How the course is built so you actually learn',
        'index.method_1_title': 'Clear explanations — no unnecessary jargon',
        'index.method_1_desc': 'Every concept explained simply, with real-life examples. No prior technical knowledge required.',
        'index.method_2_title': 'Hands-on practice — you do, not just read',
        'index.method_2_desc': 'Every lesson includes practice you do in your own Claude. Real learning comes from doing.',
        'index.method_3_title': 'Daily comprehension quiz',
        'index.method_3_desc': 'Not decoration — a real 5-7 question quiz. Without 70% — you cannot proceed.',
        'index.method_4_title': 'Real final project',
        'index.method_4_desc': 'On day seven you build your own scheduled agent, connected to your tools — from start to finish.',

        'index.cta_final_title': 'Ready to start?',
        'index.cta_final_desc': 'The first day takes about 40 minutes. By the end of the week, you\'ll be in a completely different place.',
        'index.cta_final_btn': 'Let\'s start with Day 1 →',

        'index.cert_banner_title': 'You finished the course!',
        'index.cert_banner_desc': 'All 7 days completed, all quizzes passed. Time to claim your certificate.',
        'index.cert_banner_btn': 'View completion certificate 🏆',

        'footer.built_with_love': 'Built with love for the team. © 2026 AlphaDevs · All rights reserved.',

        // DAY CARD
        'day_card.day': 'Day',
        'day_card.start': 'Start',
        'day_card.completed_view': 'Completed — review',
        'day_card.locked': 'Locked',
        'day_card.locked_msg': 'Complete the previous day to unlock',
        'day_card.lessons': 'lessons',

        // DAYS — titles & descriptions
        'day1.title': 'Chat Foundations with Cowork',
        'day1.desc': 'How to talk to Claude, what it can do, and how to write prompts that work.',
        'day2.title': 'Files, Documents, and the Digital World',
        'day2.desc': 'Creating and editing Word, Excel, PDF, and presentations. Managing your workspace folder.',
        'day3.title': 'Skills — Built-in Experts',
        'day3.desc': 'What is a Skill, how to invoke one, and how it makes you a master.',
        'day4.title': 'Plugins and External Connections',
        'day4.desc': 'Connecting Gmail, Calendar, Drive, Monday — turning Claude into a real teammate.',
        'day5.title': 'Memory, Projects, and Artifacts',
        'day5.desc': 'How to work over time: persistent memory, projects, and live dashboards.',
        'day6.title': 'Agents — Build Custom Personal Assistants',
        'day6.desc': 'What is an agent, how it differs from a skill, and how to build one that works for you.',
        'day7.title': 'Automation, Scheduling, and Pro Tricks',
        'day7.desc': 'Scheduled tasks, advanced connections, and 10 tricks that turn you into a pro.',

        // DAY 1 — Lesson Page
        'day1.lesson_eyebrow': 'Day 1 · 40 minutes · Level: Beginner',
        'day1.lesson_title': 'Chat Foundations with Cowork',
        'day1.lesson_subtitle': 'Today we start from the beginning. We\'ll understand what Cowork is, how to talk to Claude properly, and what makes one prompt successful and another a failure.',
        'day1.day_of_total': 'Day 1 of 7',

        'day1.toc_intro': 'Welcome to Cowork',
        'day1.toc_first_chat': 'Your First Chat',
        'day1.toc_prompt_anatomy': 'Anatomy of a Good Prompt',
        'day1.toc_when_claude': 'When to Turn to Claude',
        'day1.toc_quiz': 'Day 1 Quiz',

        'common.warmup': 'Warmup',
        'common.lessons': 'Lessons',
        'common.exercise': 'Exercise',
        'common.case_study': 'Case Study',
        'common.workbook': 'Workbook',
        'common.bonus': 'Bonus',
        'common.total': 'Total',

        'video.intro': 'Intro Video',
        'video.coming_soon': 'Video recording coming soon.',
        'video.read_meanwhile': 'Meanwhile — read the written content below.',

        // Quiz UI
        'quiz.badge': 'Quiz',
        'quiz.title': 'Comprehension Quiz',
        'quiz.desc': 'You need at least 70% to pass to the next day. You can try again.',
        'quiz.submit': 'Check yourself →',
        'quiz.passed_title': 'Well done! You passed the quiz 🎉',
        'quiz.failed_title': 'Almost there!',
        'quiz.try_again': 'Try again 🔄',
        'quiz.back_to_content': 'Back to content',
        'quiz.continue_to': 'Continue to Day',
        'quiz.get_certificate': 'Get completion certificate 🎓',
        'quiz.back_home': 'Back to home',
        'quiz.explanation': 'Explanation',

        // License modal
        'license.title': 'Course Access',
        'license.lead': 'This course is private property of buyers. Please enter the credentials you received by email after purchase.',
        'license.name_label': 'Full Name',
        'license.name_placeholder': 'The name you registered with',
        'license.email_label': 'Email',
        'license.key_label': 'License Key',
        'license.submit': 'Enter Course →',
        'license.help': 'Forgot your key?',
        'license.error_invalid': 'Invalid credentials. Check the key (format: AD-XXXXXX) and email.',

        // Lesson sidebar
        'lesson.toc_label': "Today's Content",
        'lesson.day_of_total': 'Day {n} of 7',

        // Coming Soon
        'coming_soon.title': 'This page is being translated',
        'coming_soon.lead': "We're working on translating this lesson. In the meantime, you can read it in Hebrew, or go back to the translated content.",
        'coming_soon.read_he': 'Read in Hebrew',
        'coming_soon.go_back': 'Back to course',

        // ==================
        // SALES LANDING PAGE
        // ==================
        'sales.nav_buy': 'Buy now',
        'sales.brand_subtitle': 'AI Academy',

        'sales.hero_eyebrow': '🚀 The professional AI course · 1,247 active students',
        'sales.hero_title': "In 7 days, stop wasting hours on tasks AI already handles better than you",
        'sales.hero_sub': "The only professional AI course built for working professionals — from your first prompt to building agents that work for you 24/7. No technical background, real hands-on practice, and results you'll see on day one.",
        'sales.hero_cta_buy': 'Start now · ₪297 →',
        'sales.hero_cta_curriculum': 'See the curriculum',
        'sales.hero_trust_refund': '✅ 30-day refund',
        'sales.hero_trust_cert': '🎓 Certificate',
        'sales.hero_trust_lifetime': '♾️ Lifetime access',
        'sales.hero_trust_hebrew': '🇮🇱 Hebrew &amp; English',

        'sales.stat_students': 'Active students',
        'sales.stat_rating': 'Average rating',
        'sales.stat_days': 'Days to complete',
        'sales.stat_lessons': 'Hands-on lessons',

        'sales.pain_eyebrow': '😩 Sound familiar?',
        'sales.pain_title': "You know you're falling behind — but don't know where to start",
        'sales.pain_intro': "Every day there's a new article about AI. Every competitor uses it. You ask yourself — how do I get into this without spending weeks reading and trying?",
        'sales.pain_1_title': "I don't have time to learn from scratch",
        'sales.pain_1_desc': '40-hour courses, academic articles, scattered YouTube videos — everything is messy and leads nowhere.',
        'sales.pain_2_title': "I can't tell what's actually relevant",
        'sales.pain_2_desc': '"Learn Python", "Understand LLMs" — but I just want to work better, not become a programmer.',
        'sales.pain_3_title': "My prompts don't work",
        'sales.pain_3_desc': "I ask AI to write an email — get something generic. Ask for analysis — get a long list. There's no middle ground.",
        'sales.pain_4_title': "I'm not seeing real results",
        'sales.pain_4_desc': "I've read 50 posts. Watched demos. But in my actual work — I'm still doing everything manually.",
        'sales.pain_5_title': "I'm missing the wave",
        'sales.pain_5_desc': "My competitors already use it. My team asks questions I can't answer. I feel like I'm being left behind.",
        'sales.pain_6_title': "Most content is too basic or too academic",
        'sales.pain_6_desc': "I want something professional, actionable, built for real working professionals — not theory and not influencer fluff.",

        'sales.solution_eyebrow': '✨ The Solution',
        'sales.solution_title': '7 days. Clear structure. Measurable results.',
        'sales.solution_intro': 'No more "learn everything." No more "read 100 articles." A precise path, day by day, with hands-on practice in your own AI — and a real result at the end.',
        'sales.solution_step1_title': 'Learn',
        'sales.solution_step1_desc': 'Short, clear video. Every lesson under 15 minutes.',
        'sales.solution_step2_title': 'Practice',
        'sales.solution_step2_desc': 'Ready-to-paste prompt for your AI. See real results.',
        'sales.solution_step3_title': 'Test',
        'sales.solution_step3_desc': 'End-of-day quiz. Pass it? Move to the next day.',

        'sales.curriculum_eyebrow': '📚 Course Content',
        'sales.curriculum_title': '7 days. Each one teaches a new capability.',
        'sales.curriculum_intro': 'Each day combines 4-5 hands-on lessons, live practice, and a final quiz. 70% required to pass.',

        'sales.pricing_eyebrow': '💎 Pricing',
        'sales.pricing_title': 'Choose the plan that fits',
        'sales.pricing_intro': 'One-time payment. Lifetime access. 30-day refund, no questions asked.',
        'sales.tier_starter': 'STARTER',
        'sales.tier_starter_desc': 'Try it — first 2 days',
        'sales.tier_starter_btn': 'Start with Starter',
        'sales.tier_starter_li1': 'Days 1-2 of the full course',
        'sales.tier_starter_li2': '2 quizzes',
        'sales.tier_starter_li3': '30-day access',
        'sales.tier_starter_li4': '30-day refund',
        'sales.tier_pro': 'PRO',
        'sales.tier_pro_desc': 'The main product — full course',
        'sales.tier_pro_btn': 'Buy Pro now',
        'sales.tier_pro_li1': 'All 7 course days',
        'sales.tier_pro_li2': '32 hands-on lessons',
        'sales.tier_pro_li3': '7 quizzes',
        'sales.tier_pro_li4': 'Professional certificate',
        'sales.tier_pro_li5': 'Lifetime access',
        'sales.tier_pro_li6': 'Bonus: 50 winning prompts library',
        'sales.tier_pro_li7': 'Bonus: 5 ready-to-use agent templates',
        'sales.tier_proplus': 'PRO+',
        'sales.tier_proplus_desc': 'Course + community for a year',
        'sales.tier_proplus_btn': 'Choose Pro+',
        'sales.tier_proplus_li1': 'Everything in Pro',
        'sales.tier_proplus_li2': 'Private WhatsApp community',
        'sales.tier_proplus_li3': 'Monthly Q&amp;A on Zoom',
        'sales.tier_proplus_li4': 'Lifetime course updates',
        'sales.tier_proplus_li5': '50% off future courses',
        'sales.tier_business': 'BUSINESS',
        'sales.tier_business_unit': '/ 5 users',
        'sales.tier_business_desc': 'For teams &amp; companies',
        'sales.tier_business_btn': 'Request a quote',
        'sales.tier_business_li1': '5 employee licenses',
        'sales.tier_business_li2': 'Manager dashboard with progress reports',
        'sales.tier_business_li3': 'Custom onboarding',
        'sales.tier_business_li4': 'VAT-compliant invoice',
        'sales.tier_business_li5': 'Dedicated support',
        'sales.tier_featured_label': '⭐ Most popular',
        'sales.pricing_guarantee': '🛡️ Full 30-day refund · Not happy — money back, no questions',

        'sales.testimonials_eyebrow': '💬 What students say',
        'sales.testimonials_title': '1,247 students. 4.9/5 average rating.',
        'sales.testi1_quote': "In a few days I accomplished more than I tried for three months alone. The course explains things so simply it's almost funny I didn't think of it myself.",
        'sales.testi1_role': 'VP Marketing, SaaS company',
        'sales.testi2_quote': 'I built myself an agent that scans my emails in the morning and sends me a summary. Saves me 45 minutes a day. Every day. Worth the course price 100x.',
        'sales.testi2_role': 'Independent attorney',
        'sales.testi3_quote': "I've taken courses around the world, even academic ones. This is the most practical course I've taken. By day two I was already using what I learned at work.",
        'sales.testi3_role': 'Senior business consultant',
        'sales.testi4_quote': "I worried I wasn't tech-savvy enough. Turned out it's not even an issue — the course is built for people exactly like me. Now I'm teaching my team.",
        'sales.testi4_role': 'HR Director',
        'sales.testi5_quote': 'I bought Pro+ for the community. But the course itself is excellent. Worth every shekel.',
        'sales.testi5_role': 'Startup founder',
        'sales.testi6_quote': "After years of trying to learn AI alone, I finally have a clear path. Real results. I recommend it to anyone running a business.",
        'sales.testi6_role': 'Business owner',

        'sales.faq_eyebrow': '❓ Frequently Asked',
        'sales.faq_title': 'Everything you want to know before buying',
        'sales.faq_q1': 'Do I need technical background?',
        'sales.faq_a1': "No. The course is built specifically for working professionals without a tech background. Explanations are plain-English with real-life examples. If you can use Word and send email — you're ready.",
        'sales.faq_q2': 'How long will it take me?',
        'sales.faq_a2': 'About 6 hours total for the full course. You can do one day per day, or go faster. No time pressure. Lifetime access.',
        'sales.faq_q3': 'Which AI tool do I need for the course?',
        'sales.faq_a3': "The course focuses on Claude (the most advanced today). There's a free tier. Most of what you learn also works with ChatGPT and other AI tools — the principles are the same.",
        'sales.faq_q4': "What if I don't like it?",
        'sales.faq_a4': 'Within 30 days, you get a full refund. No questions. No conditions. Send one email to support@alphadevs.co — done. Money back in 3-5 business days.',
        'sales.faq_q5': 'How do I get access after buying?',
        'sales.faq_a5': "Within a minute of payment you get an email with a link and username. You log in, watch the first lesson, and start. It's all automatic.",
        'sales.faq_q6': 'Can I split the payment?',
        'sales.faq_a6': "Yes. Checkout supports up to 12 installments. You'll see the option during purchase.",
        'sales.faq_q7': 'Will I get a tax invoice?',
        'sales.faq_a7': 'Tax invoice/receipt automatically by email within a minute of payment. If you need a business invoice — you can enter your business ID at checkout.',
        'sales.faq_q8': "What's the difference between Pro and Pro+?",
        'sales.faq_a8': "Pro = full course + certificate + bonuses. Pro+ = all that + active WhatsApp community + monthly Zoom calls + lifetime course updates. If you like community and ongoing support — Pro+. If you prefer working alone — Pro is enough.",
        'sales.faq_q9': 'Does the course get updated?',
        'sales.faq_a9': "Yes. The AI world changes constantly. We update the course regularly. Pro+ buyers get lifetime access to all updates.",
        'sales.faq_q10': 'Is there a course for my team?',
        'sales.faq_a10': "BUSINESS plan — ₪1,997 for 5 users, ₪7,500 for 25. Includes manager dashboard, progress reports, and custom onboarding option. Get in touch and we'll build a solution for you.",

        'sales.final_title': 'Ready to start?',
        'sales.final_desc': "Day one takes 40 minutes. By the end of the week — you're in a completely different place. Don't put this off another week.",
        'sales.final_cta': 'Buy the course now · ₪297 →',
        'sales.final_trust': '🛡️ 30-day refund · 🎓 Certificate · ♾️ Lifetime access',
        'sales.footer': '© 2026 AlphaDevs Academy · Built with love in Israel'
    }
};
