// This will show you what a CHL tile actually looks like
fetch('/api/tiles/chl/5/9/12?time=latest')
  .then(r => r.blob())
  .then(blob => {
    const url = URL.createObjectURL(blob);
    const img = document.createElement('img');
    img.style.position = 'fixed';
    img.style.top = '50%';
    img.style.left = '50%';
    img.style.transform = 'translate(-50%, -50%)';
    img.style.zIndex = '99999';
    img.style.border = '5px solid red';
    img.style.backgroundColor = 'black';
    img.src = url;
    document.body.appendChild(img);
    console.log('CHL tile displayed in center of screen with red border');
    console.log('Click to remove');
    img.onclick = () => {
      img.remove();
      URL.revokeObjectURL(url);
    };
  });
