import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  adminConfiguration,
  createAdminSessionCookie,
  hasValidAdminSession,
  matchesAdminPassword
} from '../functions/_lib/admin-auth.js';
import { onRequestPost as checkPassword } from '../functions/api/admin/check-password.js';
import { onRequestPost as publishStudio } from '../functions/api/studio/publish.js';

const password = 'mot-de-passe-test';
const sessionSecret = 'secret-session-test-distinct-32-caracteres-minimum';
const env = { PAGES_CMS_PASSWORD: password, ADMIN_SESSION_SECRET: sessionSecret };

assert.equal(adminConfiguration({}).ok, false, 'Une configuration vide doit être refusée');
assert.equal(adminConfiguration({ PAGES_CMS_PASSWORD: password }).ok, false, 'Le secret de session est obligatoire');
assert.equal(adminConfiguration({ PAGES_CMS_PASSWORD: password, ADMIN_SESSION_SECRET: password }).ok, false, 'Les secrets doivent être distincts');
assert.equal(adminConfiguration(env).ok, true, 'La configuration complète doit être acceptée');
assert.equal(matchesAdminPassword(password, env), true, 'Le bon mot de passe doit être accepté');
assert.equal(matchesAdminPassword('incorrect', env), false, 'Un mauvais mot de passe doit être refusé');

const loginRequest = new Request('https://rccubzaguais.fr/api/admin/check-password');
const setCookie = await createAdminSessionCookie(loginRequest, env);
const cookieHeader = setCookie.split(';')[0];
const authenticatedRequest = new Request('https://rccubzaguais.fr/api/studio/publish', {
  headers: { cookie: cookieHeader }
});
assert.equal(await hasValidAdminSession(authenticatedRequest, env), true, 'La session signée doit être valide');
assert.equal(await hasValidAdminSession(authenticatedRequest, { ...env, ADMIN_SESSION_SECRET: `${sessionSecret}-different` }), false, 'Une autre clé ne doit pas valider la session');

const missingConfigResponse = await checkPassword({
  request: new Request('https://rccubzaguais.fr/api/admin/check-password', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password })
  }),
  env: {}
});
assert.equal(missingConfigResponse.status, 503, 'Une configuration absente doit être refusée par le serveur');

const wrongPasswordResponse = await checkPassword({
  request: new Request('https://rccubzaguais.fr/api/admin/check-password', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: 'incorrect' })
  }),
  env
});
assert.equal((await wrongPasswordResponse.json()).ok, false, 'Le point d’entrée doit refuser un mauvais mot de passe');

const protectedPublishResponse = await publishStudio({
  request: new Request('https://rccubzaguais.fr/api/studio/publish', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'composition' })
  }),
  env
});
assert.equal(protectedPublishResponse.status, 401, 'La publication Studio doit exiger une session ou un mot de passe valide');

const newsData = JSON.parse(await readFile(new URL('../data/news.json', import.meta.url), 'utf8'));
assert.equal(newsData.news.length, 13, 'Les 13 actualités doivent être conservées');
const ids = newsData.news.map((item) => item.id);
assert.ok(ids.every(Boolean), 'Chaque actualité doit avoir un identifiant');
assert.equal(new Set(ids).size, ids.length, 'Les identifiants d’actualités doivent être uniques');

globalThis.__RCC_TEST__ = true;
globalThis.window = globalThis;
globalThis.document = { readyState: 'loading', addEventListener() {} };
await import('../notification-categories.js');
await import('../notifications.js');
const eventPayload = globalThis.RCCNotificationTest.notificationEventPayload;

assert.equal(eventPayload({ type_evenement: 'match', status: 'upcoming', opponent: 'Blaye' }).type, 'match');
assert.equal(eventPayload({ type_evenement: 'match', status: 'win', result: '28-14' }).type, 'resultat');
assert.equal(eventPayload({ type_evenement: 'tournoi', title: 'Tournoi U8' }).type, 'tournoi');
assert.equal(eventPayload({ type_evenement: 'entrainement', team: 'Seniors' }).type, 'entrainement');
assert.equal(eventPayload({ type_evenement: 'type-inconnu' }).type, 'evenement');

console.log('Tests prioritaires RCC réussis.');
