import { guroTable } from "../../styles/guroStyles";

const TableRowLink = ({ children, onClick, className = "", ...props }) => {
  return (
    <tr
      onClick={onClick}
      className={`${guroTable.row} ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
};

export default TableRowLink;
