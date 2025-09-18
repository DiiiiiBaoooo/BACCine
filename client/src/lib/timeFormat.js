import { ClockIcon } from "lucide-react";

const timeFormat = (minutes) =>{
    const hours = Math.floor(minutes/60);
    const minutesRemainder = minutes % 60;
    return `${hours}h  ${minutesRemainder}'`
}

export default timeFormat