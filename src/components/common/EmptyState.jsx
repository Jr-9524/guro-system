import { guroEmptyState } from "../../styles/guroStyles";

const EmptyState = ({ icon: Icon, title, message, action }) => (
  <div className={guroEmptyState.root}>
    {Icon && (
      <div className={guroEmptyState.icon}>
        <Icon className="h-6 w-6" />
      </div>
    )}
    <h3 className={guroEmptyState.title}>{title}</h3>
    {message && <p className={guroEmptyState.message}>{message}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
