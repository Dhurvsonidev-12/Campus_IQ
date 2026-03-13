import { useEffect,useState } from "react"
import API from "../api/api"
import { useNavigate } from "react-router-dom"
import Sidebar from "../components/Sidebar"

function HostEvents(){

const [events,setEvents] = useState([])
const navigate = useNavigate()

useEffect(()=>{

API.get("/host/events")
.then(res => setEvents(res.data))
.catch(err => console.log(err))

},[])

return(

<div className="flex">

<Sidebar/>

<div className="p-10 w-full">

<div className="flex justify-between mb-8">

<h1 className="text-3xl font-bold">
Manage Events
</h1>

<button
onClick={()=>navigate("/host/create")}
className="bg-blue-600 text-white px-5 py-2 rounded-lg"
>
Create New Event
</button>

</div>

<div className="grid grid-cols-1 md:grid-cols-3 gap-6">

{events.map(event=>(

<div key={event.id} className="bg-white shadow-lg rounded-xl overflow-hidden">

{event.poster && (

<img
src={`http://127.0.0.1:8001/uploads/${event.poster}`}
className="w-full h-40 object-cover"
/>

)}

<div className="p-6">

<h2 className="text-xl font-semibold">
{event.title}
</h2>

<p className="text-gray-500">
Venue: {event.venue}
</p>

<p className="text-gray-500">
Fee: ₹{event.fee}
</p>

<p className="text-gray-500">
Limit: {event.participant_limit}
</p>

</div>

</div>

))}

</div>

</div>

</div>

)

}

export default HostEvents