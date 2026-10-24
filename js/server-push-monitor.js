const fs = require('fs');
const path = require('path');
const http = require('http');
var admin = require("firebase-admin");

// Buscar el archivo de llaves ya sea en la raíz local o en la carpeta secreta de Render
let secretPath = path.join(__dirname, "../serviceAccountKey.json");
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

db.ref('sensores').on('value', async (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  const esAnomalo = (data.ph < 5.5 || data.ph > 6.5) || (data.temperatura > 25);

  if (esAnomalo) {
    const payload = {
      notification: {
        title: '🚨 Alerta Crítica - Huerto Hidropónico UAEH',
        body: `Anomalía detectada: pH: ${data.ph || 'N/A'} | Temp: ${data.temperatura || 'N/A'}°C`,
        icon: 'https://cdn-icons-png.flaticon.com/192/1892/1892751.png'
      }
    };

    try {
      const tokensSnap = await db.ref('fcm_tokens').once('value');
      const tokensObj = tokensSnap.val();

      if (tokensObj) {
        const tokens = Object.values(tokensObj).map(t => t.token);
        const response = await admin.messaging().sendToDevice(tokens, payload);
        console.log('Notificaciones Push enviadas con éxito. Exitosas:', response.successCount);
      }
    } catch (error) {
      console.error('Error al enviar notificación Push:', error);
    }
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