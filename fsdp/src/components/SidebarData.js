import { MdDashboard } from "react-icons/md";
import { RiAdvertisementFill } from "react-icons/ri";
import { MdPermMedia } from "react-icons/md";
import { FaClock } from "react-icons/fa";
import { MdDevices } from "react-icons/md";

export const SidebarData = [
    {
        title: "Dashboard",
        icon: <MdDashboard/>,
        link: "/dashboard"
    },


    {
        title: "Manage Ads",
        icon: <RiAdvertisementFill/> ,
        link: "/adManagement"
    },


    {
        title: "Library",
        icon: <MdPermMedia/>        ,
        link: "/library"
    },


    {
        title: "Scheduling",
        icon: <FaClock/>,
        link: "/scheduling"
    },


    {
        title: "Devices",
        icon: <MdDevices/>,
        link: "/devices"
    },
]