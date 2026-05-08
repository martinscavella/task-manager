import { Skeleton } from '@/components/ui/skeleton'

export default function TaskDetailLoading() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Back button */}
        <Skeleton className="h-8 w-32 mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left col */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>

            {/* Dettagli card */}
            <div className="border rounded-lg overflow-hidden">
              <Skeleton className="h-10 w-full" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="px-4 py-3 border-t flex gap-4">
                  <Skeleton className="h-4 w-24 shrink-0" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </div>
          </div>

          {/* Right col */}
          <div className="lg:col-span-1">
            <div className="border rounded-lg p-4 space-y-3">
              <Skeleton className="h-4 w-20 mb-4" />
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2">
                  <Skeleton className="w-[18px] h-[18px] rounded-full shrink-0" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
