const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const {
  MercadoPagoConfig,
  Preference
} = require('mercadopago');

const app = express();

app.use(cors());
app.use(express.json());

// ===============================
// 📸 IMÁGENES
// ===============================

app.use(
  '/uploads',
  express.static('uploads')
);

// ===============================
// 📸 MULTER
// ===============================

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },

  filename: (req, file, cb) => {

    const uniqueName =
      Date.now() +
      path.extname(
        file.originalname
      );

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage
});

// ===============================
// 🛢️ MYSQL
// ===============================

const db = mysql.createConnection(process.env.MYSQL_URL);
db.connect((err) => {

  if (err) {

    console.log(err);
    return;
  }

  console.log(
    '✅ Conectado a MySQL'
  );
});

// ===============================
// 💳 MERCADO PAGO
// ===============================

const client =
  new MercadoPagoConfig({

    accessToken:
      'APP_USR-1395077078735021-051718-b0ca1f3049ad0f74ad65f965fc8146ff-3406337007'

  });

// ===============================
// 🚀 SERVER
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor en puerto ${PORT}`);
});
db.connect((err) => {

  if (err) {
    console.log('❌ Error MySQL:', err);
    return;
  }

  console.log('✅ Conectado a MySQL');

});

// ===============================
// 👤 REGISTER
// ===============================

app.post(
  '/register',
  (req, res) => {

    const {
      nombre,
      email,
      password,
      tipo
    } = req.body;

    const sql = `
      INSERT INTO usuarios
      (nombre, email, password, tipo)
      VALUES (?, ?, ?, ?)
    `;

    db.query(
      sql,
      [
        nombre,
        email,
        password,
        tipo
      ],

      (err, result) => {

        if (err) {

          console.log(err);

          return res
            .status(500)
            .json(err);
        }

        res.json({
          success: true
        });
      }
    );
  }
);

// ===============================
// 🔐 LOGIN
// ===============================

app.post(
  '/login',
  (req, res) => {

    const {
      email,
      password
    } = req.body;

    const sql = `
      SELECT * FROM usuarios
      WHERE email = ?
      AND password = ?
    `;

    db.query(
      sql,
      [
        email,
        password
      ],

      (err, results) => {

        if (err) {

          console.log(err);

          return res
            .status(500)
            .json(err);
        }

        if (
          results.length > 0
        ) {

          res.json(
            results[0]
          );

        } else {

          res.status(401)
            .json({

              message:
                'Credenciales incorrectas'

            });
        }
      }
    );
  }
);

// ===============================
// 👤 OBTENER USUARIO
// ===============================

app.get(
  '/usuarios/:id',
  (req, res) => {

    const { id } =
      req.params;

    db.query(

      `SELECT * FROM usuarios
       WHERE id = ?`,

      [id],

      (err, results) => {

        if (err) {

          return res
            .status(500)
            .json(err);
        }

        if (
          results.length === 0
        ) {

          return res
            .status(404)
            .json({
              message:
                'Usuario no encontrado'
            });
        }

        res.json(
          results[0]
        );
      }
    );
  }
);

// ===============================
// 🚗 CREAR PARQUEADERO
// ===============================

app.post(

  '/parqueaderos',

  upload.single('foto'),

  (req, res) => {

    const {
      descripcion,
      lat,
      lng,
      precio,
      usuarioId,
      direccion,
    } = req.body;

    const foto =
      req.file
        ? req.file.filename
        : null;

    const sql = `
      INSERT INTO parqueaderos
      (
        descripcion,
        lat,
        lng,
        precio,
        usuario_id,
        direccion,
        foto,
        disponible
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(

      sql,

      [
        descripcion,
        lat,
        lng,
        precio,
        usuarioId,
        direccion,
        foto,
        true
      ],

      (err, result) => {

        if (err) {

          console.log(err);

          return res
            .status(500)
            .json(err);
        }

        res.json({

          success: true,
          message:
            'Parqueadero creado'

        });
      }
    );
  }
);

// ===============================
// 🗺️ OBTENER PARQUEADEROS
// ===============================

app.get(
  '/parqueaderos',
  (req, res) => {

    db.query(

      `SELECT * FROM parqueaderos`,

      (err, results) => {

        if (err) {

          return res
            .status(500)
            .json(err);
        }

        res.json(results);
      }
    );
  }
);

// ===============================
// 📍 MIS PARQUEADEROS
// ===============================

app.get(
  '/mis-parqueaderos/:userId',

  (req, res) => {

    const { userId } =
      req.params;

    db.query(

      `SELECT * FROM parqueaderos
       WHERE usuario_id = ?`,

      [userId],

      (err, results) => {

        if (err) {

          return res
            .status(500)
            .json(err);
        }

        res.json(results);
      }
    );
  }
);

// ===============================
// ✏️ EDITAR PARQUEADERO
// ===============================

app.put(
  '/parqueaderos/:id',

  (req, res) => {

    const { id } =
      req.params;

    const {
      descripcion,
      precio,
      direccion
    } = req.body;

    db.query(

      `UPDATE parqueaderos
       SET
       descripcion = ?,
       precio = ?,
       direccion = ?
       WHERE id = ?`,

      [
        descripcion,
        precio,
        direccion,
        id
      ],

      (err, result) => {

        if (err) {

          return res
            .status(500)
            .json(err);
        }

        res.json({
          success: true
        });
      }
    );
  }
);

// ===============================
// 🗑️ ELIMINAR PARQUEADERO
// ===============================

app.delete(
  '/parqueaderos/:id',

  (req, res) => {

    const { id } =
      req.params;

    db.query(

      `DELETE FROM parqueaderos
       WHERE id = ?`,

      [id],

      (err, result) => {

        if (err) {

          return res
            .status(500)
            .json(err);
        }

        res.json({
          success: true
        });
      }
    );
  }
);

// ===============================
// 📖 CREAR RESERVA
// ===============================

app.post(
  '/reservas',

  (req, res) => {

    const {
      usuario_id,
      parqueadero_id,
      horas,
      hora_inicio,
    } = req.body;

    db.query(

      `SELECT * FROM parqueaderos
       WHERE id = ?`,

      [parqueadero_id],

      (err, results) => {

        if (err) {

          return res
            .status(500)
            .json(err);
        }

        if (
          results.length === 0
        ) {

          return res
            .status(404)
            .json({

              message:
                'Parqueadero no encontrado'

            });
        }

        const parqueadero =
          results[0];

        const total =
          parseInt(
            parqueadero.precio
          ) *
          parseInt(horas);

        const reservaSql = `
          INSERT INTO reservas
          (
            usuario_id,
            parqueadero_id,
            horas,
            hora_inicio,
            total,
            estado
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.query(

          reservaSql,

          [
            usuario_id,
            parqueadero_id,
            horas,
            hora_inicio,
            total,
            'activa'
          ],

          (err, result) => {

            if (err) {

              return res
                .status(500)
                .json(err);
            }

            const reservaId =
              result.insertId;

            // 🔔 NOTIFICACIÓN

            db.query(

              `INSERT INTO notificaciones
              (
                usuario_id,
                reserva_id,
                emisor_id,
                titulo,
                mensaje
              )
              VALUES (?, ?, ?, ?, ?)`,

              [
                parqueadero.usuario_id,
                reservaId,
                usuario_id,
                'Nueva reserva 🚗',
                'Han reservado tu parqueadero'
              ]
            );

            // 💰 GANANCIAS

            const comision =
              total * 0.10;

            const ganancia =
              total - comision;

            db.query(

              `INSERT INTO ganancias
              (
                usuario_id,
                reserva_id,
                total_pago,
                comision,
                ganancia_arrendador
              )
              VALUES (?, ?, ?, ?, ?)`,

              [
                parqueadero.usuario_id,
                reservaId,
                total,
                comision,
                ganancia
              ]
            );

            res.json({

              success: true,
              total: total,
              reservaId: reservaId

            });
          }
        );
      }
    );
  }
);

// ===============================
// 📚 OBTENER RESERVAS
// ===============================

// ===============================
// 📚 OBTENER RESERVAS
// ===============================

app.get(
  '/reservas/:usuarioId',

  (req, res) => {

    const { usuarioId } =
      req.params;

    const sql = `

      SELECT

        r.*,

        p.descripcion,
        p.precio,
        p.direccion,
        p.foto,

        p.usuario_id AS arrendador_id,

        u.nombre,
        u.email

      FROM reservas r

      JOIN parqueaderos p
      ON r.parqueadero_id = p.id

      JOIN usuarios u
      ON p.usuario_id = u.id

      WHERE r.usuario_id = ?

      ORDER BY r.id DESC

    `;

    db.query(

      sql,

      [usuarioId],

      (err, results) => {

        if (err) {

          console.log(err);

          return res
            .status(500)
            .json(err);
        }

        res.json(results);
      }
    );
  }
);

// ===============================
// 📄 DETALLE RESERVA
// ===============================

app.get(
  '/reserva-detalle/:reservaId',
  (req, res) => {

    const { reservaId } = req.params;

    const sql = `

      SELECT
          r.*,

          p.descripcion,
          p.precio,
          p.direccion,
          p.foto,

          p.usuario_id AS arrendador_id,

          u.nombre

      FROM reservas r

      JOIN parqueaderos p
      ON r.parqueadero_id = p.id

      JOIN usuarios u
      ON p.usuario_id = u.id

      WHERE r.id = ?

    `;

    db.query(

      sql,

      [reservaId],

      (err, results) => {

        if (err) {

          console.log(err);

          return res
            .status(500)
            .json(err);
        }

        if (results.length === 0) {

          return res.status(404).json({
            message: 'Reserva no encontrada'
          });
        }

        res.json(results[0]);
      }
    );
  }
);
// ===============================
// 💳 CREAR PAGO
// ===============================

app.post(
  '/crear-pago',

  async (req, res) => {

    try {

      const {
        titulo,
        precio
      } = req.body;

      const preference =
        new Preference(client);

      const response =
        await preference.create({

          body: {

            items: [

              {
                title: titulo,
                quantity: 1,
                unit_price:
                  Number(precio),
                currency_id: 'COP',
              }

            ],
          },
        });

      res.json({

        url:
          response.init_point

      });

    } catch (e) {

      console.log(e);

      res.status(500)
        .json({

          error:
            'Error creando pago'

        });
    }
  }
);
// ===============================
// 📚 RESERVAS DEL ARRENDADOR
// ===============================

app.get(
  '/reservas-arrendador/:userId',

  (req, res) => {

    const { userId } = req.params;

    const sql = `

      SELECT

        r.*,

        p.descripcion,
        p.direccion,
        p.foto,

        u.nombre,
        u.email,

        r.usuario_id AS conductor_id

      FROM reservas r

      JOIN parqueaderos p
      ON r.parqueadero_id = p.id

      JOIN usuarios u
      ON r.usuario_id = u.id

      WHERE p.usuario_id = ?

      ORDER BY r.id DESC

    `;

    db.query(

      sql,

      [userId],

      (err, results) => {

        if (err) {
          return res.status(500).json(err);
        }

        res.json(results);
      }
    );
  }
);
// ===============================
// 🔔 NOTIFICACIONES
// ===============================

app.get(
  '/notificaciones/:userId',

  (req, res) => {

    const { userId } =
      req.params;

    const sql = `

      SELECT

        n.*,

        r.parqueadero_id,

        p.descripcion,
        p.direccion,
        p.foto,

        u.nombre
        AS conductor_nombre

      FROM notificaciones n

      LEFT JOIN reservas r
      ON n.reserva_id = r.id

      LEFT JOIN parqueaderos p
      ON r.parqueadero_id = p.id

      LEFT JOIN usuarios u
      ON n.emisor_id = u.id

      WHERE n.usuario_id = ?

      ORDER BY n.fecha DESC

    `;

    db.query(

      sql,

      [userId],

      (err, results) => {

        if (err) {

          return res
            .status(500)
            .json(err);
        }

        res.json(results);
      }
    );
  }
);

// ===============================
// 💰 GANANCIAS
// ===============================

app.get(
  '/ganancias/:userId',

  (req, res) => {

    const { userId } =
      req.params;

    db.query(

      `SELECT * FROM ganancias
       WHERE usuario_id = ?
       ORDER BY fecha DESC`,

      [userId],

      (err, results) => {

        if (err) {

          return res
            .status(500)
            .json(err);
        }

        res.json(results);
      }
    );
  }
);

// ===============================
// 💬 ENVIAR MENSAJE
// ===============================

app.post(
  '/mensajes',

  (req, res) => {

    const {
      reserva_id,
      emisor_id,
      receptor_id,
      mensaje
    } = req.body;

    db.query(

      `INSERT INTO mensajes
      (
        reserva_id,
        emisor_id,
        receptor_id,
        mensaje
      )
      VALUES (?, ?, ?, ?)`,

      [
        reserva_id,
        emisor_id,
        receptor_id,
        mensaje
      ],

      (err, result) => {

        if (err) {

          return res
            .status(500)
            .json(err);
        }

        res.json({
          success: true
        });
      }
    );
  }
);

// ===============================
// 💬 OBTENER MENSAJES
// ===============================

app.get(
  '/mensajes/:reservaId',

  (req, res) => {

    const { reservaId } =
      req.params;

    const sql = `

      SELECT

        m.*,

        u.nombre

      FROM mensajes m

      JOIN usuarios u
      ON m.emisor_id = u.id

      WHERE m.reserva_id = ?

      ORDER BY m.fecha ASC

    `;

    db.query(

      sql,

      [reservaId],

      (err, results) => {

        if (err) {

          return res
            .status(500)
            .json(err);
        }

        res.json(results);
      }
    );
  }
);