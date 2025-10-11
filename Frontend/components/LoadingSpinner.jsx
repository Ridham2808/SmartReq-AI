export default function LoadingSpinner(){
  return (
    <div className="w-full flex justify-center items-center py-10" role="status" aria-live="polite">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      <span className="sr-only">Loading...</span>
    </div>
  )
}


