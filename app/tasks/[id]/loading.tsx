import { Skeleton } from '@/components/ui/skeleton'

export default function TaskDetailLoading() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar skeleton */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 border-r bg-muted/20 shrink-0">
        <div className="px-4 py-4 border-b">
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="px-3 py-3 border-b">
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="px-2 py-2 space-y-1">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="px-3 py-2.5 space-y-1.5">
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </aside>

      {/* Main content skeleton */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
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
      </div>
    </div>
  )
}
