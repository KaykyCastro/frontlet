import qz from "qz-tray";

let initialized = false;

export async function initQZ() {
  if (initialized) return;

  qz.security.setCertificatePromise(function(resolve, reject) {
    fetch("/digital-certificate.txt")
      .then(function(res) {
        if (!res.ok) {
          throw new Error("Certificado não encontrado");
        }

        return res.text();
      })
      .then(function(cert) {
        console.log(cert)
        resolve(cert);
      })
      .catch(function(err) {
        reject(err);
      });
  });

  qz.security.setSignaturePromise(function(toSign) {
    return function(resolve, reject) {
      fetch("http://localhost:3000/auth", {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: toSign,
      })
        .then(function(res) {
          if (!res.ok) {
            throw new Error("Erro ao assinar");
          }

          return res.text();
        })
        .then(function(signature) {
          resolve(signature);
        })
        .catch(function(err) {
          reject(err);
        });
    };
  });

  if (!qz.websocket.isActive()) {
    await qz.websocket.connect();
  }

  initialized = true;
}