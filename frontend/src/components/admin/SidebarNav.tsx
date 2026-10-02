import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { adminNav } from './adminNav';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
  }`;

const childClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-lg px-3 py-1.5 text-sm transition ${
    isActive ? 'bg-red-50 font-medium text-red-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
  }`;

export default function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  // Until the user toggles a group, it is open only when one of its pages is active
  const [toggled, setToggled] = useState<Record<string, boolean>>({});

  return (
    <nav className="flex flex-col gap-1">
      {adminNav.map((item) => {
        if (!('children' in item)) {
          return (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate} className={linkClass}>
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </NavLink>
          );
        }

        const childActive = item.children.some((c) => pathname.startsWith(c.to));
        const open = toggled[item.label] ?? childActive;

        return (
          <div key={item.label}>
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setToggled((prev) => ({ ...prev, [item.label]: !open }))}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                childActive ? 'text-red-600' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <item.icon className="h-[18px] w-[18px]" />
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            <div
              className={`grid transition-all duration-200 ${
                open ? 'grid-rows-[1fr] opacity-100' : 'invisible grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <div className="ml-5 mt-1 flex flex-col gap-1 border-l border-gray-200 pl-3">
                  {item.children.map((child) => (
                    <NavLink key={child.to} to={child.to} onClick={onNavigate} className={childClass}>
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}