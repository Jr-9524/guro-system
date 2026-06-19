import SectionTabs from "./SectionTabs";

const items = [
  { id: "active", label: "Active", href: "/iep/active" },
  { id: "drafts", label: "Drafts", href: "/iep/drafts" },
  { id: "archive", label: "Archive", href: "/iep/archive" },
  { id: "goals", label: "Goal Bank", href: "/goals" },
];

const IepTabs = ({ activeId }) => (
  <SectionTabs label="IEP views" activeId={activeId} items={items} />
);

export default IepTabs;
