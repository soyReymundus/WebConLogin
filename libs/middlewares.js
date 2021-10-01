const { verify } = require("jsonwebtoken");

function contentType(request, response, next) {

    if (request.method == "GET" || request.method == "DELETE" || request.method == "HEAD") return next();
    if (!!request.content) return next();

    if (!request.headers['content-type'] || request.headers['content-type'].toLowerCase() != "application/json") {

        response
            .status(415)
            .type("application/json")
            .send(
                JSON.stringify({
                    "error": {
                        "code": 415,
                        "message": "El encabezado \"content-type\" debe ser \"application/json\", asi como tambien el cuerpo."
                    }
                })
            ).end();

    } else {

        try {
            request.content = JSON.parse(request.body);
            next();
        } catch (e) {
            response
                .status(400)
                .type("application/json")
                .send(
                    JSON.stringify({
                        "redirect": process.env.WEB + "/register",
                        "error": {
                            "code": 400,
                            "message": "El cuerpo debe ser un JSON."
                        }
                    })
                ).end();
        };

    };

};

function pfpContentType(request, response, next) {

    if (request.method == "GET" || request.method == "DELETE" || request.method == "HEAD") return next();
    if (!!request.content) return next();

    if (!request.headers['content-type'] || request.headers['content-type'].toLowerCase() != "image/png") {

        response
            .status(415)
            .type("application/json")
            .send(
                JSON.stringify({
                    "error": {
                        "code": 415,
                        "message": "El encabezado \"content-type\" debe ser \"image/png\", asi como tambien el cuerpo."
                    }
                })
            ).end();

    } else {
        if (!request.body) {

            response
                .status(400)
                .type("application/json")
                .send(
                    JSON.stringify({
                        "error": {
                            "code": 400,
                            "message": "El cuerpo esta mal formado."
                        }
                    })
                ).end();

        } else {
            request.content = request.body.replace(/^data:image\/png;base64,/, "");
            next();
        };
    };
};

function authorization(request, response, next) {

    if (!!request.userID) return next();

    if (request.headers.authorization != undefined) {

        response
            .status(406)
            .type("application/json")
            .send(
                JSON.stringify({
                    "redirect": process.env.WEB,
                    "error": {
                        "code": 406,
                        "message": "Usted ya en linea."
                    }
                })
            ).end();

    } else {
        request.userID = true;
        next();
    };
};

function token(request, response, next) {

    if (!!request.userID) return next();

    if (request.headers.authorization == undefined || request.headers.authorization == "") {

        response
            .status(401)
            .type("application/json")
            .send(
                JSON.stringify({
                    "error": {
                        "code": 401,
                        "message": "Es necesario autenticar para obtener la respuesta solicitada."
                    }
                })
            ).end();

    } else {

        let header = request.headers.authorization.split(" ");

        if (header.length != 2) {

            response
                .status(400)
                .type("application/json")
                .send(
                    JSON.stringify({
                        "error": {
                            "code": 400,
                            "message": "El contenido de la cabezera \"authorization\" no es valido."
                        }
                    })
                ).end();

        } else {

            if (header[0] != "Bearer") {

                response
                    .status(401)
                    .type("application/json")
                    .send(
                        JSON.stringify({
                            "error": {
                                "code": 401,
                                "message": "No se admite ese tipo de tokens"
                            }
                        })
                    ).end();

            } else {

                try {

                    let decode = verify(header[1], process.env.JWT_KEY);

                    if (!decode.ID || typeof decode.ID != "number") {

                        response
                            .status(401)
                            .type("application/json")
                            .send(
                                JSON.stringify({
                                    "error": {
                                        "code": 401,
                                        "message": "El token no es valido (no contiene ID de usuario)."
                                    }
                                })
                            ).end();

                    } else {
                        request.userID = decode.ID;
                        next();
                    };
                } catch (e) {

                    response
                        .status(401)
                        .type("application/json")
                        .send(
                            JSON.stringify({
                                "error": {
                                    "code": 401,
                                    "message": "El token no es valido."
                                }
                            })
                        ).end();

                };

            };
        };
    };
};

function method(request, response, next) {
    if (request.method == "GET" || request.method == "POST" || request.method == "PATCH") {
        next();
    } else {
        let JSONresponse = {
            "error": {
                "code": 405,
                "message": "Metodo http no permitido."
            }
        };

        response
            .status(405)
            .type("application/json")
            .send(JSON.stringify(JSONresponse)).end();

    };
};

function error(error, request, response, next) {

    let JSONresponse;

    if (error.statusCode == 413) {

        JSONresponse = {
            "error": {
                "code": 413,
                "message": "El cuerpo de la peticion es muy largo, usa 5MB o menos."
            }
        };

        response
            .status(413)
            .send(JSON.stringify(JSONresponse)).end();
    } else {

        JSONresponse = {
            "error": {
                "code": 500,
                "message": "Ocurrio un error, intenta de nuevo mas tarde."
            }
        };

        response
            .status(500)
            .send(JSON.stringify(JSONresponse)).end();
    };

};

module.exports = {
    contentType,
    authorization,
    pfpContentType,
    token,
    method,
    error
};