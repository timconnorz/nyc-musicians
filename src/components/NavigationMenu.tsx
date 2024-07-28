import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { ReactNode } from "react";
import Image from "next/image";

const StyledNavigationMenuItem = ({ children }: { children: ReactNode }) => (
  <NavigationMenuItem className="hover:bg-gray-100 px-3 py-2 rounded-md transition-colors duration-200 cursor-pointer">
    {children}
  </NavigationMenuItem>
);

export default function Menu({ className }: { className?: string }) {
  return (
    <NavigationMenu className={className}>
      <NavigationMenuList>
        <StyledNavigationMenuItem>
          Item One
        </StyledNavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}