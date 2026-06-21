const EmptyState = ({ icon: Icon, title, message, action }) => (
  <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-base-300 bg-base-100 p-8 text-center">
    {Icon && <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-base-200 text-base-content/50"><Icon className="h-6 w-6" /></div>}
    <h3 className="mt-4 font-semibold">{title}</h3>
    {message && <p className="mt-1 max-w-md text-sm leading-6 text-base-content/60">{message}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
export default EmptyState;