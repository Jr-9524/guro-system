import { Link } from "react-router-dom";
import { guroCard, guroPanel, guroText } from "../../styles/guroStyles";

const Panel = ({
  title,
  action,
  actionLabel = "View",
  children,
  className = "",
}) => (
  <section
    className={`${guroCard.base} ${guroCard.padding} border border-base-300 ${className}`}
  >
    {(title || action) && (
      <div className={`${guroPanel.header} border-b border-base-300 pb-3`}>
        {title && <h2 className={guroPanel.title}>{title}</h2>}

        {action && (
          <Link to={action} className={guroText.link}>
            {actionLabel}
          </Link>
        )}
      </div>
    )}

    {children}
  </section>
);

export default Panel;
