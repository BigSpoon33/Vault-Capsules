// System/Scripts/Widgets/dc-networkTest.jsx
// Network Capability Test - Verify HTTP request methods available in Datacore

function NetworkTest() {
    const TEST_URL = 'https://raw.githubusercontent.com/BigSpoon33/Datacore_Components_Showcase/main/README.md';

    // State for each test method
    const [fetchResult, setFetchResult] = dc.useState({ status: 'idle', message: '', preview: '' });
    const [requestUrlResult, setRequestUrlResult] = dc.useState({ status: 'idle', message: '', preview: '' });
    const [xhrResult, setXhrResult] = dc.useState({ status: 'idle', message: '', preview: '' });

    // Currently selected preview
    const [activePreview, setActivePreview] = dc.useState(null);

    // Test 1: Native fetch()
    const testFetch = async () => {
        setFetchResult({ status: 'testing', message: 'Testing...', preview: '' });
        try {
            const response = await fetch(TEST_URL);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const text = await response.text();
            const preview = text.substring(0, 500);
            setFetchResult({
                status: 'success',
                message: `Success! Fetched ${text.length} chars`,
                preview
            });
            setActivePreview('fetch');
        } catch (err) {
            setFetchResult({
                status: 'error',
                message: err.message || String(err),
                preview: ''
            });
        }
    };

    // Test 2: Obsidian's requestUrl()
    const testRequestUrl = async () => {
        setRequestUrlResult({ status: 'testing', message: 'Testing...', preview: '' });
        try {
            // Try to access Obsidian's requestUrl
            const obsidian = require('obsidian');
            if (!obsidian?.requestUrl) {
                throw new Error('requestUrl not available in obsidian module');
            }

            const response = await obsidian.requestUrl({
                url: TEST_URL,
                method: 'GET'
            });

            const text = response.text;
            const preview = text.substring(0, 500);
            setRequestUrlResult({
                status: 'success',
                message: `Success! Fetched ${text.length} chars (status: ${response.status})`,
                preview
            });
            setActivePreview('requestUrl');
        } catch (err) {
            setRequestUrlResult({
                status: 'error',
                message: err.message || String(err),
                preview: ''
            });
        }
    };

    // Test 3: XMLHttpRequest
    const testXHR = () => {
        setXhrResult({ status: 'testing', message: 'Testing...', preview: '' });
        try {
            const xhr = new XMLHttpRequest();

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        const text = xhr.responseText;
                        const preview = text.substring(0, 500);
                        setXhrResult({
                            status: 'success',
                            message: `Success! Fetched ${text.length} chars`,
                            preview
                        });
                        setActivePreview('xhr');
                    } else {
                        setXhrResult({
                            status: 'error',
                            message: `HTTP ${xhr.status}: ${xhr.statusText}`,
                            preview: ''
                        });
                    }
                }
            };

            xhr.onerror = function() {
                setXhrResult({
                    status: 'error',
                    message: 'Network error or CORS blocked',
                    preview: ''
                });
            };

            xhr.open('GET', TEST_URL, true);
            xhr.send();
        } catch (err) {
            setXhrResult({
                status: 'error',
                message: err.message || String(err),
                preview: ''
            });
        }
    };

    // Status icon helper
    const getStatusIcon = (status) => {
        switch (status) {
            case 'idle': return '⬜';
            case 'testing': return '🔄';
            case 'success': return '✅';
            case 'error': return '❌';
            default: return '❓';
        }
    };

    // Button style helper
    const buttonStyle = {
        padding: '6px 12px',
        borderRadius: '4px',
        border: '1px solid var(--background-modifier-border)',
        background: 'var(--interactive-normal)',
        color: 'var(--text-normal)',
        cursor: 'pointer',
        fontSize: '0.9em',
        minWidth: '60px'
    };

    const buttonHoverStyle = {
        ...buttonStyle,
        background: 'var(--interactive-hover)'
    };

    // Get active preview content
    const getPreviewContent = () => {
        switch (activePreview) {
            case 'fetch': return fetchResult.preview;
            case 'requestUrl': return requestUrlResult.preview;
            case 'xhr': return xhrResult.preview;
            default: return '';
        }
    };

    const previewContent = getPreviewContent();

    // Count working methods
    const workingCount = [fetchResult, requestUrlResult, xhrResult].filter(r => r.status === 'success').length;
    const testedCount = [fetchResult, requestUrlResult, xhrResult].filter(r => r.status !== 'idle').length;

    return (
        <div style={{
            fontFamily: 'var(--font-interface)',
            background: 'var(--background-primary)',
            border: '1px solid var(--background-modifier-border)',
            borderRadius: '8px',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                background: 'var(--background-secondary)',
                padding: '12px 16px',
                borderBottom: '1px solid var(--background-modifier-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                <span style={{ fontSize: '1.2em' }}>🔬</span>
                <span style={{ fontWeight: 'bold' }}>Network Capability Test</span>
                {testedCount > 0 && (
                    <span style={{
                        marginLeft: 'auto',
                        fontSize: '0.85em',
                        color: workingCount > 0 ? 'var(--text-success)' : 'var(--text-error)',
                        background: workingCount > 0 ? 'var(--background-modifier-success)' : 'var(--background-modifier-error)',
                        padding: '2px 8px',
                        borderRadius: '4px'
                    }}>
                        {workingCount}/{testedCount} working
                    </span>
                )}
            </div>

            {/* Test URL */}
            <div style={{
                padding: '8px 16px',
                background: 'var(--background-secondary-alt)',
                fontSize: '0.8em',
                fontFamily: 'var(--font-monospace)',
                color: 'var(--text-muted)',
                borderBottom: '1px solid var(--background-modifier-border)'
            }}>
                Testing: {TEST_URL}
            </div>

            {/* Test Methods */}
            <div style={{ padding: '16px' }}>
                {/* Test Row Component */}
                {[
                    { name: 'fetch()', result: fetchResult, action: testFetch, key: 'fetch' },
                    { name: 'requestUrl()', result: requestUrlResult, action: testRequestUrl, key: 'requestUrl' },
                    { name: 'XMLHttpRequest', result: xhrResult, action: testXHR, key: 'xhr' }
                ].map(({ name, result, action, key }) => (
                    <div key={key} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 0',
                        borderBottom: '1px solid var(--background-modifier-border)'
                    }}>
                        <span style={{
                            fontFamily: 'var(--font-monospace)',
                            minWidth: '140px',
                            fontWeight: '500'
                        }}>
                            {name}
                        </span>

                        <button
                            style={buttonStyle}
                            onClick={action}
                            disabled={result.status === 'testing'}
                        >
                            {result.status === 'testing' ? '...' : 'Test'}
                        </button>

                        <span style={{ fontSize: '1.2em' }}>
                            {getStatusIcon(result.status)}
                        </span>

                        <span style={{
                            fontSize: '0.85em',
                            color: result.status === 'success' ? 'var(--text-success)' :
                                   result.status === 'error' ? 'var(--text-error)' :
                                   'var(--text-muted)',
                            flex: 1
                        }}>
                            {result.message}
                        </span>

                        {result.preview && (
                            <button
                                style={{
                                    ...buttonStyle,
                                    fontSize: '0.75em',
                                    padding: '4px 8px',
                                    background: activePreview === key ? 'var(--interactive-accent)' : buttonStyle.background,
                                    color: activePreview === key ? 'var(--text-on-accent)' : buttonStyle.color
                                }}
                                onClick={() => setActivePreview(activePreview === key ? null : key)}
                            >
                                Preview
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Run All Button */}
            <div style={{
                padding: '0 16px 16px 16px',
                display: 'flex',
                gap: '8px'
            }}>
                <button
                    style={{
                        ...buttonStyle,
                        flex: 1,
                        background: 'var(--interactive-accent)',
                        color: 'var(--text-on-accent)',
                        fontWeight: 'bold'
                    }}
                    onClick={() => {
                        testFetch();
                        testRequestUrl();
                        testXHR();
                    }}
                >
                    Run All Tests
                </button>
            </div>

            {/* Response Preview */}
            {previewContent && (
                <div style={{
                    borderTop: '1px solid var(--background-modifier-border)',
                    padding: '12px 16px'
                }}>
                    <div style={{
                        fontSize: '0.85em',
                        fontWeight: 'bold',
                        marginBottom: '8px',
                        color: 'var(--text-muted)'
                    }}>
                        Response Preview ({activePreview}):
                    </div>
                    <pre style={{
                        background: 'var(--background-secondary)',
                        padding: '12px',
                        borderRadius: '4px',
                        fontSize: '0.8em',
                        fontFamily: 'var(--font-monospace)',
                        overflow: 'auto',
                        maxHeight: '200px',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        margin: 0
                    }}>
                        {previewContent}...
                    </pre>
                </div>
            )}

            {/* Summary Footer */}
            {testedCount === 3 && (
                <div style={{
                    borderTop: '1px solid var(--background-modifier-border)',
                    padding: '12px 16px',
                    background: workingCount > 0 ? 'var(--background-modifier-success)' : 'var(--background-modifier-error)',
                    color: workingCount > 0 ? 'var(--text-success)' : 'var(--text-error)'
                }}>
                    {workingCount > 0 ? (
                        <span>
                            <strong>Network access available!</strong> Can proceed with in-Obsidian capsule manager using {
                                [fetchResult.status === 'success' && 'fetch()',
                                 requestUrlResult.status === 'success' && 'requestUrl()',
                                 xhrResult.status === 'success' && 'XMLHttpRequest'
                                ].filter(Boolean).join(', ')
                            }.
                        </span>
                    ) : (
                        <span>
                            <strong>No network access.</strong> Fall back to monorepo + install script approach.
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

// EXPORT THE COMPONENT
return { Func: NetworkTest };
