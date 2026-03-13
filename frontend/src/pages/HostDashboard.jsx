import Sidebar from "../components/Sidebar"

function HostDashboard(){

 return(

  <div className="flex">

   <Sidebar/>

   <div className="p-10">
    <h1 className="text-3xl font-bold">
     Host Dashboard
    </h1>
   </div>

  </div>

 )

}

export default HostDashboard