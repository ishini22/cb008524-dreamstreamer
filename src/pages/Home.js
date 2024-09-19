import React from 'react';
import { useNavigate } from 'react-router-dom';
import SignOutButton from '../components/Auth/SignOutButton';

const Home = ({ signOut }) => {
  const navigate = useNavigate();

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-6">Welcome to DreamStreamer</h1>
      <div className="flex flex-col space-y-4">
        <button
          onClick={() => navigate('/dreamstreamer')}
          className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200"
        >
          Go to DreamStreamer
        </button>
        <SignOutButton signOut={signOut} />
      </div>
    </div>
  );
};

export default Home;
