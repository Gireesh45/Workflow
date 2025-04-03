import { FC } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { List, Settings, HelpCircle, LogOut } from "lucide-react";

const Sidebar: FC = () => {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const isActive = (path: string) => location === path;
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  const userInitials = user?.username 
    ? user.username.charAt(0).toUpperCase() 
    : user?.email 
      ? user.email.charAt(0).toUpperCase() 
      : "U";
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white border-r border-neutral-200 flex-shrink-0 hidden md:flex md:flex-col h-screen">
        <div className="p-6 border-b border-neutral-200">
          <h1 className="font-bold text-xl text-neutral-900">Workflow System</h1>
        </div>
        
        <nav className="p-4 flex-1">
          <ul className="space-y-2">
            <li>
              <Link href="/workflows">
                <div className={`flex items-center px-3 py-2 text-neutral-700 rounded-md cursor-pointer ${isActive("/workflows") ? "bg-neutral-100 font-medium" : "hover:bg-neutral-100"}`}>
                  <List className="h-5 w-5 mr-3 text-primary" />
                  Workflows
                </div>
              </Link>
            </li>
            <li>
              <Link href="/settings">
                <div className={`flex items-center px-3 py-2 text-neutral-600 rounded-md cursor-pointer ${isActive("/settings") ? "bg-neutral-100 font-medium" : "hover:bg-neutral-100"}`}>
                  <Settings className="h-5 w-5 mr-3 text-neutral-500" />
                  Settings
                </div>
              </Link>
            </li>
            <li>
              <Link href="/help">
                <div className={`flex items-center px-3 py-2 text-neutral-600 rounded-md cursor-pointer ${isActive("/help") ? "bg-neutral-100 font-medium" : "hover:bg-neutral-100"}`}>
                  <HelpCircle className="h-5 w-5 mr-3 text-neutral-500" />
                  Help
                </div>
              </Link>
            </li>
          </ul>
        </nav>
        
        <div className="p-4 border-t border-neutral-200">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
              <span>{userInitials}</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-neutral-800">{user?.username || "User"}</p>
              <p className="text-xs text-neutral-500">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto text-neutral-500 hover:text-neutral-700"
              onClick={handleLogout}
              aria-label="Log out"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </aside>
      
      {/* Mobile Navigation */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white z-10 border-b border-neutral-200 px-4 py-3 flex items-center">
        <Button variant="ghost" size="icon" className="text-neutral-500 mr-3" aria-label="Open navigation menu">
          <List className="h-6 w-6" />
        </Button>
        <h1 className="font-bold text-lg text-neutral-900">Workflow System</h1>
      </div>
    </>
  );
};

export default Sidebar;
