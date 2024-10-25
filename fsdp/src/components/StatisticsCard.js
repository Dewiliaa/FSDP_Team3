import { FaRegClock } from "react-icons/fa";
import { MdDevices } from "react-icons/md";

function Card(){
    return(
        <div className="card">
            <h1>Statistics</h1>

            <div className="display-times">
                <FaRegClock className="clock-icon"/>
                <h2 className="time-stat"> Time</h2>
                <p className="time-title">Ad Display Times</p>
            </div>

            <div className="device-count">
                <MdDevices className="device-icon"/>
                <h2 className="time-stat"> Number</h2>
                <p className="time-title">Devices Used Today</p>
            </div>
        </div>
    );
}

export default Card