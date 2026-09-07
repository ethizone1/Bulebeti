import React from "react";
import { Link } from "react-router-dom";

const BuleBetLogo = ({
  size = 40,
  variant = "combo", // "combo" | "emblem" | "full" | "title" | "text"
  showSubtitle = true,
  linkTo = "/",
  style = {},
  className = "",
}) => {
  if (variant === "footer") {
    return (
      <Link
        to={linkTo}
        style={{
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          ...style,
        }}
        className={className}
        aria-label="MaedBet Ethiopian Restaurant Hub"
      >
        <img
          src="/bulebet_footer_logo.png"
          alt="MaedBet Ethiopian Restaurant Hub Logo"
          style={{
            height: `${size}px`,
            width: "auto",
            objectFit: "contain",
          }}
        />
      </Link>
    );
  }

  if (variant === "full" || variant === "title") {
    return (
      <Link
        to={linkTo}
        style={{
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          ...style,
        }}
        className={className}
        aria-label="MaedBet Ethiopian Restaurant Hub"
      >
        <img
          src="/bulebet_title_logo.png"
          alt="MaedBet Ethiopian Restaurant Hub Logo"
          style={{
            height: `${size}px`,
            width: "auto",
            objectFit: "contain",
            filter: "drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15))",
          }}
        />
      </Link>
    );
  }

  if (variant === "text") {
    return (
      <Link
        to={linkTo}
        style={{
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          ...style,
        }}
        className={className}
        aria-label="MaedBet Ethiopian Restaurant Hub"
      >
        <img
          src="/bulebet_text_logo.png"
          alt="MaedBet Ethiopian Restaurant Hub"
          style={{
            height: `${size}px`,
            width: "auto",
            objectFit: "contain",
          }}
        />
      </Link>
    );
  }

  if (variant === "emblem") {
    return (
      <Link
        to={linkTo}
        style={{
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          ...style,
        }}
        className={className}
        aria-label="MaedBet Home"
      >
        <img
          src="/bulebet_emblem.png"
          alt="MaedBet Emblem"
          style={{
            height: `${size}px`,
            width: "auto",
            objectFit: "contain",
            borderRadius: "50%",
          }}
        />
      </Link>
    );
  }

  // Default: Combo (Renders full new luxury golden MaedBet logo image)
  return (
    <Link
      to={linkTo}
      style={{
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        ...style,
      }}
      className={className}
      aria-label="MaedBet Home"
    >
      <img
        src="/maedbet_logo.png"
        alt="MaedBet Ethiopian Restaurant Hub Logo"
        style={{
          height: `${size * 1.3}px`,
          width: "auto",
          objectFit: "contain",
          filter: "drop-shadow(0 2px 8px rgba(212, 175, 55, 0.25))",
        }}
      />
    </Link>
  );
};

export default BuleBetLogo;

