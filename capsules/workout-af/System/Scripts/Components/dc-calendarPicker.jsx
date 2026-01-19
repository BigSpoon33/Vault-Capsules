// ═══════════════════════════════════════════════════════════════════════════════
// DC-CALENDAR-PICKER - Theme-aware Mini Calendar Component
// A compact calendar popup for selecting dates in the daily wrapper
// 
// Features:
//   - Month/year navigation
//   - Days with notes get dot indicator
//   - Days without notes are greyed out (but still selectable)
//   - Today highlighted
//   - Selected date highlighted
//   - "Today" quick button
//   - Full theme integration
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTS
// ─────────────────────────────────────────────────────────────────────────────

const { useTheme } = await dc.require(
    dc.fileLink("System/Scripts/Core/dc-themeProvider.jsx")
);

const { GloButton, useComponentCSS, hexToRgba } = await dc.require(
    dc.fileLink("System/Scripts/Components/dc-gloButton.jsx")
);

const {
    isValidDateStr,
    getTodayDateStr,
    parseDateStr,
    getCalendarGrid,
    getDatesWithNotes,
    isToday,
} = await dc.require(
    dc.fileLink("System/Scripts/Core/dc-dateContext.jsx")
);

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const MONTH_NAMES_SHORT = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT: CalendarPicker
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * CalendarPicker - A mini calendar popup for date selection
 * 
 * @param {Object} props
 * @param {string} props.selectedDate - Currently selected date (YYYY-MM-DD)
 * @param {function} props.onSelectDate - Callback when date is selected: (dateStr) => void
 * @param {function} [props.onClose] - Callback when calendar should close
 * @param {boolean} [props.showCloseButton=true] - Whether to show close button
 * @param {boolean} [props.inline=false] - If true, renders inline instead of popup style
 */
function CalendarPicker({
    selectedDate,
    onSelectDate,
    onClose,
    showCloseButton = true,
    inline = false,
}) {
    // Theme
    const { theme, isLoading } = useTheme();
    useComponentCSS();
    
    // Parse selected date to get initial month/year
    const parsed = parseDateStr(selectedDate) || parseDateStr(getTodayDateStr());
    const [viewYear, setViewYear] = dc.useState(parsed?.year || new Date().getFullYear());
    const [viewMonth, setViewMonth] = dc.useState(parsed?.month || new Date().getMonth() + 1);
    
    // Cache dates with notes for current view
    const [datesWithNotes, setDatesWithNotes] = dc.useState(new Set());
    
    // Load dates with notes when month changes
    dc.useEffect(() => {
        const notes = getDatesWithNotes(viewYear, viewMonth);
        setDatesWithNotes(notes);
    }, [viewYear, viewMonth]);
    
    // Theme colors
    const primary = theme?.["color-primary"] || "#7c3aed";
    const accent = theme?.["color-accent"] || "#f59e0b";
    const surface = theme?.["color-surface"] || "#2a2a3e";
    const surfaceAlt = theme?.["color-background"] || "#1e1e2e";
    const text = theme?.["color-text"] || "#ffffff";
    const textMuted = theme?.["color-text-muted"] || "#a0a0b0";
    const success = theme?.["color-success"] || "#10b981";
    
    // Get today's date string
    const todayStr = getTodayDateStr();
    
    // ─────────────────────────────────────────────────────────────────────────
    // NAVIGATION HANDLERS
    // ─────────────────────────────────────────────────────────────────────────
    
    const goToPrevMonth = () => {
        if (viewMonth === 1) {
            setViewMonth(12);
            setViewYear(viewYear - 1);
        } else {
            setViewMonth(viewMonth - 1);
        }
    };
    
    const goToNextMonth = () => {
        if (viewMonth === 12) {
            setViewMonth(1);
            setViewYear(viewYear + 1);
        } else {
            setViewMonth(viewMonth + 1);
        }
    };
    
    const goToToday = () => {
        const today = parseDateStr(todayStr);
        if (today) {
            setViewYear(today.year);
            setViewMonth(today.month);
            onSelectDate(todayStr);
        }
    };
    
    const handleDateClick = (dateStr) => {
        onSelectDate(dateStr);
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    
    if (isLoading) {
        return (
            <div style={{ padding: 20, textAlign: "center", color: textMuted }}>
                Loading...
            </div>
        );
    }
    
    const grid = getCalendarGrid(viewYear, viewMonth);
    
    // Container styles
    const containerStyle = {
        background: surface,
        border: `1px solid ${primary}33`,
        borderRadius: 12,
        padding: 12,
        minWidth: 280,
        boxShadow: inline ? "none" : `0 8px 32px ${hexToRgba(primary, 0.2)}`,
        color: text,
        fontFamily: "var(--font-interface)",
    };
    
    return (
        <div style={containerStyle}>
            {/* Header: Month/Year Navigation */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
                paddingBottom: 8,
                borderBottom: `1px solid ${textMuted}22`,
            }}>
                <button
                    onClick={goToPrevMonth}
                    style={{
                        background: "transparent",
                        border: "none",
                        color: textMuted,
                        fontSize: 18,
                        cursor: "pointer",
                        padding: "4px 8px",
                        borderRadius: 4,
                        transition: "color 0.2s ease",
                    }}
                    onMouseEnter={(e) => e.target.style.color = primary}
                    onMouseLeave={(e) => e.target.style.color = textMuted}
                >
                    ‹
                </button>
                
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                }}>
                    <span style={{
                        fontWeight: 600,
                        fontSize: 14,
                        color: text,
                    }}>
                        {MONTH_NAMES[viewMonth - 1]} {viewYear}
                    </span>
                </div>
                
                <button
                    onClick={goToNextMonth}
                    style={{
                        background: "transparent",
                        border: "none",
                        color: textMuted,
                        fontSize: 18,
                        cursor: "pointer",
                        padding: "4px 8px",
                        borderRadius: 4,
                        transition: "color 0.2s ease",
                    }}
                    onMouseEnter={(e) => e.target.style.color = primary}
                    onMouseLeave={(e) => e.target.style.color = textMuted}
                >
                    ›
                </button>
            </div>
            
            {/* Day Headers */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 2,
                marginBottom: 4,
            }}>
                {DAY_NAMES_SHORT.map((day, i) => (
                    <div
                        key={i}
                        style={{
                            textAlign: "center",
                            fontSize: 10,
                            fontWeight: 600,
                            color: textMuted,
                            padding: "4px 0",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                        }}
                    >
                        {day}
                    </div>
                ))}
            </div>
            
            {/* Calendar Grid */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 2,
            }}>
                {grid.flat().map((cell, i) => {
                    const { day, dateStr, isCurrentMonth } = cell;
                    const hasNote = datesWithNotes.has(dateStr);
                    const isTodayCell = dateStr === todayStr;
                    const isSelected = dateStr === selectedDate;
                    
                    // Determine cell styling
                    let bgColor = "transparent";
                    let textColor = isCurrentMonth ? text : `${textMuted}66`;
                    let borderColor = "transparent";
                    let fontWeight = "normal";
                    
                    if (isSelected) {
                        bgColor = primary;
                        textColor = "#ffffff";
                        fontWeight = "600";
                    } else if (isTodayCell) {
                        borderColor = accent;
                        fontWeight = "600";
                        textColor = accent;
                    }
                    
                    // Grey out days without notes (but not selected/today)
                    if (!hasNote && !isSelected && !isTodayCell && isCurrentMonth) {
                        textColor = `${textMuted}88`;
                    }
                    
                    return (
                        <button
                            key={i}
                            onClick={() => handleDateClick(dateStr)}
                            style={{
                                position: "relative",
                                width: 36,
                                height: 36,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: bgColor,
                                border: `2px solid ${borderColor}`,
                                borderRadius: 8,
                                color: textColor,
                                fontSize: 13,
                                fontWeight,
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                                if (!isSelected) {
                                    e.target.style.background = hexToRgba(primary, 0.2);
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isSelected) {
                                    e.target.style.background = bgColor;
                                }
                            }}
                        >
                            {day}
                            
                            {/* Note indicator dot */}
                            {hasNote && !isSelected && (
                                <div style={{
                                    position: "absolute",
                                    bottom: 3,
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    width: 4,
                                    height: 4,
                                    borderRadius: "50%",
                                    background: isTodayCell ? accent : success,
                                }} />
                            )}
                        </button>
                    );
                })}
            </div>
            
            {/* Footer: Today Button & Close */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 12,
                paddingTop: 8,
                borderTop: `1px solid ${textMuted}22`,
            }}>
                <GloButton
                    label="Today"
                    size="small"
                    variant="ghost"
                    onClick={goToToday}
                    style={{ padding: "4px 12px" }}
                />
                
                {showCloseButton && onClose && (
                    <GloButton
                        label="Close"
                        size="small"
                        variant="ghost"
                        onClick={onClose}
                        style={{ padding: "4px 12px" }}
                    />
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR POPUP WRAPPER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * CalendarPopup - Wraps CalendarPicker with popup behavior
 * Shows/hides based on isOpen prop, with click-outside handling
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether popup is visible
 * @param {string} props.selectedDate - Currently selected date
 * @param {function} props.onSelectDate - Callback when date selected
 * @param {function} props.onClose - Callback to close popup
 * @param {Object} [props.style] - Additional positioning styles
 */
function CalendarPopup({
    isOpen,
    selectedDate,
    onSelectDate,
    onClose,
    style = {},
}) {
    const popupRef = dc.useRef(null);
    
    // Handle click outside to close
    dc.useEffect(() => {
        if (!isOpen) return;
        
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                onClose();
            }
        };
        
        // Delay adding listener to avoid immediate close
        const timeoutId = setTimeout(() => {
            document.addEventListener("mousedown", handleClickOutside);
        }, 100);
        
        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose]);
    
    if (!isOpen) return null;
    
    return (
        <div
            ref={popupRef}
            style={{
                position: "absolute",
                zIndex: 1000,
                ...style,
            }}
        >
            <CalendarPicker
                selectedDate={selectedDate}
                onSelectDate={(date) => {
                    onSelectDate(date);
                    onClose();
                }}
                onClose={onClose}
                showCloseButton={true}
            />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

return {
    CalendarPicker,
    CalendarPopup,
    MONTH_NAMES,
    MONTH_NAMES_SHORT,
    DAY_NAMES,
    DAY_NAMES_SHORT,
};
