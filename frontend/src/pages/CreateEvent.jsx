import { useState } from "react"
import API from "../api/api"
import Sidebar from "../components/Sidebar"

function CreateEvent(){

 const [title,setTitle] = useState("")
 const [description,setDescription] = useState("")
 const [venue,setVenue] = useState("")
 const [fee,setFee] = useState("")
 const [limit,setLimit] = useState("")
 const [poster,setPoster] = useState(null)

const createEvent = async () => {

 const token = localStorage.getItem("token")

 const formData = new FormData()

 formData.append("title", title)
 formData.append("description", description)
 formData.append("venue", venue)
 formData.append("fee", Number(fee))
 formData.append("participant_limit", Number(limit))

 if (poster) {
  formData.append("poster", poster)
 }

 try {

  const res = await API.post(
   "/create-event",
   formData,
   {
    headers:{
 Authorization:`Bearer ${token}`
    }
   }
  )

  alert("Event Created")

 } catch(err){

  console.log(err.response)
  alert("Error creating event")

 }

}

 return(

 <div className="flex">

  <Sidebar/>

  <div className="flex-1 p-10">

   <h1 className="text-3xl font-bold mb-6">
    The Creator’s Studio
   </h1>

   <div className="bg-white shadow-xl rounded-xl p-8 w-[500px]">

    <h2 className="text-xl font-semibold mb-4">
     Focused Form
    </h2>

    <input
     placeholder="Event Title"
     className="border p-2 w-full mb-3"
     onChange={(e)=>setTitle(e.target.value)}
    />

    <textarea
     placeholder="Description"
     className="border p-2 w-full mb-3"
     onChange={(e)=>setDescription(e.target.value)}
    />

    <input
     placeholder="Venue"
     className="border p-2 w-full mb-3"
     onChange={(e)=>setVenue(e.target.value)}
    />

    <input
     type="file"
     onChange={(e)=>setPoster(e.target.files[0])}
     className="border p-2 w-full mb-3"
    />

    <div className="flex gap-3 mt-4">

     <input
      placeholder="Entry Fee"
      className="border p-2 flex-1"
      onChange={(e)=>setFee(e.target.value)}
     />

     <input
      placeholder="Participant Limit"
      className="border p-2 flex-1"
      onChange={(e)=>setLimit(e.target.value)}
     />

    </div>

    <button
     onClick={createEvent}
     className="bg-blue-600 text-white w-full py-2 mt-5 rounded-lg"
    >
     Create Event
    </button>

   </div>

  </div>

 </div>

 )

}

export default CreateEvent