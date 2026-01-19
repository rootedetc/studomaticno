export function Skeleton({ variant = 'text', width, height, className = '', count = 1 }) {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded';

  const getVariantClasses = () => {
    switch (variant) {
      case 'card':
        return 'h-32 w-full rounded-lg';
      case 'avatar':
        return 'h-10 w-10 rounded-full';
      case 'circle':
        return 'h-12 w-12 rounded-full';
      case 'list':
        return 'h-16 w-full rounded-lg';
      case 'table':
        return 'h-10 w-full rounded';
      case 'text':
      default:
        return 'h-4 w-full rounded';
    }
  };

  const getWidth = () => {
    if (width) return typeof width === 'number' ? `${width}px` : width;
    return variant === 'text' ? '100%' : 'auto';
  };

  const getHeight = () => {
    if (height) return typeof height === 'number' ? `${height}px` : height;
    return 'auto';
  };

  const style = {
    width: width || variant === 'text' ? undefined : undefined,
    height: height || variant === 'text' ? undefined : undefined,
  };

  const item = (
    <div
      className={`${baseClasses} ${getVariantClasses()} ${className}`}
      style={style}
    />
  );

  if (count > 1) {
    return (
      <div className={`space-y-2`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={getVariantClasses()} />
        ))}
      </div>
    );
  }

  return item;
}

export function SkeletonCard({ count = 1 }) {
  return (
    <div className="card p-4 space-y-3">
      <Skeleton variant="text" count={2} />
      <Skeleton variant="text" width="60%" />
    </div>
  );
}

export function SkeletonList({ items = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="card p-4 flex items-center gap-3">
          <Skeleton variant="circle" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" />
            <Skeleton variant="text" width="60%" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 3 }) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3">
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} variant="text" height="h-4" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-3">
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: cols }).map((_, colIndex) => (
                <Skeleton key={colIndex} variant="text" height="h-4" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonAvatar() {
  return <Skeleton variant="avatar" />;
}
