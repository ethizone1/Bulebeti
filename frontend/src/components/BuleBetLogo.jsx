import React from "react";
import { Link } from "react-router-dom";

const BuleBetLogo = ({ size = 36 }) => {
  return (
    <Link
      to="/"
      style={{
        textDecoration: "none",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
      aria-label="BuleBet Home"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block" }}
      >
        <rect width="48" height="48" rx="8" fill="#F7E7C3" />
        <path d="M12 32L20 16L28 32H24L22 26H18L16 32H12Z" fill="#B77A00" />
      </svg>
      <div
        style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}
        className="hide-on-mobile"
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: 800,
            letterSpacing: "0.06em",
            color: "var(--primary)",
          }}
        >
          BuleBet
        </div>
        <div
          style={{ fontSize: "10px", color: "var(--gold)", fontWeight: 700 }}
        >
          GLOBAL
        </div>
      </div>
    </Link>
  );
};

export default BuleBetLogo;
