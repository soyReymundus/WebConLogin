const express = require('express');
const app = express();
require('dotenv').config();

app.use("/api", require("./routes/api.js"));
app.use("/", require("./routes/web.js"));

app.listen(8080, () => {
    console.log("El servidor esta funcionando.");
});