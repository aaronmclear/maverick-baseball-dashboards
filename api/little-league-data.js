const fs = require('fs/promises');
const path = require('path');

const { put, list } = require('@vercel/blob');
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const BLOB_KEY = 'little-league/data.json';
const IS_VERCEL = Boolean(process.env.VERCEL);

const lakeMonstersRosterIds = [
  'kellen-marshall',
  'william-tong',
  'maverick-mclear',
  'jack-stangel',
  'isaiah-kirtman',
  'tyler-wu',
  'charlie-gregory',
  'jasper-crosby',
  'holden-norman',
  'jordan-banchero',
  'skye-martin',
  'tristan-hoefer'
];

const springRosterIds = [
  'kellen-marshall',
  'ymir-skulason',
  'william-tong',
  'maverick-mclear',
  'jack-stangel',
  'isaiah-kirtman',
  'tyler-wu',
  'charlie-gregory',
  'jasper-crosby',
  'holden-norman',
  'eli-stangel',
  'tanner-bloom'
];

const selectTeamDefinitions = [
  {
    id: 'fall-league',
    name: 'Fall League',
    guestIds: ['eli-stangel', 'tanner-bloom', 'jordan-banchero']
  },
  {
    id: 'spring-league',
    name: 'Spring League',
    rosterIds: springRosterIds,
    guestIds: ['eli-stangel', 'tanner-bloom']
  },
  { id: 'lake-monsters', name: 'Lake Monsters', rosterIds: lakeMonstersRosterIds },
  { id: '11u-all-stars', name: '11U All Stars', rosterIds: lakeMonstersRosterIds }
];

const selectRosterNames = {
  'kellen-marshall': 'Kellen Marshall',
  'william-tong': 'William Tong',
  'maverick-mclear': 'Maverick McLear',
  'jack-stangel': 'Jack Stangel',
  'isaiah-kirtman': 'Isaiah Kirtman',
  'tyler-wu': 'Tyler Wu',
  'charlie-gregory': 'Charlie Gregory',
  'jasper-crosby': 'Jasper Crosby',
  'holden-norman': 'Holden Norman',
  'jordan-banchero': 'Jordan Banchero',
  'skye-martin': 'Skye Martin',
  'tristan-hoefer': 'Tristan Hoefer',
  'ymir-skulason': 'Ymir Skulason',
  'eli-stangel': 'Eli Stangel',
  'tanner-bloom': 'Tanner Bloom'
};

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function blankHitting() {
  return { gp: 0, pa: 0, ab: 0, h: 0, singles: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, runs: 0, bb: 0, hbp: 0, sf: 0, so: 0, sb: 0, qab: 0, qabPct: 0, ldPct: 0, fbPct: 0, gbPct: 0, babip: 0 };
}

function blankPitching() {
  return { gp: 0, ipOuts: 0, pitches: 0, bf: 0, strikePct: 0, firstPitchStrikePct: 0, hAllowed: 0, r: 0, er: 0, bb: 0, so: 0, kLooking: 0, wins: 0, losses: 0, abAgainst: 0 };
}

function blankFielding() {
  return { tc: 0, a: 0, po: 0, e: 0, dp: 0 };
}

function blankSelectStats() {
  return { hitting: blankHitting(), pitching: blankPitching(), fielding: blankFielding() };
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sumStats(base, incoming) {
  const next = { ...base };
  for (const [key, value] of Object.entries(incoming || {})) {
    next[key] = (Number(next[key]) || 0) + (Number(value) || 0);
  }
  return next;
}

function estimateBallsInPlay(stats) {
  const ab = Number(stats?.ab) || 0;
  const so = Number(stats?.so) || 0;
  const hr = Number(stats?.hr) || 0;
  const sf = Number(stats?.sf) || 0;
  return Math.max(ab - so - hr + sf, 0);
}

function mergeHittingStats(base, incoming) {
  const next = sumStats(base, incoming);
  const basePa = Number(base?.pa) || 0;
  const incomingPa = Number(incoming?.pa) || 0;
  const totalPa = basePa + incomingPa;
  const baseQabPct = Number(base?.qabPct);
  const incomingQabPct = Number(incoming?.qabPct);
  const baseBip = estimateBallsInPlay(base);
  const incomingBip = estimateBallsInPlay(incoming);
  const totalBip = baseBip + incomingBip;

  if (totalPa > 0) {
    next.qabPct = (
      ((Number.isFinite(baseQabPct) ? baseQabPct : 0) * basePa) +
      ((Number.isFinite(incomingQabPct) ? incomingQabPct : 0) * incomingPa)
    ) / totalPa;
  } else {
    next.qabPct = Number.isFinite(incomingQabPct) ? incomingQabPct : (Number.isFinite(baseQabPct) ? baseQabPct : 0);
  }

  for (const key of ['ldPct', 'fbPct', 'gbPct']) {
    const baseValue = Number(base?.[key]);
    const incomingValue = Number(incoming?.[key]);
    if (totalBip > 0) {
      next[key] = (
        ((Number.isFinite(baseValue) ? baseValue : 0) * baseBip) +
        ((Number.isFinite(incomingValue) ? incomingValue : 0) * incomingBip)
      ) / totalBip;
    } else {
      next[key] = Number.isFinite(incomingValue) ? incomingValue : (Number.isFinite(baseValue) ? baseValue : 0);
    }
  }

  return next;
}

function mergePitchingStats(base, incoming) {
  const next = sumStats(base, incoming);
  const baseBf = Number(base?.bf) || 0;
  const incomingBf = Number(incoming?.bf) || 0;
  const totalBf = baseBf + incomingBf;
  const baseFps = Number(base?.firstPitchStrikePct);
  const incomingFps = Number(incoming?.firstPitchStrikePct);
  const baseStrikePct = Number(base?.strikePct);
  const incomingStrikePct = Number(incoming?.strikePct);

  if (totalBf > 0) {
    next.firstPitchStrikePct = (
      ((Number.isFinite(baseFps) ? baseFps : 0) * baseBf) +
      ((Number.isFinite(incomingFps) ? incomingFps : 0) * incomingBf)
    ) / totalBf;
    next.strikePct = (
      ((Number.isFinite(baseStrikePct) ? baseStrikePct : 0) * baseBf) +
      ((Number.isFinite(incomingStrikePct) ? incomingStrikePct : 0) * incomingBf)
    ) / totalBf;
  } else {
    next.firstPitchStrikePct = Number.isFinite(incomingFps) ? incomingFps : (Number.isFinite(baseFps) ? baseFps : 0);
    next.strikePct = Number.isFinite(incomingStrikePct) ? incomingStrikePct : (Number.isFinite(baseStrikePct) ? baseStrikePct : 0);
  }

  return next;
}

function ensureSelectRosterPlayers(data) {
  const players = data.selectTeam.players;
  const existingIds = new Set(players.map(player => player.playerId || slugify(player.name)));
  for (const team of selectTeamDefinitions) {
    for (const playerId of team.rosterIds || []) {
      if (existingIds.has(playerId)) continue;
      players.push({
        playerId,
        name: selectRosterNames[playerId] || playerId,
        littleLeagueTeamId: null,
        select: blankSelectStats(),
        selectTeams: {}
      });
      existingIds.add(playerId);
    }
  }
}

function normalizeSelectBucket(bucket) {
  return {
    hitting: mergeHittingStats(blankHitting(), bucket?.hitting || {}),
    pitching: mergePitchingStats(blankPitching(), bucket?.pitching || {}),
    fielding: sumStats(blankFielding(), bucket?.fielding || {})
  };
}

function normalizeData(raw) {
  const data = raw && typeof raw === 'object' ? deepClone(raw) : {};
  data.meta = data.meta || {};
  data.teams = Array.isArray(data.teams) ? data.teams : [];
  data.littleLeaguePlayers = Array.isArray(data.littleLeaguePlayers) ? data.littleLeaguePlayers : [];
  data.selectTeam = data.selectTeam || { name: 'MI 11U', players: [] };
  data.selectTeam.players = Array.isArray(data.selectTeam.players) ? data.selectTeam.players : [];
  ensureSelectRosterPlayers(data);

  for (const player of data.littleLeaguePlayers) {
    player.playerId = player.playerId || slugify(player.name);
    player.hitting = mergeHittingStats(blankHitting(), player.hitting || {});
    player.pitching = mergePitchingStats(blankPitching(), player.pitching || {});
    player.fielding = sumStats(blankFielding(), player.fielding || {});
  }

  for (const player of data.selectTeam.players) {
    player.playerId = player.playerId || slugify(player.name);
    player.selectTeams = player.selectTeams || {};
    player.selectTeams['spring-league'] = normalizeSelectBucket(player.selectTeams['spring-league'] || player.selectTeams['mi-11u-maroon'] || player.select || {});
    for (const team of selectTeamDefinitions) {
      player.selectTeams[team.id] = normalizeSelectBucket(player.selectTeams[team.id] || {});
    }
    player.select = player.selectTeams['spring-league'];
  }

  return data;
}

async function blobList() {
  const result = await list({
    prefix: BLOB_KEY,
    limit: 20,
    token: BLOB_TOKEN
  });
  if (!result || !result.blobs || result.blobs.length === 0) {
    return [];
  }
  return result.blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
}

async function blobGet() {
  const versions = await blobList();
  if (!versions.length) return null;
  const latest = versions[0];
  const response = await fetch(latest.url);
  if (!response.ok) return null;
  return await response.json();
}

async function blobSet(value) {
  await put(BLOB_KEY, JSON.stringify(value), {
    access: 'public',
    contentType: 'application/json',
    token: BLOB_TOKEN,
    addRandomSuffix: false,
    allowOverwrite: true
  });
}

async function fileGet() {
  const filePath = path.join(process.cwd(), 'little-league-data.json');
  const text = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(text);
}

async function fileSet(value) {
  const filePath = path.join(process.cwd(), 'little-league-data.json');
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function getStoredData() {
  if (IS_VERCEL && !BLOB_TOKEN) {
    throw new Error('Storage not configured');
  }
  if (BLOB_TOKEN) {
    let data = await blobGet();
    if (!data) {
      data = await fileGet();
      await blobSet(data);
    }
    return data;
  }
  return await fileGet();
}

function ensureTeam(data, teamName, forcedId) {
  const teamId = forcedId || slugify(teamName);
  const existing = data.teams.find(team => team.id === teamId);
  if (existing) {
    existing.name = teamName || existing.name;
  } else {
    data.teams.push({ id: teamId, name: teamName });
  }
  return teamId;
}

function aggregateLittleLeagueRows(rows) {
  const playerMap = new Map();
  let teamId = null;
  let teamName = null;

  for (const raw of rows) {
    const row = {
      playerId: raw.playerId || slugify(raw.name),
      name: raw.name,
      teamId: raw.teamId || slugify(raw.teamName),
      teamName: raw.teamName,
      hitting: mergeHittingStats(blankHitting(), raw.hitting || {}),
      pitching: mergePitchingStats(blankPitching(), raw.pitching || {}),
      fielding: sumStats(blankFielding(), raw.fielding || {})
    };

    teamId = row.teamId;
    teamName = row.teamName;
    const existing = playerMap.get(row.playerId) || {
      playerId: row.playerId,
      name: row.name,
      teamId: row.teamId,
      hitting: blankHitting(),
      pitching: blankPitching(),
      fielding: blankFielding()
    };
    existing.name = row.name;
    existing.teamId = row.teamId;
    existing.hitting = mergeHittingStats(existing.hitting, row.hitting);
    existing.pitching = mergePitchingStats(existing.pitching, row.pitching);
    existing.fielding = sumStats(existing.fielding, row.fielding);
    playerMap.set(row.playerId, existing);
  }

  return { teamId, teamName, players: Array.from(playerMap.values()) };
}

function aggregateSelectRows(rows, existingData, teamId = 'spring-league') {
  const littleLookup = new Map((existingData.littleLeaguePlayers || []).map(player => [player.playerId, player]));
  const existingSelectLookup = new Map((existingData.selectTeam.players || []).map(player => [player.playerId, player]));
  const playerMap = new Map((existingData.selectTeam.players || []).map(player => [player.playerId, {
    ...player,
    selectTeams: { ...(player.selectTeams || {}) }
  }]));

  for (const player of playerMap.values()) {
    player.selectTeams = player.selectTeams || {};
    player.selectTeams[teamId] = blankSelectStats();
    if (teamId === 'spring-league') player.select = player.selectTeams[teamId];
  }

  for (const raw of rows) {
    const row = {
      playerId: raw.playerId || slugify(raw.name),
      name: raw.name,
      stats: {
        hitting: mergeHittingStats(blankHitting(), raw.hitting || {}),
        pitching: mergePitchingStats(blankPitching(), raw.pitching || {}),
        fielding: sumStats(blankFielding(), raw.fielding || {})
      }
    };

    const little = littleLookup.get(row.playerId);
    const existing = existingSelectLookup.get(row.playerId);
    const current = playerMap.get(row.playerId) || {
      playerId: row.playerId,
      name: row.name,
      littleLeagueTeamId: existing?.littleLeagueTeamId || little?.teamId || null,
      select: blankSelectStats(),
      selectTeams: {}
    };
    current.name = row.name;
    current.littleLeagueTeamId = current.littleLeagueTeamId || little?.teamId || null;
    current.selectTeams = current.selectTeams || {};
    current.selectTeams[teamId] = current.selectTeams[teamId] || blankSelectStats();
    current.selectTeams[teamId].hitting = mergeHittingStats(current.selectTeams[teamId].hitting, row.stats.hitting);
    current.selectTeams[teamId].pitching = mergePitchingStats(current.selectTeams[teamId].pitching, row.stats.pitching);
    current.selectTeams[teamId].fielding = sumStats(current.selectTeams[teamId].fielding, row.stats.fielding);
    if (teamId === 'spring-league') current.select = current.selectTeams[teamId];
    playerMap.set(row.playerId, current);
  }

  return Array.from(playerMap.values());
}

function applyImports(existing, imports) {
  const next = normalizeData(existing);
  const summaries = [];

  for (const importFile of imports || []) {
    const rows = Array.isArray(importFile.rows) ? importFile.rows : [];
    if (!rows.length) continue;

    const first = rows[0];
    if (first.sourceType === 'select') {
      const teamId = first.selectTeamId || 'spring-league';
      const teamName = first.selectTeamName || selectTeamDefinitions.find(team => team.id === teamId)?.name || 'select stats';
      next.selectTeam.players = aggregateSelectRows(rows, next, teamId);
      summaries.push(`replaced ${teamName} with ${rows.length} row${rows.length === 1 ? '' : 's'}`);
      continue;
    }

    const { teamId, teamName, players } = aggregateLittleLeagueRows(rows);
    if (!teamId || !teamName) continue;
    ensureTeam(next, teamName, teamId);
    next.littleLeaguePlayers = next.littleLeaguePlayers.filter(player => player.teamId !== teamId);
    next.littleLeaguePlayers.push(...players);
    summaries.push(`replaced ${teamName} with ${players.length} player${players.length === 1 ? '' : 's'}`);
  }

  next.meta.updatedAt = new Date().toISOString();
  return { data: normalizeData(next), summaries };
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const data = await getStoredData();
      return res.status(200).json(normalizeData(data));
    }

    if (req.method === 'POST') {
      const payload = req.body;
      if (payload && payload.action === 'restoreSeed') {
        const seed = normalizeData(await fileGet());
        if (BLOB_TOKEN) await blobSet(seed);
        else await fileSet(seed);
        return res.status(200).json({ ok: true, data: seed, summaries: ['restored seed data'] });
      }

      if (!payload || payload.action !== 'replaceUploads' || !Array.isArray(payload.imports)) {
        return res.status(400).json({ error: 'Invalid payload' });
      }

      const existing = await getStoredData();
      const result = applyImports(existing, payload.imports);
      if (BLOB_TOKEN) await blobSet(result.data);
      else await fileSet(result.data);
      return res.status(200).json({ ok: true, data: result.data, summaries: result.summaries });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    if (String(error && error.message).includes('Storage not configured')) {
      return res.status(503).json({ error: 'Storage not configured', code: 'STORAGE_UNCONFIGURED' });
    }
    return res.status(500).json({ error: 'Server error' });
  }
};
