const { readdirSync, readFileSync, statSync } = require("fs");
var archivos = new Map();
var contenidosCarpetaHtml = readdirSync("./public/html");
var contenidosCarpetaCss = readdirSync("./public/css");
var contenidosCarpetaJs = readdirSync("./public/js");
var subdirectorios = [];

for (let index = 0; index < contenidosCarpetaHtml.length; index++) {
    const archivo = contenidosCarpetaHtml[index];

    if (statSync("./public/html/" + archivo).isFile()) {
        let clave = "/" + archivo;

        if (archivo.endsWith(".html")) {
            let nombre = archivo.replace(".html", "");

            if (nombre.length == 3 && parseInt(nombre) <= 599 && parseInt(nombre) >= 100) {
                clave = nombre;
            }else if(nombre == "id"){
                clave = "id";
            };

        };
        
        archivos.set(clave, readFileSync("./public/html/" + archivo).toString());
    } else {
        subdirectorios.push("./public/html/" + archivo);
    };

};

for (let index = 0; index < contenidosCarpetaJs.length; index++) {
    const archivo = contenidosCarpetaJs[index];

    if (statSync("./public/js/" + archivo).isFile()) {

        archivos.set("/js/" + archivo, readFileSync("./public/js/" + archivo).toString());

    } else {
        subdirectorios.push("./public/js/" + archivo);
    };

};

for (let index = 0; index < contenidosCarpetaCss.length; index++) {
    const archivo = contenidosCarpetaCss[index];

    if (statSync("./public/css/" + archivo).isFile()) {

        archivos.set("/css/" + archivo, readFileSync("./public/css/" + archivo).toString());

    } else {
        subdirectorios.push("./public/css/" + archivo);
    };

};

for (let index = 0; index < subdirectorios.length; index++) {
    const subdirectorio = subdirectorios[index];
    const contenidosSubdirectorio = readdirSync(subdirectorios[index]);

    for (let index = 0; index < contenidosSubdirectorio.length; index++) {
        const archivo = contenidosSubdirectorio[index];
    
        if (statSync(subdirectorio + "/" + archivo).isFile()) {
    
            archivos.set(subdirectorio.replace("./public", "").replace("/html", "") + "/" + archivo, readFileSync(subdirectorio + "/" + archivo).toString());
    
        } else {
            subdirectorios.push(subdirectorio + "/" + archivo);
        };
    
    };

};

module.exports = archivos;

/*const { readdirSync, readFileSync } = require("fs");
var archivos = new Map();
var rutasCarpetas = readdirSync("./public");

for (let index = 0; index < rutasCarpetas.length; index++) {
    const carpeta = rutasCarpetas[index];

    if (!carpeta.includes("\.")) {

        let ruta = "/" + carpeta;
        let rutasArchivos = readdirSync("./public" + ruta);

        for (let index2 = 0; index2 < rutasArchivos.length; index2++) {
            const archivo = rutasArchivos[index2].toLocaleLowerCase();
            var contenidoArchivo;

            if (ruta == "/html") {
                contenidoArchivo = readFileSync("./public" + ruta + "/" + archivo).toString();

                archivos.set("/" + archivo, contenidoArchivo);

            } else if (ruta == "/js" || ruta == "/css") {
                contenidoArchivo = readFileSync("./public" + ruta + "/" + archivo).toString();

                archivos.set(ruta + "/" + archivo, contenidoArchivo);

            };

        };

    };

};

module.exports = archivos;*/