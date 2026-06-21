import { Link } from "react-router-dom";

const SectionTabs = ({ items, activeId, onChange, label = "Section views" }) => (
  <nav
    className="inline-flex max-w-full shrink-0 flex-nowrap gap-1 overflow-x-auto rounded-xl border border-base-300 bg-base-200/60 p-1"
    aria-label={label}
  >
    {items.map((item) => {
      const isActive = item.id === activeId;
      const className = `shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
        isActive
          ? "bg-base-100 text-base-content ring-1 ring-inset ring-base-300"
          : "text-base-content/60 hover:bg-base-100/70 hover:text-base-content"
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
