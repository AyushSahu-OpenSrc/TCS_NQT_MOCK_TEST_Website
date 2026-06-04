import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildTest,
  RESULT_DELAY_MS,
  SECTIONS,
  TEST_DURATION_SEC,
  TEST_SCHEDULE,
  TOTAL_QUESTIONS,
} from './data/questions.js';
import {
  clearResults,
  exportResults,
  importResults,
  loadResults,
  saveResults,
} from './lib/storage.js';

function fmtTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function fmtDate(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function resultPercent(score) {
  return Math.round((score / TOTAL_QUESTIONS) * 100);
}

function sectionShort(section) {
  return section.replace(' Ability', '').replace('Advanced ', 'Adv. ');
}

export default function App() {
  const [screen, setScreen] = useState('dashboard');
  const [results, setResults] = useState(loadResults());
  const [now, setNow] = useState(Date.now());
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [session, setSession] = useState(null);
  const [showImportError, setShowImportError] = useState('');

  const audioCtxRef = useRef(null);
  const alarmOscRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  useEffect(() => {
    const overdue = TEST_SCHEDULE.find((test) => {
      const due = new Date(test.at).getTime();
      return now >= due && !results[test.id];
    });

    if (alarmEnabled && overdue) {
      startAlarm();
      if ('Notification' in window && Notification.permission === 'granted') {
        if (now % 30000 < 1100) {
          new Notification('TCS NQT Mock overdue', {
            body: `Test ${overdue.id} is due. Complete it now.`,
          });
        }
      }
    } else {
      stopAlarm();
    }

    return () => {};
  }, [now, alarmEnabled, results]);

  function persist(nextResults) {
    setResults(nextResults);
    saveResults(nextResults);
  }

  function enableAlarm() {
    setAlarmEnabled(true);
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    alert('Alarm enabled. Keep this browser tab open for alarm sound.');
  }

  function startAlarm() {
    if (!audioCtxRef.current || alarmOscRef.current) return;
    const oscillator = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    oscillator.frequency.value = 880;
    gain.gain.value = 0.08;
    oscillator.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    oscillator.start();
    alarmOscRef.current = oscillator;
  }

  function stopAlarm() {
    if (alarmOscRef.current) {
      try { alarmOscRef.current.stop(); } catch {}
      alarmOscRef.current = null;
    }
  }

  function startTest(testId, retake = false) {
    const test = TEST_SCHEDULE.find((item) => item.id === testId);
    const dueTime = new Date(test.at).getTime();

    if (Date.now() < dueTime) {
      alert(`Test ${testId} is locked. It will unlock at ${fmtDate(test.at)}.`);
      return;
    }

    if (results[testId] && !retake) {
      alert('This test is already submitted. Use Retake if you want to replace your score.');
      return;
    }

    if (retake && !confirm('Retake will replace previous result for this test. Continue?')) return;

    stopAlarm();
    const questions = buildTest(testId);
    setSession({
      testId,
      questions,
      answers: Array(questions.length).fill(null),
      currentIndex: 0,
      globalLeft: TEST_DURATION_SEC,
      verbalLeft: 25,
      startedAt: Date.now(),
      autoSubmitted: false,
    });
    setScreen('test');
  }

  function updateSession(patch) {
    setSession((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function updateAnswer(option) {
    setSession((prev) => {
      const answers = [...prev.answers];
      answers[prev.currentIndex] = option;
      return { ...prev, answers };
    });
  }

  function goQuestion(index) {
    if (!session) return;
    updateSession({ currentIndex: Math.max(0, Math.min(session.questions.length - 1, index)), verbalLeft: 25 });
  }

  function nextQuestion() {
    if (!session) return;
    goQuestion(session.currentIndex + 1);
  }

  function prevQuestion() {
    if (!session) return;
    goQuestion(session.currentIndex - 1);
  }

  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => {
      setSession((prev) => {
        if (!prev) return prev;
        const left = prev.globalLeft - 1;
        if (left <= 0) {
          setTimeout(() => submitTest(true), 0);
          return { ...prev, globalLeft: 0 };
        }
        return { ...prev, globalLeft: left };
      });
    }, 1000);

    return () => clearInterval(id);
  }, [session?.testId]);

  useEffect(() => {
    if (!session) return;
    const current = session.questions[session.currentIndex];
    if (!current || current.section !== 'Verbal Ability') return;

    setSession((prev) => (prev ? { ...prev, verbalLeft: 25 } : prev));
    const id = setInterval(() => {
      setSession((prev) => {
        if (!prev) return prev;
        if (prev.questions[prev.currentIndex]?.section !== 'Verbal Ability') return prev;
        const left = prev.verbalLeft - 1;
        if (left <= 0) {
          const next = Math.min(prev.currentIndex + 1, prev.questions.length - 1);
          if (prev.currentIndex === prev.questions.length - 1) {
            setTimeout(() => submitTest(true), 0);
            return { ...prev, verbalLeft: 0 };
          }
          return { ...prev, currentIndex: next, verbalLeft: 25 };
        }
        return { ...prev, verbalLeft: left };
      });
    }, 1000);

    return () => clearInterval(id);
  }, [session?.testId, session?.currentIndex]);

  function submitTest(auto = false) {
    setSession((prev) => {
      if (!prev) return prev;
      if (!auto && !confirm('Submit test? Result will unlock after 10 minutes on dashboard.')) return prev;

      const sectionStats = {};
      const wrong = [];
      let score = 0;

      prev.questions.forEach((question, index) => {
        if (!sectionStats[question.section]) {
          sectionStats[question.section] = { correct: 0, total: 0 };
        }
        sectionStats[question.section].total += 1;

        const selected = prev.answers[index];
        if (selected === question.answer) {
          score += 1;
          sectionStats[question.section].correct += 1;
        } else {
          wrong.push({
            number: index + 1,
            section: question.section,
            text: question.text,
            yourAnswer: selected || 'Not attempted',
            correctAnswer: question.answer,
            explanation: question.explanation,
            trick: question.trick,
            pyq: question.pyq,
          });
        }
      });

      const result = {
        testId: prev.testId,
        score,
        total: TOTAL_QUESTIONS,
        percentage: resultPercent(score),
        submittedAt: Date.now(),
        availableAt: Date.now() + RESULT_DELAY_MS,
        startedAt: prev.startedAt,
        sectionStats,
        wrong,
      };

      persist({ ...loadResults(), [prev.testId]: result });
      setScreen('dashboard');
      alert('Test submitted. Result will unlock on dashboard after 10 minutes.');
      return null;
    });
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importResults(file);
      setResults(imported);
      setShowImportError('');
      alert('Progress imported successfully.');
    } catch (err) {
      setShowImportError(err.message || 'Import failed.');
    } finally {
      e.target.value = '';
    }
  }

  const dashboardStats = useMemo(() => {
    const entries = TEST_SCHEDULE.map((test) => results[test.id]).filter(Boolean);
    const unlocked = entries.filter((r) => now >= r.availableAt);
    const completed = entries.length;
    const avg = unlocked.length
      ? Math.round(unlocked.reduce((sum, r) => sum + r.score, 0) / (unlocked.length * TOTAL_QUESTIONS) * 100)
      : 0;
    const best = unlocked.length ? Math.max(...unlocked.map((r) => r.score)) : 0;
    const sectionTotals = {};
    const sectionCorrect = {};
    unlocked.forEach((r) => {
      Object.entries(r.sectionStats).forEach(([section, value]) => {
        sectionTotals[section] = (sectionTotals[section] || 0) + value.total;
        sectionCorrect[section] = (sectionCorrect[section] || 0) + value.correct;
      });
    });
    let weakest = '--';
    let weakestPct = 101;
    Object.keys(sectionTotals).forEach((section) => {
      const pct = (sectionCorrect[section] / sectionTotals[section]) * 100;
      if (pct < weakestPct) {
        weakestPct = pct;
        weakest = sectionShort(section);
      }
    });
    return { completed, unlocked: unlocked.length, avg, best, weakest };
  }, [results, now]);

  const overdue = TEST_SCHEDULE.find((test) => now >= new Date(test.at).getTime() && !results[test.id]);

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <div className="logo">NQT</div>
          <div>
            <h1>TCS NQT Final Mock Trainer</h1>
            <p>10 mocks · 81 questions · no coding · dashboard results after 10 minutes</p>
          </div>
        </div>
        <div className="topActions">
          <span className="pill">{new Date(now).toLocaleTimeString('en-IN')}</span>
          <button className="secondary" onClick={() => setScreen('dashboard')}>Dashboard</button>
          <button onClick={enableAlarm}>Enable Alarm</button>
        </div>
      </header>

      <main className="container">
        {overdue && (
          <div className={`alarm ${alarmEnabled ? 'pulse' : ''}`}>
            <b>🚨 Test {overdue.id} overdue:</b> {overdue.focus}. Start it to stop alarm.
          </div>
        )}

        {screen === 'dashboard' && (
          <Dashboard
            results={results}
            now={now}
            stats={dashboardStats}
            startTest={startTest}
            onClear={() => {
              if (confirm('Delete all dashboard progress?')) {
                clearResults();
                setResults({});
              }
            }}
            onExport={exportResults}
            onImport={handleImport}
            importError={showImportError}
          />
        )}

        {screen === 'test' && session && (
          <TestScreen
            session={session}
            setDashboard={() => setScreen('dashboard')}
            updateAnswer={updateAnswer}
            goQuestion={goQuestion}
            nextQuestion={nextQuestion}
            prevQuestion={prevQuestion}
            submitTest={submitTest}
          />
        )}
      </main>
    </>
  );
}

function Dashboard({ results, now, stats, startTest, onClear, onExport, onImport, importError }) {
  return (
    <section>
      <div className="sectionTitle">
        <div>
          <h2>Performance Dashboard</h2>
          <p>Dashboard par hi result, incorrect answers aur explanation unlock honge.</p>
        </div>
        <div className="row">
          <button className="secondary" onClick={onExport}>Export Progress</button>
          <label className="fileButton">
            Import Progress
            <input type="file" accept="application/json" onChange={onImport} />
          </label>
          <button className="ghost" onClick={onClear}>Reset</button>
        </div>
      </div>

      {importError && <div className="errorBox">{importError}</div>}

      <div className="metrics">
        <Metric title="Tests Submitted" value={`${stats.completed}/10`} />
        <Metric title="Unlocked Results" value={`${stats.unlocked}/10`} />
        <Metric title="Average Score" value={`${stats.avg}%`} />
        <Metric title="Best Score" value={`${stats.best}/81`} />
        <Metric title="Weakest Section" value={stats.weakest} />
      </div>

      <div className="card progressCard">
        <div className="between">
          <b>Overall Completion</b>
          <span>{Math.round((stats.completed / 10) * 100)}%</span>
        </div>
        <div className="progress"><span style={{ width: `${(stats.completed / 10) * 100}%` }} /></div>
        <p className="note">Result submit karne ke exactly 10 minutes baad unlock hoga. Uske baad dashboard par section score + wrong answer review dikhega.</p>
      </div>

      <div className="sectionTitle">
        <h2>Test Schedule</h2>
        <span className="tag red">Test 1 starts 4 June, 12:30 AM</span>
      </div>

      <div className="testsGrid">
        {TEST_SCHEDULE.map((test) => (
          <TestCard
            key={test.id}
            test={test}
            result={results[test.id]}
            now={now}
            startTest={startTest}
          />
        ))}
      </div>

      <div className="sectionTitle">
        <h2>Dashboard Results</h2>
        <span className="tag">Unlocked only after 10 minutes</span>
      </div>

      <div className="resultsStack">
        {TEST_SCHEDULE.map((test) => (
          <DashboardResult key={test.id} test={test} result={results[test.id]} now={now} />
        ))}
      </div>
    </section>
  );
}

function Metric({ title, value }) {
  return (
    <div className="card metric">
      <div className="metricValue">{value}</div>
      <div className="metricTitle">{title}</div>
    </div>
  );
}

function TestCard({ test, result, now, startTest }) {
  const due = new Date(test.at).getTime();
  const isLocked = now < due;

  let tag = isLocked ? `Locked until ${fmtDate(test.at)}` : 'Due / Overdue';
  let tagClass = isLocked ? '' : 'bad';

  if (result && now < result.availableAt) {
    tag = `Result Pending ${fmtTime((result.availableAt - now) / 1000)}`;
    tagClass = 'warn';
  }

  if (result && now >= result.availableAt) {
    tag = `Score ${result.score}/81`;
    tagClass = result.percentage >= 75 ? 'good' : result.percentage >= 55 ? 'warn' : 'bad';
  }

  return (
    <div className={`card testCard ${isLocked && !result ? 'lockedCard' : ''}`}>
      <div className="between">
        <h3>Test {test.id}</h3>
        <span className={`tag ${tagClass}`}>{tag}</span>
      </div>
      <p className="muted">{test.focus}</p>
      <div className="miniTags">
        <span>81 Q</span>
        <span className="tag red">Target: {test.target}/81</span>
        <span>Verbal 25s/Q</span>
      </div>
      <p><b>Scheduled:</b> {fmtDate(test.at)}</p>
      <div className="row">
        {!result && (
          <button disabled={isLocked} onClick={() => startTest(test.id)}>
            {isLocked ? 'Locked' : 'Start Test'}
          </button>
        )}
        {result && <button className="secondary" onClick={() => startTest(test.id, true)}>Retake</button>}
      </div>
    </div>
  );
}

function DashboardResult({ test, result, now }) {
  if (!result) {
    return (
      <div className="card resultPanel collapsed">
        <div className="between">
          <b>Test {test.id} Result</b>
          <span className="tag">Not attempted</span>
        </div>
      </div>
    );
  }

  if (now < result.availableAt) {
    return (
      <div className="card resultPanel pending">
        <div className="between">
          <b>Test {test.id} Result Pending</b>
          <span className="tag warn">Unlocks in {fmtTime((result.availableAt - now) / 1000)}</span>
        </div>
        <p className="muted">Submitted. Result, incorrect answers and explanations will appear here after 10 minutes.</p>
      </div>
    );
  }

  return (
    <div className="card resultPanel">
      <div className="between wrapMobile">
        <div>
          <h3>Test {test.id} Result</h3>
          <p className="muted">Submitted: {new Date(result.submittedAt).toLocaleString('en-IN')}</p>
        </div>
        <div className="scoreBadge">
          <b>{result.score}/81</b>
          <span>{result.percentage}%</span>
        </div>
      </div>

      <div className="sectionScores">
        {Object.entries(result.sectionStats).map(([section, stats]) => {
          const pct = Math.round((stats.correct / stats.total) * 100);
          return (
            <div className="sectionScore" key={section}>
              <span>{sectionShort(section)}</span>
              <b>{stats.correct}/{stats.total}</b>
              <em>{pct}%</em>
            </div>
          );
        })}
      </div>

      <details className="wrongDetails" open>
        <summary>Incorrect / Skipped Answers: {result.wrong.length}</summary>
        {result.wrong.length === 0 ? (
          <div className="perfect">Perfect attempt. No wrong answers.</div>
        ) : (
          <div className="wrongList">
            {result.wrong.map((item) => (
              <div className="wrongItem" key={`${result.testId}-${item.number}`}>
                <div className="wrongHead">
                  <span className="tag bad">Q{item.number}</span>
                  <span className="tag">{item.section}</span>
                  {item.pyq && <span className="tag red">{item.pyq}</span>}
                </div>
                <p className="questionText">{item.text}</p>
                <p className="wrongAnswer">Your answer: {item.yourAnswer}</p>
                <p className="correctAnswer">Correct answer: {item.correctAnswer}</p>
                <p className="explanation"><b>Explanation:</b> {item.explanation}</p>
                {item.trick && <p className="trick"><b>Next-time trick:</b> {item.trick}</p>}
              </div>
            ))}
          </div>
        )}
      </details>
    </div>
  );
}

function TestScreen({ session, setDashboard, updateAnswer, goQuestion, nextQuestion, prevQuestion, submitTest }) {
  const current = session.questions[session.currentIndex];
  const answered = session.answers.filter(Boolean).length;

  const sectionCounts = useMemo(() => {
    const counts = {};
    session.questions.forEach((q) => {
      counts[q.section] = (counts[q.section] || 0) + 1;
    });
    return counts;
  }, [session.questions]);

  return (
    <section className="testLayout">
      <aside className="card sidebar">
        <div className="between">
          <h3>Test {session.testId}</h3>
          <span className="tag red">Live</span>
        </div>
        <div className="timer">{fmtTime(session.globalLeft)}</div>
        <p className="muted">Answered: {answered}/{TOTAL_QUESTIONS}</p>
        <div className="progress"><span style={{ width: `${(answered / TOTAL_QUESTIONS) * 100}%` }} /></div>

        <div className="sectionLegend">
          {Object.entries(sectionCounts).map(([section, count]) => (
            <div key={section}>
              <span>{sectionShort(section)}</span><b>{count}</b>
            </div>
          ))}
        </div>

        <div className="qGrid">
          {session.questions.map((_, index) => (
            <button
              key={index}
              className={[
                'qButton',
                session.currentIndex === index ? 'current' : '',
                session.answers[index] ? 'answered' : '',
              ].join(' ')}
              onClick={() => goQuestion(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <div className="row bottomActions">
          <button className="secondary" onClick={setDashboard}>Exit</button>
          <button className="good" onClick={() => submitTest(false)}>Submit</button>
        </div>
      </aside>

      <main className="card questionPanel">
        <div className="between wrapMobile">
          <div>
            <div className="row" style={{ marginBottom: '8px' }}>
              <span className="tag">{current.section}</span>
              {current.pyq && <span className="tag red">{current.pyq}</span>}
            </div>
            <p className="muted">Question {session.currentIndex + 1} of {TOTAL_QUESTIONS}</p>
          </div>
          {current.section === 'Verbal Ability' && (
            <div className="perQTimer">Verbal auto-next: {session.verbalLeft}s</div>
          )}
        </div>

        <h2 className="mainQuestion">{current.text}</h2>

        <div className="options">
          {current.options.map((option) => (
            <button
              key={option}
              className={`option ${session.answers[session.currentIndex] === option ? 'selected' : ''}`}
              onClick={() => updateAnswer(option)}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="between questionNav">
          <button className="secondary" onClick={prevQuestion} disabled={session.currentIndex === 0}>Previous</button>
          <button onClick={nextQuestion} disabled={session.currentIndex === TOTAL_QUESTIONS - 1}>Save & Next</button>
        </div>
      </main>
    </section>
  );
}
