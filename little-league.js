const statSets = {
  batting: [
    { key: 'ab', label: 'AB', type: 'count', higherIsBetter: true },
    { key: 'avg', label: 'AVG', type: 'rate', higherIsBetter: true },
    { key: 'ops', label: 'OPS', type: 'rate', higherIsBetter: true },
    { key: 'doubles', label: '2B', type: 'count', higherIsBetter: true },
    { key: 'triples', label: '3B', type: 'count', higherIsBetter: true },
    { key: 'hr', label: 'HR', type: 'count', higherIsBetter: true },
    { key: 'bb', label: 'BB', type: 'count', higherIsBetter: true },
    { key: 'so', label: 'SO', type: 'count', higherIsBetter: false },
    { key: 'runs', label: 'R', type: 'count', higherIsBetter: true },
    { key: 'rbi', label: 'RBI', type: 'count', higherIsBetter: true },
    { key: 'sb', label: 'SB', type: 'count', higherIsBetter: true }
  ],
  pitching: [
    { key: 'innings', label: 'IP', type: 'innings', higherIsBetter: true },
    { key: 'pitches', label: '#P', type: 'count', higherIsBetter: true },
    { key: 'hAllowed', label: 'H', type: 'count', higherIsBetter: false },
    { key: 'runsAllowed', label: 'R', type: 'count', higherIsBetter: false },
    { key: 'earnedRuns', label: 'ER', type: 'count', higherIsBetter: false },
    { key: 'walksAllowed', label: 'BB', type: 'count', higherIsBetter: false },
    { key: 'strikeouts', label: 'K', type: 'count', higherIsBetter: true },
    { key: 'kLooking', label: 'K-L', type: 'count', higherIsBetter: true },
    { key: 'era', label: 'ERA', type: 'rate', higherIsBetter: false },
    { key: 'whip', label: 'WHIP', type: 'rate', higherIsBetter: false },
    { key: 'baa', label: 'BAA', type: 'rate', higherIsBetter: false }
  ],
  fielding: [
    { key: 'tc', label: 'TC', type: 'count', higherIsBetter: true },
    { key: 'a', label: 'A', type: 'count', higherIsBetter: true },
    { key: 'po', label: 'PO', type: 'count', higherIsBetter: true },
    { key: 'e', label: 'E', type: 'count', higherIsBetter: false },
    { key: 'dp', label: 'DP', type: 'count', higherIsBetter: true }
  ]
};

const headerAliases = {
  player_name: 'player_name',
  player: 'player_name',
  name: 'player_name',
  team: 'team',
  team_name: 'team',
  source: 'source',
  roster_group: 'source',
  player_id: 'player_id',
  g: 'g',
  games: 'g',
  pa: 'pa',
  plate_appearances: 'pa',
  ab: 'ab',
  h: 'h',
  hits: 'h',
  doubles: 'doubles',
  '2b': 'doubles',
  triples: 'triples',
  '3b': 'triples',
  hr: 'hr',
  home_runs: 'hr',
  rbi: 'rbi',
  runs: 'runs',
  bb: 'bb',
  walks: 'bb',
  hbp: 'hbp',
  sf: 'sf',
  sacrifice_flies: 'sf',
  so: 'so',
  strikeouts: 'so',
  sb: 'sb',
  stolen_bases: 'sb',
  ip_outs: 'ipOuts',
  ipouts: 'ipOuts',
  bf: 'bf',
  batters_faced: 'bf',
  h_allowed: 'hAllowed',
  hits_allowed: 'hAllowed',
  er: 'er',
  earned_runs: 'er',
  bb_allowed: 'bbAllowed',
  walks_allowed: 'bbAllowed',
  so_pitched: 'soPitched',
  strikeouts_pitched: 'soPitched',
  strikes: 'strikes',
  pitches: 'pitches'
};

const numericFields = [
  'gp', 'pa', 'ab', 'h', 'singles', 'doubles', 'triples', 'hr', 'rbi', 'runs', 'bb', 'hbp', 'sf', 'so', 'sb',
  'ipOuts', 'pitches', 'hAllowed', 'r', 'er', 'bb', 'kLooking', 'wins', 'losses', 'abAgainst',
  'tc', 'a', 'po', 'e', 'dp'
];

const state = {
  seedData: null,
  data: null,
  importedFiles: [],
  page: document.body.dataset.page || 'league',
  family: 'batting',
  search: '',
  teamFilter: 'all',
  selectScope: 'combined',
  sortKey: 'ab'
};

const pageTitle = document.getElementById('statsPageTitle');
const updatedAtEl = document.getElementById('leagueUpdatedAt');
const importStatus = document.getElementById('importStatus');
const importedFiles = document.getElementById('importedFiles');
const teamFiles = document.getElementById('teamFiles');
const resetImports = document.getElementById('resetImports');
const copyLeagueLink = document.getElementById('copyLeagueLink');
const teamFilter = document.getElementById('teamFilter');
const playerSearch = document.getElementById('playerSearch');
const statsTable = document.getElementById('statsTable');
const statsEmpty = document.getElementById('statsEmpty');
const scopeBar = document.getElementById('scopeBar');

function blankHitting() {
  return { gp: 0, pa: 0, ab: 0, h: 0, singles: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, runs: 0, bb: 0, hbp: 0, sf: 0, so: 0, sb: 0 };
}

function blankPitching() {
  return { ipOuts: 0, pitches: 0, hAllowed: 0, r: 0, er: 0, bb: 0, so: 0, kLooking: 0, wins: 0, losses: 0, abAgainst: 0 };
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatDate(value) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRate(value) {
  if (!Number.isFinite(value)) return '--';
  return value.toFixed(3).replace(/^0(?=\.)/, '.');
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return '--';
  return `${(value * 100).toFixed(1)}%`;
}

function formatInningsFromOuts(outs) {
  if (!Number.isFinite(outs) || outs <= 0) return '0.0';
  const whole = Math.floor(outs / 3);
  const remainder = outs % 3;
  return `${whole}.${remainder}`;
}

function formatValue(type, value) {
  if (value === Infinity) return '∞';
  if (!Number.isFinite(value)) return '--';
  if (type === 'rate') return formatRate(value);
  if (type === 'percent') return formatPercent(value);
  if (type === 'innings') return formatInningsFromOuts(Math.round(value * 3));
  return value.toLocaleString();
}

function sumStats(base, incoming) {
  const next = { ...base };
  for (const [key, value] of Object.entries(incoming || {})) {
    next[key] = (Number(next[key]) || 0) + (Number(value) || 0);
  }
  return next;
}

function normalizeData(raw) {
  const data = raw && typeof raw === 'object' ? deepClone(raw) : {};
  data.meta = data.meta || {};
  data.teams = Array.isArray(data.teams) ? data.teams : [];
  data.littleLeaguePlayers = Array.isArray(data.littleLeaguePlayers) ? data.littleLeaguePlayers : [];
  data.selectTeam = data.selectTeam || { name: 'Select Team', players: [] };
  data.selectTeam.players = Array.isArray(data.selectTeam.players) ? data.selectTeam.players : [];

  for (const player of data.littleLeaguePlayers) {
    player.playerId = player.playerId || slugify(player.name);
    player.hitting = sumStats(blankHitting(), player.hitting || {});
    player.pitching = sumStats(blankPitching(), player.pitching || {});
    player.fielding = sumStats({ tc: 0, a: 0, po: 0, e: 0, dp: 0 }, player.fielding || {});
  }

  for (const player of data.selectTeam.players) {
    player.playerId = player.playerId || slugify(player.name);
    player.select = player.select || {};
    player.select.hitting = sumStats(blankHitting(), player.select.hitting || {});
    player.select.pitching = sumStats(blankPitching(), player.select.pitching || {});
    player.select.fielding = sumStats({ tc: 0, a: 0, po: 0, e: 0, dp: 0 }, player.select.fielding || {});
  }

  return data;
}

function teamNameMap(data) {
  return new Map((data.teams || []).map(team => [team.id, team.name]));
}

function deriveHitting(stats) {
  const singles = Math.max((stats.h || 0) - (stats.doubles || 0) - (stats.triples || 0) - (stats.hr || 0), 0);
  const totalBases = singles + ((stats.doubles || 0) * 2) + ((stats.triples || 0) * 3) + ((stats.hr || 0) * 4);
  const avg = stats.ab ? stats.h / stats.ab : NaN;
  const obpDenominator = (stats.ab || 0) + (stats.bb || 0) + (stats.hbp || 0) + (stats.sf || 0);
  const obp = obpDenominator ? ((stats.h || 0) + (stats.bb || 0) + (stats.hbp || 0)) / obpDenominator : NaN;
  const slg = stats.ab ? totalBases / stats.ab : NaN;
  const ops = Number.isFinite(obp) && Number.isFinite(slg) ? obp + slg : NaN;
  return {
    ab: stats.ab || 0,
    avg,
    ops,
    doubles: stats.doubles || 0,
    triples: stats.triples || 0,
    hr: stats.hr || 0,
    rbi: stats.rbi || 0,
    runs: stats.runs || 0,
    bb: stats.bb || 0,
    so: stats.so || 0,
    sb: stats.sb || 0
  };
}

function derivePitching(stats) {
  const innings = (stats.ipOuts || 0) / 3;
  const era = stats.ipOuts ? ((stats.er || 0) * 27) / stats.ipOuts : NaN;
  const whip = stats.ipOuts ? (((stats.hAllowed || 0) + (stats.bb || 0)) * 3) / stats.ipOuts : NaN;
  const baa = stats.abAgainst ? (stats.hAllowed || 0) / stats.abAgainst : NaN;
  return {
    innings,
    pitches: stats.pitches || 0,
    hAllowed: stats.hAllowed || 0,
    runsAllowed: stats.r || 0,
    earnedRuns: stats.er || 0,
    walksAllowed: stats.bb || 0,
    strikeouts: stats.so || 0,
    kLooking: stats.kLooking || 0,
    era,
    whip,
    baa
  };
}

function getStatDefinitions() {
  return statSets[state.family];
}

function getSortDefinition() {
  return getStatDefinitions().find(stat => stat.key === state.sortKey) || getStatDefinitions()[0];
}

function getComparableValue(definition, derived) {
  const value = derived[definition.key];
  if (value === Infinity) return Number.MAX_SAFE_INTEGER;
  if (Number.isNaN(value)) return definition.higherIsBetter ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  return value;
}

function littleLeagueRows(data) {
  const teams = teamNameMap(data);
  return data.littleLeaguePlayers.map(player => ({
    playerId: player.playerId,
    name: player.name,
    teamId: player.teamId,
    teamName: teams.get(player.teamId) || player.teamId || 'Unassigned',
    hitting: player.hitting,
    pitching: player.pitching,
    fielding: player.fielding
  }));
}

function selectRows(data, scope) {
  const teams = teamNameMap(data);
  const littleLookup = new Map(data.littleLeaguePlayers.map(player => [player.playerId, player]));

  return data.selectTeam.players.map(player => {
    const little = littleLookup.get(player.playerId);
    const littleHitting = little ? little.hitting : blankHitting();
    const littlePitching = little ? little.pitching : blankPitching();
    const littleFielding = little ? little.fielding : { tc: 0, a: 0, po: 0, e: 0, dp: 0 };
    const selectHitting = player.select?.hitting || blankHitting();
    const selectPitching = player.select?.pitching || blankPitching();
    const selectFielding = player.select?.fielding || { tc: 0, a: 0, po: 0, e: 0, dp: 0 };
    const hitting = scope === 'combined' ? sumStats(littleHitting, selectHitting) : scope === 'littleLeague' ? littleHitting : selectHitting;
    const pitching = scope === 'combined' ? sumStats(littlePitching, selectPitching) : scope === 'littleLeague' ? littlePitching : selectPitching;
    const fielding = scope === 'combined' ? sumStats(littleFielding, selectFielding) : scope === 'littleLeague' ? littleFielding : selectFielding;

    return {
      playerId: player.playerId,
      name: player.name,
      teamId: player.littleLeagueTeamId || little?.teamId || 'unassigned',
      teamName: teams.get(player.littleLeagueTeamId || little?.teamId) || 'Independent',
      hitting,
      pitching,
      fielding
    };
  });
}

function getRows() {
  const sourceRows = state.page === 'select' ? selectRows(state.data, state.selectScope) : littleLeagueRows(state.data);
  return sourceRows.filter(row => {
    const matchesSearch = !state.search || row.name.toLowerCase().includes(state.search);
    const matchesTeam = state.page === 'select' || state.teamFilter === 'all' || row.teamId === state.teamFilter;
    return matchesSearch && matchesTeam;
  });
}

function getDerived(row, family = state.family) {
  if (family === 'batting') return deriveHitting(row.hitting);
  if (family === 'pitching') return derivePitching(row.pitching);
  return {
    tc: row.fielding?.tc || 0,
    a: row.fielding?.a || 0,
    po: row.fielding?.po || 0,
    e: row.fielding?.e || 0,
    dp: row.fielding?.dp || 0
  };
}

function sortRows(rows) {
  const definition = getSortDefinition();
  const direction = definition.higherIsBetter ? -1 : 1;

  return [...rows].sort((a, b) => {
    const delta = getComparableValue(definition, getDerived(a)) - getComparableValue(definition, getDerived(b));
    if (delta !== 0) return delta * direction;
    return a.name.localeCompare(b.name);
  });
}

function renderImportedFiles() {
  if (!importedFiles) return;
  importedFiles.innerHTML = state.importedFiles.length
    ? state.importedFiles.map(file => `<div class="file-pill">${file}</div>`).join('')
    : '<div class="file-pill">Using seed sample data</div>';
}

function renderTeamFilter() {
  if (!teamFilter || state.page === 'select') return;
  const teams = state.data.teams || [];
  teamFilter.innerHTML = [
    '<option value="all">All Teams</option>',
    ...teams.map(team => `<option value="${team.id}">${team.name}</option>`)
  ].join('');
  teamFilter.value = teams.some(team => team.id === state.teamFilter) ? state.teamFilter : 'all';
  state.teamFilter = teamFilter.value;
}

function renderScopeBar() {
  if (!scopeBar) return;
  const scopes = [
    { key: 'combined', label: 'Combined' },
    { key: 'littleLeague', label: 'Little League' },
    { key: 'select', label: 'Select Only' }
  ];
  scopeBar.innerHTML = scopes.map(scope => `
    <button class="stat-tab ${scope.key === state.selectScope ? 'is-active' : ''}" type="button" data-scope="${scope.key}">
      ${scope.label}
    </button>
  `).join('');
}

function renderTabBars() {
  const familyTabs = document.getElementById('familyTabs');
  if (familyTabs) {
    familyTabs.innerHTML = [
      { key: 'batting', label: 'Batting' },
      { key: 'pitching', label: 'Pitching' },
      { key: 'fielding', label: 'Fielding' }
    ].map(family => `
      <button class="stat-tab ${family.key === state.family ? 'is-active' : ''}" type="button" data-family="${family.key}">
        ${family.label}
      </button>
    `).join('');
  }
  renderScopeBar();
}

function renderTable(rows) {
  const definitions = getStatDefinitions();
  const sortedRows = sortRows(rows);
  const thead = statsTable.querySelector('thead');
  const tbody = statsTable.querySelector('tbody');

  thead.innerHTML = `
    <tr>
      <th class="sticky-col sticky-col--head sticky-name-col">Player</th>
      ${definitions.map(stat => `
        <th>
          <button class="table-button ${stat.key === state.sortKey ? 'is-active' : ''}" type="button" data-sort-key="${stat.key}">
            ${stat.label}${stat.key === state.sortKey ? '<span class="sort-arrow">↓</span>' : ''}
          </button>
        </th>
      `).join('')}
    </tr>
  `;

  tbody.innerHTML = sortedRows.map(row => {
    const derived = getDerived(row);
    return `
      <tr>
        <td class="sticky-col sticky-name-col">
          <div class="player-link">
            <span>${row.name}</span>
            <small>${row.teamName}</small>
          </div>
        </td>
        ${definitions.map(stat => `<td>${formatValue(stat.type, derived[stat.key])}</td>`).join('')}
      </tr>
    `;
  }).join('');

  statsEmpty.classList.toggle('hidden', sortedRows.length > 0);
}

function renderPage() {
  const rows = getRows();
  if (pageTitle) {
    pageTitle.textContent = state.page === 'select'
      ? 'MILL Majors Statistics'
      : 'MI 11U Statistics';
  }
  updatedAtEl.textContent = `Updated: ${formatDate(state.data.meta.updatedAt)}`;
  renderImportedFiles();
  renderTeamFilter();
  renderTabBars();
  renderTable(rows);
}

function normalizeHeaders(headers) {
  return headers.map(header => headerAliases[slugify(header).replace(/-/g, '_')] || slugify(header).replace(/-/g, '_'));
}

function parseCsvRows(text) {
  const rows = [];
  let current = '';
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(current);
      current = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(current);
      if (row.some(cell => cell.trim() !== '')) rows.push(row);
      current = '';
      row = [];
      continue;
    }

    current += char;
  }

  if (current.length || row.length) {
    row.push(current);
    if (row.some(cell => cell.trim() !== '')) rows.push(row);
  }

  return rows;
}

function parseCsv(text) {
  const rows = parseCsvRows(text);
  if (!rows.length) return [];
  const headers = normalizeHeaders(rows[0]);
  return rows.slice(1).map(cells => {
    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = cells[index] ?? '';
    });
    return entry;
  });
}

function parseImportedText(name, text) {
  if (name.toLowerCase().endsWith('.json')) {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.players)) return parsed.players;
    throw new Error('JSON imports must be an array of player rows or an object with a players array.');
  }
  if (text.includes('Batting') && text.includes('Pitching') && text.includes('Fielding')) {
    return parseGameChangerCsv(text, name);
  }
  return parseCsv(text);
}

function inferSourceFromFilename(name) {
  const lower = name.toLowerCase();
  if (lower.includes('11u') || lower.includes('maroon') || lower.includes('select')) {
    return { type: 'select', label: 'MI 11U Maroon' };
  }
  if (lower.includes('dodgers')) return { type: 'littleLeague', label: 'Dodgers' };
  if (lower.includes('padres')) return { type: 'littleLeague', label: 'Padres' };
  if (lower.includes('yankees')) return { type: 'littleLeague', label: 'Yankees' };
  if (lower.includes('red sox')) return { type: 'littleLeague', label: 'Red Sox' };
  return { type: 'littleLeague', label: 'League Team' };
}

function parseGameChangerCsv(text, name) {
  const rows = parseCsvRows(text);
  if (rows.length < 2) return [];
  const sectionRow = rows[0];
  const headerRow = rows[1];
  const source = inferSourceFromFilename(name);
  const qualifiedHeaders = [];
  let activeSection = 'meta';

  headerRow.forEach((header, index) => {
    const sectionName = (sectionRow[index] || '').trim();
    if (sectionName) activeSection = sectionName;
    if (index < 3) qualifiedHeaders.push(header);
    else qualifiedHeaders.push(`${activeSection}:${header}`);
  });

  return rows.slice(2)
    .filter(row => row[0] !== 'Totals' && row[0] !== 'Glossary')
    .map(row => {
      const entry = {};
      qualifiedHeaders.forEach((header, index) => {
        entry[header] = row[index] ?? '';
      });
      const first = (entry.First || '').trim();
      const last = (entry.Last || '').trim();
      const playerName = `${first} ${last}`.trim();
      if (!playerName) return null;

      const hAllowed = toNumber(entry['Pitching:H']);
      const baa = Number(entry['Pitching:BAA']);
      const abAgainst = Number.isFinite(baa) && baa > 0 && hAllowed > 0 ? Math.round(hAllowed / baa) : 0;

      return {
        playerId: slugify(playerName),
        name: playerName,
        teamId: slugify(source.label),
        teamName: source.label,
        sourceType: source.type,
        hitting: {
          gp: toNumber(entry['Batting:GP']),
          pa: toNumber(entry['Batting:PA']),
          ab: toNumber(entry['Batting:AB']),
          h: toNumber(entry['Batting:H']),
          singles: toNumber(entry['Batting:1B']),
          doubles: toNumber(entry['Batting:2B']),
          triples: toNumber(entry['Batting:3B']),
          hr: toNumber(entry['Batting:HR']),
          rbi: toNumber(entry['Batting:RBI']),
          runs: toNumber(entry['Batting:R']),
          bb: toNumber(entry['Batting:BB']),
          so: toNumber(entry['Batting:SO']),
          sb: toNumber(entry['Batting:SB']),
          hbp: toNumber(entry['Batting:HBP']),
          sf: toNumber(entry['Batting:SF'])
        },
        pitching: {
          ipOuts: ipToOuts(entry['Pitching:IP']),
          pitches: toNumber(entry['Pitching:#P']),
          hAllowed,
          r: toNumber(entry['Pitching:R']),
          er: toNumber(entry['Pitching:ER']),
          bb: toNumber(entry['Pitching:BB']),
          so: toNumber(entry['Pitching:SO']),
          kLooking: toNumber(entry['Pitching:K-L']),
          wins: toNumber(entry['Pitching:W']),
          losses: toNumber(entry['Pitching:L']),
          abAgainst
        },
        fielding: {
          tc: toNumber(entry['Fielding:TC']),
          a: toNumber(entry['Fielding:A']),
          po: toNumber(entry['Fielding:PO']),
          e: toNumber(entry['Fielding:E']),
          dp: toNumber(entry['Fielding:DP'])
        }
      };
    })
    .filter(Boolean);
}

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeImportRow(row) {
  const normalized = {};
  for (const [key, value] of Object.entries(row || {})) {
    const canonical = headerAliases[key] || key;
    normalized[canonical] = typeof value === 'string' ? value.trim() : value;
  }
  for (const field of numericFields) {
    normalized[field] = toNumber(normalized[field]);
  }
  normalized.player_name = normalized.player_name || normalized.name || '';
  normalized.team = normalized.team || 'unassigned';
  normalized.source = slugify(normalized.source || 'little-league').replace(/-/g, '');
  normalized.player_id = normalized.player_id || slugify(normalized.player_name);
  return normalized;
}

function ensureTeam(data, teamName) {
  const teamId = slugify(teamName);
  if (!data.teams.some(team => team.id === teamId)) {
    data.teams.push({ id: teamId, name: teamName });
  }
  return teamId;
}

function mergeImportedRows(rows) {
  const next = deepClone(state.data || state.seedData);
  const littleMap = new Map(next.littleLeaguePlayers.map(player => [player.playerId, player]));
  const selectMap = new Map(next.selectTeam.players.map(player => [player.playerId, player]));

  for (const rawRow of rows) {
    if (rawRow && rawRow.hitting && rawRow.pitching && rawRow.fielding) {
      if (rawRow.sourceType === 'select') {
        const existing = selectMap.get(rawRow.playerId) || {
          playerId: rawRow.playerId,
          name: rawRow.name,
          littleLeagueTeamId: null,
          select: { hitting: blankHitting(), pitching: blankPitching(), fielding: { tc: 0, a: 0, po: 0, e: 0, dp: 0 } }
        };
        existing.name = rawRow.name;
        existing.select.hitting = sumStats(existing.select.hitting, rawRow.hitting);
        existing.select.pitching = sumStats(existing.select.pitching, rawRow.pitching);
        existing.select.fielding = sumStats(existing.select.fielding, rawRow.fielding);
        selectMap.set(rawRow.playerId, existing);
      } else {
        ensureTeam(next, rawRow.teamName);
        const existing = littleMap.get(rawRow.playerId) || {
          playerId: rawRow.playerId,
          name: rawRow.name,
          teamId: rawRow.teamId,
          hitting: blankHitting(),
          pitching: blankPitching(),
          fielding: { tc: 0, a: 0, po: 0, e: 0, dp: 0 }
        };
        existing.name = rawRow.name;
        existing.teamId = rawRow.teamId;
        existing.hitting = sumStats(existing.hitting, rawRow.hitting);
        existing.pitching = sumStats(existing.pitching, rawRow.pitching);
        existing.fielding = sumStats(existing.fielding || { tc: 0, a: 0, po: 0, e: 0, dp: 0 }, rawRow.fielding);
        littleMap.set(rawRow.playerId, existing);
      }
      continue;
    }

    const row = normalizeImportRow(rawRow);
    if (!row.player_name) continue;
    const teamId = ensureTeam(next, row.team);
    const hitting = {
      gp: row.g || row.gp, pa: row.pa, ab: row.ab, h: row.h, singles: row.singles || 0, doubles: row.doubles, triples: row.triples, hr: row.hr,
      rbi: row.rbi, runs: row.runs, bb: row.bb, hbp: row.hbp, sf: row.sf, so: row.so, sb: row.sb
    };
    const pitching = {
      ipOuts: row.ipOuts, pitches: row.pitches, hAllowed: row.hAllowed, r: row.r || 0, er: row.er, bb: row.bbAllowed || row.bb || 0,
      so: row.soPitched || row.so || 0, kLooking: row.kLooking || 0, wins: row.wins || 0, losses: row.losses || 0, abAgainst: row.abAgainst || 0
    };
    const fielding = { tc: row.tc || 0, a: row.a || 0, po: row.po || 0, e: row.e || 0, dp: row.dp || 0 };

    if (row.source === 'select') {
      const existing = selectMap.get(row.player_id) || {
        playerId: row.player_id,
        name: row.player_name,
        littleLeagueTeamId: teamId,
        select: { hitting: blankHitting(), pitching: blankPitching(), fielding: { tc: 0, a: 0, po: 0, e: 0, dp: 0 } }
      };
      existing.name = row.player_name;
      existing.littleLeagueTeamId = existing.littleLeagueTeamId || teamId;
      existing.select.hitting = sumStats(existing.select.hitting, hitting);
      existing.select.pitching = sumStats(existing.select.pitching, pitching);
      existing.select.fielding = sumStats(existing.select.fielding, fielding);
      selectMap.set(row.player_id, existing);
      continue;
    }

    const existing = littleMap.get(row.player_id) || {
      playerId: row.player_id,
      name: row.player_name,
      teamId,
      hitting: blankHitting(),
      pitching: blankPitching(),
      fielding: { tc: 0, a: 0, po: 0, e: 0, dp: 0 }
    };
    existing.name = row.player_name;
    existing.teamId = teamId;
    existing.hitting = sumStats(existing.hitting, hitting);
    existing.pitching = sumStats(existing.pitching, pitching);
    existing.fielding = sumStats(existing.fielding, fielding);
    littleMap.set(row.player_id, existing);
  }

  next.littleLeaguePlayers = Array.from(littleMap.values());
  next.selectTeam.players = Array.from(selectMap.values());
  next.meta.updatedAt = new Date().toISOString();
  state.data = normalizeData(next);
}

async function handleFiles(fileList) {
  const rows = [];
  const names = [];
  for (const file of Array.from(fileList || [])) {
    const text = await file.text();
    rows.push(...parseImportedText(file.name, text));
    names.push(file.name);
  }
  mergeImportedRows(rows);
  state.importedFiles = [...state.importedFiles, ...names];
  importStatus.textContent = `${rows.length} row${rows.length === 1 ? '' : 's'} merged into the dashboard preview`;
  renderPage();
}

async function copyShareLink() {
  const url = window.location.href;
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    importStatus.textContent = 'Share link copied';
    return;
  }
  importStatus.textContent = `Share this URL: ${url}`;
}

function wireEvents() {
  document.addEventListener('click', async event => {
    const familyButton = event.target.closest('[data-family]');
    if (familyButton) {
      state.family = familyButton.dataset.family;
      state.sortKey = getStatDefinitions()[0].key;
      renderPage();
      return;
    }

    const sortButton = event.target.closest('[data-sort-key]');
    if (sortButton) {
      state.sortKey = sortButton.dataset.sortKey;
      renderPage();
      return;
    }

    const scopeButton = event.target.closest('[data-scope]');
    if (scopeButton) {
      state.selectScope = scopeButton.dataset.scope;
      renderPage();
      return;
    }
  });

  if (teamFiles) {
    teamFiles.addEventListener('change', async event => {
      if (!event.target.files?.length) return;
      try {
        await handleFiles(event.target.files);
      } catch (error) {
        importStatus.textContent = error.message || 'Import failed';
      }
    });
  }

  if (resetImports) {
    resetImports.addEventListener('click', () => {
      state.data = normalizeData(state.seedData);
      state.importedFiles = [];
      if (teamFiles) teamFiles.value = '';
      importStatus.textContent = 'Reset to sample seed data';
      renderPage();
    });
  }

  if (copyLeagueLink) {
    copyLeagueLink.addEventListener('click', async () => {
      try {
        await copyShareLink();
      } catch {
        importStatus.textContent = 'Unable to copy link on this browser';
      }
    });
  }

  if (teamFilter) {
    teamFilter.addEventListener('change', event => {
      state.teamFilter = event.target.value;
      renderPage();
    });
  }

  if (playerSearch) {
    playerSearch.addEventListener('input', event => {
      state.search = event.target.value.trim().toLowerCase();
      renderPage();
    });
  }
}

async function init() {
  const seeded = window.__LITTLE_LEAGUE_DATA__;
  if (seeded) {
    state.seedData = normalizeData(seeded);
    state.data = normalizeData(seeded);
  } else {
    const response = await fetch('little-league-data.json');
    const json = await response.json();
    state.seedData = normalizeData(json);
    state.data = normalizeData(json);
  }
  wireEvents();
  renderPage();
}

init().catch(() => {
  if (importStatus) importStatus.textContent = 'Unable to load dashboard seed data';
});
