async function getOffer(id) {
  const res = await fetch(`/api/ofertas/${id}`);
  if (!res.ok) throw new Error("Oferta no encontrada");
  return res.json();
}
 
function fmtDate(d) {
  if (!d) return "N/D";
  return new Date(d).toLocaleDateString("es-MX");
}
 
function renderCard(o) {
  const price = typeof o.price === "number" ? `$${o.price}` : "N/D";
  const qty = typeof o.quantity === "number" ? o.quantity : "N/D";
  const canReserve = USER_ROLE === "user" && !alreadyReserved && o.quantity > 0;
 
  document.getElementById("detailCard").innerHTML = `
    <h2 class="page-title">${o.title ?? "Sin título"}</h2>
    <p class="card-meta">${o.category ?? "Sin categoría"}</p>
    <p class="muted">${o.description ?? ""}</p>
 
    <div style="margin-top:12px;">
      <p class="muted">Precio: <b>${price}</b></p>
      <p class="muted">Cantidad: <b>${qty}</b></p>
      <p class="muted">Caduca: <b>${fmtDate(o.expirationDate)}</b></p>
      <p class="muted">Dirección: <b>${o.address ?? "N/D"}</b></p>
    </div>
 
    <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
  <a class="btn btn-outline" href="/ofertas">Volver</a>
    ${canReserve
  ? `<button class="btn" onclick="reserveOffer('${o._id}')">Reservar</button>`
  : alreadyReserved
    ? `<span class="muted">Ya reservaste esta oferta</span>`
    : o.quantity <= 0
      ? `<span class="muted">Sin stock</span>`
      : `<span class="muted">Solo usuarios pueden reservar</span>`
}
  `;
}
 
/**
 * Google Maps por iframe (sin Google Cloud):
 * https://www.google.com/maps?q=lat,lng&output=embed
 */
function setGoogleMapsIframe(lat, lng) {
  const frame = document.getElementById("gmapFrame");
  const link = document.getElementById("gmapLink");
 
  if (typeof lat !== "number" || typeof lng !== "number") {
    // No coords
    frame.remove();
    link.style.display = "none";
    const wrap = document.querySelector(".map-embed");
    if (wrap) {
      wrap.innerHTML = `<div class="muted" style="padding:14px;">
        Esta oferta no tiene ubicación (lat/lng).
      </div>`;
    }
    return;
  }
 
  const q = `${lat},${lng}`;
  frame.src = `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
  link.href = `https://www.google.com/maps?q=${encodeURIComponent(q)}`;
}
 
/**
 * Open-Meteo (API de terceros real, sin key)
 */
async function loadWeather(lat, lng) {
  const box = document.getElementById("weatherBox");
 
  if (typeof lat !== "number" || typeof lng !== "number") {
    box.textContent = "No hay ubicación para consultar el clima.";
    return;
  }
 
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${encodeURIComponent(lat)}` +
      `&longitude=${encodeURIComponent(lng)}` +
      `&current=temperature_2m,precipitation,wind_speed_10m` +
      `&timezone=auto`;
 
    const res = await fetch(url);
    if (!res.ok) throw new Error("Open-Meteo no respondió");
    const data = await res.json();
 
    const c = data.current;
    if (!c) {
      box.textContent = "No se pudo obtener el clima.";
      return;
    }
 
    box.innerHTML = `
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap:12px;">
        <div class="card" style="padding:12px;">
          <div class="muted">Temperatura</div>
          <div style="font-size:22px; font-weight:900;">${c.temperature_2m}°C</div>
        </div>
        <div class="card" style="padding:12px;">
          <div class="muted">Lluvia</div>
          <div style="font-size:22px; font-weight:900;">${c.precipitation} mm</div>
        </div>
        <div class="card" style="padding:12px;">
          <div class="muted">Viento</div>
          <div style="font-size:22px; font-weight:900;">${c.wind_speed_10m} km/h</div>
        </div>
      </div>
      <p class="muted" style="margin-top:10px;">
        Actualizado: ${new Date(c.time).toLocaleString("es-MX")}
      </p>
    `;
  } catch (e) {
    box.textContent = `No se pudo cargar el clima: ${e.message}`;
  }
}
 
(async () => {
  try {
    // OFFER_ID viene de offer-detail.ejs
    const offer = await getOffer(OFFER_ID);
 
    await checkIfReserved(offer._id);
    renderCard(offer);
 
    const lat = offer?.location?.lat;
    const lng = offer?.location?.lng;
 
    setGoogleMapsIframe(lat, lng);
    loadWeather(lat, lng);
  } catch (e) {
    document.getElementById("detailCard").innerHTML = `
      <h2 class="page-title">Error</h2>
      <p class="muted">${e.message}</p>
      <a class="btn btn-outline" href="/ofertas" style="margin-top:12px;">Volver</a>
    `;
    const wb = document.getElementById("weatherBox");
    if (wb) wb.textContent = "No se pudo cargar el clima.";
  }
})();
 
async function reserveOffer(offerId) {
  try {
    const res = await fetch(`/api/reservas/${offerId}`, {
    method: "POST",
    credentials: "include"
    });
 
    const data = await res.json();
 
    if (res.ok) {
      alert("Reserva realizada correctamente");
      location.reload(); 
    } else {
      alert(data.message);
    }
 
  } catch (err) {
    console.error(err);
    alert("Error de conexión");
  }
}
 
let alreadyReserved = false;
 
async function checkIfReserved(offerId) {
  try {
    const res = await fetch("/api/reservas/mine", {
    credentials: "include"
  });
    const data = await res.json();
 
    alreadyReserved = data.some(r => r.offer._id === offerId);
 
  } catch (err) {
    console.error("Error verificando reservas", err);
  }
}