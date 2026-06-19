import { Link } from "react-router-dom";

const SectionTabs = ({ items, activeId, onChange, label = "Section views" }) => (
  <nav
    className="flex w-fit max-w-full flex-wrap gap-1 rounded-xl border border-base-300 bg-base-100 p-1"
    aria-label={label}
  >
    {items.map((item) => {
      const isActive = item.id === activeId;
      const className = `rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
        isActive
          ? "bg-primary text-primary-content"
          : "text-base-content/60 hover:bg-base-200 hover:text-base-content"
      }`;

      return item.href ? (
        <Link
          key={item.id}
          to={item.href}
          aria-current={isActive ? "page" : undefined}
          className={className}
        >
          {item.label}
        </Link>
      ) : (
        <button
          key={item.id}
          type="button"
          aria-pressed={isActive}
          className={className}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      );
    })}
  </nav>
);

export default SectionTabs;
