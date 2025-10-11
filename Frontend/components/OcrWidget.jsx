"use client"
import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import ClientOnly from './ClientOnly'

export default function OcrWidget({ open, onClose }){
  const [scriptsReady, setScriptsReady] = useState(false)
  const [lang, setLang] = useState('eng')
  const [progress, setProgress] = useState({ pct: 0, status: '' })
  const [text, setText] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const fileInputRef = useRef(null)
  const imgRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.js'
    }
  }, [scriptsReady])

  useEffect(() => {
    if (!open) {
      // reset when closing to keep it light
      setText('')
      setProgress({ pct: 0, status: '' })
      setIsBusy(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (imgRef.current) imgRef.current.src = ''
    }
  }, [open])

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
        if (imgRef.current) imgRef.current.classList.add('hidden')
        if (canvasRef.current) canvasRef.current.classList.remove('hidden')
        imageUrl = await renderPdfFirstPageToCanvas(file)
      } else {
        imageUrl = await fileToDataURL(file)
        if (imgRef.current) {
          imgRef.current.src = imageUrl
          imgRef.current.classList.remove('hidden')
        }
        if (canvasRef.current) canvasRef.current.classList.add('hidden')
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
      setText(`Error: ${err?.message || 'Failed to extract text'}`)
    } finally {
      setIsBusy(false)
    }
  }

  if (!open) return null

  return (
    <ClientOnly>
      <Script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js" onLoad={() => setScriptsReady(true)} strategy="afterInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.js" strategy="afterInteractive" />

      <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/30">
        <div className="w-full sm:w-[640px] mx-0 sm:mx-auto bg-white rounded-t-2xl sm:rounded-2xl border-2 border-black shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b-2 border-black flex items-center justify-between">
            <div className="font-semibold">OCR Extractor</div>
            <button onClick={onClose} className="px-3 py-1 rounded-md border-2 border-black text-black hover:bg-gray-50">Close</button>
          </div>

          <div className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <label htmlFor="ocr-file" className="flex-1 flex items-center justify-between border-2 border-dashed border-gray-300 rounded-lg p-3 cursor-pointer hover:border-indigo-400 transition">
                <span className="text-gray-600">Upload image or PDF</span>
                <span className="px-3 py-1 text-xs font-medium bg-gray-100 rounded-md">Browse</span>
              </label>
              <input id="ocr-file" ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={onFileChange} />

              <select value={lang} onChange={(e) => setLang(e.target.value)} className="sm:w-40 w-full border rounded-md px-3 py-2 text-sm">
                <option value="eng">English (eng)</option>
                <option value="hin">Hindi (hin)</option>
              </select>

              <button onClick={() => { if (fileInputRef.current) fileInputRef.current.value=''; setText('') }} className="w-full sm:w-auto px-4 py-2 text-sm rounded-md border text-gray-700 hover:bg-gray-50">Clear</button>
            </div>

            <img ref={imgRef} alt="Preview" className="hidden max-h-48 rounded-lg shadow mb-4" />
            <canvas ref={canvasRef} className="hidden max-h-48 rounded-lg shadow mb-4" />

            {isBusy && (
              <div className="mb-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full" />
                  <div className="flex-1 h-2 bg-gray-200 rounded">
                    <div className="h-2 bg-indigo-600 rounded" style={{ width: `${progress.pct}%` }} />
                  </div>
                  <span className="text-sm text-gray-600">{progress.status ? `${progress.status} • ` : ''}{progress.pct}%</span>
                </div>
              </div>
            )}

            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-700">Extracted Text</h2>
              <button
                onClick={async () => { try { await navigator.clipboard.writeText(text || '') } catch(_){} }}
                className="px-3 py-1 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Copy
              </button>
            </div>
            <textarea rows={8} value={text} onChange={(e)=>setText(e.target.value)} className="w-full border rounded-lg p-3 text-sm font-mono text-gray-800" placeholder="Your extracted text will appear here..." />

            <p className="mt-3 text-xs text-gray-500">Powered by Tesseract.js and pdfjs-dist.</p>
          </div>
        </div>
      </div>
    </ClientOnly>
  )
}


