exports.getOffersSOAP = (req, res) => {

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope
xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">

  <soap:Body>

    <GetOffersResponse>

      <Offer>
        <Id>1</Id>
        <Title>Verduras frescas</Title>
        <Category>Verduras</Category>
        <Price>80</Price>
        <Quantity>15</Quantity>
      </Offer>

      <Offer>
        <Id>2</Id>
        <Title>Pan del día</Title>
        <Category>Panadería</Category>
        <Price>30</Price>
        <Quantity>10</Quantity>
      </Offer>

    </GetOffersResponse>

  </soap:Body>

</soap:Envelope>`;

  res.set("Content-Type", "text/xml");

  res.send(xml);

};