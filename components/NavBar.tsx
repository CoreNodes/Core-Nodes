import { ReactElement } from "react";
import { Twitter, Discord, GitBook, Home } from "./Icons";

const NavItem: React.FC<{ title: string; href: string; icon: ReactElement; newTab?: boolean }> = (props) => (
  <a
    title={props.title}
    href={props.href}
    className="hover:text-primary"
    {...(props.newTab && { target: "_blank", rel: "noreferrer" })}
  >
    {props.icon}
  </a>
);

const NavBar: React.FC = () => (
  <nav className="flex space-x-6 text-[#62596D] justify-center">
    <NavItem title="Website" href="https://core-nodes.com/" icon={<Home />} />
    <NavItem title="Twitter" href="https://twitter.com/core_nodes" icon={<Twitter />} newTab={true} />
    <NavItem title="Discord" href="https://discord.gg/CmtkBh6H" icon={<Discord />} newTab={true} />
    <NavItem
      title="Gitbook"
      href="https://core-nodes.gitbook.io/core-nodes/fwpsUeT7w2uhzuaFgwa6/protocol-information/background"
      icon={<GitBook />}
      newTab={true}
    />
  </nav>
);
export default NavBar;
