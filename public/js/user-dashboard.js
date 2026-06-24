async function loadReservations() {
  try {
    const res = await fetch("/api/reservas/mine");
    const data = await res.json();

    const container = document.getElementById("reservationsContainer");
    container.innerHTML = "";

    if (!data.length) {
      container.innerHTML = "<p>No tienes reservas</p>";
      return;
    }

  data.forEach(r => {
  const expDate = r.offer?.expirationDate;
  const isExpired = expDate ? new Date(expDate) < new Date() : false;

  const statusBadge = isExpired
    ? `<span class="badge danger">Vencida</span>`
    : `<span class="badge ok">Activa</span>`;

  const card = `
    <div class="card">

      ${statusBadge}

      <h3>${r.offer?.title || "Sin título"}</h3>
      <p>${r.offer?.description || ""}</p>

      <p class="muted">
        Fecha reserva: ${new Date(r.createdAt).toLocaleDateString("es-MX")}
      </p>

      <p class="muted">
        Caduca: ${
          expDate
            ? new Date(expDate).toLocaleDateString("es-MX")
            : "N/D"
        }
      </p>

      <div style="margin-top:10px;">
        <a href="/ofertas/${r.offer._id}" class="btn btn-small">
          Ver detalle
        </a>
      </div>

    </div>
  `;

  container.innerHTML += card;
});

  } catch (err) {
    console.error(err);
  }
}

loadReservations();