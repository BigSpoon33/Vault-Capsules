// dc-demoWidget.jsx
// A simple demo widget to test capsule installation from the Store

function DemoWidget() {
    const [count, setCount] = dc.useState(0);
    const [message, setMessage] = dc.useState("Hello from the Store!");

    return (
        <div style={{
            padding: 20,
            background: "var(--background-secondary)",
            borderRadius: 12,
            border: "2px solid var(--text-accent)",
            textAlign: "center"
        }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🧪</div>
            <h3 style={{ margin: "0 0 8px 0", color: "var(--text-normal)" }}>
                Demo Widget
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 16 }}>
                {message}
            </p>
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                marginBottom: 16
            }}>
                <button
                    onClick={() => setCount(c => c - 1)}
                    style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: "none",
                        background: "var(--interactive-normal)",
                        color: "var(--text-normal)",
                        cursor: "pointer",
                        fontSize: 18
                    }}
                >
                    −
                </button>
                <span style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    minWidth: 60,
                    color: "var(--text-accent)"
                }}>
                    {count}
                </span>
                <button
                    onClick={() => setCount(c => c + 1)}
                    style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: "none",
                        background: "var(--interactive-accent)",
                        color: "var(--text-on-accent)",
                        cursor: "pointer",
                        fontSize: 18
                    }}
                >
                    +
                </button>
            </div>
            <div style={{
                fontSize: 11,
                color: "var(--text-faint)",
                fontFamily: "var(--font-monospace)"
            }}>
                v1.0.0 • Installed via Capsule Store
            </div>
        </div>
    );
}

return { Func: DemoWidget, DemoWidget };
