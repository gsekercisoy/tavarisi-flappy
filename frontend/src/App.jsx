import React, { useEffect, useState } from 'react';
import { api } from './api.js';

const W = 420, H = 520, GROUND = H - 42;
const G = 1750, FLAP = -500, PIPE_W = 62, GAP_H = 132, R = 13;

export default function App() {
  return (
    <div className="app">
      <h1>🐤 Tavarişi Flappy</h1>
      <p className="lead">Oyun React canvas üzerinde; rekorlar Java REST API'ye (H2) kaydedilir.</p>
      <div className="layout">
        <Game />
        <Leaderboard />
      </div>
    </div>
  );
}

function Game() {
  const cnv = React.useRef(null);
  const g = React.useRef({
    bird: { y: 250, vy: 0 }, pipes: [], score: 0, speed: 128,
    flapped: false, running: false, raf: null, last: 0, frameDone: false
  });
  const [phase, setPhase] = useState('idle');   // idle | running | over
  const [score, setScore] = useState(0);
  const [pipes, setPipesN] = useState(0);
  const [player, setPlayer] = useState(() => localStorage.getItem('flappyPlayer') || '');
  const [subState, setSubState] = useState(''); // '' | sending | sent | err-msg
  const [scoresDirty, setScoresDirty] = useState(0);

  useEffect(() => {
    const c = cnv.current, ctx = c.getContext('2d');
    const S = g.current;

    const draw = () => {
      // gökyüzü
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#38bdf8');
      grad.addColorStop(1, '#7dd3fc');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

      // bulutlar
      ctx.fillStyle = 'rgba(255,255,255,.65)';
      [[70, 90], [210, 60], [330, 120]].forEach(([x, y], i) => {
        const rr = 16 + i * 4;
        ctx.beginPath();
        ctx.arc(x, y, rr, 0, 6.3); ctx.arc(x + rr, y + 4, rr - 4, 0, 6.3); ctx.arc(x - rr, y + 5, rr - 6, 0, 6.3);
        ctx.fill();
      });

      // borular
      S.pipes.forEach(p => {
        ctx.fillStyle = '#16a34a';
        ctx.strokeStyle = '#14532d';
        ctx.lineWidth = 2;
        ctx.fillRect(p.x, 0, PIPE_W, p.gapY);
        ctx.strokeRect(p.x + 1, -2, PIPE_W - 2, p.gapY + 2);
        ctx.fillRect(p.x, p.gapY + GAP_H, PIPE_W, GROUND - p.gapY - GAP_H);
        ctx.strokeRect(p.x + 1, p.gapY + GAP_H, PIPE_W - 2, GROUND - p.gapY - GAP_H + 2);
        // kapaklar
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(p.x - 4, p.gapY - 12, PIPE_W + 8, 12);
        ctx.fillRect(p.x - 4, p.gapY + GAP_H, PIPE_W + 8, 12);
      });

      // yer
      ctx.fillStyle = '#a16207'; ctx.fillRect(0, GROUND, W, H - GROUND);
      ctx.fillStyle = '#ca8a04';
      for (let x = ((S.score * 3) % 24) * -1; x < W; x += 24) ctx.fillRect(x, GROUND, 14, 6);

      // kuş
      const by = S.bird.y;
      ctx.save();
      ctx.translate(90, by);
      const tilt = Math.max(-0.5, Math.min(1.1, S.bird.vy / 600));
      ctx.rotate(tilt);
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#a16207'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.beginPath(); ctx.ellipse(-3, 3, 7, 5, Math.sin(Date.now() / 90) * 0.5, 0, 6.3); ctx.fill(); // kanat
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(5, -4, 3.4, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); ctx.arc(6, -4, 1.6, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#f97316';
      ctx.beginPath(); ctx.moveTo(R - 2, 1); ctx.lineTo(R + 7, 4); ctx.lineTo(R - 2, 7); ctx.fill();
      ctx.restore();

      // skor
      ctx.fillStyle = '#0f172a';
      ctx.font = '800 30px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(String(S.score), W / 2, 52);

      if (S.running === false && phaseNow() === 'idle') {
        ctx.fillStyle = 'rgba(15,23,42,.55)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#e2e8f0'; ctx.font = '700 20px system-ui';
        ctx.fillText('Boşluk / tıkla ile kanat çırp', W / 2, H / 2 - 8);
        ctx.fillText('Borulara ve yere çarpma!', W / 2, H / 2 + 20);
      }
    };

    const phaseNow = () => phase;

    const step = (ts) => {
      const dt = Math.min((ts - S.last) / 1000 || 0, 0.033);
      S.last = ts;

      if (S.running) {
        if (S.flapped) { S.bird.vy = FLAP; S.flapped = false; }
        S.bird.vy = Math.min(S.bird.vy + G * dt, 780);
        S.bird.y += S.bird.vy * dt;

        // borular ilerlet
        S.pipes.forEach(p => p.x -= S.speed * dt);

        // yeni boru
        const lastPipe = S.pipes[S.pipes.length - 1];
        if (!lastPipe || lastPipe.x <= W - 190) {
          S.pipes.push({ x: W + 20, gapY: 70 + Math.random() * (GROUND - GAP_H - 120), passed: false });
        }
        S.pipes = S.pipes.filter(p => p.x > -70);

        // skor + hız
        S.pipes.forEach(p => {
          if (!p.passed && p.x + PIPE_W < 90 - R) {
            p.passed = true;
            S.score++;
            setScore(S.score);
            setPipesN(S.score);
            S.speed = Math.min(210, 128 + S.score * 3);
          }
        });

        // çarpışma
        const bx = 90 - R, byTop = S.bird.y - R, byBot = S.bird.y + R;
        let dead = byBot >= GROUND;
        if (S.bird.y - R < 0) { S.bird.y = R; S.bird.vy = 0; }
        for (const p of S.pipes) {
          if (bx + 2 * R > p.x && bx < p.x + PIPE_W) {
            if (byTop < p.gapY || byBot > p.gapY + GAP_H) { dead = true; break; }
          }
        }
        if (dead) {
          S.running = false;
          if (S.raf) cancelAnimationFrame(S.raf);
          S.raf = null;
          draw();
          setPhase('over');
          return;
        }
      }

      draw();
      S.raf = requestAnimationFrame(step);
    };

    const flap = (e) => {
      if (e) e.preventDefault();
      if (phaseNow() === 'running') S.flapped = true;
    };
    const onKey = (e) => {
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) { flap(e); if (e.code === 'Space') e.preventDefault(); }
    };
    const onPointer = (e) => { flap(e); };

    document.addEventListener('keydown', onKey);
    c.addEventListener('pointerdown', onPointer);

    S.last = performance.now();
    S.raf = requestAnimationFrame(step);

    g.current.start = () => {
      S.bird = { y: 250, vy: 0 };
      S.pipes = []; S.score = 0; S.speed = 128; S.flapped = false;
      setScore(0); setPipesN(0); setSubState('');
      S.running = true;
      setPhase('running');
      if (!S.raf) { S.last = performance.now(); S.raf = requestAnimationFrame(step); }
    };

    return () => {
      document.removeEventListener('keydown', onKey);
      c.removeEventListener('pointerdown', onPointer);
      if (S.raf) cancelAnimationFrame(S.raf);
    };
  }, []);

  const submitScore = async () => {
    setSubState('sending');
    try {
      await api.post('/scores', { player: player.trim() || 'MISAFIR', score, pipes });
      localStorage.setItem('flappyPlayer', player.trim());
      setSubState('sent');
      setScoresDirty(k => k + 1);
      setTimeout(() => setSubState(''), 2500);
    } catch (e) { setSubState(e.message); }
  };

  return (
    <div className="panel game-panel">
      <div className="hud">
        <span>Skor: <b>{score}</b></span>
        <span>Boru: <b>{pipes}</b></span>
      </div>
      <canvas ref={cnv} width={W} height={H} />
      {phase === 'running' && <p className="small">Boşluk / ▲ / W / tıkla — kanat çırp</p>}
      {phase !== 'running' && (
        <button className="btn primary" onClick={() => g.current.start()}>
          {phase === 'over' ? 'Tekrar Oyna' : 'Başla'}
        </button>
      )}
      {phase === 'over' && (
        <div className="submit">
          <b>Uçtu! Skorum: {score} ({pipes} boru)</b>
          <div className="rowi">
            <input placeholder="Oyuncu adı" value={player} maxLength={20}
              onChange={e => setPlayer(e.target.value)} />
            <button className="btn primary" onClick={submitScore} disabled={subState === 'sending'}>
              {subState === 'sending' ? '…' : 'Skoru Kaydet'}
            </button>
          </div>
          {subState === 'sent' && <div className="ok">Skor kaydedildi ✅</div>}
          {subState !== '' && subState !== 'sent' && subState !== 'sending' && <div className="err">{subState}</div>}
        </div>
      )}
    </div>
  );
}

function Leaderboard({ dirty }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    api.get('/scores').then(d => { if (alive) setData(d); }).catch(e => { if (alive) setErr(e.message); });
    const t = setInterval(() => {
      api.get('/scores').then(d => { if (alive) setData(d); }).catch(() => {});
    }, 10000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  useEffect(() => {
    if (dirty) api.get('/scores').then(setData).catch(() => {});
  }, [dirty]);

  if (err) return <div className="panel"><div className="err">{err}</div></div>;
  if (!data) return <div className="panel">Yükleniyor…</div>;

  return (
    <div className="panel">
      <h2>🏆 Skor Tablosu (sunucudan)</h2>
      <table className="tbl">
        <thead><tr><th>#</th><th>Oyuncu</th><th>Skor</th><th>Boru</th></tr></thead>
        <tbody>
          {data.map((s, i) => (
            <tr key={s.id}>
              <td>{i + 1}</td>
              <td>{s.player}</td>
              <td className="num">{s.score}</td>
              <td className="muted">{s.pipes}</td>
            </tr>
          ))}
          {data.length === 0 && <tr><td colSpan={4} className="muted">Henüz skor yok</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
