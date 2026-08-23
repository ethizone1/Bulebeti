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
        aria-label="BuleBet Ethiopian Restaurant Hub"
      >
        <img
          src="/bulebet_title_logo.png"
          alt="BuleBet Ethiopian Restaurant Hub Logo"
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
        aria-label="BuleBet Ethiopian Restaurant Hub"
      >
        <img
          src="/bulebet_text_logo.png"
          alt="BuleBet Ethiopian Restaurant Hub"
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
        aria-label="BuleBet Home"
      >
        <img
          src="/bulebet_emblem.png"
          alt="BuleBet Emblem"
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

  // Default: Combo (Emblem Image + Styled Golden Title Text)
  return (
    <Link
      to={linkTo}
      style={{
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        ...style,
      }}
      className={className}
      aria-label="BuleBet Home"
    >
      <img
        src="/bulebet_emblem.png"
        alt="BuleBet Emblem"
        style={{
          height: `${size}px`,
          width: `${size}px`,
          objectFit: "cover",
          borderRadius: "50%",
          flexShrink: 0,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
        }}
      />
      <div
        style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}
      >
        <span
          style={{
            fontSize: `${Math.max(15, size * 0.45)}px`,
            fontWeight: 800,
            letterSpacing: "0.08em",
            color: "var(--primary, #0f172a)",
            fontFamily: "'Georgia', 'Times New Roman', serif",
          }}
        >
          BULEBET
        </span>
        {showSubtitle && (
          <span
            className="hide-on-mobile"
            style={{
              fontSize: `${Math.max(9, size * 0.22)}px`,
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: "var(--gold, #d4af37)",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            ETHIOPIAN RESTAURANT HUB
          </span>
        )}
      </div>
    </Link>
  );
};

export default BuleBetLogo;

