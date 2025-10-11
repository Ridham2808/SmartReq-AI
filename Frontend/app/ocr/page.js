'use client'
import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

export default function OCRPage() {
  const [scriptsReady, setScriptsReady] = useState(false)
  const [lang, setLang] = useState('eng')
  const [progress, setProgress] = useState({ pct: 0, status: '' })
  const [text, setText] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const fileInputRef = useRef(null)
  const imgRef = useRef(null)
  const canvasRef = useRef(null)

  const showPreviewImage = (url) => {
    if (imgRef.current && canvasRef.current) {
      imgRef.current.src = url
      imgRef.current.classList.remove('hidden')
      canvasRef.current.classList.add('hidden')
    }
  }

  const showPreviewCanvas = () => {
    if (imgRef.current && canvasRef.current) {
      imgRef.current.classList.add('hidden')
      canvasRef.current.classList.remove('hidden')
    }
  }

  const resetUI = () => {
    setText('')
    setProgress({ pct: 0, status: '' })
    setIsBusy(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (imgRef.current) imgRef.current.src = ''
    if (imgRef.current) imgRef.current.classList.add('hidden')
    if (canvasRef.current) canvasRef.current.classList.add('hidden')
  }

  const fileToDataURL = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const renderPdfFirstPageToCanvas = async (file) => {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale: 2 })
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvasContext: ctx, viewport }).promise
    return canvas.toDataURL('image/png')
  }

  const onFileChange = async (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file || !scriptsReady) return
    setText('')
    setProgress({ pct: 0, status: 'Initializing' })
    setIsBusy(true)
    try {
      const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
      let imageUrl
      if (isPdf) {
        showPreviewCanvas()
        imageUrl = await renderPdfFirstPageToCanvas(file)
      } else {
        imageUrl = await fileToDataURL(file)
        showPreviewImage(imageUrl)
      }

      const worker = await window.Tesseract.createWorker(lang, 1, {
        logger: (m) => {
          if (m && typeof m.progress === 'number') {
            setProgress({ pct: Math.max(0, Math.floor(m.progress * 100)), status: m.status || '' })
          }
        }
      })
      const { data } = await worker.recognize(imageUrl)
      await worker.terminate()
      setText(data?.text || '')
    } catch (err) {
      console.error(err)
      setText(`Error: ${err?.message || 'Failed to extract text'}`)
    } finally {
      setIsBusy(false)
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.js'
    }
  }, [scriptsReady])

  return (
    <main className="min-h-screen bg-gray-50">
      <Script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js" onLoad={() => setScriptsReady(true)} strategy="afterInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.js" strategy="afterInteractive" />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-800">OCR File Extractor</h1>
        </header>

        <section className="bg-white shadow rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <label
              htmlFor="fileInput"
              className="flex-1 flex items-center justify-between border-2 border-dashed border-gray-300 rounded-lg p-3 cursor-pointer hover:border-indigo-400 transition"
            >
              <span className="text-gray-600">Upload image or PDF</span>
              <span className="px-3 py-1 text-xs font-medium bg-gray-100 rounded-md">Browse</span>
            </label>
            <input id="fileInput" ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={onFileChange} />

            <select value={lang} onChange={(e) => setLang(e.target.value)} className="sm:w-40 w-full border rounded-md px-3 py-2 text-sm">
              <option value="eng">English (eng)</option>
              <option value="hin">Hindi (hin)</option>
            </select>

            <button onClick={resetUI} disabled={isBusy} className="w-full sm:w-auto px-4 py-2 text-sm rounded-md border text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              Clear
            </button>
          </div>

          <div className="hidden mb-4" id="previewWrap">
            {/* kept for structure parity; we toggle individual elements */}
          </div>
          <img ref={imgRef} alt="Preview" className="hidden max-h-64 rounded-lg shadow mb-4" />
          <canvas ref={canvasRef} className="hidden max-h-64 rounded-lg shadow mb-4" />

          {isBusy && (
            <div className="mb-4">
              <div className="flex items-center gap-3">
                <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                <div className="flex-1 h-2 bg-gray-200 rounded">
                  <div className="h-2 bg-indigo-600 rounded" style={{ width: `${progress.pct}%` }}></div>
                </div>
                <span className="text-sm text-gray-600">{progress.status ? `${progress.status} • ` : ''}{progress.pct}%</span>
              </div>
            </div>
          )}

          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-700">Extracted Text</h2>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(text || '')
                } catch {
                  /* no-op */
                }
              }}
              className="px-3 py-1 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Copy
            </button>
          </div>
          <textarea rows={10} value={text} onChange={(e) => setText(e.target.value)} className="w-full border rounded-lg p-3 text-sm font-mono text-gray-800" placeholder="Your extracted text will appear here..."></textarea>

          <p className="mt-4 text-xs text-gray-500">Powered by <a href="https://github.com/naptha/tesseract.js" className="text-indigo-600 hover:underline" target="_blank" rel="noopener">Tesseract.js</a>. PDF rendered via <a href="https://github.com/mozilla/pdfjs-dist" className="text-indigo-600 hover:underline" target="_blank" rel="noopener">pdfjs-dist</a>.</p>
        </section>
      </div>
    </main>
  )
}


