export const STORAGE_KEY = 'tcs_nqt_81q_dashboard_results_v2';

export function loadResults() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveResults(results) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
}

export function clearResults() {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportResults() {
  const payload = {
    app: 'TCS_NQT_FINAL_MOCK_TRAINER',
    version: 2,
    exportedAt: Date.now(),
    results: loadResults(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tcs-nqt-progress-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importResults(file) {
  const text = await file.text();
  const payload = JSON.parse(text);
  if (!payload || payload.app !== 'TCS_NQT_FINAL_MOCK_TRAINER' || !payload.results) {
    throw new Error('Invalid progress file.');
  }
  saveResults(payload.results);
  return payload.results;
}
