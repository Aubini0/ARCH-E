// Setting up Spotify web SDK



// window.onSpotifyWebPlaybackSDKReady = () => {
//   const token = 'YOUR_SPOTIFY_ACCESS_TOKEN'; //  obtain the OAuth token
//   const player = new Spotify.Player({
//     name: 'Your Web Player',
//     getOAuthToken: cb => { cb(token); }
//   });

//   // Error handling
//   player.addListener('initialization_error', ({ message }) => { console.error(message); });
//   player.addListener('authentication_error', ({ message }) => { console.error(message); });
//   player.addListener('account_error', ({ message }) => { console.error(message); });
//   player.addListener('playback_error', ({ message }) => { console.error(message); });

//   // Playback status updates
//   player.addListener('player_state_changed', state => { console.log(state); });

//   // Ready
//   player.addListener('ready', ({ device_id }) => {
//     console.log('Ready with Device ID', device_id);
//   });

//   // Not Ready
//   player.addListener('not_ready', ({ device_id }) => {
//     console.log('Device ID has gone offline', device_id);
//   });

//   // Connect to the player!
//   player.connect();
// };








// “Controlling playback”



// // Play a track
// player.resume().then(() => {
//   console.log('Resumed!');
// });

// // Pause playback
// player.pause().then(() => {
//   console.log('Paused!');
// });

// // Queue a new track (Spotify URI)
// function queueTrack(spotifyUri) {
//   fetch(`https://api.spotify.com/v1/me/player/queue?uri=${spotifyUri}`, {
//     method: 'POST',
//     headers: {
//       'Authorization': `Bearer ${token}`
//     }
//   }).then(response => {
//     if (response.ok) {
//       console.log('Track queued!');
//     } else {
//       console.error('Failed to queue track');
//     }
//   });
// }


















// “Add music”



// document.addEventListener('DOMContentLoaded', function() {
//   // Bind the click event to the 'Add music' button
//   const addMusicButton = document.querySelector('#add-music-btn'); // Ensure this selector matches your button's ID or class
//   addMusicButton.addEventListener('click', function() {
//     // Call the functions to fetch saved songs and playlists
//     fetchSavedTracks();
//     fetchPlaylists();
//   });
// });


// // Function to fetch the user's saved tracks
// async function fetchSavedTracks() {
//   try {
//     const response = await fetch('https://api.spotify.com/v1/me/tracks', { headers });
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }
//     const data = await response.json();
//     // Function to handle adding these tracks to the queue
//     addTracksToQueue(data.items);
//   } catch (error) {
//     console.error('Error fetching saved tracks:', error);
//   }
// }

// // Function to fetch the user's playlists
// async function fetchPlaylists() {
//   try {
//     const response = await fetch('https://api.spotify.com/v1/me/playlists', { headers });
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }
//     const data = await response.json();
//     // Function to handle displaying these playlists to the user
//     displayPlaylists(data.items);
//   } catch (error) {
//     console.error('Error fetching playlists:', error);
//   }
// }

// // Implement the addTracksToQueue function according to how your application handles queuing
// function addTracksToQueue(tracks) {
//   // Logic to add tracks to the queue goes here
//   // This would typically involve setting these tracks as the next up in the UI and in any backend or state management system
// }

// // Implement the displayPlaylists function to show the playlists in the UI for the user to select tracks from
// function displayPlaylists(playlists) {
//   // Logic to display playlists in the UI goes here
//   // Users should be able to browse these playlists and select songs to add to the queue
// }

// // Ensure you replace 'YOUR_SPOTIFY_ACCESS_TOKEN' with the actual access token
// const accessToken = 'YOUR_SPOTIFY_ACCESS_TOKEN';
// const headers = {
//   'Authorization': `Bearer ${accessToken}`,
//   'Content-Type': 'application/json'
// };





// Clear spotify content from que/or retrieved content





// // JavaScript code to clear retrieved songs from Spotify on clicking "Close"

// // Function to clear the content
// function clearSpotifyContent() {
//   // Select the elements that contain the songs and playlists
//   const savedSongsElement = document.getElementById('saved-songs');
//   const playlistsElement = document.getElementById('playlists');

//   // Clear the innerHTML of these elements
//   savedSongsElement.innerHTML = '';
//   playlistsElement.innerHTML = '';
// }

// // Add event listener to the "Close" button
// const closeButton = document.getElementById('close-button');
// closeButton.addEventListener('click', clearSpotifyContent);







// “ play now + Add all songs “





// const playNowButton = document.getElementById('play-now-button');
// const addAllButton = document.getElementById('add-all-button');
// const songs = []; // This should be populated with Spotify track URIs

// // Function to play songs immediately
// function playNow() {
//   // Clear the current playback queue and play new songs
//   // This could be a call to your backend or directly to the Spotify Web API
//   // For example, using the Spotify Web Playback SDK:
//   spotifyApi.play({ uris: songs }).then(() => {
//     console.log('Playback started');
//   }).catch(error => {
//     console.error('Error starting playback', error);
//   });
// }

// // Function to add all songs to the queue
// function addAllToQueue() {
//   // Add songs to the current queue without playing them immediately
//   songs.forEach(songUri => {
//     spotifyApi.queue(songUri).then(() => {
//       console.log(`Added ${songUri} to queue`);
//     }).catch(error => {
//       console.error('Error adding song to queue', error);
//     });
//   });
// }

// playNowButton.addEventListener('click', playNow);
// addAllButton.addEventListener('click', addAllToQueue);



// spotifyApi.play and spotifyApi.queue are placeholder functions representing the Spotify Web API calls to start playback and queue a song, respectively. You would need to replace these with the actual calls to the Spotify Web API using your application's authentication token and the correct endpoints.
// We assume spotifyApi is an object that has been set up to interact with the Spotify Web API, likely through an SDK or a set of AJAX calls.
// songs is an array that should contain the Spotify URI strings for the tracks you want to play or queue.
// Remember to replace the placeholder functions with actual API calls and to ensure that your application has the correct permissions to control playback using the Spotify Web API. You will also need to handle the OAuth token lifecycle (i.e., refreshing it when it expires) and error handling for a smooth user experience.





// Clear button functionality




// const clearButton = document.getElementById('clear-queue-button');

// clearButton.addEventListener('click', () => {
//   // Assuming queue is an array that holds your songs and currentPlaying is the currently playing song
//   queue = queue.filter(song => song === currentPlaying);
//   // Update your UI here to show only the current playing song
//   updateQueueUI();
// });




// “ + button “



// const addButton = document.getElementById('add-song-button');

// addButton.addEventListener('click', () => {
//   // Fetch and display the user's saved songs and playlists
//   // This would likely be a call to fetchSavedTracks and fetchPlaylists as defined in earlier examples
//   fetchSavedTracks();
//   fetchPlaylists();
// });








// Drag and drop order que to switch song order around.




// const queueList = document.getElementById('queue');

// queueList.addEventListener('dragstart', (event) => {
//   event.dataTransfer.setData('text/plain', event.target.id);
// });

// queueList.addEventListener('drop', (event) => {
//   const draggedSongId = event.dataTransfer.getData('text/plain');
//   const targetSongId = event.target.id;
//   // Logic to reorder the queue based on draggedSongId and targetSongId
//   reorderQueue(draggedSongId, targetSongId);
//   event.preventDefault();
// });



// queueList.addEventListener('dragover', (event) => {
//   event.preventDefault(); // Necessary to allow the drop
// });





// “ trash icon to remove song from que




// function removeSongFromQueue(songId) {
//   // Remove song from queue
//   queue = queue.filter(song => song.id !== songId);
//   // Update UI
//   updateQueueUI();
// }

// // Add event listeners to the trash icons for each song
// document.querySelectorAll('.trash-icon').forEach(icon => {
//   icon.addEventListener('click', () => {
//     const songId = icon.dataset.songId; // Assuming each icon has a data attribute with the song ID
//     removeSongFromQueue(songId);
//   });
// });














// The updateQueueUI function is a placeholder for whatever logic you use to update the display of your queue in the UI.
// The reorderQueue function would contain logic to reorder the array of songs based on the drag-and-drop operations.
// The trash icon logic assumes you have a way to associate each icon with a song ID, likely through a data attribute.
// Proper error handling and state management are critical to ensure a smooth user experience.














// // Function to update the card with the currently playing song's metadata
// function updatePlayingCard(songData) {
//   // Assuming you have an element with a class 'card' in your HTML
//   const cardElement = document.querySelector('.card');
//   cardElement.style.display = 'block'; // Show the card element

//   // Update the song thumbnail
//   const thumbnailElement = cardElement.querySelector('.thumbnail');
//   thumbnailElement.src = songData.albumImageUrl;
//   thumbnailElement.alt = songData.title;

//   // Update the song title and artist name
//   cardElement.querySelector('.song-title').textContent = songData.title;
//   cardElement.querySelector('.artist-name').textContent = songData.artist;

//   // Update the like count or play count if available
//   if(songData.playCount) {
//     cardElement.querySelector('.song-count').textContent = songData.playCount;
//   }
// }

// // Function to hide the card when no song is playing
// function removePlayingCard() {
//   const cardElement = document.querySelector('.card');
//   cardElement.style.display = 'none'; // Hide the card element
// }

// // Function to fetch the currently playing track from Spotify
// async function fetchCurrentlyPlaying(accessToken) {
//   const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
//     headers: new Headers({
//       'Authorization': 'Bearer ' + accessToken
//     })
//   });
//   const data = await response.json();

//   // Check if a song is currently playing
//   if (data && data.is_playing) {
//     // Extract the necessary song metadata
//     const songData = {
//       albumImageUrl: data.item.album.images[0].url,
//       title: data.item.name,
//       artist: data.item.artists.map(artist => artist.name).join(', '),
//       playCount: null // Replace with actual play count if available

  
//   };
//     updatePlayingCard(songData);
//   } else {
//     removePlayingCard();
//   }
// }

// // You would call fetchCurrentlyPlaying with the access token when needed
// // fetchCurrentlyPlaying('your_access_token_here');



//  updatePlayingCard receives an object with the song's metadata and updates the UI     card.
// removePlayingCard hides the UI card if there is no song playing.
// fetchCurrentlyPlaying is an asynchronous function that calls the Spotify API to get the current playback state. If a song is playing, it updates the card with the song's metadata; otherwise, it hides the card.





// // Fetch the user's saved tracks with error handling
// async function fetchSavedTracks() {
//   try {
//     const response = await fetch('https://api.spotify.com/v1/me/tracks', { headers });
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }
//     const data = await response.json();
//     updateUIWithTracks(data.items); // Implement this function
//   } catch (error) {
//     console.error('Error fetching saved tracks:', error);
//   }
// }

// // Fetch the user's playlists with error handling
// async function fetchPlaylists() {
//   try {
//     const response = await fetch('https://api.spotify.com/v1/me/playlists', { headers });
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }
//     const data = await response.json();
//     updateUIWithPlaylists(data.items); // Implement this function
//   } catch (error) {
//     console.error('Error fetching playlists:', error);
//   }
// }