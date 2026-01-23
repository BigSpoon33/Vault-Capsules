// ═══════════════════════════════════════════════════════════════════════════════
// DC-DATE-CONTEXT - Date Utilities for Daily Note System
// Provides helpers for reading/writing frontmatter and content across dates
// 
// Features:
//   - Get file/frontmatter for any date
//   - Save frontmatter updates to any date's note
//   - Read/write journal sections from markdown
//   - Date formatting and validation
//   - Check if daily note exists for a date
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const DATE_FORMAT = "YYYY-MM-DD";
const JOURNAL_HEADING = "## 📝 Journal Entry";

// ─────────────────────────────────────────────────────────────────────────────
// DATE VALIDATION & PARSING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if a string is a valid YYYY-MM-DD date
 * @param {string} dateStr - Date string to validate
 * @returns {boolean}
 */
function isValidDateStr(dateStr) {
    if (!dateStr || typeof dateStr !== "string") return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    
    // Also verify it's a real date
    const date = new Date(dateStr + "T00:00:00");
    return !isNaN(date.getTime());
}

/**
 * Get today's date as YYYY-MM-DD string
 * @returns {string}
 */
function getTodayDateStr() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/**
 * Get yesterday's date as YYYY-MM-DD string
 * @returns {string}
 */
function getYesterdayDateStr() {
    const now = new Date();
    now.setDate(now.getDate() - 1);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/**
 * Get date string offset by N days from a given date
 * @param {string} dateStr - Base date (YYYY-MM-DD)
 * @param {number} offsetDays - Number of days to offset (negative for past)
 * @returns {string}
 */
function getOffsetDateStr(dateStr, offsetDays) {
    const date = new Date(dateStr + "T00:00:00");
    date.setDate(date.getDate() + offsetDays);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/**
 * Parse a date string into components
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {{ year: number, month: number, day: number, date: Date } | null}
 */
function parseDateStr(dateStr) {
    if (!isValidDateStr(dateStr)) return null;
    const [year, month, day] = dateStr.split("-").map(Number);
    return {
        year,
        month,
        day,
        date: new Date(dateStr + "T00:00:00"),
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// DATE FORMATTING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format date for display: "December 27th, 2025 (Saturday)"
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {string}
 */
function formatDateDisplay(dateStr) {
    const parsed = parseDateStr(dateStr);
    if (!parsed) return dateStr;
    
    const { date, day } = parsed;
    
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    // Get ordinal suffix
    const getOrdinal = (n) => {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    
    const monthName = monthNames[date.getMonth()];
    const dayName = dayNames[date.getDay()];
    const year = date.getFullYear();
    
    return `${monthName} ${getOrdinal(day)}, ${year} (${dayName})`;
}

/**
 * Format date for short display: "Dec 27"
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {string}
 */
function formatDateShort(dateStr) {
    const parsed = parseDateStr(dateStr);
    if (!parsed) return dateStr;
    
    const { date, day } = parsed;
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    return `${monthNames[date.getMonth()]} ${day}`;
}

/**
 * Get relative date label: "Today", "Yesterday", "2 days ago", "Dec 25", etc.
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {string}
 */
function getRelativeDateLabel(dateStr) {
    const today = getTodayDateStr();
    const yesterday = getYesterdayDateStr();
    const tomorrow = getOffsetDateStr(today, 1);
    
    if (dateStr === today) return "Today";
    if (dateStr === yesterday) return "Yesterday";
    if (dateStr === tomorrow) return "Tomorrow";
    
    // Calculate days difference
    const targetDate = new Date(dateStr + "T00:00:00");
    const todayDate = new Date(today + "T00:00:00");
    const diffMs = todayDate.getTime() - targetDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0 && diffDays <= 7) {
        return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    } else if (diffDays < 0 && diffDays >= -7) {
        return `In ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? "s" : ""}`;
    }
    
    // For dates more than a week away, show the date
    return formatDateShort(dateStr);
}

/**
 * Check if a date is today
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {boolean}
 */
function isToday(dateStr) {
    return dateStr === getTodayDateStr();
}

/**
 * Check if a date is in the past
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {boolean}
 */
function isPastDate(dateStr) {
    return dateStr < getTodayDateStr();
}

/**
 * Check if a date is in the future
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {boolean}
 */
function isFutureDate(dateStr) {
    return dateStr > getTodayDateStr();
}

// ─────────────────────────────────────────────────────────────────────────────
// FILE ACCESS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the TFile for a given date string
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {TFile | null}
 */
function getFileForDate(dateStr) {
    if (!isValidDateStr(dateStr)) return null;
    return app.metadataCache.getFirstLinkpathDest(dateStr, "") || null;
}

/**
 * Check if a daily note exists for a given date
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {boolean}
 */
function dateNoteExists(dateStr) {
    return getFileForDate(dateStr) !== null;
}

/**
 * Get frontmatter for a given date's note
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {object} - Frontmatter object (empty if note doesn't exist)
 */
function getFrontmatterForDate(dateStr) {
    const file = getFileForDate(dateStr);
    if (!file) return {};
    
    const cache = app.metadataCache.getFileCache(file);
    return cache?.frontmatter || {};
}

/**
 * Save frontmatter updates to a date's note
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @param {object} updates - Key-value pairs to update
 * @returns {Promise<boolean>} - Success status
 */
async function saveFrontmatterForDate(dateStr, updates) {
    const file = getFileForDate(dateStr);
    if (!file) {
        console.warn(`[dc-dateContext] Cannot save frontmatter: no note for ${dateStr}`);
        return false;
    }
    
    try {
        await app.fileManager.processFrontMatter(file, (fm) => {
            Object.assign(fm, updates);
        });
        return true;
    } catch (error) {
        console.error(`[dc-dateContext] Failed to save frontmatter for ${dateStr}:`, error);
        return false;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// JOURNAL SECTION ACCESS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get journal section content from a date's note
 * Reads content between "## 📝 Journal Entry" and the next heading or end
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {Promise<string>} - Journal content (empty if not found)
 */
async function getJournalSection(dateStr) {
    const file = getFileForDate(dateStr);
    if (!file) return "";
    
    try {
        const content = await app.vault.read(file);
        
        // Find the journal heading
        const headingIndex = content.indexOf(JOURNAL_HEADING);
        if (headingIndex === -1) return "";
        
        // Get content after the heading
        const afterHeading = content.slice(headingIndex + JOURNAL_HEADING.length);
        
        // Find the next heading (## or ---) or end of file
        const nextHeadingMatch = afterHeading.match(/\n(## |---\s*$)/);
        const journalContent = nextHeadingMatch
            ? afterHeading.slice(0, nextHeadingMatch.index)
            : afterHeading;
        
        return journalContent.trim();
    } catch (error) {
        console.error(`[dc-dateContext] Failed to read journal for ${dateStr}:`, error);
        return "";
    }
}

/**
 * Save journal section content to a date's note
 * Replaces content between "## 📝 Journal Entry" and the next heading
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @param {string} newContent - New journal content
 * @returns {Promise<boolean>} - Success status
 */
async function saveJournalSection(dateStr, newContent) {
    const file = getFileForDate(dateStr);
    if (!file) {
        console.warn(`[dc-dateContext] Cannot save journal: no note for ${dateStr}`);
        return false;
    }
    
    try {
        const content = await app.vault.read(file);
        
        // Find the journal heading
        const headingIndex = content.indexOf(JOURNAL_HEADING);
        if (headingIndex === -1) {
            console.warn(`[dc-dateContext] No journal heading found in ${dateStr}`);
            return false;
        }
        
        // Get content after the heading
        const beforeHeading = content.slice(0, headingIndex + JOURNAL_HEADING.length);
        const afterHeading = content.slice(headingIndex + JOURNAL_HEADING.length);
        
        // Find the next heading (## or ---) or end of file
        const nextHeadingMatch = afterHeading.match(/\n(## |---\s*$)/);
        const afterJournal = nextHeadingMatch
            ? afterHeading.slice(nextHeadingMatch.index)
            : "";
        
        // Rebuild the content
        const updatedContent = beforeHeading + "\n\n" + newContent.trim() + "\n" + afterJournal;
        
        await app.vault.modify(file, updatedContent);
        return true;
    } catch (error) {
        console.error(`[dc-dateContext] Failed to save journal for ${dateStr}:`, error);
        return false;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CALENDAR HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all dates in a month that have daily notes
 * @param {number} year - Year (e.g., 2025)
 * @param {number} month - Month (1-12)
 * @returns {Set<string>} - Set of date strings that have notes
 */
function getDatesWithNotes(year, month) {
    const datesWithNotes = new Set();
    
    // Get all daily notes (files matching YYYY-MM-DD pattern)
    const files = app.vault.getMarkdownFiles();
    const monthStr = String(month).padStart(2, "0");
    const prefix = `${year}-${monthStr}-`;
    
    for (const file of files) {
        if (file.basename.startsWith(prefix) && isValidDateStr(file.basename)) {
            datesWithNotes.add(file.basename);
        }
    }
    
    return datesWithNotes;
}

/**
 * Get calendar grid for a month
 * @param {number} year - Year (e.g., 2025)
 * @param {number} month - Month (1-12)
 * @returns {Array<Array<{ day: number, dateStr: string, isCurrentMonth: boolean }>>}
 */
function getCalendarGrid(year, month) {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    const grid = [];
    let currentWeek = [];
    
    // Fill in days from previous month
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
    
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dateStr = `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        currentWeek.push({ day, dateStr, isCurrentMonth: false });
    }
    
    // Fill in days of current month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        currentWeek.push({ day, dateStr, isCurrentMonth: true });
        
        if (currentWeek.length === 7) {
            grid.push(currentWeek);
            currentWeek = [];
        }
    }
    
    // Fill in days from next month
    if (currentWeek.length > 0) {
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        let day = 1;
        
        while (currentWeek.length < 7) {
            const dateStr = `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            currentWeek.push({ day, dateStr, isCurrentMonth: false });
            day++;
        }
        grid.push(currentWeek);
    }
    
    return grid;
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVE FILE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the date string from the currently active file (if it's a daily note)
 * @returns {string | null} - Date string or null if not a daily note
 */
function getActiveDateStr() {
    const activeFile = app.workspace.getActiveFile();
    if (!activeFile) return null;
    
    const basename = activeFile.basename;
    if (isValidDateStr(basename)) {
        return basename;
    }
    return null;
}

/**
 * Get date string to use for widgets - either from prop or active file
 * @param {string | undefined} targetDate - Optional target date prop
 * @returns {string} - Date string to use (defaults to today if nothing found)
 */
function resolveDateStr(targetDate) {
    if (targetDate && isValidDateStr(targetDate)) {
        return targetDate;
    }
    
    const activeDate = getActiveDateStr();
    if (activeDate) {
        return activeDate;
    }
    
    return getTodayDateStr();
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

return {
    // Constants
    DATE_FORMAT,
    JOURNAL_HEADING,
    
    // Date validation & parsing
    isValidDateStr,
    getTodayDateStr,
    getYesterdayDateStr,
    getOffsetDateStr,
    parseDateStr,
    
    // Date formatting
    formatDateDisplay,
    formatDateShort,
    getRelativeDateLabel,
    isToday,
    isPastDate,
    isFutureDate,
    
    // File access
    getFileForDate,
    dateNoteExists,
    getFrontmatterForDate,
    saveFrontmatterForDate,
    
    // Journal section
    getJournalSection,
    saveJournalSection,
    
    // Calendar helpers
    getDatesWithNotes,
    getCalendarGrid,
    
    // Active file helpers
    getActiveDateStr,
    resolveDateStr,
};
