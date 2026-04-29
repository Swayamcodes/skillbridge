const baseBlockClass = 'animate-pulse rounded bg-current/10';

const SkeletonBlock = ({ className = '' }) => (
  <div
    aria-hidden="true"
    className={`${baseBlockClass} ${className}`.trim()}
  />
);

export const GigCardSkeleton = ({ className = '' }) => (
  <div
    aria-hidden="true"
    className={`rounded-xl border border-current/10 p-6 text-current ${className}`.trim()}
  >
    <div className="mb-4 flex items-start justify-between gap-3">
      <SkeletonBlock className="h-6 w-3/4" />
      <SkeletonBlock className="h-8 w-24 rounded-full" />
    </div>

    <div className="mb-4 space-y-2">
      <SkeletonBlock className="h-4 w-full" />
      <SkeletonBlock className="h-4 w-full" />
      <SkeletonBlock className="h-4 w-full" />
    </div>

    <div className="mb-4 flex flex-wrap gap-2">
      <SkeletonBlock className="h-6 w-20 rounded-full" />
      <SkeletonBlock className="h-6 w-20 rounded-full" />
      <SkeletonBlock className="h-6 w-20 rounded-full" />
    </div>

    <div className="flex items-center justify-between gap-4 border-t border-current/10 pt-4">
      <div className="flex items-center gap-2">
        <SkeletonBlock className="h-8 w-8 rounded-full" />
        <SkeletonBlock className="h-4 w-28" />
      </div>
      <SkeletonBlock className="h-4 w-4" />
    </div>
  </div>
);

export const ProfileSkeleton = ({ className = '' }) => (
  <div
    aria-hidden="true"
    className={`rounded-2xl border border-current/10 text-current ${className}`.trim()}
  >
    <SkeletonBlock className="h-40 w-full rounded-b-none rounded-t-2xl" />

    <div className="px-8 pb-8">
      <div className="-mt-10 mb-8 flex items-start gap-6">
        <SkeletonBlock className="h-20 w-20 rounded-full border-4 border-transparent" />

        <div className="flex-1 pt-12">
          <SkeletonBlock className="mb-3 h-8 w-48" />
          <SkeletonBlock className="mb-2 h-5 w-36" />
          <SkeletonBlock className="h-4 w-24" />
        </div>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-4 border-t border-current/10 pt-6">
        {[0, 1, 2].map((item) => (
          <div key={item} className="flex flex-col items-center gap-2">
            <SkeletonBlock className="h-8 w-12" />
            <SkeletonBlock className="h-4 w-20" />
          </div>
        ))}
      </div>

      <div className="mb-6">
        <SkeletonBlock className="mb-3 h-6 w-28" />
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-11/12" />
          <SkeletonBlock className="h-4 w-4/5" />
        </div>
      </div>

      <div className="mb-6">
        <SkeletonBlock className="mb-3 h-6 w-24" />
        <SkeletonBlock className="h-4 w-56" />
      </div>

      <div>
        <SkeletonBlock className="mb-3 h-6 w-20" />
        <div className="flex flex-wrap gap-2">
          <SkeletonBlock className="h-8 w-24 rounded-full" />
          <SkeletonBlock className="h-8 w-20 rounded-full" />
          <SkeletonBlock className="h-8 w-28 rounded-full" />
          <SkeletonBlock className="h-8 w-16 rounded-full" />
        </div>
      </div>
    </div>
  </div>
);

export const TableRowSkeleton = ({ className = '' }) => (
  <div
    aria-hidden="true"
    className={`flex flex-col gap-4 rounded-xl border border-current/10 p-5 text-current sm:flex-row sm:items-center sm:justify-between ${className}`.trim()}
  >
    <div className="min-w-0 flex-1">
      <SkeletonBlock className="mb-2 h-5 w-3/4 max-w-56" />
      <SkeletonBlock className="h-4 w-32" />
    </div>

    <div className="flex items-center justify-between gap-4 sm:justify-end">
      <SkeletonBlock className="h-6 w-20" />
      <SkeletonBlock className="h-7 w-24 rounded-full" />
    </div>
  </div>
);

export default {
  GigCardSkeleton,
  ProfileSkeleton,
  TableRowSkeleton,
};
