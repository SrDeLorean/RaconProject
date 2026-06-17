const ROUND_ORDER = [
  'fase previa', 'ronda previa', 'play-in',
  'ronda de 64', 'ronda de 32', 'ronda de 16', 'octavos',
  'cuartos', 'cuartos de final',
  'semifinal', 'semis',
  'tercer puesto', '3er puesto',
  'final',
];

function getRoundWeight(jornada = '') {
  const j = jornada.toLowerCase();
  const idx = ROUND_ORDER.findIndex(r => j.includes(r));
  return idx === -1 ? 50 : idx;
}

// Simulated partidos from database for Competencia 1
const partidos = [
  { id: 275, jornada: 'Cuartos Copa', local: { id: 1 }, visitante: { id: 2 } },
  { id: 276, jornada: 'Cuartos Copa', local: { id: 3 }, visitante: { id: 4 } },
  { id: 277, jornada: 'Cuartos Copa', local: { id: 5 }, visitante: { id: 6 } },
  { id: 278, jornada: 'Cuartos Copa', local: { id: 7 }, visitante: { id: 8 } },
  { id: 279, jornada: 'Semis Copa', local: null, visitante: null },
  { id: 280, jornada: 'Semis Copa', local: null, visitante: null },
  { id: 281, jornada: 'Gran Final Copa', local: null, visitante: null }
];

const map = {};
partidos.forEach(p => {
  const key = p.jornada || 'Ronda';
  if (!map[key]) map[key] = [];
  map[key].push(p);
});

const rounds = Object.entries(map)
  .sort(([a], [b]) => getRoundWeight(a) - getRoundWeight(b))
  .map(([roundName, roundMatches]) => {
    return [roundName, roundMatches.length];
  });

console.log("ROUNDS AND QUANTITIES:");
console.log(rounds);
