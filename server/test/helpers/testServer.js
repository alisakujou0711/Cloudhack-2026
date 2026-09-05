// Boots the exported Express app on an ephemeral port against a throwaway database, and drives
// it over real HTTP with a minimal cookie jar. Tests assert only on what a browser could see:
// status codes, response bodies, and cookie behaviour.
const fs = require('fs');
const os = require('os');
const path = require('path');
const net = require('net');
const { once } = require('events');

function parseSetCookie(header) {
  const [pair, ...attrs] = header.split(';');
  const index = pair.indexOf('=');
  const name = pair.slice(0, index).trim();
  const value = pair.slice(index + 1).trim();
  const attributes = {};
  for (const attr of attrs) {
    const eq = attr.indexOf('=');
    const key = (eq === -1 ? attr : attr.slice(0, eq)).trim().toLowerCase();
    attributes[key] = eq === -1 ? true : attr.slice(eq + 1).trim();
  }
  return { name, value, attributes };
}

function isExpired({ value, attributes }) {
  if (attributes['max-age'] !== undefined) return Number(attributes['max-age']) <= 0;
  if (attributes.expires) return new Date(attributes.expires).getTime() <= Date.now();
  return value === '';
}

function createClient(baseUrl) {
  const jar = new Map();

  async function request(method, endpoint, options = {}) {
    const { body, form, cookieHeader, sendCookies = true } = options;
    const headers = {};
    // Only a JSON body needs a declared type; fetch gives a multipart `form` its own, boundary
    // and all.
    if (body !== undefined) headers['content-type'] = 'application/json';
    const cookie = cookieHeader !== undefined
      ? cookieHeader
      : sendCookies
        ? [...jar].map(([name, value]) => `${name}=${value}`).join('; ')
        : '';
    if (cookie) headers.cookie = cookie;

    const res = await fetch(baseUrl + endpoint, {
      method,
      headers,
      body: form !== undefined ? form : body === undefined ? undefined : JSON.stringify(body),
    });

    const setCookie = res.headers.getSetCookie();
    for (const header of setCookie) {
      const parsed = parseSetCookie(header);
      if (isExpired(parsed)) jar.delete(parsed.name);
      else jar.set(parsed.name, parsed.value);
    }

    const text = await res.text();
    let payload = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }
    return { status: res.status, body: payload, setCookie };
  }

  return {
    jar,
    request,
    get: (endpoint, options) => request('GET', endpoint, options),
    post: (endpoint, body, options) => request('POST', endpoint, { ...options, body }),
    put: (endpoint, body, options) => request('PUT', endpoint, { ...options, body }),
    del: (endpoint, options) => request('DELETE', endpoint, options),
    postForm: (endpoint, form, options) => request('POST', endpoint, { ...options, form }),
  };
}

async function freePort() {
  const probe = net.createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const { port } = probe.address();
  probe.close();
  await once(probe, 'close');
  return port;
}

function temporaryDatabase() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portfoliopath-test-'));
  return {
    dir,
    file: path.join(dir, 'test.db'),
    remove: () => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10 }),
  };
}

async function startTestServer() {
  const database = temporaryDatabase();
  process.env.DATABASE_PATH = database.file;

  const app = require('../../app');
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${server.address().port}/api`;

  return {
    baseUrl,
    client: () => createClient(baseUrl),
    async stop() {
      server.closeAllConnections();
      server.close();
      await once(server, 'close');
      // Teardown only: Windows will not delete an open SQLite file, so the handle has to be
      // released before the temp directory goes. No test asserts through this module.
      require('../../db').close();
      database.remove();
    },
  };
}

module.exports = { startTestServer, createClient, temporaryDatabase, freePort };
