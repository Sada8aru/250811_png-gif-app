export const injectBoundingBoxTemplate = (container: HTMLElement) => {
  if (!container) return;
  container.textContent = "";

  const handleDirections = ["nw", "ne", "sw", "se"];
  handleDirections.forEach((dir) => {
    const handle = document.createElement("div");
    handle.className = `bounding-box__handle bounding-box__handle--${dir}`;
    container.appendChild(handle);
  });

  const borders = ["top", "right", "bottom", "left"];
  borders.forEach((pos) => {
    const border = document.createElement("div");
    border.className = `bounding-box__border bounding-box__border--${pos}`;
    container.appendChild(border);
  });
};

export const injectCropBoxTemplate = (container: HTMLElement) => {
  if (!container) return;
  container.textContent = "";

  const handleDirections = ["nw", "ne", "sw", "se", "n", "e", "s", "w"];
  handleDirections.forEach((dir) => {
    const handle = document.createElement("div");
    handle.className = `crop-box__handle crop-box__handle--${dir}`;
    container.appendChild(handle);
  });

  const overlays = ["top", "right", "bottom", "left"];
  overlays.forEach((pos) => {
    const overlay = document.createElement("div");
    overlay.className = `crop-box__overlay crop-box__overlay--${pos}`;
    container.appendChild(overlay);
  });
};
