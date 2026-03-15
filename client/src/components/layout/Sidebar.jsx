import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronDown,
  Users,
  UserCog,
  Contact,
  GraduationCap,
  Receipt,
  Wallet,
  UsersRound,
  Shield,
  DollarSign,
  LayoutDashboard,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

const navigationItems = [
  {
    key: "dashboard",
    label: "Dashboard",
    action: "read",
    icon: LayoutDashboard,
  },
  {
    key: "contacts",
    label: "Contacts",
    resource: "CONTACTS",
    group: "People Management",
    action: "read",
    icon: Contact,
  },
  {
    key: "students",
    label: "Students",
    resource: "STUDENTS",
    group: "People Management",
    action: "read",
    icon: GraduationCap,
  },
  {
    key: "receipts",
    label: "Receipts",
    resource: "RECEIPTS",
    group: "Financial",
    action: "read",
    icon: Receipt,
  },
  {
    key: "giro",
    label: "Giro",
    resource: "GIRO",
    group: "Financial",
    action: "read",
    icon: Wallet,
  },
  {
    key: "parents",
    label: "Parents",
    resource: "PARENTS",
    group: "People Management",
    action: "read",
    icon: UsersRound,
  },
  {
    key: "users",
    label: "Users",
    resource: "USERS",
    group: "User Management",
    action: "read",
    icon: Users,
  },
  {
    key: "user-roles",
    label: "User Roles",
    resource: "ROLES",
    group: "User Management",
    action: "read",
    icon: UserCog,
  },
  {
    key: "resources",
    label: "Role Resources",
    resource: "RESOURCES",
    group: "User Management",
    action: "read",
    icon: Shield,
  },
];

const groupIcons = {
  "People Management": Contact,
  Financial: DollarSign,
  "User Management": Shield,
};

const SidebarContent = ({
  standaloneItems,
  groupedItems,
  expandedMenus,
  toggleSubmenu,
  isActive,
  isGroupActive,
  onLinkClick,
}) => (
  <aside className="flex flex-col h-full bg-linear-to-brom-slate-50 to-blue-50/50 border-e border-blue-100">
    {/* Header */}
    <div className="flex h-16 shrink-0 items-center px-4 bg-linear-to-r from-blue-600 to-blue-700 shadow-lg">
      <div className="flex items-baseline">
        <h1 className="text-2xl tracking-wide text-white font-semibold">
          {import.meta.env.VITE_APP_NAME || "Prime"}
        </h1>
      </div>
    </div>

    {/* Navigation */}
    <div className="flex flex-1 flex-col overflow-y-auto">
      <nav className="flex-1 space-y-2 px-3 py-6">
        {standaloneItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.key);

          return (
            <Link
              key={item.key}
              to={`/${item.key}`}
              onClick={onLinkClick}
              className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg
              transition-all duration-200
              ${
                active ?
                  "bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-200"
                : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
              }
            `}
            >
              <Icon className="size-5 shrink-0" />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}

        {/* Add spacing between standalone and grouped items if both exist */}
        {standaloneItems.length > 0 && Object.keys(groupedItems).length > 0 && (
          <div className="h-2" />
        )}

        {/* Grouped items */}
        {Object.keys(groupedItems).map((groupName) => {
          const items = groupedItems[groupName];
          const GroupIcon = groupIcons[groupName] || Shield;
          const isExpanded = expandedMenus[groupName];
          const groupActive = isGroupActive(groupName);

          return (
            <div key={groupName}>
              {/* Group Header */}
              <button
                onClick={() => toggleSubmenu(groupName)}
                className={`
                w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg
                transition-all duration-200
                ${
                  groupActive ?
                    "bg-blue-100/70 text-blue-900"
                  : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                }
              `}
              >
                <div className="flex items-center gap-3">
                  <GroupIcon className="size-5 shrink-0" />
                  <span className="font-medium text-sm">{groupName}</span>
                </div>
                <ChevronDown
                  className={`
                  size-4 shrink-0 transition-transform duration-200
                  ${isExpanded ? "rotate-180" : ""}
                `}
                />
              </button>

              {/* Submenu items */}
              {isExpanded && (
                <div className="mt-1 ms-4 space-y-1 border-s-2 border-blue-200 ps-4">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.key);

                    return (
                      <Link
                        key={item.key}
                        to={`/${item.key}`}
                        onClick={onLinkClick}
                        className={`
                        flex items-center gap-3 px-3 py-2 rounded-lg
                        transition-all duration-200
                        ${
                          active ?
                            "bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-200"
                          : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                        }
                      `}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="font-medium text-sm">
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      {/* Footer */}
      <div className="shrink-0 px-3 py-4 border-t border-blue-200 bg-white/50">
        <div className="text-sm text-center text-slate-600">
          © {new Date().getFullYear()}{" "}
          {import.meta.env.VITE_APP_NAME || "Prime"}
        </div>
      </div>
    </div>
  </aside>
);

export const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();

  const { groupedItems, standaloneItems } = useMemo(() => {
    const groups = {};
    const standalone = [];

    navigationItems.forEach((item) => {
      if (item.group) {
        if (!groups[item.group]) {
          groups[item.group] = [];
        }
        groups[item.group].push(item);
      } else {
        standalone.push(item);
      }
    });

    return { groupedItems: groups, standaloneItems: standalone };
  }, []);

  const initialExpandedState = useMemo(() => {
    const expanded = {};
    Object.keys(groupedItems).forEach((groupName) => {
      expanded[groupName] = true;
    });
    return expanded;
  }, [groupedItems]);

  const [expandedMenus, setExpandedMenus] = useState(initialExpandedState);

  const isActive = (path) => {
    return (
      location.pathname === `/${path}` ||
      location.pathname.startsWith(`/${path}/`)
    );
  };

  const isGroupActive = (groupName) => {
    const items = groupedItems[groupName] || [];
    return items.some((item) => isActive(item.key));
  };

  const toggleSubmenu = (groupName) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block md:fixed md:inset-y-0 md:w-64 md:z-40">
        <SidebarContent
          standaloneItems={standaloneItems}
          groupedItems={groupedItems}
          expandedMenus={expandedMenus}
          toggleSubmenu={toggleSubmenu}
          isActive={isActive}
          isGroupActive={isGroupActive}
          onLinkClick={handleLinkClick}
        />
      </div>

      {/* Mobile sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SheetDescription className="sr-only">
          Main navigation menu
        </SheetDescription>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent
            standaloneItems={standaloneItems}
            groupedItems={groupedItems}
            expandedMenus={expandedMenus}
            toggleSubmenu={toggleSubmenu}
            isActive={isActive}
            isGroupActive={isGroupActive}
            onLinkClick={handleLinkClick}
          />
        </SheetContent>
      </Sheet>
    </>
  );
};
