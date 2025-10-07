import React, { useState } from "react";
import { Link } from "react-router-dom";


interface FireButtonProps {
  to: string;
  text: string;
  bgColor: string;
  hoverColor: string;
}
const FireButton: React.FC<FireButtonProps> = ({
  to,
  text,
  bgColor,
  hoverColor,
}) => {
  const [fire, setFire] = useState(false);

  const handleClick = () => {
    setFire(true);
    setTimeout(() => setFire(false), 800);
  };
  return (
    <div
      className={`relative ${fire ? "fire-effect" : ""}`}
      onClick={handleClick}
    >
      <Link
        to={to}
        className={`px-8 py-3 ${bgColor} text-white font-bold rounded-lg shadow-lg hover:${hoverColor} transition-all`}
      >
        {text}
      </Link>
    </div>
  );
};

export default FireButton;