import { personIcon } from "./constants.js";
import ui from "./ui.js";
import getIcon, { getStatus } from "./helpers.js";

// global değişkenler

// haritadaki tıklanan son konum
let map;
let clickedCoords;
let layer;
let notes = JSON.parse(localStorage.getItem("notes")) || [];

/*
 * kullanıcın konumunu paylaşmak isterse
 * 1) paylaşırsa haritayı kullanıcının konumuna göre ayarla
 * 2) paylaşmazsa haritayı Ankara'ya ayarla
 */
window.navigator.geolocation.getCurrentPosition(
  (e) => {
    loadMap([e.coords.latitude, e.coords.longitude], "Mevcut Konum");
  },
  () => {
    loadMap([39.925696, 32.855806], "Varsayılan Konum");
  }
);
// haritayı yükler
function loadMap(currentPosition, msg) {
  console.log(currentPosition);
  // harita kurulum merkez belirleme
  map = L.map("map", {
    zoomControl: false,
  }).setView(currentPosition, 8);

  // sağ aşağıya zoom butonları ekler
  L.control
    .zoom({
      position: "bottomright",
    })
    .addTo(map);

  // haritayı ekrana basar
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  // haritanın üzerine imleçleri ekleyeceğimiz bir katman oluştur
  layer = L.layerGroup().addTo(map);

  // imleç ekle
  L.marker(currentPosition, { icon: personIcon }).addTo(map).bindPopup(msg);

  // haritada tıklama olaylarını izle
  map.on("click", onMapClick);

  // ekrana notları bas
  renderNotes();
  renderMarkers();
}

// haritaya tıklanma olayında çalışacak fonksiyon
function onMapClick(e) {
  // tıklanan konumun koordinatlarını global değişkene aktar
  clickedCoords = [e.latlng.lat, e.latlng.lng];

  // aside elementine add class ını ekle
  ui.aside.className = "add";
}

// iptal butonuna tıklanınca
ui.cancelBtn.addEventListener("click", () => {
  // aside elementinden add class ını kaldır
  ui.aside.className = "";
});

// form gönderilince
ui.form.addEventListener("submit", (e) => {
  // sayfayı yenilemesini engelle
  e.preventDefault();

  // inputlardaki verilere eriş
  const title = e.target[0].value;
  const date = e.target[1].value;
  const status = e.target[2].value;

  // yeni bir nesne oluştur
  const newNote = {
    id: new Date().getTime(),
    title,
    date,
    status,
    coords: clickedCoords,
  };

  // nesneyi globaş değişkene kaydet
  notes.unshift(newNote);

  // localstorage ı güncelle
  localStorage.setItem("notes", JSON.stringify(notes));

  // aside alanından "add" classını kaldır
  ui.aside.className = "";

  // formu temizle
  e.target.reset();

  // yeni notun ekrana gelmesi için notları tekrardan renderla
  renderNotes();
  renderMarkers();
});

// ekrana imleçleri bas
function renderMarkers() {
  // eski imlecleri kaldır(katmandaki markerları temizle)
  layer.clearLayers();

  notes.forEach((item) => {
    // item ın status'üne bağlı iconu belirle
    const icon = getIcon(item.status);

    L.marker(item.coords, { icon }) // imleci oluştur
      .addTo(layer) // imleçler katmanına ekle
      .bindPopup(item.title); // imlece bir popup ekle
  });
}

// ekrana notları bas
function renderNotes() {
  const noteCards = notes

    .map((item) => {
      // tarihi kullanıcı dostu forma çevirdik
      const date = new Date(item.date).toLocaleString("tr", {
        day: "2-digit",
        month: "long",
        year: "2-digit",
      });
      // status değerini çevir
      const status = getStatus(item.status);

      // oluşturulacak note un html içeriğini belirle
      return `
    <li data-id=${item.id}>
            <div>
              <p>${item.title}</p>
              <p>${date}</p>
              <p>${status}</p>
            </div>

            <div class="icons">
              <i data-id=${item.id} class="bi bi-airplane-fill" id="fly"></i>
              <i data-id=${item.id} class="bi bi-trash3-fill" id="delete"></i>
            </div>
          </li>
    
    `;
    })
    .join("");
  // note ları liste alanında renderla
  ui.list.innerHTML = noteCards;

  // delete iconları al ve tıklanınca silme foksiyonu çağır
  document.querySelectorAll("li #delete").forEach((btn) => {
    btn.addEventListener("click", () => deleteNote(btn.dataset.id));
  });
  // fly iconları al ve tıklanınca uçuş foksiyonu çağır
  document.querySelectorAll("li #fly").forEach((btn) => {
    btn.addEventListener("click", () => flyToLocation(btn.dataset.id));
  });
}

// silme butonuna tıklanınca
function deleteNote(id) {
  // kullanıcıya sor
  const res = confirm("Notu silmeyi onaylıyor musunuz?");

  // onaylarsa sil
  if (res) {
    // id sini bildiğimiz elemanı diziden kaldır
    notes = notes.filter((note) => note.id !== +id);

    // local-storage ı güncelle
    localStorage.setItem("notes", JSON.stringify(notes));

    // güncel notları ekrana bas
    renderNotes();

    // güncel imleçleri ekrana bas
    renderMarkers();
  }
}

// uçuş butonuna tıklanınca
function flyToLocation(id) {
  // id'si bilinen elemanı dizide bul
  const note = notes.find((note) => note.id === +id);

  // note un koordinatlarına uç
  map.flyTo(note.coords, 10);
}

// tıklanma olayında
// aside alanındaki form veya liste içeriğini gizlemek için hide class ı ekle
ui.arrow.addEventListener("click", () => {
  ui.aside.classList.toggle("hide");
});
