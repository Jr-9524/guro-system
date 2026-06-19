import { guroStat } from "../../styles/guroStyles";

const Stat = ({
  title,
  label,
  value,
  note,
  helper,
  icon: Icon,
  variant = "blue",
  className = "",
}) => {
  const variantClass = guroStat.variants[variant] || guroStat.variants.blue;

  return (
    <div className={`${guroStat.card} ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={guroStat.title}>{title || label}</p>
          <h3 className={guroStat.value}>{value}</h3>

          {(note || helper) && (
            <p className={`${guroStat.note} ${variantClass.note}`}>
              {note || helper}
            </p>
          )}
        </div>

        {Icon && (
          <div className={`${guroStat.iconBox} ${variantClass.iconBox}`}>
            <Icon className={`h-6 w-6 ${variantClass.icon}`} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Stat;
