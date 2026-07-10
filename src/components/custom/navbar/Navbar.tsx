import { ThemeSwitch } from "../ThemeSwitch";
import { CentralNav } from "./CentralNav";
import { NavbarLayout } from "./NavbarLayout"
import { SidebarButton } from "./SidebarButton"


const Navbar = () => {
  return (
    <NavbarLayout
      left={<SidebarButton />}
      center={<CentralNav />}
      right={<ThemeSwitch />}
    />
  )
}

export default Navbar;
