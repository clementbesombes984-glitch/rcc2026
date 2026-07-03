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

function audiences(item, fallback) {
  const values = Array.isArray(item.audience) ? item.audience : [];
  if (item.important) values.push('important');
  if (fallback) values.push(fallback);
  if (!values.length) values.push('general');
  return Array.from(new Set(values));
}

function newsPayload(item) {
  return {
    type: 'news',
    title: item.title || 'Actualite RCC',
    body: item.summary || item.category || 'Nouvelle actualite du club.',
    url: '/actualites.html',
    audience: audiences(item, 'general'),
    tag: `news-${idFor('news', item)}`
  };
}

function matchPayload(item) {
  const status = String(item.status || '').toLowerCase();
  const isResult = status === 'win' || status === 'loss' || Boolean(item.result);
  return {
    type: isResult ? 'resultat' : 'match',
    title: `${item.home || 'RCC'} vs ${item.away || 'Adversaire'}`,
    body: [item.date, item.time, item.venue, item.result].filter(Boolean).join(' - '),
    url: isResult ? '/matchs.html' : '/#matches',
    audience: audiences(item, isResult ? 'resultats' : 'matchs'),
    tag: `match-${idFor('match', item)}`
  };
}

async function send(payload) {
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
  console.log(payload.title, response.status, result);
  if (!response.ok) process.exitCode = 1;
}

const beforeRef = process.env.BEFORE_REF || 'HEAD~1';
const previousNews = readJsonAt(beforeRef, 'data/news.json').news || [];
const currentNews = readJson('data/news.json').news || [];
const previousMatches = readJsonAt(beforeRef, 'data/matches.json').matches || [];
const currentMatches = readJson('data/matches.json').matches || [];

const previousIds = new Set([
  ...previousNews.map((item) => idFor('news', item)),
  ...previousMatches.map((item) => idFor('match', item))
]);

const payloads = [
  ...currentNews
    .filter((item) => item.notification && !previousIds.has(idFor('news', item)))
    .map(newsPayload),
  ...currentMatches
    .filter((item) => item.notification && !previousIds.has(idFor('match', item)))
    .map(matchPayload)
];

if (!payloads.length) {
  console.log('Aucune nouvelle notification a envoyer.');
}

for (const payload of payloads) {
  await send(payload);
}
