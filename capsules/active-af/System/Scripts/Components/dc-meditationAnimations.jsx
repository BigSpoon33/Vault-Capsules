// ═══════════════════════════════════════════════════════════════════════════════
// MEDITATION ANIMATIONS
// Collection of soothing animations for the meditation timer widget
// 
// Animations:
//   - BreathingCircle (core - always present)
//   - Bubbles
//   - CandleFlame
//   - WaterRipples
//   - Particles
//   - LotusFlower
//   - EnergyOrb
//   - Mandala
//   - SacredGeometry
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Get color from palette based on index/time
// ─────────────────────────────────────────────────────────────────────────────

const getColor = (colors, index, time = 0) => {
    if (!colors || colors.length === 0) return "#7c3aed";
    if (colors.length === 1) return colors[0];
    return colors[Math.floor((index + time) % colors.length)];
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Linear interpolation
// ─────────────────────────────────────────────────────────────────────────────

const lerp = (a, b, t) => a + (b - a) * t;

// ═══════════════════════════════════════════════════════════════════════════════
// BREATHING CIRCLE (Core Animation - Outer Ring)
// ═══════════════════════════════════════════════════════════════════════════════

function BreathingCircle({ 
    breathPhase,       // "in" | "hold-in" | "out" | "hold-out"
    breathProgress,    // 0-1 progress through current phase
    colors,
    size = 200,
    isRunning = false,
}) {
    // Calculate scale based on breath phase
    let scale = 1;
    if (breathPhase === "in") {
        scale = lerp(1, 1.3, breathProgress);
    } else if (breathPhase === "hold-in") {
        scale = 1.3;
    } else if (breathPhase === "out") {
        scale = lerp(1.3, 1, breathProgress);
    } else {
        scale = 1;
    }
    
    const primaryColor = colors?.[0] || "#7c3aed";
    const secondaryColor = colors?.[1] || colors?.[0] || "#f59e0b";
    
    // Glow intensity based on breath
    const glowIntensity = breathPhase === "in" || breathPhase === "hold-in" ? 0.6 : 0.3;
    
    return (
        <div style={{
            width: size,
            height: size,
            borderRadius: "50%",
            background: `radial-gradient(circle, transparent 60%, ${primaryColor}11 100%)`,
            border: `3px solid ${primaryColor}`,
            boxShadow: isRunning 
                ? `0 0 ${30 * glowIntensity}px ${primaryColor}, 
                   0 0 ${60 * glowIntensity}px ${primaryColor}44,
                   inset 0 0 ${40 * glowIntensity}px ${primaryColor}22`
                : `0 0 15px ${primaryColor}44`,
            transform: `scale(${scale})`,
            transition: "transform 0.3s ease-out, box-shadow 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
        }}>
            {/* Inner gradient ring */}
            <div style={{
                position: "absolute",
                width: "90%",
                height: "90%",
                borderRadius: "50%",
                border: `1px solid ${secondaryColor}33`,
                opacity: isRunning ? 0.8 : 0.4,
            }} />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUBBLES ANIMATION
// ═══════════════════════════════════════════════════════════════════════════════

function BubblesAnimation({ colors, isRunning, size = 160 }) {
    const [bubbles, setBubbles] = dc.useState([]);
    const bubbleIdRef = dc.useRef(0);
    
    // Generate bubbles while running
    dc.useEffect(() => {
        if (!isRunning) {
            setBubbles([]);
            return;
        }
        
        const interval = setInterval(() => {
            const newBubble = {
                id: bubbleIdRef.current++,
                x: 20 + Math.random() * 60, // 20-80% from left
                size: 4 + Math.random() * 10,
                duration: 3 + Math.random() * 4,
                delay: Math.random() * 0.5,
                color: getColor(colors, bubbleIdRef.current),
            };
            
            setBubbles(prev => [...prev.slice(-20), newBubble]); // Keep max 20 bubbles
        }, 300);
        
        return () => clearInterval(interval);
    }, [isRunning, colors]);
    
    // Clean up old bubbles
    dc.useEffect(() => {
        if (bubbles.length === 0) return;
        
        const timeout = setTimeout(() => {
            setBubbles(prev => prev.slice(1));
        }, 8000);
        
        return () => clearTimeout(timeout);
    }, [bubbles.length]);
    
    return (
        <div style={{
            width: size,
            height: size,
            position: "relative",
            overflow: "hidden",
            borderRadius: "50%",
        }}>
            {bubbles.map(bubble => (
                <div
                    key={bubble.id}
                    style={{
                        position: "absolute",
                        left: `${bubble.x}%`,
                        bottom: "-10%",
                        width: bubble.size,
                        height: bubble.size,
                        borderRadius: "50%",
                        background: `radial-gradient(circle at 30% 30%, ${bubble.color}88, ${bubble.color}44)`,
                        border: `1px solid ${bubble.color}66`,
                        animation: `bubbleRise ${bubble.duration}s ease-out ${bubble.delay}s forwards`,
                        opacity: 0,
                    }}
                />
            ))}
            <style>{`
                @keyframes bubbleRise {
                    0% { transform: translateY(0) translateX(0); opacity: 0; }
                    10% { opacity: 0.8; }
                    80% { opacity: 0.6; }
                    100% { transform: translateY(-${size * 1.2}px) translateX(${Math.random() > 0.5 ? '' : '-'}${10 + Math.random() * 20}px); opacity: 0; }
                }
            `}</style>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CANDLE FLAME ANIMATION
// ═══════════════════════════════════════════════════════════════════════════════

function CandleFlameAnimation({ colors, isRunning, breathPhase, size = 160 }) {
    const [flicker, setFlicker] = dc.useState({ x: 0, scale: 1 });
    
    // Flickering effect
    dc.useEffect(() => {
        if (!isRunning) return;
        
        const interval = setInterval(() => {
            setFlicker({
                x: (Math.random() - 0.5) * 6,
                scale: 0.95 + Math.random() * 0.1,
            });
        }, 100);
        
        return () => clearInterval(interval);
    }, [isRunning]);
    
    // Flame intensity based on breath
    const intensity = breathPhase === "in" || breathPhase === "hold-in" ? 1.2 : 1;
    
    const flameColor = colors?.[0] || "#ff9500";
    const innerColor = colors?.[1] || "#ffdd00";
    
    return (
        <div style={{
            width: size,
            height: size,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
        }}>
            {/* Glow */}
            <div style={{
                position: "absolute",
                width: "60%",
                height: "60%",
                borderRadius: "50%",
                background: `radial-gradient(circle, ${flameColor}44 0%, transparent 70%)`,
                filter: "blur(10px)",
                transform: `scale(${intensity})`,
                transition: "transform 0.5s ease",
            }} />
            
            {/* Flame body */}
            <div style={{
                width: 30,
                height: 60,
                background: `linear-gradient(to top, ${flameColor}, ${innerColor} 50%, #fff 90%)`,
                borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                transform: `translateX(${flicker.x}px) scaleX(${flicker.scale}) scaleY(${intensity})`,
                transition: "transform 0.1s ease",
                boxShadow: `0 0 20px ${flameColor}, 0 0 40px ${flameColor}66`,
                filter: "blur(1px)",
            }} />
            
            {/* Inner flame */}
            <div style={{
                position: "absolute",
                width: 15,
                height: 35,
                background: `linear-gradient(to top, ${innerColor}, #fff)`,
                borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                transform: `translateX(${flicker.x * 0.5}px) translateY(5px)`,
                opacity: 0.9,
            }} />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WATER RIPPLES ANIMATION
// ═══════════════════════════════════════════════════════════════════════════════

function WaterRipplesAnimation({ colors, isRunning, breathPhase, size = 160 }) {
    const [ripples, setRipples] = dc.useState([]);
    const rippleIdRef = dc.useRef(0);
    
    // Create new ripple on each breath cycle
    dc.useEffect(() => {
        if (!isRunning) {
            setRipples([]);
            return;
        }
        
        if (breathPhase === "in") {
            const newRipple = {
                id: rippleIdRef.current++,
                color: getColor(colors, rippleIdRef.current),
            };
            setRipples(prev => [...prev.slice(-4), newRipple]);
        }
    }, [breathPhase, isRunning]);
    
    const primaryColor = colors?.[0] || "#7c3aed";
    
    return (
        <div style={{
            width: size,
            height: size,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        }}>
            {/* Static center dot */}
            <div style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: primaryColor,
                boxShadow: `0 0 10px ${primaryColor}`,
                zIndex: 10,
            }} />
            
            {/* Ripples */}
            {ripples.map((ripple, i) => (
                <div
                    key={ripple.id}
                    style={{
                        position: "absolute",
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        border: `2px solid ${ripple.color}`,
                        animation: "rippleExpand 4s ease-out forwards",
                        opacity: 0,
                    }}
                />
            ))}
            
            <style>{`
                @keyframes rippleExpand {
                    0% { transform: scale(1); opacity: 0.8; }
                    100% { transform: scale(${size / 20}); opacity: 0; }
                }
            `}</style>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARTICLES / STARS ANIMATION
// ═══════════════════════════════════════════════════════════════════════════════

function ParticlesAnimation({ colors, isRunning, breathPhase, size = 160 }) {
    const particleCount = 40;
    
    // Generate fixed particle positions
    const particles = dc.useMemo(() => {
        return Array.from({ length: particleCount }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: 1 + Math.random() * 3,
            twinkleSpeed: 1 + Math.random() * 2,
            twinkleDelay: Math.random() * 2,
            driftX: (Math.random() - 0.5) * 20,
            driftY: (Math.random() - 0.5) * 20,
        }));
    }, []);
    
    // Breath scale effect
    const breathScale = breathPhase === "in" || breathPhase === "hold-in" ? 1.1 : 1;
    
    return (
        <div style={{
            width: size,
            height: size,
            position: "relative",
            borderRadius: "50%",
            overflow: "hidden",
        }}>
            {particles.map((p, i) => (
                <div
                    key={p.id}
                    style={{
                        position: "absolute",
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        borderRadius: "50%",
                        background: getColor(colors, i),
                        boxShadow: `0 0 ${p.size * 2}px ${getColor(colors, i)}`,
                        animation: isRunning 
                            ? `twinkle ${p.twinkleSpeed}s ease-in-out ${p.twinkleDelay}s infinite, drift 8s ease-in-out infinite`
                            : "none",
                        transform: `scale(${breathScale})`,
                        transition: "transform 0.5s ease",
                        opacity: isRunning ? 1 : 0.3,
                    }}
                />
            ))}
            
            <style>{`
                @keyframes twinkle {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 1; }
                }
                @keyframes drift {
                    0%, 100% { transform: translate(0, 0); }
                    25% { transform: translate(5px, -5px); }
                    50% { transform: translate(-3px, 3px); }
                    75% { transform: translate(-5px, -3px); }
                }
            `}</style>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOTUS FLOWER ANIMATION
// ═══════════════════════════════════════════════════════════════════════════════

function LotusFlowerAnimation({ colors, isRunning, breathPhase, breathProgress, size = 160 }) {
    const petalCount = 8;
    
    // Calculate petal opening based on breath
    let openAmount = 0.3; // Closed
    if (breathPhase === "in") {
        openAmount = lerp(0.3, 1, breathProgress);
    } else if (breathPhase === "hold-in") {
        openAmount = 1;
    } else if (breathPhase === "out") {
        openAmount = lerp(1, 0.3, breathProgress);
    }
    
    const primaryColor = colors?.[0] || "#ff69b4";
    const secondaryColor = colors?.[1] || "#ff1493";
    
    return (
        <div style={{
            width: size,
            height: size,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: isRunning ? "slowRotate 120s linear infinite" : "none",
        }}>
            {/* Petals */}
            {Array.from({ length: petalCount }, (_, i) => {
                const angle = (i / petalCount) * 360;
                const petalColor = i % 2 === 0 ? primaryColor : secondaryColor;
                
                return (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            width: 30,
                            height: 50,
                            background: `linear-gradient(to top, ${petalColor}88, ${petalColor})`,
                            borderRadius: "50% 50% 50% 50% / 80% 80% 20% 20%",
                            transformOrigin: "center bottom",
                            transform: `rotate(${angle}deg) translateY(-${20 + openAmount * 25}px) scaleY(${0.8 + openAmount * 0.2})`,
                            transition: "transform 0.3s ease-out",
                            boxShadow: `0 0 10px ${petalColor}44`,
                            opacity: isRunning ? 1 : 0.5,
                        }}
                    />
                );
            })}
            
            {/* Center */}
            <div style={{
                width: 25,
                height: 25,
                borderRadius: "50%",
                background: `radial-gradient(circle, #ffdd00, ${primaryColor})`,
                boxShadow: `0 0 15px ${primaryColor}`,
                zIndex: 10,
                transform: `scale(${0.8 + openAmount * 0.4})`,
                transition: "transform 0.3s ease-out",
            }} />
            
            <style>{`
                @keyframes slowRotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENERGY ORB ANIMATION
// ═══════════════════════════════════════════════════════════════════════════════

function EnergyOrbAnimation({ colors, isRunning, breathPhase, size = 160 }) {
    const [rotation, setRotation] = dc.useState(0);
    
    // Slow rotation
    dc.useEffect(() => {
        if (!isRunning) return;
        
        const interval = setInterval(() => {
            setRotation(prev => (prev + 0.5) % 360);
        }, 50);
        
        return () => clearInterval(interval);
    }, [isRunning]);
    
    const primaryColor = colors?.[0] || "#7c3aed";
    const secondaryColor = colors?.[1] || "#f59e0b";
    const tertiaryColor = colors?.[2] || "#10b981";
    
    // Pulse based on breath
    const pulseScale = breathPhase === "in" || breathPhase === "hold-in" ? 1.1 : 1;
    
    return (
        <div style={{
            width: size,
            height: size,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        }}>
            {/* Outer glow */}
            <div style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: `radial-gradient(circle, ${primaryColor}22 0%, transparent 70%)`,
                filter: "blur(15px)",
                transform: `scale(${pulseScale})`,
                transition: "transform 0.5s ease",
            }} />
            
            {/* Swirling layers */}
            {[0, 1, 2].map(i => (
                <div
                    key={i}
                    style={{
                        position: "absolute",
                        width: `${70 - i * 15}%`,
                        height: `${70 - i * 15}%`,
                        borderRadius: "50%",
                        background: `conic-gradient(from ${rotation + i * 120}deg, 
                            ${primaryColor}88, 
                            ${secondaryColor}88, 
                            ${tertiaryColor}88, 
                            ${primaryColor}88)`,
                        filter: "blur(3px)",
                        opacity: isRunning ? 0.8 : 0.3,
                        transform: `scale(${pulseScale})`,
                        transition: "transform 0.5s ease, opacity 0.3s ease",
                    }}
                />
            ))}
            
            {/* Center core */}
            <div style={{
                width: "20%",
                height: "20%",
                borderRadius: "50%",
                background: `radial-gradient(circle, #fff, ${primaryColor})`,
                boxShadow: `0 0 20px ${primaryColor}`,
                zIndex: 10,
            }} />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MANDALA ANIMATION (Complex Sacred Geometry)
// ═══════════════════════════════════════════════════════════════════════════════

function MandalaAnimation({ colors, isRunning, breathPhase, breathProgress, size = 160 }) {
    const [time, setTime] = dc.useState(0);
    
    // Slow time progression
    dc.useEffect(() => {
        if (!isRunning) return;
        
        const interval = setInterval(() => {
            setTime(prev => prev + 0.01);
        }, 50);
        
        return () => clearInterval(interval);
    }, [isRunning]);
    
    // Breath scale
    let breathScale = 1;
    if (breathPhase === "in") {
        breathScale = lerp(1, 1.15, breathProgress);
    } else if (breathPhase === "hold-in") {
        breathScale = 1.15;
    } else if (breathPhase === "out") {
        breathScale = lerp(1.15, 1, breathProgress);
    }
    
    const primaryColor = colors?.[0] || "#7c3aed";
    const secondaryColor = colors?.[1] || "#f59e0b";
    const tertiaryColor = colors?.[2] || "#10b981";
    
    // Ring configurations
    const rings = [
        { count: 12, radius: 45, size: 8, rotation: time * 20, color: primaryColor, shape: "circle" },
        { count: 8, radius: 35, size: 12, rotation: -time * 15, color: secondaryColor, shape: "triangle" },
        { count: 6, radius: 25, size: 10, rotation: time * 25, color: tertiaryColor, shape: "diamond" },
        { count: 12, radius: 55, size: 6, rotation: -time * 10, color: primaryColor, shape: "circle" },
    ];
    
    // Render shape based on type
    const renderShape = (shape, shapeSize, color, index) => {
        const baseStyle = {
            position: "absolute",
            opacity: isRunning ? 0.8 : 0.4,
            transition: "opacity 0.3s ease",
        };
        
        if (shape === "circle") {
            return (
                <div style={{
                    ...baseStyle,
                    width: shapeSize,
                    height: shapeSize,
                    borderRadius: "50%",
                    background: `${color}66`,
                    border: `1px solid ${color}`,
                    boxShadow: `0 0 ${shapeSize/2}px ${color}44`,
                }} />
            );
        } else if (shape === "triangle") {
            return (
                <div style={{
                    ...baseStyle,
                    width: 0,
                    height: 0,
                    borderLeft: `${shapeSize/2}px solid transparent`,
                    borderRight: `${shapeSize/2}px solid transparent`,
                    borderBottom: `${shapeSize}px solid ${color}88`,
                    filter: `drop-shadow(0 0 3px ${color})`,
                }} />
            );
        } else if (shape === "diamond") {
            return (
                <div style={{
                    ...baseStyle,
                    width: shapeSize,
                    height: shapeSize,
                    background: `${color}66`,
                    border: `1px solid ${color}`,
                    transform: "rotate(45deg)",
                    boxShadow: `0 0 ${shapeSize/2}px ${color}44`,
                }} />
            );
        }
    };
    
    return (
        <div style={{
            width: size,
            height: size,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${breathScale})`,
            transition: "transform 0.3s ease-out",
        }}>
            {/* Rings */}
            {rings.map((ring, ringIndex) => (
                <div
                    key={ringIndex}
                    style={{
                        position: "absolute",
                        width: ring.radius * 2,
                        height: ring.radius * 2,
                        transform: `rotate(${ring.rotation}deg)`,
                        transition: isRunning ? "none" : "transform 0.3s ease",
                    }}
                >
                    {Array.from({ length: ring.count }, (_, i) => {
                        const angle = (i / ring.count) * 360;
                        const rad = (angle * Math.PI) / 180;
                        const x = Math.cos(rad) * ring.radius + ring.radius - ring.size/2;
                        const y = Math.sin(rad) * ring.radius + ring.radius - ring.size/2;
                        
                        return (
                            <div
                                key={i}
                                style={{
                                    position: "absolute",
                                    left: x,
                                    top: y,
                                    transform: `rotate(${-ring.rotation}deg)`, // Counter-rotate to keep upright
                                }}
                            >
                                {renderShape(ring.shape, ring.size, ring.color, i)}
                            </div>
                        );
                    })}
                </div>
            ))}
            
            {/* Center - Flower of Life hint */}
            <div style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: `radial-gradient(circle, #fff, ${primaryColor})`,
                boxShadow: `0 0 15px ${primaryColor}, 0 0 30px ${primaryColor}44`,
                zIndex: 20,
            }} />
            
            {/* Inner seed pattern */}
            {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                <div
                    key={`seed-${i}`}
                    style={{
                        position: "absolute",
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        border: `1px solid ${primaryColor}88`,
                        background: `${primaryColor}22`,
                        transform: `rotate(${angle}deg) translateY(-12px)`,
                        opacity: isRunning ? 0.8 : 0.4,
                    }}
                />
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SACRED GEOMETRY ANIMATION (Metatron's Cube / Flower of Life)
// ═══════════════════════════════════════════════════════════════════════════════

function SacredGeometryAnimation({ colors, isRunning, breathPhase, breathProgress, size = 160 }) {
    const [drawProgress, setDrawProgress] = dc.useState(0);
    
    // Animate drawing
    dc.useEffect(() => {
        if (!isRunning) {
            setDrawProgress(0);
            return;
        }
        
        const interval = setInterval(() => {
            setDrawProgress(prev => (prev + 0.005) % 1);
        }, 50);
        
        return () => clearInterval(interval);
    }, [isRunning]);
    
    // Breath scale
    let breathScale = 1;
    if (breathPhase === "in") {
        breathScale = lerp(1, 1.1, breathProgress);
    } else if (breathPhase === "hold-in") {
        breathScale = 1.1;
    } else if (breathPhase === "out") {
        breathScale = lerp(1.1, 1, breathProgress);
    }
    
    const primaryColor = colors?.[0] || "#7c3aed";
    const secondaryColor = colors?.[1] || "#f59e0b";
    
    const center = size / 2;
    const radius = size * 0.35;
    
    // Flower of Life circles
    const flowerCircles = [
        { cx: 0, cy: 0 }, // Center
        ...Array.from({ length: 6 }, (_, i) => {
            const angle = (i * 60 * Math.PI) / 180;
            return {
                cx: Math.cos(angle) * radius * 0.5,
                cy: Math.sin(angle) * radius * 0.5,
            };
        }),
    ];
    
    // Metatron's cube lines (connecting vertices)
    const hexPoints = Array.from({ length: 6 }, (_, i) => {
        const angle = ((i * 60 - 90) * Math.PI) / 180;
        return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
        };
    });
    
    return (
        <div style={{
            width: size,
            height: size,
            position: "relative",
            transform: `scale(${breathScale})`,
            transition: "transform 0.3s ease-out",
        }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Outer circle */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={primaryColor}
                    strokeWidth="1"
                    opacity={isRunning ? 0.6 : 0.3}
                />
                
                {/* Flower of Life circles */}
                {flowerCircles.map((circle, i) => (
                    <circle
                        key={`flower-${i}`}
                        cx={center + circle.cx}
                        cy={center + circle.cy}
                        r={radius * 0.5}
                        fill="none"
                        stroke={i === 0 ? secondaryColor : primaryColor}
                        strokeWidth="1"
                        opacity={isRunning ? 0.5 + (drawProgress > i / flowerCircles.length ? 0.3 : 0) : 0.3}
                        style={{ transition: "opacity 0.5s ease" }}
                    />
                ))}
                
                {/* Metatron's cube lines */}
                {hexPoints.map((point, i) => (
                    hexPoints.slice(i + 1).map((point2, j) => (
                        <line
                            key={`line-${i}-${j}`}
                            x1={center + point.x}
                            y1={center + point.y}
                            x2={center + point2.x}
                            y2={center + point2.y}
                            stroke={secondaryColor}
                            strokeWidth="0.5"
                            opacity={isRunning ? 0.3 : 0.15}
                        />
                    ))
                ))}
                
                {/* Hex vertices */}
                {hexPoints.map((point, i) => (
                    <circle
                        key={`vertex-${i}`}
                        cx={center + point.x}
                        cy={center + point.y}
                        r={3}
                        fill={primaryColor}
                        opacity={isRunning ? 0.8 : 0.4}
                    >
                        {isRunning && (
                            <animate
                                attributeName="opacity"
                                values="0.4;1;0.4"
                                dur={`${1 + i * 0.2}s`}
                                repeatCount="indefinite"
                            />
                        )}
                    </circle>
                ))}
                
                {/* Center point */}
                <circle
                    cx={center}
                    cy={center}
                    r={5}
                    fill={secondaryColor}
                >
                    {isRunning && (
                        <animate
                            attributeName="r"
                            values="4;6;4"
                            dur="2s"
                            repeatCount="indefinite"
                        />
                    )}
                </circle>
            </svg>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATION REGISTRY
// ═══════════════════════════════════════════════════════════════════════════════

const animations = {
    bubbles: { component: BubblesAnimation, label: "Bubbles", icon: "🫧" },
    flame: { component: CandleFlameAnimation, label: "Candle Flame", icon: "🕯️" },
    ripples: { component: WaterRipplesAnimation, label: "Water Ripples", icon: "💧" },
    particles: { component: ParticlesAnimation, label: "Stars", icon: "✨" },
    lotus: { component: LotusFlowerAnimation, label: "Lotus Flower", icon: "🪷" },
    orb: { component: EnergyOrbAnimation, label: "Energy Orb", icon: "🔮" },
    mandala: { component: MandalaAnimation, label: "Mandala", icon: "🔯" },
    sacredGeometry: { component: SacredGeometryAnimation, label: "Sacred Geometry", icon: "✡️" },
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

return {
    BreathingCircle,
    BubblesAnimation,
    CandleFlameAnimation,
    WaterRipplesAnimation,
    ParticlesAnimation,
    LotusFlowerAnimation,
    EnergyOrbAnimation,
    MandalaAnimation,
    SacredGeometryAnimation,
    animations,
};
