import { useState } from 'react';
import './App.css';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = 'google/gemma-4-31b-it:free';

const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
const FREQUENCIES = ['주 1회', '주 2회', '주 3회', '주 5회', '매일'];
const CONTENT_TYPES = ['롱폼', '숏폼', '혼합'];
const FREQ_TO_COUNT = { '주 1회': 4, '주 2회': 8, '주 3회': 13, '주 5회': 22, '매일': 30 };

const now = new Date();

function buildPrompt(topic, year, month, frequency, contentType) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const count = FREQ_TO_COUNT[frequency] || 8;
  const typeRule = contentType === '혼합' ? '"롱폼" 또는 "숏폼"' : `"${contentType}"`;

  return `당신은 유튜브/소셜미디어 콘텐츠 전략가입니다.
채널 주제: "${topic}"
기간: ${year}년 ${month + 1}월 (1일~${daysInMonth}일)
업로드 빈도: ${frequency} (약 ${count}개 영상)
콘텐츠 유형: ${contentType}

위 조건으로 콘텐츠 캘린더를 JSON으로 작성하세요.

규칙:
- schedule 배열에 정확히 ${count}개 항목
- date는 "${year}-${String(month + 1).padStart(2, '0')}-DD" 형식 (범위: 1~${daysInMonth}일)
- type은 ${typeRule}
- title은 구체적이고 클릭을 유도하는 한국어 제목
- concept은 2-3문장의 영상 컨셉 설명
- 날짜 중복 없이 고르게 분포

아래 JSON만 반환하세요 (다른 텍스트 없이):
{
  "strategy": "이달 운영 전략 요약 (2-3문장)",
  "schedule": [
    { "date": "YYYY-MM-DD", "title": "영상 제목", "type": "롱폼|숏폼", "concept": "컨셉 설명" }
  ]
}`;
}

function parseResponse(raw) {
  console.log('[OpenRouter 원본 응답]', raw);

  // 마크다운 코드블록 제거 (```json ... ``` 또는 ``` ... ```)
  let cleaned = raw.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1').trim();

  // JSON 객체 추출 (가장 바깥쪽 { } 기준)
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) {
    console.error('[파싱 실패] JSON 객체를 찾을 수 없음:', cleaned);
    throw new Error('JSON 파싱 실패');
  }
  cleaned = cleaned.slice(start, end + 1);

  let data;
  try {
    data = JSON.parse(cleaned);
  } catch (e) {
    console.error('[파싱 실패] JSON.parse 오류:', e.message, '\n파싱 시도한 텍스트:', cleaned);
    throw new Error('JSON 파싱 실패');
  }

  if (!Array.isArray(data.schedule)) data.schedule = [];
  if (typeof data.strategy !== 'string') data.strategy = '';
  return data;
}

function toKoreanError(err) {
  try {
    const msg = err?.message || '';
    if (msg.includes('503') || msg.includes('overloaded') || msg.includes('UNAVAILABLE')) {
      return 'Gemini 서버가 일시적으로 혼잡합니다. 잠시 후 다시 시도해주세요.';
    }
    if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
      return 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
    }
    if (msg.includes('API key') || msg.includes('401') || msg.includes('unauthorized')) {
      return 'API 키가 유효하지 않습니다. .env 파일의 VITE_OPENROUTER_API_KEY를 확인해주세요.';
    }
    return msg || '오류가 발생했습니다. 다시 시도해주세요.';
  } catch {
    return '오류가 발생했습니다. 다시 시도해주세요.';
  }
}

function CalendarGrid({ year, month, schedule }) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const scheduleMap = {};
  schedule.forEach(item => {
    const day = parseInt(item.date.split('-')[2], 10);
    if (!scheduleMap[day]) scheduleMap[day] = [];
    scheduleMap[day].push(item);
  });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    const week = cells.slice(i, i + 7);
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  return (
    <div className="calendar">
      <div className="calendar-weekdays">
        {['일', '월', '화', '수', '목', '금', '토'].map(d => (
          <div key={d} className="calendar-weekday">{d}</div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="calendar-week">
          {week.map((day, di) => {
            const items = day ? (scheduleMap[day] || []) : [];
            return (
              <div
                key={di}
                className={`calendar-day${!day ? ' calendar-day--empty' : ''}${items.length ? ' calendar-day--scheduled' : ''}`}
              >
                {day && (
                  <>
                    <span className="calendar-day-num">{day}</span>
                    {items.map((item, idx) => (
                      <span key={idx} className={`calendar-tag calendar-tag--${item.type === '롱폼' ? 'long' : 'short'}`}>
                        {item.type}
                      </span>
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function ScheduleList({ schedule }) {
  const sorted = [...schedule].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <ul className="schedule-list">
      {sorted.map((item, i) => {
        const d = new Date(item.date + 'T00:00:00');
        const dateStr = d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
        return (
          <li key={i} className="schedule-item">
            <div className="schedule-item-left">
              <span className="schedule-date">{dateStr}</span>
              <span className={`schedule-type schedule-type--${item.type === '롱폼' ? 'long' : 'short'}`}>
                {item.type}
              </span>
            </div>
            <div className="schedule-item-right">
              <p className="schedule-title">{item.title}</p>
              <p className="schedule-concept">{item.concept}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function App() {
  const [topic, setTopic] = useState('');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [frequency, setFrequency] = useState('주 2회');
  const [contentType, setContentType] = useState('혼합');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const years = [now.getFullYear(), now.getFullYear() + 1];

  async function generate() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const prompt = buildPrompt(topic, year, month, frequency, contentType);
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Content Calendar',
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error('[OpenRouter 에러 응답]', res.status, errBody);
        throw new Error(`${res.status}`);
      }
      const json = await res.json();
      console.log('[OpenRouter API 응답 전체]', json);
      const raw = json.choices?.[0]?.message?.content || '';
      const data = parseResponse(raw);
      setResult(data);
    } catch (err) {
      setError(toKoreanError(err));
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!topic.trim()) return;
    generate();
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="badge">
          <span>📅</span> AI Content Calendar
        </div>
        <h1>콘텐츠 캘린더 생성기</h1>
        <p>채널 주제와 월을 입력하면 한 달치 업로드 스케줄을 자동 생성합니다</p>
      </header>

      <form className="input-form" onSubmit={handleSubmit}>
        <div className="dropdowns">
          <label className="dropdown-label">
            <span>연도</span>
            <select value={year} onChange={e => setYear(Number(e.target.value))} disabled={loading}>
              {years.map(y => <option key={y} value={y}>{y}년</option>)}
            </select>
          </label>
          <label className="dropdown-label">
            <span>월</span>
            <select value={month} onChange={e => setMonth(Number(e.target.value))} disabled={loading}>
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </label>
          <label className="dropdown-label">
            <span>업로드 빈도</span>
            <select value={frequency} onChange={e => setFrequency(e.target.value)} disabled={loading}>
              {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </label>
          <label className="dropdown-label">
            <span>콘텐츠 유형</span>
            <select value={contentType} onChange={e => setContentType(e.target.value)} disabled={loading}>
              {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
        </div>

        <div className="textarea-wrap">
          <textarea
            rows={3}
            placeholder="채널 주제를 입력하세요 (예: 30대 직장인을 위한 재테크, 비건 홈쿠킹, 게임 공략...)"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            disabled={loading}
          />
        </div>

        {error && (
          <div className="error-box">
            <span>{error}</span>
            <button className="retry-btn" type="button" onClick={generate} disabled={loading}>
              다시 시도
            </button>
          </div>
        )}

        <button className="submit-btn" type="submit" disabled={!topic.trim() || loading}>
          {loading ? (
            <>
              <span className="btn-spinner" />
              캘린더 생성 중...
            </>
          ) : (
            '📅 캘린더 생성'
          )}
        </button>
      </form>

      {loading && (
        <div className="loading-card">
          <div className="dot-pulse">
            <span /><span /><span />
          </div>
          <p>Gemini가 {year}년 {month + 1}월 콘텐츠 스케줄을 생성하고 있습니다...</p>
        </div>
      )}

      {result && (
        <div className="result">
          <div className="card">
            <div className="card-header">
              <div className="card-label">
                <span className="card-icon">💡</span>
                <h2>이달의 운영 전략</h2>
              </div>
            </div>
            <div className="card-body">
              <p className="body-text">{result.strategy}</p>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-label">
                <span className="card-icon">📅</span>
                <h2>{year}년 {month + 1}월 캘린더</h2>
              </div>
              <div className="legend">
                <span className="legend-item legend-item--long">롱폼</span>
                <span className="legend-item legend-item--short">숏폼</span>
              </div>
            </div>
            <div className="card-body">
              <CalendarGrid year={year} month={month} schedule={result.schedule} />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-label">
                <span className="card-icon">📋</span>
                <h2>업로드 스케줄 ({result.schedule.length}개)</h2>
              </div>
            </div>
            <div className="card-body">
              <ScheduleList schedule={result.schedule} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
