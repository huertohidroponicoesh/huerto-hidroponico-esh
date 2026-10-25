const fs = require('fs');
const path = require('path');
const http = require('http');
var admin = require("firebase-admin");

// =========================================================
// 1. CONFIGURACIÓN DE CREDENCIALES FIREBASE (FCM)
// =========================================================
// Busca el archivo serviceAccountKey.json en la raíz o en los secretos de Render (/etc/secrets/)
let secretPath = path.join(__dirname, "serviceAccountKey.json");
if (!fs.existsSync(secretPath)) {
  secretPath = "/etc/secrets/serviceAccountKey.json";
}

var serviceAccount = require(secretPath);

// Inicializar la app de Firebase Admin con tus credenciales y tu Realtime Database
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://huerto-hidroponico-esh-default-rtdb.firebaseio.com"
});

const db = admin.database();

console.log("Servidor de Notificaciones Push activado y escuchando cambios en Firebase...");

// =========================================================
// 2. MONITOREO Y EVALUACIÓN AISLADA DE SENSORES
// =========================================================
db.ref('sensores').on('value', async (snapshot) => {
  const data = snapshot.val();
  if (!data) {
    console.log("⚠️ No se encontraron datos en el nodo sensores.");
    return;
  }

  console.log("📊 Datos recibidos de sensores:", JSON.stringify(data));

  const phVal = Number(data.ph);
  const ecVal = Number(data.ec);
  const tempVal = Number(data.temperatura);

  // Lista para almacenar las anomalías detectadas de forma independiente
  const alertasDetectadas = [];

  // Evaluación aislada de pH (Rango seguro: 5.5 - 6.5)
  if (phVal < 5.5 || phVal > 6.5) {
    alertasDetectadas.push({
      titulo: "¡pH Fuera de Rango! 🧪",
      cuerpo: `Nivel crítico actual: ${phVal} pH (Óptimo: 5.5 - 6.5). Requiere ajuste en solución.`
    });
  }

  // Evaluación aislada de Conductividad CE (Rango seguro: 2.0 - 2.5)
  if (ecVal < 2.0 || ecVal > 2.5) {
    alertasDetectadas.push({
      titulo: "¡Conductividad (CE) Anómala! ⚡",
      cuerpo: `Nivel actual: ${ecVal} mS/cm (Óptimo: 2.0 - 2.5 mS/cm).`
    });
  }

  // Evaluación aislada de Temperatura del Agua (Rango seguro: 18.0°C - 24.0°C)
  if (tempVal < 18.0 || tempVal > 24.0) {
    alertasDetectadas.push({
      titulo: "¡Alerta Térmica en Agua! 🌡️",
      cuerpo: `Temperatura actual: ${tempVal}°C (Óptima: 18°C - 24°C). Verifique placa Peltier.`
    });
  }

  // Si se detectó alguna anomalía, procedemos a enviar las notificaciones Push vía FCM
  if (alertasDetectadas.length > 0) {
    try {
      // 3. OBTENER LOS TOKENS DE FCM REGISTRADOS EN LA BASE DE DATOS
      const tokensSnap = await db.ref('fcm_tokens').once('value');
      const tokensObj = tokensSnap.val();

      if (!tokensObj) {
        console.log("⚠️ No hay tokens de dispositivos registrados en fcm_tokens.");
        return;
      }

      const tokensMap = {};
      const tokens = [];

      // Mapear y validar la estructura de los tokens guardados (pueden ser string u objeto)
      Object.entries(tokensObj).forEach(([key, item]) => {
        let tokenVal = (typeof item === 'string') ? item : (item && item.token);
        if (tokenVal) {
          tokens.push(tokenVal);
          tokensMap[tokenVal] = key;
        }
      });

      if (tokens.length === 0) {
        console.log("⚠️ No se encontraron tokens válidos en fcm_tokens.");
        return;
      }

      // Enviar de forma aislada cada alerta detectada a través de Firebase Cloud Messaging (FCM)
      for (const alerta of alertasDetectadas) {
        console.log(`🚨 Disparando alerta aislada FCM: ${alerta.titulo}`);

        const message = {
          tokens: tokens, // Lista de dispositivos destino
          notification: {
            title: `🚨 Huerto ESH: ${alerta.titulo}`,
            body: alerta.cuerpo
          },
          webpush: {
            notification: {
              icon: 'https://cdn-icons-png.flaticon.com/192/1892/1892751.png'
            }
          }
        };

        // =========================================================
        // 4. ENVÍO MULTICAST A TRAVÉS DE FCM (FIREBASE ADMIN)
        // =========================================================
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`✅ Notificaciones FCM enviadas. Exitosas: ${response.successCount}, Fallidas: ${response.failureCount}`);

        // Autopurga automática de tokens obsoletos o inválidos detectados por Firebase
        if (response.failureCount > 0) {
          response.responses.forEach(async (resp, idx) => {
            if (!resp.success) {
              const failedToken = tokens[idx];
              const dbKey = tokensMap[failedToken];
              console.error(`❌ Error en token FCM [${idx}] (${failedToken}):`, resp.error.message);

              if (
                resp.error.code === 'messaging/registration-token-not-registered' || 
                resp.error.code === 'messaging/invalid-registration-token' ||
                resp.error.message.includes('404')
              ) {
                console.log(`🗑️ Eliminando token FCM obsoleto/inválido de Firebase: ${dbKey}`);
                if (dbKey) {
                  await db.ref(`fcm_tokens/${dbKey}`).remove();
                }
              }
            }
          });
        }
      }

    } catch (error) {
      console.error('❌ Error general al procesar notificaciones FCM:', error);
    }
  } else {
    console.log("✔️ Todos los parámetros (pH, CE, Temperatura) dentro de rangos normales. Sin alertas.");
  }
});

// =========================================================
// 5. SERVIDOR HTTP BÁSICO (EXIGIDO POR RENDER)
// =========================================================
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Huerto ESH Monitor Push 24/7 activo\n');
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Servidor HTTP corriendo en el puerto ${PORT}`);
});