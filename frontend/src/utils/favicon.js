export const setDynamicFavicon = (name, logoUrl) => {
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }

  if (logoUrl) {
    link.href = logoUrl;
  } else {
    // Generate an SVG favicon with initials
    const initials = name 
      ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() 
      : 'BB';
      
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" rx="20" fill="#000000"/>
        <text x="50" y="66" font-family="Arial, sans-serif" font-size="45" font-weight="bold" fill="#D4AF37" text-anchor="middle">
          ${initials}
        </text>
      </svg>
    `.trim();
    
    // Encode for use in a data URI
    const encodedSvg = encodeURIComponent(svg);
    link.href = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
  }
};
