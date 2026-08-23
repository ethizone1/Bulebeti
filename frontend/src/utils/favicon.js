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
    link.href = "/bulebet_emblem.png";
  }
};
