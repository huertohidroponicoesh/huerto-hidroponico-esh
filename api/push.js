const admin = require("firebase-admin");

// Inicializar Firebase Admin si no está inicializado previamente
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://huerto-hidroponico-esh-default-rtdb.firebaseio.com"
  });
}

const db = admin.database();

module.exports = async (req, res) => {
  // Configuración de encabezados CORS para peticiones desde tu panel web
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Aceptar datos tanto por body (POST) como por query (GET)
    const { titulo, mensaje, tipo } = req.body || req.query;

    if (!titulo || !mensaje) {
      return res.status(400).json({ error: "Parámetros requeridos: 'titulo' y 'mensaje'." });
    }

    // Consultar los tokens FCM registrados en la base de datos
    const tokensSnap = await db.ref('fcm_tokens').once('value');
    const tokensObj = tokensSnap.val();

    if (!tokensObj) {
      return res.status(200).json({ success: false, message: "No hay tokens FCM registrados." });
    }

    const tokens = [];
    const tokensMap = {};

    Object.entries(tokensObj).forEach(([key, item]) => {
      let tokenVal = (typeof item === 'string') ? item : (item && item.token);
      if (tokenVal) {
        tokens.push(tokenVal);
        tokensMap[tokenVal] = key;
      }
    });

    if (tokens.length === 0) {
      return res.status(200).json({ success: false, message: "La lista de tokens está vacía." });
    }

    // Enviar notificación multicast a través de FCM
    const message = {
      tokens: tokens,
      notification: {
        title: titulo,
        body: mensaje
      },
      webpush: {
        notification: {
          icon: 'https://cdn-icons-png.flaticon.com/192/1892/1892751.png'
        }
      }
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    // Limpieza automática de tokens obsoletos/inválidos
    if (response.failureCount > 0) {
      response.responses.forEach(async (resp, idx) => {
        if (!resp.success) {
          const failedToken = tokens[idx];
          const dbKey = tokensMap[failedToken];
          if (
            resp.error.code === 'messaging/registration-token-not-registered' || 
            resp.error.code === 'messaging/invalid-registration-token'
          ) {
            if (dbKey) {
              await db.ref(`fcm_tokens/${dbKey}`).remove();
            }
          }
        }
      });
    }

    return res.status(200).json({
      success: true,
      enviadas: response.successCount,
      fallidas: response.failureCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Error en Vercel Serverless Function:", error);
    return res.status(500).json({ error: error.message });
  }
};