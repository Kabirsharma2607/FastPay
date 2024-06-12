const crypto = require("node:crypto");

const hashPassword = (
  password,
  salt = crypto.randomBytes(16).toString("hex")
) => {
  const iterations = 10000;
  const keyLength = 64;
  const digest = "sha512";

  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      iterations,
      keyLength,
      digest,
      (err, derivedKey) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            salt: salt,
            hash: derivedKey.toString("hex"),
          });
        }
      }
    );
  });
};

module.exports = {
  hashPassword,
};
