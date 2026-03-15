import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/providers/AuthProvider";
import { Menu, UserCircle, LogOut, User, KeyRound } from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { ChangeCurrentPassword } from "../auth";

export const Navbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed: ", error);
    }
  };

  const handleChangePasswordClick = useCallback(() => {
    setShowChangePasswordModal(true);
  }, []);

  return (
    <>
      <nav className="bg-linear-to-r from-white to-blue-50/30 shadow-md border-b border-blue-100">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={toggleSidebar}
                className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all duration-200"
              >
                <Menu className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            {/* Brand/Logo section */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold bg-linear-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent hidden sm:block">
                {import.meta.env.VITE_APP_NAME || "Prime Exams"}
              </h1>
            </div>

            {/* Desktop profile section */}
            <div className="flex items-center space-x-4">
              {/* User greeting */}
              <div className="hidden sm:block text-sm text-slate-600">
                Welcome,{" "}
                <span className="font-semibold">
                  {user?.userName || user?.email || ""}
                </span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center rounded-full bg-linear-to-r from-blue-50 to-blue-100 p-2 text-sm hover:from-blue-100 hover:to-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 border border-blue-200 shadow-sm">
                    <span className="sr-only">Open user menu</span>
                    <UserCircle className="h-8 w-8 text-blue-600" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-56 rounded-xl shadow-xl border-blue-100"
                >
                  <DropdownMenuLabel className="flex items-center px-2 py-3">
                    <User className="h-5 w-5 text-blue-500 mr-3" />
                    <div>
                      <div className="font-semibold text-slate-900">
                        {user?.userName || "User"}
                      </div>
                      <div className="text-xs text-slate-500 font-normal">
                        {user?.email || "user@example.com"}
                      </div>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator className="bg-blue-100" />
                  <DropdownMenuItem
                    onClick={handleChangePasswordClick}
                    className="flex items-center cursor-pointer hover:bg-blue-50 focus:bg-blue-50"
                  >
                    <KeyRound className="h-5 w-5 mr-3 text-blue-600" />
                    <span className="font-medium text-slate-700">
                      Change Password
                    </span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 focus:bg-red-50"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    <span className="font-medium">Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>
      {/* CHANGE PASSWORD MODAL */}
      <Dialog
        open={showChangePasswordModal}
        onOpenChange={setShowChangePasswordModal}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Change Password</DialogTitle>
          </DialogHeader>
          <ChangeCurrentPassword
            onSuccess={() => setShowChangePasswordModal(false)}
            onCancel={() => setShowChangePasswordModal(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
