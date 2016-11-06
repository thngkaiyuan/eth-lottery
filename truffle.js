module.exports = {
  build: {
    "index.html": "index.html",
    "app.js": [
      "javascripts/app.js"
    ],
    "app.css": [
      "stylesheets/app.css"
    ],
    "stylesheets/": "stylesheets/",
    "images/": "images/",
    "javascripts/": "javascripts/"
  },
  rpc: {
    host: "localhost",
    port: 8545
  }
};
