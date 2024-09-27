import React from 'react';
import { useNavigate } from 'react-router-dom';
import SignOutButton from '../components/Auth/SignOutButton';

const Home = ({ signOut }) => {
  const navigate = useNavigate();

  return (
    <div className="w-full h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black flex flex-col items-center justify-center">
      <h1 className="text-4xl font-extrabold text-white mb-8 tracking-wide">
        Welcome to DreamStreamer
      </h1>
      <div className="flex flex-col space-y-6">
        <button
          onClick={() => navigate('/dreamstreamer')}
          className="w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full shadow-lg hover:scale-105 hover:bg-gradient-to-l transform transition duration-300 ease-in-out"
        >
          Go to DreamStreamer
        </button>
        <SignOutButton signOut={signOut} />
      </div>
    </div>
  );
};

export default Home;
