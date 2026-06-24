const USER_ROLE = window.USER_ROLE || null;

async function fetchOffers(params) {
  const url = new URL("/api/ofertas", window.location.origin);

  Object.entries(params).forEach(([k, v]) => {
    if (v !== "" && v !== null && v !== undefined) {
      url.searchParams.set(k, v);
    }
  });

  const res = await fetch(url.toString());

  if (!res.ok) {
    let msg = "No se pudo obtener ofertas";
    try {
      const j = await res.json();
      if (j?.message) msg = j.message;
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}

function mapsUrlFromOffer(o) {
  const lat = o?.location?.lat;
  const lng = o?.location?.lng;
  const hasCoords = typeof lat === "number" && typeof lng === "number";

  return hasCoords
    ? `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`
    : null;
}

// 🔥 TEMPLATE LIMPIO (SIN commerce NI ID visible)
function cardTemplate(o) {
  const exp = o.expirationDate
    ? new Date(o.expirationDate).toLocaleDateString("es-MX")
    : "N/D";

  const price = typeof o.price === "number" ? `$${o.price}` : "N/D";
  const qty = typeof o.quantity === "number" ? o.quantity : "N/D";

  const id = o?._id;
  const hasId = typeof id === "string" && id.length > 5;

  const mapsUrl = mapsUrlFromOffer(o);

  return `
    <article class="card">
      <span class="badge ok">Activa</span>
      <h3>${o.title ?? "Sin título"}</h3>
      <p class="card-meta">${o.category ?? "Sin categoría"}</p>

      <p class="muted">
        Precio: <b>${price}</b> • Cantidad: <b>${qty}</b>
      </p>

      <p class="muted">
        Caduca: <b>${exp}</b>
      </p>

      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;">
        ${
          hasId
            ? `<a class="btn btn-small detail-link" href="/ofertas/${id}">
                Ver detalle
              </a>`
            : `<span class="muted">Sin detalle</span>`
        }

        ${
          mapsUrl
            ? `<a class="btn btn-outline btn-small" href="${mapsUrl}" target="_blank">
                Ver mapa
              </a>`
            : `<span class="muted">Sin ubicación</span>`
        }
      </div>
    </article>
  `;
}

function showToast(message) {
  const msg = document.createElement("div");

  msg.style.position = "fixed";
  msg.style.bottom = "20px";
  msg.style.left = "50%";
  msg.style.transform = "translateX(-50%)";
  msg.style.background = "#111";
  msg.style.color = "#fff";
  msg.style.padding = "12px 20px";
  msg.style.borderRadius = "8px";
  msg.style.zIndex = "9999";
  msg.style.fontSize = "14px";
  msg.style.boxShadow = "0 4px 10px rgba(0,0,0,0.3)";

  msg.innerText = message;

  document.body.appendChild(msg);

  setTimeout(() => {
    msg.remove();
  }, 1500);
}

document.addEventListener("click", function (e) {
  const link = e.target.closest(".detail-link");

  if (!link) return;

  if (!USER_ROLE) {
    e.preventDefault();

    showToast("Debes iniciar sesión para ver detalles y reservar");

    setTimeout(() => {
      window.location.href = "/auth/login";
    }, 1500);
  }
});

/* ---------- Toggle UI ---------- */
const simpleBtn = document.getElementById("simpleBtn");
const advancedBtn = document.getElementById("advancedBtn");
const simpleBox = document.getElementById("simpleBox");
const advancedBox = document.getElementById("advancedBox");

function setMode(mode) {
  const isSimple = mode === "simple";

  simpleBox.style.display = isSimple ? "block" : "none";
  advancedBox.style.display = isSimple ? "none" : "block";

  simpleBtn.classList.toggle("btn-outline", !isSimple);
  advancedBtn.classList.toggle("btn-outline", isSimple);
}

simpleBtn.addEventListener("click", () => setMode("simple"));
advancedBtn.addEventListener("click", () => setMode("advanced"));

/* ---------- SIMPLE SEARCH ---------- */
const simpleForm = document.getElementById("simpleForm");
const simpleSearch = document.getElementById("simpleSearch");
const resultsSimple = document.getElementById("resultsSimple");
const emptySimple = document.getElementById("emptySimple");

async function runSimple() {
  resultsSimple.innerHTML = `<div class="muted">Cargando…</div>`;
  emptySimple.style.display = "none";

  try {
    const data = await fetchOffers({ search: simpleSearch.value.trim() });

    if (!Array.isArray(data) || data.length === 0) {
      resultsSimple.innerHTML = "";
      emptySimple.style.display = "block";
      return;
    }

    resultsSimple.innerHTML = data.map(cardTemplate).join("");
  } catch (e) {
    resultsSimple.innerHTML = `<div class="muted">Error: ${e.message}</div>`;
  }
}

simpleForm.addEventListener("submit", (e) => {
  e.preventDefault();
  runSimple();
});

/* ---------- ADVANCED SEARCH ---------- */
const formError = document.getElementById("formError");
const resultsEl = document.getElementById("results");
const emptyEl = document.getElementById("emptyState");

function getAdvancedValues() {
  return {
    search: document.getElementById("q").value.trim(),
    category: document.getElementById("category").value,
    sort: document.getElementById("sort").value,
    minPrice: document.getElementById("minPrice").value.trim(),
    maxPrice: document.getElementById("maxPrice").value.trim(),
    expiresBefore: document.getElementById("expiresBefore").value,
    minQty: document.getElementById("minQty").value.trim(),
  };
}

function validateAdvanced(values) {
  const minP = values.minPrice === "" ? null : Number(values.minPrice);
  const maxP = values.maxPrice === "" ? null : Number(values.maxPrice);

  if (minP !== null && Number.isNaN(minP)) return "Precio mínimo inválido.";
  if (maxP !== null && Number.isNaN(maxP)) return "Precio máximo inválido.";
  if (minP !== null && maxP !== null && minP > maxP)
    return "El precio mínimo no puede ser mayor al máximo.";

  return "";
}

async function runAdvanced() {
  const values = getAdvancedValues();
  const err = validateAdvanced(values);

  formError.textContent = err;
  if (err) return;

  resultsEl.innerHTML = `<div class="muted">Cargando…</div>`;
  emptyEl.style.display = "none";

  try {
    const data = await fetchOffers(values);

    if (!Array.isArray(data) || data.length === 0) {
      resultsEl.innerHTML = "";
      emptyEl.style.display = "block";
      return;
    }

    resultsEl.innerHTML = data.map(cardTemplate).join("");
  } catch (e) {
    resultsEl.innerHTML = `<div class="muted">Error: ${e.message}</div>`;
  }
}

document
  .getElementById("offerSearchForm")
  .addEventListener("submit", (e) => {
    e.preventDefault();
    runAdvanced();
  });

document.getElementById("clearBtn").addEventListener("click", () => {
  ["q", "category", "sort", "minPrice", "maxPrice", "expiresBefore", "minQty"].forEach(
    (id) => {
      document.getElementById(id).value = "";
    }
  );

  formError.textContent = "";
  runAdvanced();
});

/* ---------- INIT ---------- */
setMode("simple");
runSimple();