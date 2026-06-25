const Offer = require("../models/Offer");

exports.getOffersSOAP = async (req, res, next) => {
  try {

    const offers = await Offer.find().lean();

    let offersXML = "";

    offers.forEach((offer) => {
      offersXML += `
        <Offer>
          <Id>${offer._id}</Id>
          <Title>${offer.title}</Title>
          <Category>${offer.category}</Category>
          <Price>${offer.price}</Price>
          <Quantity>${offer.quantity}</Quantity>
          <ExpirationDate>${offer.expirationDate}</ExpirationDate>
        </Offer>
      `;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>

<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">

  <soap:Body>

    <GetOffersResponse>

      ${offersXML}

    </GetOffersResponse>

  </soap:Body>

</soap:Envelope>`;

    res.set("Content-Type", "text/xml");
    res.send(xml);

  } catch (err) {
    next(err);
  }
};