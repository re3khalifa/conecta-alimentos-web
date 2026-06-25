const router = require("express").Router();

const soapController = require("../controllers/soap.controller");

router.get("/", soapController.getOffersSOAP);

module.exports = router;