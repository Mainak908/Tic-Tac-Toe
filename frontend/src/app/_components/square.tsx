"use client";
import React from "react";

interface SquareProps {
  value: string | null;
  onClick: () => void;
}

const Square: React.FC<SquareProps> = ({ value, onClick }) => {
  return (
    <button
      className="w-16 h-16 border border-gray-400 flex items-center justify-center text-3xl font-bold bg-white hover:bg-gray-100"
      onClick={onClick}
    >
      {value}
    </button>
  );
};

export default Square;
