import React from 'react';

const SignOutButton = ({ signOut }) => (
  <button
    onClick={signOut}
    className="w-full py-2 bg-red-500 text-white rounded hover:bg-red-600 transition duration-200"
  >
    Sign Out
  </button>
);

export default SignOutButton;
