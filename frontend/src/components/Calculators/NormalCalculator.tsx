import React, { useEffect, useState } from 'react';
import { Delete } from 'lucide-react';

type Op = '+' | '-' | '×' | '÷';
type Token = { type: 'num'; value: string } | { type: 'op'; value: Op };

const OPS: Op[] = ['+', '-', '×', '÷'];

/** Kills the classic 0.1 + 0.2 = 0.30000000000000004 floating-point artifact without
 * pulling in a bignum library — good enough precision for a personal-finance calculator. */
function roundResult(n: number): number {
  if (!Number.isFinite(n)) return n;
  return Math.round((n + Number.EPSILON) * 1e10) / 1e10;
}

/** Two-pass evaluation (×÷ before +-) — NOT naive left-to-right — so "100 + 200 × 2 - 50"
 * correctly gives 450, not 550. */
function evaluateTokens(tokens: Token[]): number {
  const clean = [...tokens];
  if (clean.length && clean[clean.length - 1].type === 'op') clean.pop(); // trailing operator: ignore
  if (clean.length === 0) return 0;

  const flat: (number | Op)[] = clean.map((t) => (t.type === 'num' ? Number(t.value || '0') : t.value));

  const stage1: (number | Op)[] = [];
  let i = 0;
  while (i < flat.length) {
    const cur = flat[i];
    if (cur === '×' || cur === '÷') {
      const prev = Number(stage1.pop());
      const next = Number(flat[i + 1] ?? 0);
      stage1.push(cur === '×' ? prev * next : next === 0 ? NaN : prev / next);
      i += 2;
    } else {
      stage1.push(cur);
      i += 1;
    }
  }

  let total = Number(stage1[0] ?? 0);
  for (let j = 1; j < stage1.length; j += 2) {
    const op = stage1[j];
    const val = Number(stage1[j + 1] ?? 0);
    if (op === '+') total += val;
    else if (op === '-') total -= val;
  }
  return roundResult(total);
}

function tokensToExpression(tokens: Token[]): string {
  return tokens.map((t) => t.value).join(' ');
}

function fmtNum(n: number): string {
  if (!Number.isFinite(n)) return 'Error';
  const s = n.toLocaleString('en-IN', { maximumFractionDigits: 10 });
  return s;
}

interface HistoryEntry { expr: string; result: number }

export const NormalCalculator: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [frozenExpr, setFrozenExpr] = useState<string | null>(null);
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const lastToken = tokens[tokens.length - 1];
  const liveResult = tokens.length > 0 ? evaluateTokens(tokens) : null;

  const startFresh = (firstDigit?: string) => {
    setTokens(firstDigit !== undefined ? [{ type: 'num', value: firstDigit }] : []);
    setFrozenExpr(null);
    setJustEvaluated(false);
  };

  const pressDigit = (d: string) => {
    if (justEvaluated) return startFresh(d);
    setTokens((prev) => {
      if (prev.length === 0 || prev[prev.length - 1].type === 'op') {
        return [...prev, { type: 'num', value: d }];
      }
      const last = prev[prev.length - 1] as { type: 'num'; value: string };
      if (d === '.' && last.value.includes('.')) return prev; // one decimal point per number
      if (last.value === '0' && d !== '.') return [...prev.slice(0, -1), { type: 'num', value: d }];
      return [...prev.slice(0, -1), { type: 'num', value: last.value + d }];
    });
  };

  const pressOp = (op: Op) => {
    if (justEvaluated) {
      // Continue from the previous result, e.g. "= 300" then "+" starts "300 +".
      // pressEquals leaves `tokens` as exactly [{ type: 'num', value: String(result) }].
      const prevResult = (tokens[0] as { type: 'num'; value: string })?.value ?? '0';
      setTokens([{ type: 'num', value: prevResult }, { type: 'op', value: op }]);
      setFrozenExpr(null);
      setJustEvaluated(false);
      return;
    }
    setTokens((prev) => {
      if (prev.length === 0) return prev; // no leading bare operator (use +/- for a negative first number)
      if (prev[prev.length - 1].type === 'op') return [...prev.slice(0, -1), { type: 'op', value: op }];
      return [...prev, { type: 'op', value: op }];
    });
  };

  const pressPercent = () => {
    setTokens((prev) => {
      if (prev.length === 0 || prev[prev.length - 1].type !== 'num') return prev;
      const last = prev[prev.length - 1] as { type: 'num'; value: string };
      const pct = roundResult(Number(last.value || '0') / 100);
      return [...prev.slice(0, -1), { type: 'num', value: String(pct) }];
    });
  };

  const pressPlusMinus = () => {
    setTokens((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      if (last.type !== 'num') return prev;
      const negated = last.value.startsWith('-') ? last.value.slice(1) : `-${last.value}`;
      return [...prev.slice(0, -1), { type: 'num', value: negated }];
    });
  };

  const pressBackspace = () => {
    if (justEvaluated) return startFresh();
    setTokens((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      if (last.type === 'op') return prev.slice(0, -1);
      if (last.value.length <= 1) return prev.slice(0, -1);
      return [...prev.slice(0, -1), { type: 'num', value: last.value.slice(0, -1) }];
    });
  };

  const pressEquals = () => {
    if (tokens.length === 0 || justEvaluated) return;
    const result = evaluateTokens(tokens);
    const expr = tokensToExpression(tokens);
    setFrozenExpr(expr);
    setHistory((h) => [{ expr, result }, ...h].slice(0, 20));
    setTokens([{ type: 'num', value: String(result) }]);
    setJustEvaluated(true);
  };

  const pressClear = () => startFresh();

  const reuseHistory = (entry: HistoryEntry) => {
    setTokens([{ type: 'num', value: String(entry.result) }]);
    setFrozenExpr(null);
    setJustEvaluated(false);
  };

  // Desktop keyboard support
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) return pressDigit(e.key);
      if (e.key === '.') return pressDigit('.');
      if (e.key === '+') return pressOp('+');
      if (e.key === '-') return pressOp('-');
      if (e.key === '*') return pressOp('×');
      if (e.key === '/') { e.preventDefault(); return pressOp('÷'); }
      if (e.key === '%') return pressPercent();
      if (e.key === 'Enter' || e.key === '=') return pressEquals();
      if (e.key === 'Backspace') return pressBackspace();
      if (e.key === 'Escape') return pressClear();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens, justEvaluated]);

  const displayExpr = frozenExpr ?? tokensToExpression(tokens);
  const displayValue = justEvaluated
    ? fmtNum(Number((tokens[0] as any)?.value ?? 0))
    : liveResult !== null && lastToken?.type === 'op'
      ? fmtNum(liveResult) // live preview while an operator is pending
      : tokens.length
        ? (tokens[tokens.length - 1] as any).value || '0'
        : '0';

  const Key: React.FC<{ label: React.ReactNode; onClick: () => void; tone?: 'op' | 'num' | 'action' | 'equals' }> = ({ label, onClick, tone = 'num' }) => (
    <button
      onClick={onClick}
      className={`h-14 rounded-2xl text-lg font-semibold transition-all active:scale-95 ${
        tone === 'equals'
          ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
          : tone === 'op'
            ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
            : tone === 'action'
              ? 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300'
              : 'liquid-glass-card text-gray-900 dark:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Display */}
      <div className="liquid-glass-card rounded-2xl p-5 text-right space-y-1">
        <p className="text-sm text-gray-500 dark:text-slate-400 min-h-[1.25rem] truncate tabular-nums">{displayExpr || ' '}</p>
        <p className="text-4xl font-bold text-gray-900 dark:text-white tabular-nums truncate">{displayValue}</p>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-4 gap-2">
        <Key label="AC" tone="action" onClick={pressClear} />
        <Key label="+/-" tone="action" onClick={pressPlusMinus} />
        <Key label="%" tone="action" onClick={pressPercent} />
        <Key label="÷" tone="op" onClick={() => pressOp('÷')} />

        <Key label="7" onClick={() => pressDigit('7')} />
        <Key label="8" onClick={() => pressDigit('8')} />
        <Key label="9" onClick={() => pressDigit('9')} />
        <Key label="×" tone="op" onClick={() => pressOp('×')} />

        <Key label="4" onClick={() => pressDigit('4')} />
        <Key label="5" onClick={() => pressDigit('5')} />
        <Key label="6" onClick={() => pressDigit('6')} />
        <Key label="-" tone="op" onClick={() => pressOp('-')} />

        <Key label="1" onClick={() => pressDigit('1')} />
        <Key label="2" onClick={() => pressDigit('2')} />
        <Key label="3" onClick={() => pressDigit('3')} />
        <Key label="+" tone="op" onClick={() => pressOp('+')} />

        <Key label="0" onClick={() => pressDigit('0')} />
        <Key label="." onClick={() => pressDigit('.')} />
        <Key label={<Delete className="w-5 h-5 mx-auto" />} tone="action" onClick={pressBackspace} />
        <Key label="=" tone="equals" onClick={pressEquals} />
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="liquid-glass-card rounded-2xl p-4 space-y-1.5">
          <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">History</p>
          <div className="max-h-40 overflow-y-auto space-y-1 no-scrollbar">
            {history.map((h, i) => (
              <button
                key={i}
                onClick={() => reuseHistory(h)}
                className="w-full flex items-center justify-between text-sm px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-left"
              >
                <span className="text-gray-500 dark:text-slate-400 truncate">{h.expr} =</span>
                <span className="font-bold text-gray-900 dark:text-white tabular-nums ml-2">{fmtNum(h.result)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
