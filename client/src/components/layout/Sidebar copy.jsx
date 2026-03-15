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
  Menu,
  X,
  UserCircle,
  DollarSign,
  LayoutDashboard,
} from "lucide-react";

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
  "User Management": UserCircle,
};

export const Sidebar = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  // Separate grouped and standalone items
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

  // Initialize all group menus as expanded by default
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

  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobile}
        className="fixed top-4 start-4 z-50 lg:hidden p-2 rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileOpen ?
          <X className="size-5" />
        : <Menu className="size-5" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={toggleMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 start-0 z-40 h-screen bg-white border-e border-gray-200
          transition-transform duration-300 ease-in-out w-64
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* App Name/Logo */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h1 className="font-bold text-xl text-gray-900">My App</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {/* Standalone items (no group) */}
            {standaloneItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.key);

              return (
                <Link
                  key={item.key}
                  to={`/${item.key}`}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200
                    ${
                      active ?
                        "bg-gray-900 text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }
                  `}
                >
                  <Icon className="size-5 shrink-0" />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}

            {/* Add spacing between standalone and grouped items if both exist */}
            {standaloneItems.length > 0 &&
              Object.keys(groupedItems).length > 0 && <div className="h-2" />}

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
                          "bg-gray-100 text-gray-900"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
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
                    <div className="mt-1 ms-4 space-y-1 border-s-2 border-gray-200 ps-4">
                      {items.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.key);

                        return (
                          <Link
                            key={item.key}
                            to={`/${item.key}`}
                            onClick={() => setIsMobileOpen(false)}
                            className={`
                              flex items-center gap-3 px-3 py-2 rounded-lg
                              transition-all duration-200
                              ${
                                active ?
                                  "bg-gray-900 text-white shadow-sm"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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
          <div className="shrink-0 px-3 py-4 border-t border-gray-700">
            <div className="text-xs text-gray-400 text-center">
              © {new Date().getFullYear()}{" "}
              {import.meta.env.VITE_APP_NAME_SHORT || "Prime"} System
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
