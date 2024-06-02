async function playPlaylist(playlistId) {
    const limit = 50; // Set the desired limit here, or higher if needed
    const apiUrl = `https://saavn.dev/api/playlists?id=${playlistId}&limit=${limit}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (data.success && data.data.songs.length > 0) {
            queue = data.data.songs.map(song => song.downloadUrl[song.downloadUrl.length - 1].url);
            currentSongIndex = 0;
            playFromQueue();
            renderQueue(data.data.songs); // Render the queue with playlist data
        } else {
            console.error('No songs found in the playlist');
        }
    } catch (error) {
        console.error('Error fetching playlist data:', error);
    }
}

const searchInput = document.getElementById('searchInput');
const filters = document.querySelectorAll('.filter-container input[type="radio"]');
const searchBtn = document.getElementById('searchBtn');
const cardContainer = document.querySelector('.card-container');
const queueContainer = document.getElementById('queueContainer');

let audioPlayer = null; // Global audio player instance
let queue = []; // Array to keep track of the song queue
let currentSongIndex = 0; // Index of the currently playing song in the queue

searchBtn.addEventListener('click', performSearch);

async function performSearch() {
    const searchTerm = searchInput.value.trim();
    const checkedFilter = document.querySelector('.filter-container input[type="radio"]:checked');
    const filterValue = checkedFilter ? checkedFilter.value : 'song'; // Default to 'song' if no filter is selected

    const limit = 50; // Set the desired limit here
    const apiUrl = `https://saavn.dev/api/search/${filterValue}s?query=${encodeURIComponent(searchTerm)}&limit=${limit}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        const data = await response.json();
        if (data.success && data.data.results.length > 0) {
            renderCards(data.data.results, filterValue);
        } else {
            renderNoResults();
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        renderError(error.message);
    }
}

function renderCards(results, filterValue) {
    cardContainer.innerHTML = '';

    results.forEach((result, index) => {
        const card = document.createElement('div');
        card.classList.add('card');

        const image = document.createElement('img');
        image.src = result.image[2]?.url || 'default-image.jpg'; // Use the third image option for cards
        image.alt = result.name;
        image.draggable = false; 
        card.appendChild(image);

        const name = document.createElement('h3');
        name.textContent = result.name;
        card.appendChild(name);

        if (filterValue === 'song' || filterValue === 'album') {
            const artist = document.createElement('p');
            artist.textContent = `Artist: ${result.artists.primary[0]?.name || 'Unknown'}`;
            card.appendChild(artist);
        }

        if (filterValue === 'album') {
            const year = document.createElement('p');
            year.textContent = `Year: ${result.year}`;
            card.appendChild(year);

            const playButton = document.createElement('button');
            playButton.classList.add('play-button');
            playButton.textContent = '▶';
            playButton.addEventListener('click', () => {
                playAlbum(result.id);
            });
            card.appendChild(playButton);
        } else if (filterValue === 'song') {
            const album = document.createElement('p');
            album.textContent = `Album: ${result.album.name}`;
            card.appendChild(album);

            const duration = document.createElement('p');
            duration.textContent = `Duration: ${formatDuration(result.duration)}`;
            card.appendChild(duration);

            const playCount = document.createElement('p');
            playCount.textContent = `Play Count: ${result.playCount}`;
            card.appendChild(playCount);

            const playButton = document.createElement('button');
            playButton.classList.add('play-button');
            playButton.textContent = '▶';
            playButton.addEventListener('click', () => {
                const highestQualityUrl = result.downloadUrl[result.downloadUrl.length - 1].url;
                playAudio(highestQualityUrl);
                updateQueue([...results.slice(index), ...results.slice(0, index)]); // Update the queue with new songs
            });
            card.appendChild(playButton);
        } else if (filterValue === 'artist') {
            const link = document.createElement('a');
            link.href = result.url;
            link.textContent = 'View Artist';
            link.target = '_blank';
            card.appendChild(link);
        } else if (filterValue === 'playlist') {
            const songCount = document.createElement('p');
            songCount.textContent = `Song Count: ${result.songCount}`;
            card.appendChild(songCount);

            const playButton = document.createElement('button');
            playButton.classList.add('play-button');
            playButton.textContent = '▶';
            playButton.addEventListener('click', () => {
                playPlaylist(result.id);
            });
            card.appendChild(playButton);
        }

        cardContainer.appendChild(card);
    });
}

async function playAlbum(albumId) {
    const apiUrl = `https://saavn.dev/api/albums?id=${albumId}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (data.success && data.data.songs.length > 0) {
            queue = data.data.songs.map(song => song.downloadUrl[song.downloadUrl.length - 1].url);
            currentSongIndex = 0;
            playFromQueue();
            renderQueue(data.data.songs);
        } else {
            console.error('No songs found in the album');
        }
    } catch (error) {
        console.error('Error fetching album data:', error);
    }
}

function updateQueue(newQueue) {
    queue = newQueue.map(song => song.downloadUrl[song.downloadUrl.length - 1].url);
    currentSongIndex = 0; // Reset the current song index
    playFromQueue(); // Play from the beginning of the new queue
    renderQueue(newQueue); // Update the queue display
}

function highlightCurrentSong() {
    const queueSongs = queueContainer.querySelectorAll('.queue-song');
    queueSongs.forEach((songElement, index) => {
        if (index === currentSongIndex) {
            songElement.classList.add('playing');
        } else {
            songElement.classList.remove('playing');
        }
    });
}

function renderQueue(songs) {
    queueContainer.innerHTML = '<h3>Queue</h3>';

    songs.forEach((song, index) => {
        const songElement = document.createElement('div');
        songElement.classList.add('queue-song');
        
        const songImage = document.createElement('img');
        songImage.src = song.image[0]?.url || 'default-image.jpg'; // Use the first image option for queue items
        songImage.alt = song.name;
        songImage.draggable = false; 
        songElement.appendChild(songImage);

        const songInfo = document.createElement('div');
        songInfo.innerHTML = `<p>${index + 1}. ${song.name}</p>`;
        songElement.appendChild(songInfo);

        songElement.addEventListener('click', () => {
            const highestQualityUrl = song.downloadUrl[song.downloadUrl.length - 1].url;
            currentSongIndex = index; // Update current index to the clicked song
            playFromQueue();
        });

        queueContainer.appendChild(songElement);
    });
    highlightCurrentSong(); // Highlight the current song initially
}

function playNext() {
    currentSongIndex = (currentSongIndex + 1) % queue.length;
    playFromQueue();
}

function playPrevious() {
    currentSongIndex = (currentSongIndex - 1 + queue.length) % queue.length;
    playFromQueue();
}

function playFromQueue() {
    playAudio(queue[currentSongIndex]);
    highlightCurrentSong();
}

function playAudio(url) {
    if (audioPlayer) {
        audioPlayer.pause();
    }

    audioPlayer = new Audio(url);
    audioPlayer.addEventListener('timeupdate', updateSeekBar);
    audioPlayer.addEventListener('timeupdate', updateCurrentTimeDisplay);
    audioPlayer.addEventListener('loadedmetadata', updateDurationDisplay);
    audioPlayer.addEventListener('ended', playNext);
    audioPlayer.play();
}

function highlightCurrentSong() {
    const queueSongs = queueContainer.querySelectorAll('.queue-song');
    queueSongs.forEach((songElement, index) => {
        if (index === currentSongIndex) {
            songElement.classList.add('playing');
        } else {
            songElement.classList.remove('playing');
        }
    });
}

function formatDuration(durationInSeconds) {
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = durationInSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function renderNoResults() {
    cardContainer.innerHTML = '<p>No results found.</p>';
}

function renderError(errorMessage) {
    cardContainer.innerHTML = `<p>Error: ${errorMessage}</p>`;
}

// Event listeners for playbar buttons
const playButton = document.getElementById('playButton');
const nextButton = document.getElementById('nextButton');
const prevButton = document.getElementById('prevButton');

playButton.addEventListener('click', togglePlayPause);
nextButton.addEventListener('click', playNext);
prevButton.addEventListener('click', playPrevious);

// Event listener for seekbar control
document.querySelector(".seekbar").addEventListener("click", e => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle img").style.left = percent + "%";
    audioPlayer.currentTime = ((audioPlayer.duration) * percent) / 100;
});

// Function to toggle play/pause
function togglePlayPause() {
    if (!audioPlayer) return; // Audio player not initialized

    if (audioPlayer.paused) {
        audioPlayer.play().catch(error => {
            console.error('Error playing audio:', error);
        });
        playButton.innerHTML = '<img src="assets/pause.svg" alt="Pause">';
    } else {
        audioPlayer.pause();
        playButton.innerHTML = '<img src="assets/play.svg" alt="Play">';
    }
}

// event lister for M0NSTER
document.addEventListener('DOMContentLoaded', function() {
    const monsterLink = document.getElementById('monsterLink');
    monsterLink.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent the default link behavior
        window.open('https://github.com/m0nster0p', '_blank'); // Open the GitHub profile in a new tab
    });
});

// Function to update the seekbar, current time display, and duration display
function updateSeekBar() {
    const filled = document.querySelector('.seekbar .filled');
    const circle = document.querySelector('.seekbar .circle');

    if (filled && circle && audioPlayer) {
        const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        filled.style.width = `${progress}%`;
        circle.style.left = `${progress}%`;
    }
}

function updateCurrentTimeDisplay() {
    if (currentTimeDisplay && audioPlayer) {
        currentTimeDisplay.textContent = formatDuration(Math.floor(audioPlayer.currentTime));
    }
}

function updateDurationDisplay() {
    if (durationDisplay && audioPlayer) {
        durationDisplay.textContent = formatDuration(Math.floor(audioPlayer.duration));
    }
}
