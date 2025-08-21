// ============================
// EmailJS - Config
// ============================
const PUBLIC_KEY  = "9hkNO9AX2_ckTsIxO";
const SERVICE_ID  = "service_zy2z9au";
const TEMPLATE_ID = "template_qpb8os5";

// ============================
// Utiles
// ============================
function qs(sel, root=document){ return root.querySelector(sel); }
function qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

// ============================
// Main
// ============================
document.addEventListener("DOMContentLoaded", () => {
  // --- Init EmailJS (UNA sola vez)
  emailjs.init(PUBLIC_KEY);

  const form         = qs("#rsvp-form");
  const sendBtn      = qs("#send-btn");
  const statusEl     = qs("#form-status");

  // ----- Asistirá -> muestra/oculta extra
  const extraFields  = qs("#extra-fields");
  const radiosAsist  = qsa('input[name="asistira"]');

  radiosAsist.forEach(r => {
    r.addEventListener("change", () => {
      if (r.checked && r.value === "Sí") {
        extraFields.style.display = "block";
        sessionStorage.setItem("asistira", "Sí");
        sessionStorage.setItem("asistira_extra_open", "1");
      } else if (r.checked && r.value === "No") {
        extraFields.style.display = "none";
        sessionStorage.setItem("asistira", "No");
        sessionStorage.setItem("asistira_extra_open", "0");
        // limpiar subcampos
        const selPersonas = qs('select[name="cantidad_personas"]');
        const radiosNinos = qsa('input[name="lleva_ninos"]');
        if (selPersonas) selPersonas.value = "";
        radiosNinos.forEach(n => n.checked = false);
        sessionStorage.removeItem("cantidad_personas");
        sessionStorage.removeItem("lleva_ninos");
      }
    });
  });

  // Restaurar apertura de extra desde sessionStorage (opcional)
  if (sessionStorage.getItem("asistira_extra_open") === "1") {
    extraFields.style.display = "block";
  }

  // ----- “Lleva niños” y “Cantidad de personas” -> guardar en sessionStorage (opcional)
  const selPersonas = qs('select[name="cantidad_personas"]');
  selPersonas?.addEventListener('change', () =>
    sessionStorage.setItem("cantidad_personas", selPersonas.value || "")
  );

  const radiosNinos = qsa('input[name="lleva_ninos"]');
  radiosNinos.forEach(r => r.addEventListener('change', () => {
    if (r.checked) sessionStorage.setItem("lleva_ninos", r.value); // "Sí" | "No"
  }));

  // ----- Transporte: 2 checkboxes -> forzar exclusividad + leer valor
  const transpBoxes = qsa('input[name="transporte"]');
  transpBoxes.forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) {
        // Desmarcar el otro para que quede exclusivo
        transpBoxes.forEach(other => { if (other !== cb) other.checked = false; });
      }
    });
  });

  // ----- Restricciones alimentarias (sí/no + opciones + "otros")
  const dietaryYes   = qs("#dietary-yes");
  const dietaryNo    = qs("#dietary-no");
  const dietOptions  = qs("#diet-options");
  const dietOtros    = qs("#diet-otros");
  const dietOtrosTxt = qs("#diet-otros-text");

  dietaryYes?.addEventListener("click", () => {
    dietOptions.hidden = false;
    sessionStorage.setItem("dietary_open", "1");
  });
  dietaryNo?.addEventListener("click", () => {
    dietOptions.hidden = true;
    sessionStorage.setItem("dietary_open", "0");
    // limpiar seleccionados
    qsa('#diet-options input[type="checkbox"]').forEach(c => c.checked = false);
    if (dietOtrosTxt) { dietOtrosTxt.hidden = true; dietOtrosTxt.value = ""; }
  });
  dietOtros?.addEventListener("change", () => {
    const show = dietOtros.checked;
    if (dietOtrosTxt) {
      dietOtrosTxt.hidden = !show;
      if (!show) dietOtrosTxt.value = "";
    }
  });

  // ============================
  // Submit -> EmailJS
  // ============================
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Datos base
    const name   = qs('#name')?.value.trim()  || "";
    const phone  = qs('#phone')?.value.trim() || "";
    const email  = qs('#email')?.value.trim() || "";

    const asistira = qs('input[name="asistira"]:checked')?.value || "";
    // Transporte: tomar el único checkbox marcado (exclusividad forzada)
    const transpChecked = qsa('input[name="transporte"]').find(i => i.checked);
    const transporte = transpChecked ? transpChecked.value : "";

    // Cantidad personas / niños
    const cantidad_personas = qs('select[name="cantidad_personas"]')?.value || "";
    const lleva_ninos = qs('input[name="lleva_ninos"]:checked')?.value || "";

    // Restricciones: armar string desde checkboxes visibles
    let restricciones = "No";
    if (dietOptions && !dietOptions.hidden) {
      const list = qsa('input[name="restricciones[]"]:checked').map(i => i.value);
      restricciones = (list.length ? list.join(", ") : "Ninguna seleccionada");
    }
    const otros = dietOtros?.checked ? (dietOtrosTxt?.value.trim() || "otros (sin especificar)") : "";

    // Validaciones mínimas
    if (!name || !email || !asistira) {
      if (statusEl) {
        statusEl.textContent = "Completá nombre, email y si asistirás.";
        statusEl.style.color = "#b00020";
      }
      return;
    }

    // Si dijo "No" asistir, transporte “No aplica”
    const transporteFinal = (asistira === "No") ? "No aplica" : (transporte || "No");

    const params = {
      name,
      phone,
      email,
      asistira,
      transporte: transporteFinal,
      restricciones,
      otros,
      cantidad_personas,
      lleva_ninos
    };

    try {
      if (sendBtn) { sendBtn.disabled = true; sendBtn.value = "Enviando..."; }
      if (statusEl) { statusEl.textContent = "Enviando..."; statusEl.style.color = "#444"; }

      const res = await emailjs.send(SERVICE_ID, TEMPLATE_ID, params, PUBLIC_KEY);
      console.log("[EmailJS] OK:", res);

      if (statusEl) { statusEl.textContent = "¡Confirmación enviada con éxito! 💌"; statusEl.style.color = "#0a7d32"; }
      // Si querés conservar las selecciones, NO limpies:
      // form.reset(); sessionStorage.clear();
      // qs("#extra-fields").style.display = "none"; qs("#diet-options").hidden = true;

    } catch (err) {
      console.error("[EmailJS] ERROR:", err);
      if (statusEl) { statusEl.textContent = "❌ Error al enviar. Revisá Service/Template/Public Key y los Origins."; statusEl.style.color = "#b00020"; }
    } finally {
      if (sendBtn) { sendBtn.disabled = false; sendBtn.value = "Enviar confirmación"; }
    }
  });
});



