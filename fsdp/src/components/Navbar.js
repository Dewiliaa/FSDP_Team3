import '../App.css';
import { SidebarData } from "./SidebarData";
import companyLogo from '../assets/company-logo.png';

function Navbar() {
    return(
        <div className="Sidebar">

            <div className="SidebarHeader">
                <img src={companyLogo} alt="Company Logo" className="logo" />
                <h1 className="companyName">DineAd Connect</h1>
            </div>

            <ul className="SidebarList">
                {SidebarData.map((val, key) => {
                    return(
                        <li
                          key={key}
                          className="row"
                          id={window.location.pathname === val.link ? "active" : ""}
                          onClick={() => {
                            window.location.pathname = val.link;
                          }}
                        >
                          <div className="icon">{val.icon}</div> 
                          <div className="title">{val.title}</div> 
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

export default Navbar;
