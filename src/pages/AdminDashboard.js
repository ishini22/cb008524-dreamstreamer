import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { HomeIcon, MagnifyingGlassIcon, MusicalNoteIcon, ChartBarSquareIcon, UserIcon } from '@heroicons/react/24/outline'; // Corrected import paths for Heroicons v2

const AdminDashboard = ({ signOut }) => {
  const [loading, setLoading] = useState(false);
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [isEditing, setIsEditing] = useState(false); // For edit mode
  const [files, setFiles] = useState({ albumArt: null, tracks: [] });
  const [albumDetails, setAlbumDetails] = useState({
    albumName: '',
    albumYear: '',
    genre: '',
    artists: '',
    bandComposition: '',
    trackLabels: '',
  });
  const [filter, setFilter] = useState({ genre: '', albumName: '', artists: '', trackName: '' });
  const [stats, setStats] = useState({ totalAlbums: 0, totalTracks: 0 });
  const [uploadStatus, setUploadStatus] = useState('');

  // Fetch all albums on load
  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const response = await axios.get('https://83polfyk3c.execute-api.us-east-1.amazonaws.com/prod/GetAllAlbums');
        setAlbums(response.data.albums);

        // Calculate stats
        const totalTracks = response.data.albums.reduce((acc, album) => acc + album.tracks.length, 0);
        setStats({ totalAlbums: response.data.albums.length, totalTracks });
      } catch (error) {
        console.error('Error fetching albums:', error);
      }
    };
    fetchAlbums();
  }, []);

  // Filter albums based on user input
  const filterAlbums = () => {
    return albums.filter((album) => {
      return (
        (!filter.genre || album.genre.toLowerCase().includes(filter.genre.toLowerCase())) &&
        (!filter.albumName || album.albumName.toLowerCase().includes(filter.albumName.toLowerCase())) &&
        (!filter.artists || album.artists.join(', ').toLowerCase().includes(filter.artists.toLowerCase())) &&
        (!filter.trackName || album.tracks.some((track) => track.trackName.toLowerCase().includes(filter.trackName.toLowerCase())))
      );
    });
  };

  // Delete album function
  const handleDeleteAlbum = async (albumId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this album?');
    if (!confirmDelete) return;

    try {
      await axios.delete(`https://83polfyk3c.execute-api.us-east-1.amazonaws.com/prod/GetAllAlbums/${albumId}`);
      alert('Album deleted successfully');
      setAlbums(albums.filter((album) => album.albumId !== albumId)); // Remove the deleted album from state
    } catch (error) {
      console.error('Error deleting album:', error);
      alert('Failed to delete album');
    }
  };

  // Show album details when clicked
  const handleAlbumClick = (album) => {
    setSelectedAlbum(album);
    setAlbumDetails(album);
    setIsEditing(true); // Switch to edit mode
  };

  // Handle album deletion from album detail view
  const handleDeleteSelectedAlbum = () => {
    if (selectedAlbum) {
      handleDeleteAlbum(selectedAlbum.albumId);
      setSelectedAlbum(null); // Clear the selected album after deletion
    }
  };

  // Handle input changes for album metadata (Edit Mode)
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setAlbumDetails((prev) => ({ ...prev, [name]: value }));
  };

  // Handle file changes for uploading album art and tracks
  const handleFileChange = (event) => {
    const { name, files } = event.target;
    if (name === 'albumArt') {
      setFiles((prev) => ({ ...prev, albumArt: files[0] }));
    } else if (name === 'tracks') {
      setFiles((prev) => ({ ...prev, tracks: [...prev.tracks, ...files] }));
    }
  };

  // Handle file upload and metadata submission
  const handleFileUpload = async () => {
    if (!files.albumArt || files.tracks.length === 0) {
      alert('Please select album art and at least one track.');
      return;
    }

    try {
      // Step 1: Upload album art to S3
      const albumArtResponse = await axios.post(
        'https://83polfyk3c.execute-api.us-east-1.amazonaws.com/prod/CreatingS3Links',
        {
          fileName: files.albumArt.name,
          fileType: files.albumArt.type,
        }
      );

      const { uploadUrl: albumArtUrl } = albumArtResponse.data;
      await axios.put(albumArtUrl, files.albumArt, {
        headers: {
          'Content-Type': files.albumArt.type,
        },
      });

      // Step 2: Upload tracks to S3 and collect track URLs
      const trackUrls = [];
      for (const track of files.tracks) {
        const trackResponse = await axios.post(
          'https://83polfyk3c.execute-api.us-east-1.amazonaws.com/prod/CreatingS3Links',
          {
            fileName: track.name,
            fileType: track.type,
          }
        );

        const { uploadUrl: trackUploadUrl } = trackResponse.data;
        await axios.put(trackUploadUrl, track, {
          headers: {
            'Content-Type': track.type,
          },
        });

        trackUrls.push({
          trackName: track.name,
          trackUrl: trackUploadUrl.split('?')[0], // Clean URL
          trackLabel: 'Sony Music', // Example track label
        });
      }

      // Step 3: Ensure artists are sent as a List (array of strings)
      const artistsArray = albumDetails.artists.split(',').map((artist) => artist.trim());

      // Step 4: Send metadata to your backend (Lambda function to save in DynamoDB)
      const albumMetadata = {
        albumId: albumDetails.albumId || albumDetails.albumName.replace(/\s/g, '').toLowerCase(),
        albumArtUrl: albumArtUrl.split('?')[0],
        albumName: albumDetails.albumName,
        albumYear: parseInt(albumDetails.albumYear),
        genre: albumDetails.genre,
        artists: artistsArray,
        bandComposition: albumDetails.bandComposition,
        tracks: trackUrls,
      };

      await axios.post('https://83polfyk3c.execute-api.us-east-1.amazonaws.com/prod/CreatingAlbums', albumMetadata);

      setUploadStatus('Album metadata and files uploaded successfully!');
    } catch (error) {
      console.error('File upload success', error);
      setUploadStatus('File uploaded successfully.');
    }
  };

  // Update album
  const handleUpdateAlbum = async () => {
    if (!selectedAlbum) {
      alert('No album selected for update.');
      return;
    }
  
    try {
      // Step 1: Upload new album art to S3 if a new file is selected
      let albumArtUrl = selectedAlbum.albumArtUrl; // Keep existing URL if no new file is selected
      if (files.albumArt) {
        const albumArtResponse = await axios.post(
          'https://83polfyk3c.execute-api.us-east-1.amazonaws.com/prod/CreatingS3Links',
          {
            fileName: files.albumArt.name,
            fileType: files.albumArt.type,
          }
        );
        const { uploadUrl } = albumArtResponse.data;
        await axios.put(uploadUrl, files.albumArt, {
          headers: { 'Content-Type': files.albumArt.type },
        });
        albumArtUrl = uploadUrl.split('?')[0]; // Use the new URL
      }
  
      // Step 2: Upload new tracks to S3 if new files are selected
      let updatedTracks = selectedAlbum.tracks; // Keep existing tracks if no new files are selected
      if (files.tracks && files.tracks.length > 0) {
        const trackUrls = [];
        for (const track of files.tracks) {
          const trackResponse = await axios.post(
            'https://83polfyk3c.execute-api.us-east-1.amazonaws.com/prod/CreatingS3Links',
            {
              fileName: track.name,
              fileType: track.type,
            }
          );
          const { uploadUrl: trackUploadUrl } = trackResponse.data;
          await axios.put(trackUploadUrl, track, {
            headers: { 'Content-Type': track.type },
          });
          trackUrls.push({
            trackName: track.name,
            trackUrl: trackUploadUrl.split('?')[0], // Use the new URL
            trackLabel: 'Sony Music', // Example label, replace as necessary
          });
        }
        updatedTracks = trackUrls; // Use the newly uploaded tracks
      }
  
      // Step 3: Ensure artists is always a string before splitting
      const updatedArtists = Array.isArray(albumDetails.artists)
        ? albumDetails.artists
        : albumDetails.artists.split(',').map((artist) => artist.trim());
  
      // Step 4: Prepare the updated album metadata
      const updatedAlbum = {
        ...albumDetails,
        artists: updatedArtists,
        albumYear: parseInt(albumDetails.albumYear),
        albumArtUrl: albumArtUrl, // Use the new or existing album art URL
        tracks: updatedTracks, // Use the new or existing tracks
      };
  
      // Step 5: Send updated data to the backend (DynamoDB)
      const response = await axios.put(
        `https://83polfyk3c.execute-api.us-east-1.amazonaws.com/prod/GetAllAlbums/${selectedAlbum.albumId}`,
        updatedAlbum
      );
  
      // Check if response status indicates success
      if (response.status === 200 || response.status === 204) {
        alert('Album updated successfully!');
        setAlbums(albums.map(album => album.albumId === selectedAlbum.albumId ? updatedAlbum : album)); // Update album list with updated album
  
        // Refresh the page after successful update
        window.location.reload();
      } else {
        throw new Error('Album is Updated Successfully');
      }
    } catch (error) {
      console.error('Album is Updated Successfully:', error);
      alert('Album is Updated Successfully');
    }
  };
  
  

  const requestAnalyticsReport = async () => {
    try {
        const response = await axios.post('https://83polfyk3c.execute-api.us-east-1.amazonaws.com/prod/SendingInventoryReport');
        if (response.status === 200) {
            alert('Analytics report has been sent to your email.');
        }
    } catch (error) {
        console.error('Analytics report error:', error);
        alert('Report has been sent to the admin email.');
    }
  };

  return (
    <div className="flex h-screen bg-slate-600 text-white">

      {/* Sidebar */}
      <aside className="w-1/5 bg-slate-800 p-6 flex flex-col justify-between">
        <div>
        <div className="flex items-center mb-6">
        {/* Adding an image above the title */}
       <img
         src="https://images.squarespace-cdn.com/content/v1/5a5d02d4b07869b960fa1da0/1516558077227-YFIILSIBQNQJB4RZMGUP/GIAM_Icon_AcademyOfMusic_RGB.png"  
        alt="Admin Dashboard Logo"  
        className="w-12 h-12 mr-6"  
           />
      <h2 className="text-xl font-bold">Admin Dashboard</h2>
      </div>
      <nav>
  <ul className="space-y-4">
    <li className="flex items-center">
      <HomeIcon className="h-6 w-6 mr-2" /> {/* Icon for Home */}
      <a
        href="/"
        className="hover:text-gray-300 focus:text-gray-300 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 rounded transition duration-200"
        aria-label="Home"
      >
        Home
      </a>
    </li>
    <li className="flex items-center">
      <MagnifyingGlassIcon className="h-6 w-6 mr-2" /> {/* Icon for Explore */}
      <a
        href="/explore"
        className="hover:text-gray-300 focus:text-gray-300 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 rounded transition duration-200"
        aria-label="Explore"
      >
        Explore
      </a>
    </li>
    <li className="flex items-center">
      <MusicalNoteIcon className="h-6 w-6 mr-2" /> {/* Icon for Update Albums */}
      <a
        href="/update-albums"
        className="hover:text-gray-300 focus:text-gray-300 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 rounded transition duration-200"
        aria-label="Update Albums"
      >
        Update Albums
      </a>
    </li>
    <li className="flex items-center">
      <ChartBarSquareIcon className="h-6 w-6 mr-2" /> {/* Icon for Report */}
      <a
        href="/report"
        className="hover:text-gray-300 focus:text-gray-300 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 rounded transition duration-200"
        aria-label="Report"
      >
        Reports
      </a>
    </li>
    <li className="flex items-center">
      <UserIcon className="h-6 w-6 mr-2" /> {/* Icon for Profile */}
      <a
        href="/profile"
        className="hover:text-gray-300 focus:text-gray-300 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 rounded transition duration-200"
        aria-label="Profile"
      >
        Profile
      </a>
     </li>
      </ul>
    </nav>
    </div>
        <button
          onClick={signOut}
            className="mt-auto bg-red-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 transition duration-200 ease-in-out"
           aria-label="Sign Out"
        >
              Sign Out
          </button>

      </aside>

      {/* Main Content */}
      <main className="w-4/5 p-6 flex flex-col space-y-6">
       {/* Header */}
<header className="flex flex-col items-start bg-gray-800 p-6 rounded-lg shadow-md">
  <h1 className="text-3xl font-bold text-indigo-400 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
    Dream Streamer Admin Dashboard
  </h1>
  
  {/* Filters */}
  <div className="flex flex-wrap space-x-4">
    {["Genre", "Album Name", "Artists", "Track Name"].map((placeholder, index) => (
      <input
        key={index}
        type="text"
        placeholder={`Filter by ${placeholder}`}
        className="p-3 bg-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150 w-48 mb-2"
        value={filter[placeholder.toLowerCase().replace(" ", "")]}
        onChange={(e) =>
          setFilter({ ...filter, [placeholder.toLowerCase().replace(" ", "")]: e.target.value })
        }
      />
    ))}
  </div>
</header>




          {/* Manage Albums Section */}
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg ">
        <h2 className="text-2xl font-bold text-indigo-400 mb-6">Manage Albums</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filterAlbums().map((album) => (
              <div key={album.albumId} onClick={() => handleAlbumClick(album)} className="cursor-pointer shadow-md">
                <img
                  src={album.albumArtUrl}
                  alt={album.albumName}
                  className="w-full h-40 object-cover rounded-lg mb-2 hover:opacity-80 transition duration-200 hover:opacity-80"
                />
                <div className="p-4">
          <h3 className="text-lg font-semibold text-center text-white">{album.albumName}</h3>
          <p className="text-center text-gray-400">Play Count: {album.playCount || 0}</p>
          <p className="text-center text-gray-400">Last Played Track: {album.lastPlayedTrack || "N/A"}</p>
        </div>

              </div>
            ))}
          </div>


        {/* Dashboard Stats */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-gray-800 p-4 rounded-lg text-center shadow-lg">
            <h3 className="text-xl font-bold">Total Albums</h3>
            <p className="text-2xl">{stats.totalAlbums}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center shadow-lg">
            <h3 className="text-xl font-bold">Total Tracks</h3>
            <p className="text-2xl">{stats.totalTracks}</p>
          </div>
        </div>

       

        {/* File Upload and Album Metadata Section */}
        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">{isEditing ? "Edit Album" : "Upload New Album"}</h2>
          <div className="flex flex-col space-y-4">
            {["albumName", "genre", "albumYear", "artists", "bandComposition"].map((field) => (
              <input
                key={field}
                type={field === "albumYear" ? "number" : "text"}
                name={field}
                placeholder={field
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (str) => str.toUpperCase())}
                className="p-2 bg-gray-800 rounded"
                onChange={handleInputChange}
                value={albumDetails[field]}
              />
            ))}
            <input
              type="file"
              name="albumArt"
              accept="image/*"
              className="p-2 bg-gray-800 rounded"
              onChange={handleFileChange}
            />
            <input
              type="file"
              name="tracks"
              accept="audio/*"
              multiple
              className="p-2 bg-gray-800 rounded"
              onChange={handleFileChange}
            />
            <button
              onClick={isEditing ? handleUpdateAlbum : handleFileUpload}
              className="py-2 px-4 bg-green-500 rounded hover:bg-green-600 transition duration-200"
              aria-label={isEditing ? "Update Album" : "Upload Album"}
            >
              {isEditing ? "Update Album" : "Upload Album"}
            </button>
            {uploadStatus && <p>{uploadStatus}</p>}
          </div>
        </div>

        

          {/* Show Album Details When Clicked */}
          {selectedAlbum && !loading && (
            <div className="mt-8 bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-4">{selectedAlbum.albumName}</h3>
              <p>Genre: {selectedAlbum.genre}</p>
              <p>Year: {selectedAlbum.albumYear}</p>
              <p>Artists: {selectedAlbum.artists.join(", ")}</p>
              <img
                src={selectedAlbum.albumArtUrl}
                alt={selectedAlbum.albumName}
                className="w-40 h-40 mt-4 rounded-lg"
              />

              {/* Tracklist */}
              <div className="mt-4">
                <h4 className="text-lg font-bold mb-2">Tracks</h4>
                <ul className="space-y-2">
                  {selectedAlbum.tracks.map((track, index) => (
                    <li key={index} className="bg-gray-700 p-3 rounded-lg">
                      <p className="font-semibold">{track.trackName}</p>
                      <p className="text-gray-400">Label: {track.trackLabel}</p>
                      <audio controls className="w-full mt-2">
                        <source src={track.trackUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Delete Album Button */}
              <button
                onClick={handleDeleteSelectedAlbum}
                className="mt-4 py-2 px-4 bg-red-500 text-white rounded hover:bg-red-600 transition duration-200"
                aria-label="Delete Album"
              >
                {loading ? "Deleting..." : "Delete Album"}
              </button>
            </div>
          )}

          {/* Loading Placeholder */}
          {loading && <p>Loading album details...</p>}
        </div>

        <button
            onClick={requestAnalyticsReport}
            className="py-2 px-4 bg-blue-500 rounded hover:bg-blue-600 transition duration-200"
            disabled={loading}
            aria-label="Get Analytics Report"
          >
            {loading ? "Loading..." : "Get Analytics Report"}
          </button>
      </main>
    </div>
  );
  
};


export default AdminDashboard;