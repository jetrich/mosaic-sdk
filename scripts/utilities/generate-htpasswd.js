#!/usr/bin/env node

const crypto = require("crypto");

// APR1-MD5 algorithm implementation
function apr1MD5(password, salt) {
  const magic = "$apr1$";

  // Generate salt if not provided
  if (!salt) {
    const chars =
      "./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    salt = "";
    for (let i = 0; i < 8; i++) {
      salt += chars[Math.floor(Math.random() * chars.length)];
    }
  }

  // Initial hash
  let ctx = crypto.createHash("md5");
  ctx.update(password + magic + salt);

  // Create intermediate hash
  let ctx1 = crypto.createHash("md5");
  ctx1.update(password + salt + password);
  let final = ctx1.digest();

  // Add intermediate result
  for (let i = password.length; i > 0; i -= 16) {
    ctx.update(final.slice(0, Math.min(16, i)));
  }

  // Additional mixing
  for (let i = password.length; i > 0; i >>= 1) {
    if (i & 1) {
      ctx.update("\0");
    } else {
      ctx.update(password[0]);
    }
  }

  final = ctx.digest();

  // 1000 rounds of hashing
  for (let i = 0; i < 1000; i++) {
    ctx1 = crypto.createHash("md5");

    if (i & 1) {
      ctx1.update(password);
    } else {
      ctx1.update(final);
    }

    if (i % 3) {
      ctx1.update(salt);
    }

    if (i % 7) {
      ctx1.update(password);
    }

    if (i & 1) {
      ctx1.update(final);
    } else {
      ctx1.update(password);
    }

    final = ctx1.digest();
  }

  // Convert to base64-like encoding
  const b64 =
    "./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let result = "";

  const v = [
    (final[0] << 16) | (final[6] << 8) | final[12],
    (final[1] << 16) | (final[7] << 8) | final[13],
    (final[2] << 16) | (final[8] << 8) | final[14],
    (final[3] << 16) | (final[9] << 8) | final[15],
    (final[4] << 16) | (final[10] << 8) | final[5],
    final[11],
  ];

  for (let i = 0; i < 5; i++) {
    result += b64[v[i] & 0x3f];
    result += b64[(v[i] >> 6) & 0x3f];
    result += b64[(v[i] >> 12) & 0x3f];
    result += b64[(v[i] >> 18) & 0x3f];
  }
  result += b64[v[5] & 0x3f];
  result += b64[(v[5] >> 6) & 0x3f];

  return magic + salt + "$" + result;
}

// Generate htpasswd entry
const username = "testuser";
const password = "testpass123";

console.log("Generating htpasswd entry for:");
console.log(`Username: ${username}`);
console.log(`Password: ${password}`);
console.log();

const hash = apr1MD5(password);
const entry = `${username}:${hash}`;

console.log("Add this line to your htpasswd file:");
console.log(entry);
console.log();
console.log("To update the htpasswd file:");
console.log(`echo '${entry}' > conf/development/verdaccio/htpasswd`);
