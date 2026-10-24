var admin = require("firebase-admin");

// Apuntamos al archivo serviceAccountKey.json en la raíz
var serviceAccount = require("../serviceAccountKey.json");

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