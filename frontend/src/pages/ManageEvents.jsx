import { useEffect, useState } from "react"
import API from "../api/api"
import Sidebar from "../components/Sidebar"
import { useNavigate } from "react-router-dom"

function ManageEvents(){

 const [events,setEvents] = useState([])
 const navigate = useNavigate()

 const token = localStorage.getItem("token")

 const fetchEvents = () => {

  API.get("/host/events",{
   headers:{
    Authorization:`Bearer ${token}`
   }
  })
  .then(res => setEvents(res.data))
  .catch(err => console.log(err))

 }

 useEffect(()=>{
  fetchEvents()
 },[])

 const deleteEvent = async(id) => {

  try{

   await API.delete(`/delete-event/${id}`,{
    headers:{
     Authorization:`Bearer ${token}`
    }
   })

   alert("Event Deleted")

   setEvents(events.filter(e => e.id !== id))

  }catch(err){

   alert(err.response?.data?.detail || "Delete failed")

  }

 }

 return(

 <div className="flex">

 <Sidebar/>

 <div className="flex-1 p-10">

 <div className="flex justify-between mb-6">

 <h1 className="text-3xl font-bold">
  Manage Events
 </h1>

 <button
  onClick={()=>navigate("/create-event")}
  className="bg-blue-600 text-white px-4 py-2 rounded"
 >
  Create New Event
 </button>

 </div>

 <div className="grid grid-cols-3 gap-6">

 {events.map(event => (

 <div key={event.id} className="bg-white shadow rounded p-5">

 {event.poster && (
  <img
   src={`http://127.0.0.1:9000/${event.poster}`}
   className="w-full h-32 object-cover rounded mb-3"
  />
 )}

 <h2 className="text-xl font-semibold mb-2">
  {event.title}
 </h2>

 <p className="text-gray-500">
  {event.venue}
 </p>

 <p className="text-gray-500 mb-4">
  Fee ₹{event.fee}
 </p>

 <div className="flex gap-3">

 <button
  onClick={()=>navigate(`/edit-event/${event.id}`)}
  className="bg-yellow-500 text-white px-3 py-1 rounded"
 >
  Edit
 </button>

 <button
  onClick={()=>deleteEvent(event.id)}
  className="bg-red-500 text-white px-3 py-1 rounded"
 >
  Delete
 </button>

 </div>

 </div>

 ))}

 </div>

 </div>

 </div>

 )

}

export default ManageEvents