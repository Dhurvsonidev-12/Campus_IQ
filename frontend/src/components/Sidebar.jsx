import { LayoutDashboard, Calendar, BarChart, User } from "lucide-react"
import { useNavigate } from "react-router-dom"

function Sidebar(){

 const navigate = useNavigate()

 return(

 <div className="w-60 bg-white shadow-md h-screen p-5">

  <h1 className="text-xl font-bold mb-8">CampusIQ</h1>

  <div className="flex flex-col gap-4">

   <button onClick={()=>navigate("/host")}
   className="flex gap-2 items-center">
    <LayoutDashboard size={18}/> Dashboard
   </button>

   <button onClick={()=>navigate("/manage-events")}
   className="flex gap-2 items-center">
    <Calendar size={18}/> Manage Events
   </button>

   <button onClick={()=>navigate("/host/analytics")}
   className="flex gap-2 items-center">
    <BarChart size={18}/> Analytics
   </button>

   <button className="flex gap-2 items-center">
    <User size={18}/> My Account
   </button>

  </div>

 </div>

 )

}

export default Sidebar