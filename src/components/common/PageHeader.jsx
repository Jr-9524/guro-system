import { guroPage } from "../../styles/guroStyles";

const PageHeader = ({ title, description, actions, className = "" }) => (
  <header className={`${guroPage.header} ${className}`}>
    <div className="min-w-0">
      <h1 className={guroPage.title}>{title}</h1>
      {description && (
        <p className={guroPage.description}>{description}</p>
      )}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </header>
);

export default PageHeader;
