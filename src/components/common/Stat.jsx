const Stat = ({
  label,
  value,
  helper,
  icon: Icon,
  className = "",
  iconClassName = "text-base-content",
}) => (
  <div
    className={`rounded-md border border-base-300 bg-base-100 p-4 ${className}`}
  >
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-base-content/50">
          {label}
        </p>
        <p className="mt-1 text-3xl font-bold">{value}</p>
        {helper && (
          <p className="mt-1 text-sm text-base-content/60">{helper}</p>
        )}
      </div>

      {Icon && (
        <div
          className={`flex shrink-0 items-center justify-center ${iconClassName}`}
        >
          <Icon className="h-8 w-8" />
        </div>
      )}
    </div>
  </div>
);

export default Stat;
