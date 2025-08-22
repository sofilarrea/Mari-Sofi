document.addEventListener("DOMContentLoaded", () => {
  emailjs.init("9hkNO9AX2_ckTsIxO"); // Public Key

  const form = document.getElementById("paddle-form");
  const status = document.getElementById("paddle-status");
  const sendBtn = document.getElementById("paddle-send-btn");
  const eventoExtra = document.getElementById("evento-extra");

  // Mostrar campo "evento" solo si elige "No" al partido
  document.querySelectorAll('input[name="ira_partido"]').forEach(radio => {
    radio.addEventListener("change", () => {
      if (radio.value === "No" && radio.checked) {
        eventoExtra.style.display = "block";
      } else {
        eventoExtra.style.display = "none";
        // limpiar selección si vuelve a "Sí"
        eventoExtra.querySelectorAll('input[name="ira_evento"]').forEach(i => i.checked = false);
      }
    });
  });

  // Envío con EmailJS
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    sendBtn.disabled = true;
    status.textContent = "Enviando...";

    const name = document.getElementById("paddle-name").value;
    const ira_partido =
      document.querySelector('input[name="ira_partido"]:checked')?.value || "";
    const ira_evento =
      document.querySelector('input[name="ira_evento"]:checked')?.value || "No aplica";

    const params = { paddle_name: name, ira_partido, ira_evento };

    emailjs.send("service_zy2z9au", "template_filwdlh", params)
      .then(() => {
        status.textContent = "✅ ¡Confirmación enviada!";
        sendBtn.disabled = false;
        form.reset();
        eventoExtra.style.display = "none";
      })
      .catch((err) => {
        console.error("Error:", err);
        status.textContent = "❌ Error al enviar. Revisá IDs y Public Key.";
        sendBtn.disabled = false;
      });
  });
});
