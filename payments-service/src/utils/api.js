const axios = require("axios");

const api = axios.create({
  timeout: 10000 // 10 segundos
});

module.exports = api;
