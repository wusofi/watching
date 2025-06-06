    let player;
    let currentVideoId = null;
    let pendingVideoData = null;

    function onYouTubeIframeAPIReady() {
      player = new YT.Player('player', {
        width: '100%',
        height: '100%',
        videoId: '',
        playerVars: {
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0
        },
        events: {
          onReady: () => {
            // Jika ada video tertunda dikirim sebelum player siap
            if (pendingVideoData) {
              playVideo(pendingVideoData);
              pendingVideoData = null;
            }
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.ENDED) {
              window.opener.postMessage('videoEnded', '*');
            }
          }
        }
      });
    }

    function playVideo({ videoId, title, startSeconds }) {
      if (player && videoId !== currentVideoId) {
        currentVideoId = videoId;
        player.loadVideoById({
          videoId,
          startSeconds: startSeconds || 0
        });

        document.getElementById('songTitle').textContent = title || 'Lagu Karaoke';
      }
    }

    window.addEventListener('message', (event) => {
      const data = event.data;
      if (typeof data === 'object' && data.type === 'play') {
        if (player && player.loadVideoById) {
          playVideo(data);
        } else {
          // Player belum siap
          pendingVideoData = data;
        }
      }
    });

    // Load YouTube API
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
