import Sidebar from "../components/Sidebar"

function Analytics(){

 return(

  <div className="flex">

   <Sidebar/>

   <div className="p-10 w-full">

    <h1 className="text-3xl font-bold mb-6">
      Analytics Dashboard
    </h1>

    <p className="text-gray-600">
      Event analytics will appear here.
    </p>

   </div>

  </div>

 )

}

export default Analytics