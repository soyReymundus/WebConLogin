const express = require('express');
const api = express.Router();
const mysql = require('mysql');
const shajs = require('sha.js');
const { existsSync, appendFileSync } = require("fs");
const { sign } = require("jsonwebtoken");
const middlewares = require("../libs/middlewares.js");

const transporter = require("nodemailer").createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: (process.env.MAIL_SECURE.toLowerCase() === 'true'),
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

const connection = mysql.createConnection({
    host: process.env.SQL_HOST,
    port: process.env.SQL_PORT,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASS,
    database: process.env.SQL_DB
});

connection.connect();

api.use(middlewares.method);
api.use(express.text({ type: "*/*", limit: "5mb" }));
api.use(middlewares.error);
api.use(["/pfp"], middlewares.pfpContentType);
api.use(middlewares.contentType);
api.use(["/login", "/register", "/verify"], middlewares.authorization);
api.use(middlewares.token);

api.param("username", (request, response, next, username) => {
    let JSONresponse = {};

    if (username.toLowerCase() == "@me") {

        let ID = request.userID;

        connection.query(`SELECT USERNAME, ID, EMAIL, AVATAR FROM users WHERE ID = "${ID}"`, (selectError, results, fields) => {

            if (selectError) {
                JSONresponse = {
                    "error": {
                        "code": 500,
                        "message": "Ocurrio un error, intenta de nuevo mas tarde."
                    }
                };

                response
                    .status(500)
                    .type("application/json")
                    .send(JSON.stringify(JSONresponse)).end();
                return;
            };

            if (!results[0]) {
                JSONresponse = {
                    "error": {
                        "code": 404,
                        "message": "El Token es invalido (el usuario no existe)."
                    }
                };

                response
                    .status(400)
                    .type("application/json")
                    .send(JSON.stringify(JSONresponse)).end();
                return;
            };

            request.user = {
                "username": results[0].USERNAME,
                "email": results[0].EMAIL,
                "avatar": results[0].AVATAR,
                "id": results[0].ID,
            };

            next();

        });

    } else if (/^(\w|ñ|ç)+$/i.test(username)) {

        connection.query(`SELECT USERNAME, ID, EMAIL, AVATAR FROM users WHERE USERNAME = "${username}"`, (selectError, results, fields) => {

            if (selectError) {
                JSONresponse = {
                    "error": {
                        "code": 500,
                        "message": "Ocurrio un error, intenta de nuevo mas tarde."
                    }
                };

                response
                    .status(500)
                    .type("application/json")
                    .send(JSON.stringify(JSONresponse)).end();
                return;
            };

            if (!results[0]) {
                JSONresponse = {
                    "error": {
                        "code": 404,
                        "message": "El usuario no existe."
                    }
                };

                response
                    .status(400)
                    .type("application/json")
                    .send(JSON.stringify(JSONresponse)).end();
                return;
            };

            request.user = {
                "username": results[0].USERNAME,
                "email": results[0].EMAIL,
                "avatar": results[0].AVATAR,
                "id": results[0].ID,
            };

            next();

        });

    } else {

        JSONresponse = {
            "error": {
                "code": 404,
                "message": "El usuario no existe."
            }
        };

        response
            .status(400)
            .type("application/json")
            .send(JSON.stringify(JSONresponse)).end();
        return;

    };
});

api.post("/register", (request, response) => {

    let JSONresponse = {};
    let body = request.content;

    if (!body.username || typeof body.username != "string" || body.username.length > 15) {
        JSONresponse = {
            "error": {
                "code": 422,
                "message": "El nombre de usuario es demasiado largo o no lo a ingresado.",
                "field": "username"
            }
        };

        response
            .status(422)
            .type("application/json")
            .send(JSON.stringify(JSONresponse)).end();
        return;
    };

    if (!/^(\w|ñ|ç)+$/i.test(body.username)) {
        JSONresponse = {
            "error": {
                "code": 422,
                "message": "El nombre de usuario solo puede tener letras de la A-Z o numero del 0-9.",
                "field": "username"
            }
        };

        response
            .status(422)
            .type("application/json")
            .send(JSON.stringify(JSONresponse)).end();
        return;
    };

    if (!body.email || typeof body.email != "string") {
        JSONresponse = {
            "redirect": process.env.WEB + "/register",
            "error": {
                "code": 422,
                "message": "Por favor ingrese un correo electronico.",
                "field": "email"
            }
        };

        response
            .status(422)
            .type("application/json")
            .send(JSON.stringify(JSONresponse)).end();
        return;
    };

    if (body.email.length > 320 || !/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(body.email)) {
        JSONresponse = {
            "error": {
                "code": 422,
                "message": "Por favor ingrese un correo electronico valido.",
                "field": "email"
            }
        };

        response
            .status(422)
            .type("application/json")
            .send(JSON.stringify(JSONresponse)).end();
        return;
    };

    if (!body.password || typeof body.password != "string") {
        JSONresponse = {
            "redirect": process.env.WEB + "/register",
            "error": {
                "code": 422,
                "message": "Por favor ingrese una contraseña.",
                "field": "password"
            }
        };

        response
            .status(422)
            .type("application/json")
            .send(JSON.stringify(JSONresponse)).end();
        return;
    };

    connection.query("SELECT USERNAME, EMAIL FROM users WHERE USERNAME = ? OR EMAIL = ?", [body.username, body.email], (selectError, results, fields) => {

        if (selectError) {
            JSONresponse = {
                "error": {
                    "code": 500,
                    "message": "Ocurrio un error, intenta de nuevo mas tarde."
                }
            };

            response
                .status(500)
                .type("application/json")
                .send(JSON.stringify(JSONresponse)).end();
            return;
        };

        for (let index = 0; index < results.length; index++) {
            const user = results[index];
            if (!!user) {
                if (user.USERNAME == body.username) {
                    JSONresponse = {
                        "error": {
                            "code": 409,
                            "message": "El nombre de usuario ya esta en uso.",
                            "field": "username"
                        }
                    };

                    response
                        .status(409)
                        .type("application/json")
                        .send(JSON.stringify(JSONresponse)).end();
                    return;
                };
            };
        };

        for (let index = 0; index < results.length; index++) {
            const user = results[index];
            if (!!user) {
                if (user.EMAIL == body.email) {
                    JSONresponse = {
                        "error": {
                            "code": 409,
                            "message": "El correo electronico ya esta en uso.",
                            "field": "email"
                        }
                    };

                    response
                        .status(409)
                        .type("application/json")
                        .send(JSON.stringify(JSONresponse)).end();
                    return;
                };
            };
        };

        let password = shajs('sha256').update(process.env.SALT + body.password).digest('hex');
        let code = shajs('sha256').update(process.env.SALT + body.email).digest('hex');

        connection.query("INSERT INTO users SET USERNAME = ?, PASS = ?, EMAIL = ?, EMAILCODE = ?, VERIFIED = 0", [body.username, password, body.email, code], (insertError, results, fields) => {
            if (insertError) {
                JSONresponse = {
                    "error": {
                        "code": 500,
                        "message": "Ocurrio un error, intenta de nuevo mas tarde."
                    }
                };

                response
                    .status(500)
                    .type("application/json")
                    .send(JSON.stringify(JSONresponse)).end();
            } else {
                JSONresponse = {
                    data: {
                        message: "Le hemos enviado un email para que verifique su cuenta."
                    }
                };

                response
                    .status(200)
                    .type("application/json")
                    .send(JSON.stringify(JSONresponse)).end();

                transporter.sendMail({
                    from: `"Simple Web" <no-reply@${process.env.MAIL_HOST}.com>`,
                    to: body.email,
                    subject: "Verificacion!",
                    text: "Entra aqui para verificarte: " + process.env.WEB + "/verify?code=" + code,
                });

            };
        });

    });

});

api.patch("/verify", (request, response) => {

    let JSONresponse = {};
    let body = request.content;

    if (!body.code || body.code == "") {
        JSONresponse = {
            "error": {
                "code": 422,
                "message": "No se ingreso un codigo."
            }
        };

        response
            .status(422)
            .type("application/json")
            .send(JSON.stringify(JSONresponse)).end();
        return;
    };

    if (typeof body.code != "string") {
        JSONresponse = {
            "redirect": process.env.WEB,
            "error": {
                "code": 422,
                "message": "El tipo de codigo ingresado no es valido."
            }
        };

        response
            .status(422)
            .type("application/json")
            .send(JSON.stringify(JSONresponse)).end();
        return;
    };

    connection.query("SELECT ID FROM users WHERE EMAILCODE = ?", [body.code], (selectError, results, fields) => {

        if (selectError) {
            JSONresponse = {
                "error": {
                    "code": 500,
                    "message": "Ocurrio un error, intenta de nuevo mas tarde."
                }
            };

            response
                .status(500)
                .type("application/json")
                .send(JSON.stringify(JSONresponse)).end();
            return;
        };

        let user = results[0];

        if (!user) {
            JSONresponse = {
                "error": {
                    "code": 422,
                    "message": "El tipo de codigo ingresado no es valido."
                }
            };

            response
                .status(422)
                .type("application/json")
                .send(JSON.stringify(JSONresponse)).end();
            return;
        };

        connection.query(`UPDATE users SET EMAILCODE = null, VERIFIED = 1 WHERE ID = ${user.ID}`, (updateError, results, fields) => {

            if (updateError) {
                JSONresponse = {
                    "error": {
                        "code": 500,
                        "message": "Ocurrio un error, intenta de nuevo mas tarde."
                    }
                };

                response
                    .status(500)
                    .type("application/json")
                    .send(JSON.stringify(JSONresponse)).end();
            } else {

                JSONresponse = {
                    "redirect": process.env.WEB + "/login",
                    "data": {
                        message: "Su cuenta se verifico correctamente."
                    }
                };

                response
                    .status(200)
                    .type("application/json")
                    .send(JSON.stringify(JSONresponse)).end();

            };

        });

    });

});

api.post("/login", (request, response) => {

    let JSONresponse = {};
    let body = request.content;

    if (!body.email || typeof body.email != "string") {
        JSONresponse = {
            "error": {
                "code": 422,
                "message": "Por favor ingrese un correo electronico valido.",
                "field": "email"
            }
        };

        response
            .status(422)
            .type("application/json")
            .send(JSON.stringify(JSONresponse)).end();
        return;
    };

    if (!body.password || typeof body.password != "string") {
        JSONresponse = {
            "error": {
                "code": 422,
                "message": "Por favor ingrese una contraseña valida.",
                "field": "password"
            }
        };

        response
            .status(422)
            .type("application/json")
            .send(JSON.stringify(JSONresponse)).end();
        return;
    };

    let password = shajs('sha256').update(process.env.SALT + body.password).digest('hex');

    connection.query("SELECT ID, VERIFIED FROM users WHERE EMAIL = ? AND PASS = ?", [body.email, password], (selectError, results, fields) => {

        if (selectError) {

            JSONresponse = {
                "error": {
                    "code": 500,
                    "message": "Ocurrio un error, intenta de nuevo mas tarde."
                }
            };

            response
                .status(500)
                .type("application/json")
                .send(JSON.stringify(JSONresponse)).end();
            return;
        };

        if (!results[0]) {
            JSONresponse = {
                "error": {
                    "code": 400,
                    "message": "El correo o contraseña no son validos."
                }
            };

            response
                .status(400)
                .type("application/json")
                .send(JSON.stringify(JSONresponse)).end();
            return;
        };

        if (results[0].VERIFIED == 0) {

            JSONresponse = {
                "error": {
                    "code": 403,
                    "message": "Necesitamos verificar tu correo electrinico, ¡Ya te hemos enviado un email!."
                }
            };

            response
                .status(403)
                .type("application/json")
                .send(JSON.stringify(JSONresponse)).end();

            return;

        };

        let token = sign({ "ID": results[0].ID }, process.env.JWT_KEY);

        JSONresponse = {
            "redirect": process.env.WEB,
            "data": {
                "token": token
            }
        };

        response
            .status(200)
            .type("application/json")
            .send(JSON.stringify(JSONresponse)).end();

    });

});

api.get("/users/:username", (request, response) => {

    JSONresponse = {
        "data": {
            "username": request.user.username,
            "avatar": request.user.avatar
        }
    };

    if (request.userID == request.user.id) {
        JSONresponse.email = request.user.email;
    };

    response
        .status(200)
        .type("application/json")
        .send(JSON.stringify(JSONresponse)).end();
    return;

});

api.patch("/users/:username", (request, response) => {

    let JSONresponse = {};
    let ID = request.userID;
    let body = request.content;
    let password;
    let sql;

    if (ID == !request.user.id) {

        JSONresponse = {
            "redirect": process.env.WEB + "/config",
            "error": {
                "code": 401,
                "message": "Debes iniciar sesion como el usuario a modficar."
            }
        };

        response
            .status(401)
            .type("application/json")
            .send(JSON.stringify(JSONresponse)).end();
        return;

    };

    if (!body.password) {

        JSONresponse = {
            "redirect": process.env.WEB + "/config",
            "error": {
                "code": 401,
                "message": "Debes ingresar una contraseña.",
                "field": "password"
            }
        };

        response
            .status(401)
            .type("application/json")
            .send(JSON.stringify(JSONresponse)).end();
        return;

    };

    if (typeof body.password != "string") {

        JSONresponse = {
            "redirect": process.env.WEB + "/config",
            "error": {
                "code": 422,
                "message": "El cuerpo no es valido."
            }
        };

        response
            .status(422)
            .type("application/json")
            .send(JSON.stringify(JSONresponse)).end();
        return;

    };

    password = shajs('sha256').update(process.env.SALT + body.password).digest('hex');

    if (!body.username && !body.avatar) {
        JSONresponse = {
            "data": null
        };

        response
            .status(200)
            .type("application/json")
            .send(JSON.stringify(JSONresponse)).end();

        return;
    };

    if ((!!body.username && typeof body.username != "string") || (!!body.avatar && typeof body.avatar != "string")) {

        JSONresponse = {
            "redirect": process.env.WEB + "/config",
            "error": {
                "code": 422,
                "message": "El cuerpo no es valido."
            }
        };

        response
            .status(422)
            .type("application/json")
            .send(JSON.stringify(JSONresponse)).end();
        return;

    };

    if (!!body.username && body.username.length > 15) {
        JSONresponse = {
            "error": {
                "code": 422,
                "message": "El nombre de usuario es demasiado largo.",
                "field": "username"
            }
        };

        response
            .status(422)
            .type("application/json")
            .send(JSON.stringify(JSONresponse)).end();
        return;
    };

    if (!!body.username && !/^(\w|ñ|ç)+$/i.test(body.username)) {
        JSONresponse = {
            "error": {
                "code": 422,
                "message": "El nombre de usuario solo puede tener letras de la A-Z o numero del 0-9.",
                "field": "username"
            }
        };

        response
            .status(422)
            .type("application/json")
            .send(JSON.stringify(JSONresponse)).end();
        return;
    };

    if (!!body.avatar && body.avatar.length != 64) {
        JSONresponse = {
            "redirect": process.env.WEB + "/config",
            "error": {
                "code": 422,
                "message": "El avatar no es valido.",
                "field": "avatar"
            }
        };

        response
            .status(422)
            .type("application/json")
            .send(JSON.stringify(JSONresponse)).end();
        return;
    };

    if (!!body.avatar && !existsSync(`./public/images/pfp/${body.avatar}.png`)) {
        JSONresponse = {
            "redirect": process.env.WEB + "/config",
            "error": {
                "code": 422,
                "message": "El avatar no es valido.",
                "field": "avatar"
            }
        };

        response
            .status(422)
            .type("application/json")
            .send(JSON.stringify(JSONresponse)).end();
        return;
    };

    if (!!body.username && !!body.avatar) {
        sql = ["UPDATE users SET USERNAME = ?, AVATAR = ? WHERE ID = " + ID + " AND PASS = \"" + password + "\"", [body.username, body.avatar]];

        JSONresponse = {
            "data": {
                "username": body.username,
                "avatar": body.avatar
            }
        };
    } else if (!!body.username) {
        sql = ["UPDATE users SET USERNAME = ? WHERE ID = " + ID + " AND PASS = \"" + password + "\"", [body.username]];

        JSONresponse = {
            "data": {
                "username": body.username
            }
        };
    } else if (!!body.avatar) {
        sql = ["UPDATE users SET AVATAR = ? WHERE ID = " + ID + " AND PASS = \"" + password + "\"", [body.avatar]];

        JSONresponse = {
            "data": {
                "avatar": body.avatar
            }
        };
    };

    connection.query(sql[0], sql[1], (updateError, results, fields) => {

        if (updateError) {
            JSONresponse = {
                "error": {
                    "code": 500,
                    "message": "Ocurrio un error, intenta de nuevo mas tarde."
                }
            };

            response
                .status(500)
                .type("application/json")
                .send(JSON.stringify(JSONresponse)).end();
            return;

        };
        
        if (results.affectedRows == 0) {
            JSONresponse = {
                "error": {
                    "code": 401,
                    "message": "La contraseña es incorrecta.",
                    "field": "password"
                }
            };

            response
                .status(400)
                .type("application/json")
                .send(JSON.stringify(JSONresponse)).end();
            return;
        }

        response
            .status(200)
            .type("application/json")
            .send(JSON.stringify(JSONresponse)).end();

    });

});

api.post("/pfp", (request, response) => {

    let JSONresponse = {};

    let pfp = {
        "name": shajs('sha256').update(atob(request.content)).digest("hex"),
        "content": request.content
    };

    if (existsSync(`./public/images/pfp/` + pfp.name + ".png")) {

        JSONresponse = {
            "data": {
                "avatar": pfp.name
            }
        };

        response
            .status(200)
            .type("application/json")
            .send(JSON.stringify(JSONresponse)).end();

    } else {

        appendFileSync("./public/images/pfp/" + pfp.name + ".png", pfp.content, { "encoding": "base64" });
        JSONresponse = {
            "data": {
                "avatar": pfp.name
            }
        };

        response
            .status(201)
            .type("application/json")
            .send(JSON.stringify(JSONresponse)).end();

    };

});

api.all("*", (request, response) => {
    let JSONresponse = {
        "error": {
            "code": 404,
            "message": "No se encontro el endpoint."
        }
    };

    response
        .status(404)
        .type("application/json")
        .send(JSON.stringify(JSONresponse)).end();
});

module.exports = api;