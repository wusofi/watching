
  const API_KEY = 'AIzaSyBy-P4a2jedGeHRdporrdQ2vET7V09YwAI'; // Ganti API key kamu
  let antri = [];
  let currentVideo = null;


let tvWindow = null;

window.onload = () => {

  // ENTER sebagai trigger tombol cari/tambah
  document.getElementById('searchInput').addEventListener('keypress', function(e){
    if(e.key === 'Enter') {
      e.preventDefault();
      handleSearchOrAdd();
    }
  });

  applySavedTheme();
  loadQueueFromStorage();
  setupDragAndDrop();
};



function openTVWindow() {
  if (tvWindow && !tvWindow.closed) {
    tvWindow.focus();
    return;
  }
  tvWindow = window.open('tv.html', 'tvWindow', 'width=800,height=600');
  document.querySelector('button[onclick="openTVWindow()"]').textContent = '📺 TV Aktif';
}


window.addEventListener('message', (event) => {
  if (event.data === 'videoEnded') {
    playNext();
  }
});



  // Tema toggle
  function toggleTheme() {
    if(document.body.classList.contains('dark-mode')){
      document.body.classList.remove('dark-mode');
      document.body.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light-mode');
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    }
  }
  function applySavedTheme() {
    const simpan = localStorage.getItem('theme') || 'light';
    document.body.classList.add(simpan + '-mode');
  }
  applySavedTheme();

  function extractVideoId(url) {
    const regex = /(?:youtube\.com\/.*v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  async function handleSearchOrAdd() {
    const input = document.getElementById('searchInput').value.trim();
    if(!input) {
      alert('Masukkan kata kunci pencarian atau link YouTube!');
      return;
    }
    const videoId = extractVideoId(input);
    if(videoId){
      try {
        const title = await fetchVideoTitle(videoId);
        addToQueue({videoId, title});
      } catch(e) {
        alert('Gagal mengambil data video dari link.');
      }
    } else {
      searchmovies(input);
    }
  }

  async function searchmovies(query) {
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=20&q=${encodeURIComponent(query + " karaoke")}&key=${API_KEY}`);
      const data = await res.json();
      if(data.items && data.items.length > 0){
        showSearchResults(data.items);
      } else {
        document.getElementById('searchResults').innerHTML = '<p>Tidak ada hasil ditemukan.</p>';
      }
    } catch (err) {
      alert('Error pencarian: ' + err.message);
    }
  }

  function showSearchResults(items) {
    const container = document.getElementById('searchResults');
    container.innerHTML = '';
    items.forEach(item => {
      const videoId = item.id.videoId;
      const title = item.snippet.title;
      const thumbnail = item.snippet.thumbnails.default.url;

      const div = document.createElement('div');
      div.className = 'result-item';

      const img = document.createElement('img');
      img.src = thumbnail;
      img.alt = title;

      const info = document.createElement('div');
      info.className = 'result-info';
      info.textContent = title;

      const btn = document.createElement('button');
      btn.textContent = 'Tambah';
      btn.onclick = () => addToQueue({videoId, title});

      div.appendChild(img);
      div.appendChild(info);
      div.appendChild(btn);
      container.appendChild(div);
    });
  }

  function addToQueue(movie) {
    antri.push(movie);
    updateQueueDisplay();
    if(!currentVideo) playNext();
saveQueueToStorage();
  }

  function updateQueueDisplay() {
    const list = document.getElementById('queueList');
    list.innerHTML = '';
    antri.forEach((item, index) => {
      const li = document.createElement('li');
      li.textContent = `${index + 1}. ${item.title}`;
      li.setAttribute('draggable', 'true');
      li.dataset.index = index;

      const delBtn = document.createElement('button');
      delBtn.textContent = '✖';
      delBtn.onclick = (e) => {
        e.stopPropagation();
        antri.splice(index, 1);
        updateQueueDisplay();
      };
      li.appendChild(delBtn);

      // Drag events
      li.addEventListener('dragstart', dragStart);
      li.addEventListener('dragover', dragOver);
      li.addEventListener('drop', drop);
      li.addEventListener('dragend', dragEnd);

      list.appendChild(li);
    
if (currentVideo && item.videoId === currentVideo.videoId) {
  li.style.backgroundColor = '#2196f330';
  li.innerHTML = `▶️ ${index + 1}. ${item.title}`;
}

  });
saveQueueToStorage();
  }

  function saveToFavorites() {
    if(!currentVideo) return alert('Tidak ada lagu yang sedang diputar.');
    let favs = JSON.parse(localStorage.getItem('favorites')) || [];
    if(favs.find(f => f.videoId === currentVideo.videoId)) {
      alert('Lagu sudah ada di favorit.');
      return;
    }
    favs.push(currentVideo);
    localStorage.setItem('favorites', JSON.stringify(favs));
  }

  function playNext() {
    if(antri.length === 0){
      currentVideo = null;
      document.getElementById('player').innerHTML = '<p style="color:#888;">Antrean kosong.</p>';
      return;
    }
    currentVideo = antri.shift();
    updateQueueDisplay();
    loadVideo(currentVideo.videoId);
  }

function loadVideo(videoId, title = '') {
  if (tvWindow && !tvWindow.closed) {
    // Tampilkan pesan di layar utama
    document.getElementById('player').innerHTML = `<p style="color:#888;">Video sedang diputar di TV Mode.</p>`;

    // Kirim data lengkap ke TV
    tvWindow.postMessage({ type: 'play', videoId, title }, '*');
  if (player && player.pauseVideo) {
    player.pauseVideo();
  }  

} else {
    // Putar di layar utama seperti biasa
    const playerDiv = document.getElementById('player');
    playerDiv.innerHTML = `
      <iframe
        src="https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&rel=0&enablejsapi=1"
        allow="autoplay; encrypted-media"
        allowfullscreen
        id="ytplayer"
      ></iframe>
    `;
    setupYouTubePlayerAPI(videoId);
  }
}



  let ytPlayer;
  function setupYouTubePlayerAPI(videoId) {
    if(typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = () => {
        createPlayer(videoId);
      };
    } else {
      createPlayer(videoId);
    }
  }

  function createPlayer(videoId) {
    if(ytPlayer){
      ytPlayer.loadVideoById(videoId);
    } else {
      ytPlayer = new YT.Player('ytplayer', {
        events: {
          'onStateChange': onPlayerStateChange
        }
      });
    }
  }

  function onPlayerStateChange(event) {
    if(event.data === YT.PlayerState.ENDED) {
      playNext();
    }
if (tvWindow && !tvWindow.closed) {
  tvWindow.postMessage('videoEnded', '*');
}

  }

  async function fetchVideoTitle(videoId) {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`);
    const data = await res.json();
    if(data.items && data.items.length > 0){
      return data.items[0].snippet.title;
    }
    throw new Error('Video not found');
  }

  // Drag & drop handler
  let draggedItemIndex = null;

  function dragStart(e) {
    draggedItemIndex = +e.target.dataset.index;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  }

  function dragOver(e) {
    e.preventDefault();
    const target = e.target.closest('li');
    if (!target || target.dataset.index === undefined) return;
    const targetIndex = +target.dataset.index;
    if(targetIndex !== draggedItemIndex) {
      const list = document.getElementById('queueList');
      const draggedEl = list.querySelector(`li[data-index="${draggedItemIndex}"]`);
      const targetEl = target;

      // Insert dragged before or after based on mouse position
      const rect = targetEl.getBoundingClientRect();
      const offset = e.clientY - rect.top;
      const insertBefore = offset < rect.height / 2;
      if(insertBefore) {
        list.insertBefore(draggedEl, targetEl);
      } else {
        list.insertBefore(draggedEl, targetEl.nextSibling);
      }
    }
  }

  function drop(e) {
    e.preventDefault();
    updateQueueFromDOM();
  }

  function dragEnd(e) {
    e.target.classList.remove('dragging');
  }

  function updateQueueFromDOM() {
    const listItems = [...document.querySelectorAll('#queueList li')];
    const newQueue = [];
    listItems.forEach(li => {
      const idx = +li.dataset.index;
      newQueue.push(antri[idx]);
    });
    antri = newQueue;
    updateQueueDisplay();
saveQueueToStorage();
  }

function saveQueueToStorage() {
//  localStorage.setItem('movieQueue', JSON.stringify(antri));
  const projectKey = location.pathname.split("/")[1] || "default";
localStorage.setItem(`${projectKey}_movieQueue`, JSON.stringify(antri));

}

function loadQueueFromStorage() {
  const projectKey = location.pathname.split("/")[1] || "default";
const simpan = localStorage.getItem(`${projectKey}_movieQueue`);

//  const simpan = localStorage.getItem('movieQueue');
  if (simpan) {
    try {
      antri = JSON.parse(simpan);
      updateQueueDisplay();
    } catch(e) {
      console.error('Gagal memuat antrean:', e);
    }
  }
}


