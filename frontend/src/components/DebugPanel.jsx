import { useState, useEffect } from 'react';
import api from '../services/api';

function DebugPanel() {
  const [debugMode, setDebugMode] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDebugMode(params.get('debug') === 'true');
  }, []);

  useEffect(() => {
    if (debugMode) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('debug') !== 'true') {
        params.set('debug', 'true');
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
      }
    }
  }, [debugMode]);

  const runEncodingTest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/test-encoding');
      const data = await response.json();
      setTestResults(data);
    } catch (err) {
      setTestResults({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!debugMode) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium"
      >
        🐛 Debug {expanded ? '▼' : '▲'}
      </button>

      {expanded && (
        <div className="absolute bottom-12 right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-h-96 overflow-auto">
          <h3 className="font-bold text-gray-900 mb-3">Debug Panel</h3>

          <div className="space-y-3">
            <button
              onClick={runEncodingTest}
              disabled={loading}
              className="w-full bg-blue-500 text-white px-3 py-2 rounded text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Encoding'}
            </button>

            <button
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                params.set('debug', 'false');
                window.location.search = params.toString();
              }}
              className="w-full bg-red-500 text-white px-3 py-2 rounded text-sm font-medium"
            >
              Disable Debug
            </button>

            {testResults && (
              <div className="mt-4 p-3 bg-gray-50 rounded text-xs font-mono">
                <pre className="whitespace-pre-wrap break-all">
                  {JSON.stringify(testResults, null, 2)}
                </pre>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-gray-200">
              <h4 className="font-medium text-gray-700 mb-2">API Endpoints</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li><code>/api/timetable</code></li>
                <li><code>/api/messages/inbox</code></li>
                <li><code>/api/notifications</code></li>
                <li><code>/api/files</code></li>
                <li><code>/api/debug/page?url=...</code></li>
              </ul>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200">
              <h4 className="font-medium text-gray-700 mb-2">Page Info</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>Path: {window.location.pathname}</li>
                <li>User Agent: {navigator.userAgent.substring(0, 50)}...</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DebugPanel;
