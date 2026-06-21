const PageHeader = ({ title, description, actions, className = "" }) => (
  <header className={`flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between ${className}`}>
    <div className="min-w-0">
      <h1 className="text-2xl font-bold tracking-tight text-base-content">{title}</h1>
      {description && <p className="mt-1 max-w-3xl text-sm leading-6 text-base-content/60">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </header>
);
export default PageHeader;