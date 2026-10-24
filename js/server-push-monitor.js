const fs = require('fs');
const path = require('path');
const http = require('http');
var admin = require("firebase-admin");

// Ruta corregida para buscar serviceAccountKey.json en la misma raíz o en secretos de Render
let secretPath = path.join(__dirname, "serviceAccountKey.json");
if (!fs.existsSync(secretPath)) {
  secretPath = "/etc/secrets/serviceAccountKey.json";
}

var serviceAccount = require(secretPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://huerto-hidroponico-esh-default-rtdb.firebaseio.com"
});

const db = admin.database();

console.log("Servidor de Notificaciones Push activado y escuchando cambios en Firebase...");

// Escuchar cambios en el nodo de sensores con logs de depuración
db.ref('sensores').on('value', async (snapshot) => {
  const data = snapshot.val();
  if (!data) {
    console.log("⚠️ No se encontraron datos en el nodo sensores.");
    return;
  }

  console.log("📊 Datos recibidos de sensores:", JSON.stringify(data));

  const phVal = Number(data.ph);
  const tempVal = Number(data.temperatura);

  const esAnomalo = (phVal < 5.5 || phVal > 6.5) || (tempVal > 25);

  if (esAnomalo) {
    console.log(`🚨 ¡Anomalía detectada! pH: ${phVal} | Temp: ${tempVal}°C. Preparando notificación...`);

    try {
      const tokensSnap = await db.ref('fcm_tokens').once('value');
      const tokensObj = tokensSnap.val();

      if (tokensObj) {
        // Mapeo para identificar la clave del token en la base de datos si falla
        const tokensMap = {};
        const tokens = [];

        Object.entries(tokensObj).forEach(([key, item]) => {
          let tokenVal = null;
          if (typeof item === 'string') {
            tokenVal = item;
          } else if (item && typeof item === 'object' && item.token) {
            tokenVal = item.token;
          }

          if (tokenVal) {
            tokens.push(tokenVal);
            tokensMap[tokenVal] = key;
          }
        });

        if (tokens.length > 0) {
          console.log(`Enviando notificación a ${tokens.length} dispositivos...`);

          const message = {
            tokens: tokens,
            notification: {
              title: '🚨 Alerta Crítica - Huerto Hidropónico UAEH',
              body: `Anomalía detectada: pH: ${phVal || 'N/A'} | Temp: ${tempVal || 'N/A'}°C`
            },
            webpush: {
              notification: {
                icon: 'https://cdn-icons-png.flaticon.com/192/1892/1892751.png'
              }
            }
          };

          const response = await admin.messaging().sendEachForMulticast(message);
          console.log(`✅ Notificaciones enviadas. Exitosas: ${response.successCount}, Fallidas: ${response.failureCount}`);

          // Autopurga de tokens obsoletos o inválidos detectados por Firebase
          if (response.failureCount > 0) {
            response.responses.forEach(async (resp, idx) => {
              if (!resp.success) {
                const failedToken = tokens[idx];
                const dbKey = tokensMap[failedToken];
                console.error(`❌ Error en token [${idx}] (${failedToken}):`, resp.error.message);

                if (resp.error.code === 'messaging/registration-token-not-registered' || 
                    resp.error.code === 'messaging/invalid-registration-token' ||
                    resp.error.message.includes('404')) {
                  console.log(`🗑️ Eliminando token obsoleto/inválido de Firebase: ${dbKey}`);
                  if (dbKey) {
                    await db.ref(`fcm_tokens/${dbKey}`).remove();
                  }
                }
              }
            });
          }
        } else {
          console.log("⚠️ No se encontraron tokens válidos estructurados en fcm_tokens.");
        }
      } else {
        console.log("⚠️ No hay tokens registrados en fcm_tokens.");
      }
    } catch (error) {
      console.error('❌ Error al enviar notificación Push:', error);
    }
  } else {
    console.log("✔️ Valores dentro del rango normal. Sin alertas.");
  }
});

// Servidor HTTP básico para mantener el puerto abierto exigido por Render
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Huerto ESH Monitor Push 24/7 activo\n');
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Servidor HTTP corriendo en el puerto ${PORT}`);
});