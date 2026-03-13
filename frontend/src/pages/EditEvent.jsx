import {useState} from "react"
import {useParams,useNavigate} from "react-router-dom"
import API from "../api/api"

function EditEvent(){

 const {id} = useParams()
 const navigate = useNavigate()

 const [title,setTitle] = useState("")
 const [description,setDescription] = useState("")
 const [venue,setVenue] = useState("")
 const [fee,setFee] = useState("")
 const [limit,setLimit] = useState("")

 const updateEvent = async () => {

  const token = localStorage.getItem("token")

  try{

   await API.put(`/edit-event/${id}`,null,{
    params:{
     title,
     description,
     venue,
     fee,
     participant_limit:limit
    },
    headers:{
     Authorization:`Bearer ${token}`
    }
   })

   alert("Event Updated")

   navigate("/manage-events")

  }catch(err){

   alert("Update failed")

  }

 }

 return(

 <div className="p-10">

 <h1 className="text-3xl mb-5 font-bold">
 Edit Event
 </h1>

 <input placeholder="Title" onChange={(e)=>setTitle(e.target.value)} className="border p-2 block mb-3"/>

 <textarea placeholder="Description" onChange={(e)=>setDescription(e.target.value)} className="border p-2 block mb-3"/>

 <input placeholder="Venue" onChange={(e)=>setVenue(e.target.value)} className="border p-2 block mb-3"/>

 <input placeholder="Fee" onChange={(e)=>setFee(e.target.value)} className="border p-2 block mb-3"/>

 <input placeholder="Limit" onChange={(e)=>setLimit(e.target.value)} className="border p-2 block mb-3"/>

 <button onClick={updateEvent} className="bg-blue-600 text-white px-5 py-2 rounded">
 Update Event
 </button>

 </div>

 )

}

export default EditEvent