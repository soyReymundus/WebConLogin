# WebConLogin

Hola, debo decir que hice esto de la mejor forma que pude para mostrar que es lo que puedo hacer. La verdad es que no incluye mucho solo es una web con un front-end pobre que incluye un sistema de registro, inicio de sesión, visita a otros perfiles, configuración de perfil y bienvenida. Obviamente no es complicado para mi hacer el sistema de recuperación de contraseña, de límite de tamaño para la foto de perfil que se pongan las personas entre otros, pero el punto de esta web es simplemente probar que puedo hacerlo y no hacer una web completa y lista para entrar al mundo real.

Soy consciente de que algunas partes del código están mal hecha o inentendibles como nombres de variables o archivos en español y otras en inglés, pero simplemente no quiero perder mucho tiempo haciendo esto (incluso remplazando nombres).

Además de todo lo anteriormente dicho hago esto para que la anterior cosa que subi no quede como lo mejor que puedo hacer, puesto que yo lo veo como un bot de discord con un código inentendible, mal optimizado y con posibles bugs que se me vienen a la mente. Ese anterior "Proyecto" lo hice muy rápido y sin ganas para luego únicamente acortar el index.js realmente no refleja lo que soy capaz. 

Ahora gracias por leer a las dos personas que están leyendo esto mi amigo y una persona aleatoria de internet.

# Lo "interesante"

Simplemente voy a dar una breve explicación de como funciona la API de esta web, no me quiero extender mucho más puesto que además de que muy poca gente leerá esto y nadie tendrá interés en esto las demás cosas que podría decir se pueden entender fácilmente leyendo unos cuantos minutos el código.

La respuesta que siempre devolvera la API:
```json
{
    "redirect"?: "", //Aveces puede estar y simplemente le dice al cliente que debe redireccionar de inmediato a a ese lugar.
    "data": {}, //Los datos devueltos.
    "error": { //Si hay un error devolvera esto.
        "code": 404, //El HTTP Status Code del error.
        "message": "ID not found", //Una descripcion del error.
        "field"?: "" //El lugar donde ocurrio el error, como la contraseña o el nombre de usuario.
    }
}
```

POST: /api/register
```json
{
    "username": "",
    "password": "",
    "email": ""
}
```

POST: /api/login
```json
{
    "email": "",
    "password": "",
}
```

PATCH: /api/verify
```json
{
    "code": ""
}
```

PATCH: /users/@me
```json
{
    "username"?: "",
    "avatar"?: "",
    "password": ""
}
```

POST: /pfp
```json
data:image/png;base64,...
```