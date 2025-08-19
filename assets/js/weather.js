(function(){
  // Coordenadas de Lanzarote
  const LAT = 28.97, LON = -13.65;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}`
            + `&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min`
            + `&timezone=auto`;

  const elTemp   = document.getElementById('wx-temp');
  const elIcon   = document.getElementById('wx-icon');
  const elDesc   = document.getElementById('wx-desc');
  const elWind   = document.getElementById('wx-wind');
  const elUpd    = document.getElementById('wx-updated');
  const elFc     = document.getElementById('wx-forecast');

  const CODES = {
    0:["☀️","Despejado"],1:["🌤️","Mayormente soleado"],2:["⛅","Parcialmente nublado"],3:["☁️","Nublado"],
    45:["🌫️","Niebla"],48:["🌫️","Niebla"],
    51:["🌦️","Llovizna débil"],53:["🌦️","Llovizna"],55:["🌧️","Llovizna fuerte"],
    61:["🌦️","Lluvia débil"],63:["🌧️","Lluvia"],65:["🌧️","Lluvia intensa"],
    66:["🌧️","Lluvia helada débil"],67:["🌧️","Lluvia helada"],
    71:["🌨️","Nieve débil"],73:["🌨️","Nieve"],75:["🌨️","Nieve intensa"],
    77:["🌨️","Granizo/nevisca"],
    80:["🌦️","Chubascos débiles"],81:["🌧️","Chubascos"],82:["⛈️","Chubascos fuertes"],
    95:["⛈️","Tormenta"],96:["⛈️","Tormenta con granizo"],99:["⛈️","Tormenta fuerte con granizo"]
  };

  function fmtDay(iso){
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { weekday:'short' }).replace('.','');
  }

  fetch(url)
    .then(r => r.json())
    .then(data => {
      if (!data || !data.current_weather) throw new Error('Respuesta inválida');

      const cw = data.current_weather;
      const [emoji,desc] = CODES[cw.weathercode] || ["ℹ️","Tiempo"];

      elTemp && (elTemp.textContent = Math.round(cw.temperature) + "°");
      elIcon && (elIcon.textContent = emoji);
      elDesc && (elDesc.textContent = desc);
      elWind && (elWind.textContent = Math.round(cw.windspeed));
      elUpd  && (elUpd.textContent  = "Actualizado: " + new Date(cw.time).toLocaleString('es-ES'));

      const days = data.daily.time.map((t,i)=>({
        time:t, code:data.daily.weathercode[i],
        tmax:Math.round(data.daily.temperature_2m_max[i]),
        tmin:Math.round(data.daily.temperature_2m_min[i])
      })).slice(0,5);

      if (elFc) {
        elFc.innerHTML = days.map(d=>{
          const [e,dd] = CODES[d.code] || ["ℹ️",""];
          return `<div class="wx__day">
            <div class="d">${fmtDay(d.time)}</div>
            <div class="i" title="${dd}">${e}</div>
            <div class="t">${d.tmax}° / ${d.tmin}°</div>
          </div>`;
        }).join('');
      }
    })
    .catch(err=>{
      console.error('[Weather]', err);
      if (elDesc) elDesc.textContent = "No se pudo cargar el clima.";
    });
})();
