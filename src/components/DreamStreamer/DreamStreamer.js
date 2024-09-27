import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaPlay, FaPause, FaStepForward, FaStepBackward, FaRandom, FaRedo, FaVolumeUp } from 'react-icons/fa';
import { Link ,useNavigate} from 'react-router-dom';
import { HomeIcon, MagnifyingGlassIcon, MusicalNoteIcon, ChartBarSquareIcon, UserIcon } from '@heroicons/react/24/outline'; // Corrected import paths for Heroicons v2
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline'

const DreamStreamer = ({ signOut }) => {
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState(null);
  const [volume, setVolume] = useState(1); // Volume (0.0 - 1.0)
  const [progress, setProgress] = useState(0); // Track progress (0 - 100)
  const [shuffle, setShuffle] = useState(false); // Shuffle mode
  const [repeat, setRepeat] = useState(false); // Repeat mode
  const [purchasedAlbums, setPurchasedAlbums] = useState([]);
  const navigate = useNavigate(); // Hook for navigation


  
  // Fetch all albums on load
  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const response = await axios.get('https://83polfyk3c.execute-api.us-east-1.amazonaws.com/prod/GetAllAlbums');
        setAlbums(response.data.albums);
      } catch (error) {
        console.error('Error fetching albums:', error);
      }
    };

    fetchAlbums();

    // Retrieve purchased albums from localStorage
    const storedPurchasedAlbums = localStorage.getItem('purchasedAlbums');
    if (storedPurchasedAlbums) {
      setPurchasedAlbums(JSON.parse(storedPurchasedAlbums));
    }
  }, []);

  // Function to handle purchasing an album
const handlePurchase = (album) => {
  // Check if the album is already purchased
  const isPurchased = purchasedAlbums.some(purchasedAlbum => purchasedAlbum.albumId === album.albumId);

  if (isPurchased) {
    alert(`You have already purchased ${album.albumName}!`);
    return; // Exit the function if already purchased
  }

  // If not purchased, proceed with the purchase
  alert(`You have purchased ${album.albumName}!`);

  // Simulate a purchase by adding the album to purchased albums
  const newPurchasedAlbums = [...purchasedAlbums, album];
  setPurchasedAlbums(newPurchasedAlbums);

  // Store purchased albums in localStorage for persistence
  localStorage.setItem('purchasedAlbums', JSON.stringify(newPurchasedAlbums));
};

  // Function to view purchased albums (navigates to a different page)
  const viewPurchasedAlbums = () => {
    if (purchasedAlbums.length === 0) {
      alert("You haven't purchased any albums.");
      navigate('/'); // Redirect to the home page
      return;
    }

    // For simplicity, you can navigate to a different view here
    // Or simply set a flag to display purchased albums
    setAlbums(purchasedAlbums);
    setSelectedAlbum(null); // Clear any selected album
  };

  const playTrack = async (trackUrl, index, albumId, trackName) => {
    if (audio) {
      audio.pause();
    }
  
    const newAudio = new Audio(trackUrl);
    newAudio.volume = volume; // Set the initial volume
    newAudio.play();
    setAudio(newAudio);
    setCurrentTrackIndex(index);
    setIsPlaying(true);
  
    // Update progress
    newAudio.addEventListener('timeupdate', () => {
      setProgress((newAudio.currentTime / newAudio.duration) * 100);
    });
  
    // Track ended handling
    newAudio.addEventListener('ended', () => {
      if (repeat) {
        playTrack(trackUrl, index, albumId, trackName); // Replay the current track
      } else if (shuffle) {
        playRandomTrack();
      } else {
        playNextTrack(); // Go to the next track
      }
    });
  
    // Call API to update play count
    try {
      await axios.post('https://83polfyk3c.execute-api.us-east-1.amazonaws.com/prod/TrackingMusic', {
        albumId,
        trackName,
      });
      console.log('Track play recorded successfully');
    } catch (error) {
      console.error('Error recording track play:', error);
    }
  };
  

  // Function to toggle play/pause
  const togglePlayPause = () => {
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Play the next track
  const playNextTrack = () => {
    if (selectedAlbum) {
      if (shuffle) {
        playRandomTrack();
      } else if (currentTrackIndex < selectedAlbum.tracks.length - 1) {
        playTrack(selectedAlbum.tracks[currentTrackIndex + 1].trackUrl, currentTrackIndex + 1);
      } else {
        setIsPlaying(false); // Stop playing when the last track finishes
      }
    }
  };

  // Play the previous track
  const playPreviousTrack = () => {
    if (selectedAlbum && currentTrackIndex > 0) {
      playTrack(selectedAlbum.tracks[currentTrackIndex - 1].trackUrl, currentTrackIndex - 1);
    }
  };

  // Play a random track for shuffle mode
  const playRandomTrack = () => {
    if (selectedAlbum) {
      const randomIndex = Math.floor(Math.random() * selectedAlbum.tracks.length);
      playTrack(selectedAlbum.tracks[randomIndex].trackUrl, randomIndex);
    }
  };

  // Volume control
  const handleVolumeChange = (e) => {
    const newVolume = e.target.value / 100;
    setVolume(newVolume);
    if (audio) {
      audio.volume = newVolume;
    }
  };

  // Track progress control
  const handleProgressChange = (e) => {
    const newProgress = e.target.value;
    setProgress(newProgress);
    if (audio) {
      audio.currentTime = (newProgress / 100) * audio.duration;
    }
  };

  // Toggle shuffle mode
  const toggleShuffle = () => {
    setShuffle(!shuffle);
  };

  // Toggle repeat mode
  const toggleRepeat = () => {
    setRepeat(!repeat);
  };

  // Select an album and show its tracks
  const handleAlbumClick = (album) => {
    setSelectedAlbum(album);
    setCurrentTrackIndex(0); // Reset to the first track when an album is selected
  };

  if (!albums.length) return <p>Loading albums...</p>;

  return (
    <div className="flex h-screen bg-slate-600 text-white">
      {/* Sidebar */}
      <aside className="w-1/5 bg-slate-800 p-6 flex flex-col justify-between shadow-lg">
        <div>
          {/* Sidebar header with logo and title */}
          <div className="flex items-center mb-8">
            <img
              src="https://images.squarespace-cdn.com/content/v1/5a5d02d4b07869b960fa1da0/1516558077227-YFIILSIBQNQJB4RZMGUP/GIAM_Icon_AcademyOfMusic_RGB.png"
              alt="Admin Dashboard Logo"
              className="w-12 h-12 mr-4"
            />
            <h2 className="text-2xl font-bold text-white">Dream Streamer</h2>
          </div>

          {/* Navigation */}
          <nav>
            <ul className="space-y-4">
              {[
                { name: 'Home', href: '#homenav', icon: <HomeIcon className="h-6 w-6 text-indigo-400" /> },
                { name: 'Explore', href: '#mangealbumsnav', icon: <MagnifyingGlassIcon className="h-6 w-6 text-green-400" /> },
                { name: 'Update Albums', href: '#updatealbums', icon: <MusicalNoteIcon className="h-6 w-6 text-pink-400" /> },
                { name: 'Reports', href: '#reportnav', icon: <ChartBarSquareIcon className="h-6 w-6 text-blue-400" /> },
                { name: 'Profile', href: '/profile', icon: <UserIcon className="h-6 w-6 text-yellow-400" /> },
              ].map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="flex items-center space-x-4 text-gray-300 hover:text-white transition duration-200 ease-in-out"
                    title={item.name}
                  >
                    <span className="nav_icon">{item.icon}</span>
                    <span className="nav_text text-lg">{item.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Sign out button */}
        <button
          onClick={signOut}
          className="py-2 px-4 bg-red-500 text-white rounded hover:bg-red-600 transition duration-200"
        >
          Sign Out
        </button>
      </aside>

      <div className="w-full h-screen bg-gray-900 text-white flex flex-col">
      <div className="w-full h-screen bg-gray-900 text-white flex flex-col">
  {/* Dashboard Header */}
  <header className="bg-gray-800 p-4 rounded-lg shadow-md flex justify-between items-center">
    <h1 className="text-3xl font-bold text-indigo-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
      Dashboard
    </h1>
    
    {/* Notification and User Menu */}
    <div className="flex items-center space-x-4">
      {/* Notification Button */}
      <button
        type="button"
        className="relative rounded-full bg-gray-800 p-2 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
        aria-label="View notifications"
      >
        <span className="sr-only">View notifications</span>
        <BellIcon aria-hidden="true" className="h-6 w-6" />
        {/* Optional Notification Badge */}
        <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-gray-900" />
      </button>

      {/* User Menu */}
      <Menu as="div" className="relative">
        <div>
          <Menu.Button className="flex rounded-full bg-gray-800 p-2 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2">
            <span className="sr-only">Open user menu</span>
            <img
              className="h-8 w-8 rounded-full hover:opacity-80 transition duration-200"
              src="https://static.vecteezy.com/system/resources/previews/020/429/953/non_2x/admin-icon-vector.jpg"
              alt="User profile"
            />
          </Menu.Button>
        </div>
        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {["Your Profile", "Settings", "Sign out"].map((item, index) => (
            <Menu.Item key={index}>
              {({ active }) => (
                <a
                  href="#"
                  onClick={item === "Sign out" ? signOut : undefined}
                  className={`block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition duration-200 ${active ? 'bg-gray-700' : ''}`}
                  aria-label={item}
                >
                  {item}
                </a>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Menu>
    </div>
  </header>
</div>


       {/* Main Content */}
<div className="flex flex-col justify-center p-6">
  {/* Albums Section */}
  <div className="bg-gray-900 p-6 rounded-lg shadow-lg" id="albums-section">
    <h2 className="text-3xl font-bold text-indigo-400 mb-6 ">Albums</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {albums.map((album) => (
        <div key={album.albumId} className="cursor-pointer">
          <img
            src={album.albumArtUrl}
            alt={album.albumName}
            className="w-58 h-48 rounded-lg shadow-lg hover:opacity-90 transition-opacity duration-300 transform hover:scale-105 mx-auto"
            onClick={() => handleAlbumClick(album)}
          />
          <p className="text-center mt-2 text-white">{album.albumName}</p>
          <button
            onClick={() => handlePurchase(album)}
            className="mt-2 py-2 px-4 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-all duration-300 w-full"
          >
            Purchase
          </button>
        </div>
      ))}
    </div>
  

  <div className="flex justify-center mt-4">
    <button
      onClick={viewPurchasedAlbums}
      className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200"
    >
      View Purchased Albums
    </button>
  </div>

  {/* Main Content Area - Show Tracks after an Album is Selected */}
  <main className="flex-grow p-6 flex flex-col justify-between">
    {selectedAlbum ? (
      <>
        {/* Album Info */}
        <section className="mb-8">
          <div className="flex items-center">
            <img
              src={selectedAlbum.albumArtUrl}
              alt="Album Art"
              className="w-40 h-40 rounded-lg mr-6"
            />
            <div>
              <h2 className="text-2xl font-bold">{selectedAlbum.albumName}</h2>
              <p className="text-gray-400">Artists: {selectedAlbum.artists.join(', ')}</p>
              <p className="text-gray-400">Band Composition: {selectedAlbum.bandComposition}</p>
              <p className="text-gray-400">Album Year: {selectedAlbum.albumYear}</p>
            </div>
          </div>
        </section>

        {/* Track List */}
        <section>
                  <h3 className="text-lg font-bold mb-4">Tracks</h3>
                  <ul className="space-y-2">
                    {selectedAlbum.tracks.map((track, index) => (
                      <li
                        key={index}
                        className={`bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition duration-200 cursor-pointer ${index === currentTrackIndex ? 'bg-gray-700' : ''}`}
                        onClick={() => playTrack(track.trackUrl, index, selectedAlbum.albumId, track.trackName)}
                      >
                        <p className="font-semibold">{track.trackName}</p>
                        <p className="text-gray-400">Label: {track.trackLabel}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            ) : (
              <p className="text-center text-gray-400 mt-4">Please select an album to view the tracks.</p>
            )}
          </main>
        </div>
</div>
        {/* Music Player */}
        {selectedAlbum && (
          <footer className="bg-gray-800 p-4 fixed bottom-0 w-full">
            <div className="flex items-center justify-between">
              {/* Album Art and Track Info */}
              <div className="flex items-center">
                <img
                  src={selectedAlbum.albumArtUrl}
                  alt="Album Art"
                  className="w-12 h-12 rounded-lg mr-4"
                />
                <div>
                  <p className="text-sm font-semibold">{selectedAlbum.tracks[currentTrackIndex]?.trackName}</p>
                  <p className="text-xs text-gray-400">Artists: {selectedAlbum.artists.join(', ')}</p>
                </div>
              </div>

              {/* Player Controls */}
              <div className="flex items-center space-x-4">
                <button
                  className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition duration-200"
                  onClick={playPreviousTrack}
                >
                  <FaStepBackward className="text-white" />
                </button>
                <button
                  className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition duration-200"
                  onClick={togglePlayPause}
                >
                  {isPlaying ? <FaPause className="text-white" /> : <FaPlay className="text-white" />}
                </button>
                <button
                  className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition duration-200"
                  onClick={playNextTrack}
                >
                  <FaStepForward className="text-white" />
                </button>
              </div>

              {/* Volume Control */}
              <div className="flex items-center space-x-2">
                <FaVolumeUp className="text-white" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume * 100}
                  onChange={handleVolumeChange}
                  className="w-24"
                />
              </div>

              {/* Track Progress Slider */}
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={handleProgressChange}
                  className="w-64"
                />
              </div>

              {/* Shuffle and Repeat Controls */}
              <div className="flex items-center space-x-4">
                <button
                  className={`p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition duration-200 ${shuffle ? 'bg-blue-500' : ''}`}
                  onClick={toggleShuffle}
                >
                  <FaRandom className="text-white" />
                </button>
                <button
                  className={`p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition duration-200 ${repeat ? 'bg-blue-500' : ''}`}
                  onClick={toggleRepeat}
                >
                  <FaRedo className="text-white" />
                </button>
              </div>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};

export default DreamStreamer;