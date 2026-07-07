import { ThemeSwitch } from "../ThemeSwitch";
import { CentralNav } from "./CentralNav";
import { NavbarLayout } from "./NavbarLayout"


const Navbar = () => {
  return (
    <NavbarLayout
      center={<CentralNav />}
      right={<ThemeSwitch />}
    />
  )
}

export default Navbar;
