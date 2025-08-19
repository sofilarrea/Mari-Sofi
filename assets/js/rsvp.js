// ============================
// CONFIG EmailJS
// ============================
const PUBLIC_KEY  = "9hkNO9AX2_ckTsIxO"; 
const SERVICE_ID  = "service_zy2z9au";
const TEMPLATE_ID = "template_qpb8os5";

// ============================
// MAIN SCRIPT
// ============================
document.addEventListener("DOMContentLoaded", () => {
  // Inicializar EmailJS
  emailjs.init(PUBLIC_KEY);

  const yesBtn   = document.getElementById("dietary-yes");
  const noBtn    = document.getElementById("dietary-no");
  const dietBox  = document.getElementById("diet-options");
  const otrosCb  = document.getElementById("diet-otros");
  const otrosTxt = document.getElementById("diet-otros-text");

  // ---- Helpers de sessionStorage ----
  function saveDietaryOpen(isOpen) {
    sessionStorage.setItem("dietary_open", isOpen ? "1" : "0");
  }

  function applySelectionsFromSession() {
    // Asistirá
    const asis = sessionStorage.getItem("asistira");
    if (asis) {
      const r = document.querySelector(`input[name="asistira"][value="${asis}"]`);
      if (r) r.checked = true;
    }

    // Transporte
    const transp = sessionStorage.getItem("transporte");
    if (transp) {
      const c = document.querySelector('input[name="transporte"]');
      if (c) c.checked = (transp === "Sí");
    }

    // Restricciones
    const restr = sessionStorage.getItem("restricciones");
    const open  = sessionStorage.getItem("dietary_open") === "1";
    if (open && dietBox) {
      dietBox.hidden = false;
      dietBox.classList.add("is-open");
      yesBtn?.classList.add("is-active");
      noBtn?.classList.remove("is-active");
    }
    if (restr) {
      const vals = JSON.parse(restr);
      document.querySelectorAll('input[name="restricciones[]"]').forEach(i => {
        i.checked = vals.includes(i.value);
      });
    }

    // Otros
    const otroChk = sessionStorage.getItem("diet_otro_checked") === "1";
    if (otrosCb && otrosTxt) {
      otrosCb.checked = otroChk;
      otrosTxt.hidden = !otroChk;
      const txt = sessionStorage.getItem("diet_otro_txt") || "";
      otrosTxt.value = txt;
    }

    // Marcar visual labels tipo botón (si usás estilos .is-active)
    document.querySelectorAll('label.button.small').forEach(l => {
      const inp = l.querySelector('input');
      if (inp) l.classList.toggle('is-active', inp.checked);
    });
  }

  // ---- Toggle restricciones ----
  yesBtn?.addEventListener("click", () => {
    dietBox.hidden = false;
    dietBox.classList.add("is-open");
    yesBtn.classList.add("is-active");
    noBtn?.classList.remove("is-active");
    saveDietaryOpen(true);
  });

  noBtn?.addEventListener("click", () => {
    dietBox.classList.remove("is-open");
    dietBox.hidden = true;
    noBtn.classList.add("is-active");
    yesBtn?.classList.remove("is-active");

    // limpiar checks y otros
    dietBox.querySelectorAll('input[type="checkbox"]').forEach(i => (i.checked = false));
    if (otrosTxt) { otrosTxt.value = ""; otrosTxt.hidden = true; }

    // limpiar sessionStorage relacionado
    sessionStorage.setItem("restricciones", JSON.stringify([]));
    sessionStorage.setItem("diet_otro_checked", "0");
    sessionStorage.setItem("diet_otro_txt", "");
    saveDietaryOpen(false);

    // refrescar marcados visuales
    document.querySelectorAll('label.button.small').forEach(l => {
      const inp = l.querySelector('input');
      if (inp) l.classList.toggle('is-active', inp.checked);
    });
  });

  if (otrosCb && otrosTxt) {
    otrosCb.addEventListener("change", () => {
      const show = otrosCb.checked;
      otrosTxt.hidden = !show;
      if (!show) otrosTxt.value = "";
      sessionStorage.setItem("diet_otro_checked", show ? "1" : "0");
      sessionStorage.setItem("diet_otro_txt", otrosTxt.value.trim());
    });
    otrosTxt.addEventListener("input", () => {
      sessionStorage.setItem("diet_otro_txt", otrosTxt.value.trim());
    });
  }

  // ---- Guardar cambios al seleccionar (sessionStorage) ----
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.name === "asistira" && t.checked) {
      sessionStorage.setItem("asistira", t.value); // "Sí" | "No"
    }
    if (t.name === "transporte") {
      sessionStorage.setItem("transporte", t.checked ? "Sí" : "No");
    }
    if (t.name === "restricciones[]") {
      const vals = Array.from(document.querySelectorAll('input[name="restricciones[]"]:checked'))
        .map(i => i.value);
      sessionStorage.setItem("restricciones", JSON.stringify(vals));
    }
  });

  // ---- Restaurar al cargar (misma pestaña) ----
  applySelectionsFromSession();

  // ---- Formulario / EmailJS ----
  const form   = document.getElementById("rsvp-form");
  const btn    = document.getElementById("send-btn");
  const status = document.getElementById("form-status");

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name      = form.querySelector('[name="name"]')?.value.trim()  || "";
    const phone     = form.querySelector('[name="phone"]')?.value.trim() || "";
    const email     = form.querySelector('[name="email"]')?.value.trim() || "";
    const asistira  = form.querySelector('input[name="asistira"]:checked')?.value || "";
    const transporte = form.querySelector('input[name="transporte"]')?.checked ? "Sí" : "No";

    const seleccionadas = Array.from(form.querySelectorAll('input[name="restricciones[]"]:checked'))
      .map(i => i.value);
    const restricciones = (dietBox && !dietBox.hidden)
      ? (seleccionadas.length ? seleccionadas.join(", ") : "Ninguna seleccionada")
      : "No";

    const otros = (otrosCb?.checked) ? (otrosTxt?.value.trim() || "otros (sin especificar)") : "";

    if (!name || !email || !asistira) {
      if (status) {
        status.textContent = "Completá nombre, email y si asistirás.";
        status.style.color = "#b00020";
      }
      return;
    }

    const transporteFinal = (asistira === "No") ? "No aplica" : transporte;

    const params = {
      name,
      phone,
      email,
      asistira,
      transporte: transporteFinal,
      restricciones,
      otros,
    };

    try {
      if (btn) { btn.disabled = true; btn.value = "Enviando..."; }
      if (status) { status.textContent = ""; }

      const res = await emailjs.send(SERVICE_ID, TEMPLATE_ID, params, PUBLIC_KEY);
      console.log("[EmailJS] OK →", res);

      if (status) {
        status.textContent = "¡Gracias! Recibimos tu confirmación 💌";
        status.style.color = "#0a7d32";
      }

      // ——— Opción 1: NO limpiar el formulario, así queda marcado tal cual
      // (si preferís limpiar y reaplicar, usá la opción 2 de abajo)
      // return;

      // ——— Opción 2: limpiar y REAPLICAR lo guardado en sessionStorage
      // form.reset();
      // noBtn?.click(); // esto cierra el bloque; si querés reabrir si estaba abierto:
      // if (sessionStorage.getItem("dietary_open") === "1") {
      //   yesBtn?.click();
      // }
      // applySelectionsFromSession();

    } catch (err) {
      console.error("[EmailJS] ERROR →", err);
      if (status) {
        status.textContent = "Error al enviar. Verificá IDs y 'Origins'.";
        status.style.color = "#b00020";
      }
    } finally {
      if (btn) { btn.disabled = false; btn.value = "Enviar confirmación"; }
    }
  });
});


document.addEventListener('DOMContentLoaded', () => {
  const setActive = (label, on) => label.classList.toggle('is-active', !!on);

  // Marca/Desmarca todos los labels de un contenedor según el estado de sus inputs
  const syncContainer = (container) => {
    if (!container) return;
    container.querySelectorAll('label').forEach(lbl => {
      const inp = lbl.querySelector('input');
      if (inp) setActive(lbl, inp.checked);
    });
  };

  // Sincroniza al cargar
  document.querySelectorAll('.options-inline, .dietary__options').forEach(syncContainer);

  // Maneja cambios
  document.addEventListener('change', (e) => {
    const inp = e.target.closest('input');
    if (!inp) return;
    const label = inp.closest('label');
    const container = label?.parentElement; // .options-inline o .dietary__options
    if (!container) return;

    // Si transporte está hecho con 2 checkboxes, forzamos exclusividad
    if (inp.name === 'transporte' && inp.type === 'checkbox' && inp.checked) {
      container.querySelectorAll(`input[name="${inp.name}"]`).forEach(other => {
        if (other !== inp) {
          other.checked = false;
          const ol = other.closest('label');
          if (ol) setActive(ol, false);
        }
      });
    }

    // Radios: limpiar hermanos y activar el actual
    if (inp.type === 'radio') {
      container.querySelectorAll('label').forEach(lbl => setActive(lbl, false));
      setActive(label, true);
    } else {
      // Checkbox: solo toggle del actual
      setActive(label, inp.checked);
    }
  });
});

