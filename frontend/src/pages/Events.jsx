import { useEffect, useState } from "react"
import API from "../api/api"

function Events(){

const [events,setEvents] = useState([])
const [ticketQR,setTicketQR] = useState(null)

const bookTicket = async(eventId)=>{
const token = localStorage.getItem("token")
const payload = JSON.parse(atob(token.split(".")[1]))
const userId = payload.id
try{

const res = await API.post("/register-event",null,{
params:{
user_id:userId,
event_id:eventId
}
})

setTicketQR(res.data.qr_image)

alert("Ticket Booked Successfully!")

}catch(err){

alert(err.response?.data?.detail || "Error booking ticket")

}

}

useEffect(()=>{

API.get("/events")
.then(res => setEvents(res.data))
.catch(err => console.log(err))

},[])

return(

<div className="min-h-screen bg-gray-100 p-10">

<h1 className="text-4xl font-bold mb-10 text-center">
CampusIQ Events
</h1>

<div className="grid grid-cols-1 md:grid-cols-3 gap-8">

{events.map(event=>(

<div key={event.id} className="bg-white shadow-lg rounded-xl overflow-hidden">

{event.poster && (

<img
src={`http://127.0.0.1:8001/uploads/${event.poster}`}
className="w-full h-48 object-cover"
/>

)}

<div className="p-5">

<h2 className="text-2xl font-semibold mb-2">
{event.title}
</h2>

<p className="text-gray-600 mb-1">
📍 {event.venue}
</p>

<p className="text-gray-700 mb-4">
💰 Fee: ₹{event.fee}
</p>

<button
onClick={()=>bookTicket(event.id)}
className="bg-blue-600 text-white px-4 py-2 rounded w-full"
>
Book Ticket
</button>

</div>

</div>

))}

</div>

{ticketQR &&(

<div className="mt-16 text-center">

<h2 className="text-2xl font-bold mb-5">
Your Ticket QR
</h2>

<img
src={`http://127.0.0.1:9000${ticketQR}`}
className="mx-auto w-60"
/>

</div>

)}

</div>

)

}

export default Events