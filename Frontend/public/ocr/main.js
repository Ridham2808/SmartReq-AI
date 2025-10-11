(() => {
  const fileInput = document.getElementById('fileInput');
  const langSelect = document.getElementById('langSelect');
  const clearBtn = document.getElementById('clearBtn');
  const output = document.getElementById('output');
  const previewWrap = document.getElementById('preview');
  const imgPreview = document.getElementById('imgPreview');
  const pdfCanvas = document.getElementById('pdfCanvas');
  const progressWrap = document.getElementById('progressWrap');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const copyBtn = document.getElementById('copyBtn');

  // PDF.js setup
  if (window['pdfjsLib']) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.js';
  }

  function resetUI() {
    fileInput.value = '';
    output.value = '';
    imgPreview.src = '';
    imgPreview.classList.add('hidden');
    pdfCanvas.classList.add('hidden');
    previewWrap.classList.add('hidden');
    hideProgress();
  }

  function showProgress(percent, statusText) {
    progressWrap.classList.remove('hidden');
    const pct = Math.max(0, Math.min(100, Math.floor(percent * 100)));
    progressBar.style.width = pct + '%';
    progressText.textContent = (statusText ? statusText + ' • ' : '') + pct + '%';
  }

  function hideProgress() {
    progressWrap.classList.add('hidden');
    progressBar.style.width = '0%';
    progressText.textContent = '0%';
  }

  async function fileToImageURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function renderPdfFirstPageToCanvas(file, canvas) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2 });
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: context, viewport }).promise;
    return canvas.toDataURL('image/png');
  }

  async function runOCR(imageURL, lang) {
    output.value = '';
    showProgress(0, 'Initializing');
    try {
      const worker = await Tesseract.createWorker(lang, 1, {
        logger: (m) => {
          if (m.status && typeof m.progress === 'number') {
            showProgress(m.progress, m.status);
          }
        },
      });
      const { data } = await worker.recognize(imageURL);
      await worker.terminate();
      hideProgress();
      output.value = data.text || '';
    } catch (err) {
      hideProgress();
      console.error(err);
      output.value = 'Error: Failed to extract text. ' + (err && err.message ? err.message : 'Unknown error');
    }
  }

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const lang = langSelect.value || 'eng';
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);

    previewWrap.classList.remove('hidden');
    let imageUrl = '';
    try {
      if (isPdf) {
        imgPreview.classList.add('hidden');
        pdfCanvas.classList.remove('hidden');
        imageUrl = await renderPdfFirstPageToCanvas(file, pdfCanvas);
      } else {
        pdfCanvas.classList.add('hidden');
        imgPreview.classList.remove('hidden');
        imageUrl = await fileToImageURL(file);
        imgPreview.src = imageUrl;
      }
      await runOCR(imageUrl, lang);
    } catch (err) {
      console.error(err);
      output.value = 'Error: Unable to process the selected file.';
      hideProgress();
    }
  });

  clearBtn.addEventListener('click', () => {
    resetUI();
  });

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(output.value || '');
      copyBtn.textContent = 'Copied';
      setTimeout(() => (copyBtn.textContent = 'Copy'), 1000);
    } catch (e) {
      // fallback
      output.select();
      document.execCommand('copy');
      copyBtn.textContent = 'Copied';
      setTimeout(() => (copyBtn.textContent = 'Copy'), 1000);
    }
  });

  // initialize
  resetUI();
})();


