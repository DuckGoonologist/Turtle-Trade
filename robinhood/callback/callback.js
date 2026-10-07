"use strict";

const bytes = text => new TextEncoder().encode(text);
const base64url = value => {
  let result = "";
  for (const byte of new Uint8Array(value)) result += String.fromCharCode(byte);
  return btoa(result).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const decode64 = text => Uint8Array.from(atob(text.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));

async function createTicket(params) {
  if (params.getAll("state").length !== 1 || params.getAll("code").length !== 1 || params.has("error")) throw new Error();
  if (params.has("iss") && (params.getAll("iss").length !== 1 || params.get("iss") !== "https://agent.robinhood.com/mcp/trading")) throw new Error();
  const wrapped = params.get("state");
  const code = params.get("code");
  if (wrapped.length > 3000 || !code || code.length > 2000) throw new Error();
  const state = JSON.parse(new TextDecoder().decode(decode64(wrapped)));
  if (Object.keys(state).sort().join(",") !== "i,k,s,v" || state.v !== 1 || !/^[a-f0-9]{32}$/.test(state.i)
      || typeof state.k !== "string" || typeof state.s !== "string" || !state.s || state.k.length > 1000) throw new Error();
  const rsa = await crypto.subtle.importKey("spki", decode64(state.k), {name: "RSA-OAEP", hash: "SHA-256"}, false, ["encrypt"]);
  const rawKey = crypto.getRandomValues(new Uint8Array(32));
  const aes = await crypto.subtle.importKey("raw", rawKey, {name: "AES-GCM"}, false, ["encrypt"]);
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const payload = {code, state: wrapped};
  if (params.has("iss")) payload.iss = params.get("iss");
  const encrypted = await crypto.subtle.encrypt({name: "AES-GCM", iv: nonce, additionalData: bytes(state.i)}, aes, bytes(JSON.stringify(payload)));
  const key = await crypto.subtle.encrypt({name: "RSA-OAEP"}, rsa, rawKey);
  rawKey.fill(0);
  const ticket = base64url(bytes(JSON.stringify({v: 1, i: state.i, k: base64url(key), n: base64url(nonce), c: base64url(encrypted)})));
  if (ticket.length > 4000) throw new Error();
  return ticket;
}

async function showCompletion() {
  const status = document.getElementById("status");
  const params = window.turtleOAuthParams;
  delete window.turtleOAuthParams;
  if (!params || !params.size) {
    status.textContent = "No sign-in is in progress. Start with /robinhood connect in Discord.";
    return;
  }
  try {
    const ticket = await createTicket(params);
    document.getElementById("ticket").value = ticket;
    document.getElementById("completion").hidden = false;
    status.textContent = "Your completion code is ready. Finish linking your account in Discord.";
  } catch {
    status.textContent = "This sign-in could not be completed. Return to Discord and use /robinhood reconnect.";
  } finally { params.delete("code"); params.delete("state"); }
}

if (typeof document !== "undefined") {
  document.getElementById("copy").addEventListener("click", async () => {
    const button = document.getElementById("copy");
    try { await navigator.clipboard.writeText(document.getElementById("ticket").value); button.textContent = "Copied"; }
    catch { document.getElementById("ticket").select(); button.textContent = "Select and copy the code"; }
  });
  void showCompletion();
}
if (typeof module !== "undefined") module.exports = {createTicket};
