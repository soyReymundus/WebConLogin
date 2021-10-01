const { existsSync } = require("fs");
const express = require('express');
const web = express.Router();
const archivos = require("../libs/cargadorDeArchivos.js")

web.use((error, request, response, next) => {
    response
        .status(500)
        .type("text/html")
        .send(archivos.get("500")).end();
});
web.use((request, response, next) => {
    if (request.method != "GET") {
        response
            .status(405)
            .type("text/html")
            .send(archivos.get("405")).end();
    } else {
        next();
    };
});

web.get(/\/images\/.?/, (request, response) => {

    if (existsSync("./public" + request.path)) {

        var contentType = "image/png";

        if (request.path.endsWith(".ico")) contentType = "image/vnd.microsoft.icon";

        response
            .status(200)
            .type(contentType)
            .sendFile(__dirname.replace("routes", "").replace("\\", "/") + "/public" + request.path);

    } else {

        response
            .status(404)
            .type("text/html")
            .send(archivos.get("404")).end();

    };

});

web.get(/\/id\/.?/, (request, response) => {

    response
        .status(200)
        .type("text/html")
        .send(archivos.get("id")).end();

});

web.get(["/", "/index", "/index.html", "/home", "/home.html"], (request, response) => {

    response
        .status(200)
        .type("text/html")
        .send(archivos.get("/home.html")).end();

});

web.get("*", (request, response) => {

    if (request.path.toLocaleLowerCase().endsWith(".js")) response.type("text/javascript");
    if (request.path.toLocaleLowerCase().endsWith(".css")) response.type("text/css");
    if (request.path.toLocaleLowerCase().endsWith(".html")) response.type("text/html");

    if (archivos.has(request.path.toLocaleLowerCase())) {

        response
            .status(200)
            .send(archivos.get(request.path.toLocaleLowerCase())).end();

    } else if (archivos.has(request.path.toLocaleLowerCase() + ".html")) {

        response
            .status(200)
            .send(archivos.get(request.path.toLocaleLowerCase() + ".html")).end();

    } else {

        response
            .status(404)
            .type("text/html")
            .send(archivos.get("404")).end();

    };
});

module.exports = web;