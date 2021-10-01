var inicio = document.getElementById('inicio');
var login = document.getElementById('login');
var register = document.getElementById('register');
var config = document.getElementById('config');
var perfil = document.getElementById('perfil');
var pfpContainer = document.getElementById("pfp-container");
var data = {};

function update(){
    perfil.style.objectFit = "cover";
    perfil.style.objectPosition = "center";
}


if (!window.localStorage.getItem("token")) {
    config.setAttribute("hidden", true);
    perfil.setAttribute("hidden", true);
    login.removeAttribute("hidden");
    register.removeAttribute("hidden");
} else {
    config.removeAttribute("hidden");
    perfil.removeAttribute("hidden");
    login.setAttribute("hidden", true);
    register.setAttribute("hidden", true);

    fetch("http://127.0.0.1:8080/api/users/@me", {
        method: 'GET',
        headers: {
            "authorization": "Bearer " + window.localStorage.getItem("token")
        }
    })
        .then((response) => {
            response.json()
                .then((json) => {

                    if (response.ok) {

                        data = json.data;
                        let avatar = json.data.avatar;
                        if (!avatar) {
                            perfil.setAttribute("src", "http://127.0.0.1:8080/images/favicon.ico");
                        } else {
                            perfil.setAttribute("src", "http://127.0.0.1:8080/images/pfp/" + avatar + ".png");
                        };

                        pfpContainer.removeAttribute("hidden");

                        if (!!json.redirect) location.href = json.redirect;

                    } else {

                        if (!json.redirect) {

                            window.localStorage.removeItem("token");
                            location.reload();

                        } else {

                            location.href = json.redirect;

                        };

                    };
                })
                .catch((error) => {
                    location.reload();
                });
        })
        .catch((error) => {
            window.localStorage.removeItem("token");
            location.reload();
        });

};