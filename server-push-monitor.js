const fs = require('fs');
const path = require('path');
const http = require('http');
var admin = require("firebase-admin");

// =========================================================
// 1. CONFIGURACIÓN DE CREDENCIALES FIREBASE (FCM)
// =========================================================
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

console.log("🚀 Servidor de Notificaciones Push 24/7 activado y escuchando eventos globales...");

// Función auxiliar unificada para enviar notificaciones a todos los tokens FCM registrados
async function dispararNotificacionGlobal(tituloAlerta, cuerpoAlerta) {
  try {
    const tokensSnap = await db.ref('fcm_tokens').once('value');
    const tokensObj = tokensSnap.val();

    if (!tokensObj) {
      console.log("⚠️ No hay tokens de dispositivos registrados en fcm_tokens.");
      return;
    }

    const tokensMap = {};
    const tokens = [];

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

    console.log(`🚨 Disparando alerta FCM global: ${tituloAlerta}`);

    const message = {
      tokens: tokens,
      notification: {
        title: `🚨 Huerto ESH: ${tituloAlerta}`,
        body: cuerpoAlerta
      },
      webpush: {
        notification: {
          icon: 'https://cdn-icons-png.flaticon.com/192/1892/1892751.png'
        }
      }
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`✅ Notificaciones FCM enviadas. Exitosas: ${response.successCount}, Fallidas: ${response.failureCount}`);

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
  } catch (error) {
    console.error('❌ Error al enviar notificación FCM global:', error);
  }
}

// =========================================================
// 2. MONITOREO DE SENSORES (pH, CE, Temperatura)
// =========================================================
db.ref('sensores').on('value', async (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  const phVal = Number(data.ph);
  const ecVal = Number(data.ec);
  const tempVal = Number(data.temperatura);

  if (phVal < 5.5 || phVal > 6.5) {
    await dispararNotificacionGlobal("¡pH Fuera de Rango! 🧪", `Nivel crítico actual: ${phVal} pH (Óptimo: 5.5 - 6.5).`);
  }
  if (ecVal < 2.0 || ecVal > 2.5) {
    await dispararNotificacionGlobal("¡Conductividad (CE) Anómala! ⚡", `Nivel actual: ${ecVal} mS/cm (Óptimo: 2.0 - 2.5 mS/cm).`);
  }
  if (tempVal < 18.0 || tempVal > 24.0) {
    await dispararNotificacionGlobal("¡Alerta Térmica en Agua! 🌡️", `Temperatura actual: ${tempVal}°C (Óptima: 18°C - 24°C).`);
  }
});

// Flag para ignorar la carga inicial de registros históricos al arrancar el servidor
let cargandoInicialTrackers = true;
let cargandoInicialTasks = true;
let cargandoInicialCuadrillas = true;

// =========================================================
// 3. MONITOREO DE TRACKERS DE CULTIVO (Nuevos lotes)
// =========================================================
db.ref('trackers').on('child_added', (snapshot) => {
  if (cargandoInicialTrackers) return;
  const tracker = snapshot.val();
  if (tracker && tracker.title) {
    dispararNotificacionGlobal("🌱 Nuevo Lote Creado", `Se agregó el lote de cultivo: "${tracker.title}"`);
  }
});
setTimeout(() => { cargandoInicialTrackers = false; }, 3000);

// =========================================================
// 4. MONITOREO DE TAREAS / CHECKLIST (Nuevas tareas en 'tasks')
// =========================================================
db.ref('tasks').on('child_added', (snapshot) => {
  if (cargandoInicialTasks) return;
  const tarea = snapshot.val();
  if (tarea && tarea.text) {
    dispararNotificacionGlobal("📋 Nueva Tarea en Checklist", `Se añadió: "${tarea.text}"`);
  }
});
setTimeout(() => { cargandoInicialTasks = false; }, 3000);

// =========================================================
// 5. MONITOREO DE CUADRILLAS Y REPORTES
// =========================================================
db.ref('cuadrillas_sistema').on('child_added', (snapshot) => {
  if (cargandoInicialCuadrillas) return;
  const cuadrilla = snapshot.val();
  if (cuadrilla && cuadrilla.nombre) {
    dispararNotificacionGlobal("📁 Nueva Cuadrilla Integrada", `Se creó la carpeta: "${cuadrilla.nombre}"`);
  }
});
setTimeout(() => { cargandoInicialCuadrillas = false; }, 3000);

// =========================================================
// 6. SERVIDOR HTTP BÁSICO (EXIGIDO POR FLY.IO)
// =========================================================
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Huerto ESH Monitor Push 24/7 activo con eventos globales\n');
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor HTTP corriendo en el puerto ${PORT}`);
});