import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const siteUrl = process.env.SITE_URL || '';
const token = process.env.PUSH_ADMIN_TOKEN || '';

function readJsonAt(ref, file) {
  try {
    const content = execFileSync('git', ['show', `${ref}:${file}`], { encoding: 'utf8' });
    return JSON.parse(content);
  } catch (error) {
    return {};
  }
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    return {};
  }
}

function collection(data, key) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data[key])) return data[key];
  return [];
}

function idFor(type, item) {
  return [
    type,
    item.date || '',
    item.time || '',
    item.title || '',
    item.home || '',
    item.away || '',
    item.result || ''
  ].join('|').toLowerCase();
}

function matchIdFor(item) {
  return [
    'match',
    item.date || '',
    item.time || '',
    item.opponent || item.away || item.title || '',
    item.result || ''
  ].join('|').toLowerCase();
}

function asList(value) {
  return Array.isArray(value) ? value.filter(Boolean) : (value ? [value] : []);
}

function audienceKey(value) {
  const key = String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (key === 'ecole de rugby') return 'ecole';
  if (key === 'pole jeunes') return 'jeunes';
  if (key === 'feminines' || key === 'feminine') return 'feminines';
  if (key === 'seniors' || key === 'senior') return 'seniors';
  return key.replace(/\s+/g, '-');
}

function audiences(item, fallback) {
  const values = Array.isArray(item.audience) ? item.audience : [];
  const teams = asList(item.teams).length ? asList(item.teams) : asList(item.team);
  if (item.important) values.push('important');
  if (fallback) values.push(fallback);
  teams.map(audienceKey).forEach((team) => values.push(team));
  if (!values.length) values.push('general');
  return Array.from(new Set(values));
}

function signatureForNews(item) {
  return JSON.stringify({
    category: item.category || '',
    title: item.title || '',
    summary: item.summary || '',
    body: item.body || '',
    url: item.url || '',
    important: Boolean(item.important),
    audience: audiences(item, 'general')
  });
}

function newsPayload(item) {
  return {
    type: 'news',
    title: item.title || 'Actualite RCC',
    body: item.summary || item.body || item.category || 'Nouvelle actualite du club.',
    url: item.url || '/actualites.html',
    audience: audiences(item, 'general'),
    tag: `news-${idFor('news', item)}`
  };
}

function matchPayload(item) {
  const status = String(item.status || '').toLowerCase();
  const isResult = status === 'win' || status === 'loss' || Boolean(item.result);
  const eventType = String(item.type_evenement || item.type || 'match').toLowerCase() === 'tournoi' ? 'tournoi' : 'match';
  const eventAudience = eventType === 'tournoi' ? 'tournois' : 'matchs';
  const teams = asList(item.teams).length ? asList(item.teams) : asList(item.team);
  const teamsLabel = teams.join(', ');
  const title = eventType === 'tournoi'
    ? (item.title || item.tournamentName || `Tournoi ${teamsLabel || 'RCC'}`)
    : (item.title || `${item.home || 'RCC'} vs ${item.opponent || item.away || 'Adversaire'}`);
  const place = item.location || item.venue || '';
  const body = eventType === 'tournoi'
    ? [`Tournoi ${teamsLabel || 'RCC'}`, item.date, item.time, place].filter(Boolean).join(' - ')
    : [item.date, item.time, place, item.result].filter(Boolean).join(' - ');
  return {
    type: isResult ? 'resultat' : eventType,
    title,
    body,
    url: '/matchs.html',
    audience: audiences(item, isResult ? 'resultats' : eventAudience),
    tag: `${eventType}-${matchIdFor(item)}`
  };
}

async function send(payload) {
  console.log('Payload envoye a /api/push/send:', JSON.stringify(payload, null, 2));

  if (!siteUrl || !token) {
    console.log('SITE_URL ou PUSH_ADMIN_TOKEN absent, notification ignoree:', payload.title);
    return;
  }

  const response = await fetch(`${siteUrl.replace(/\/$/, '')}/api/push/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const result = await response.text();
  console.log('Reponse de /api/push/send:', response.status, result);
  if (!response.ok) process.exitCode = 1;
}

const beforeRef = process.env.BEFORE_REF || 'HEAD~1';
const previousNews = collection(readJsonAt(beforeRef, 'data/news.json'), 'news');
const currentNews = collection(readJson('data/news.json'), 'news');
const previousMatches = collection(readJsonAt(beforeRef, 'data/matches.json'), 'matches');
const currentMatches = collection(readJson('data/matches.json'), 'matches');

const previousNewsById = new Map(previousNews.map((item) => [idFor('news', item), item]));
const previousMatchesById = new Map(previousMatches.map((item) => [matchIdFor(item), item]));

function shouldNotifyNews(item) {
  if (!item.notification) return false;
  const previous = previousNewsById.get(idFor('news', item));
  if (!previous || !previous.notification) return true;
  return signatureForNews(previous) !== signatureForNews(item);
}

function shouldNotifyMatch(item) {
  if (!item.notification) return false;
  return !previousMatchesById.has(matchIdFor(item));
}

const newsWithNotification = currentNews.filter((item) => item.notification);
const lastNews = currentNews[currentNews.length - 1] || null;

console.log('Actus lues:', currentNews.length);
console.log('Actus avec notification=true:', newsWithNotification.length);
console.log('Derniere actu detectee:', lastNews ? JSON.stringify({
  title: lastNews.title || '',
  category: lastNews.category || '',
  notification: Boolean(lastNews.notification),
  important: Boolean(lastNews.important),
  audience: Array.isArray(lastNews.audience) ? lastNews.audience : []
}, null, 2) : 'aucune');
console.log('Evenements calendrier lus:', currentMatches.length);
console.log('Evenements calendrier avec notification=true:', currentMatches.filter((item) => item.notification).length);

const newsPayloads = currentNews.filter(shouldNotifyNews).map(newsPayload);
const matchPayloads = currentMatches.filter(shouldNotifyMatch).map(matchPayload);
const payloads = [...newsPayloads, ...matchPayloads];

console.log('Notifications actualites a envoyer:', newsPayloads.length);
console.log('Notifications calendrier a envoyer:', matchPayloads.length);

if (!payloads.length) {
  console.log('Aucune nouvelle notification a envoyer.');
}

for (const payload of payloads) {
  await send(payload);
}
