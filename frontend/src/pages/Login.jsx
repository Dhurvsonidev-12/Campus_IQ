import { useState } from "react"
import API from "../api/api"
import { useNavigate } from "react-router-dom"

function Login(){

 const navigate = useNavigate()

 const [role,setRole] = useState("student")
 const [email,setEmail] = useState("")
 const [password,setPassword] = useState("")

const login = async () => {

  try{

   const res = await API.post("/login", null, {
    params:{email,password}
   })

   const token = res.data.access_token
   const payload = JSON.parse(atob(token.split(".")[1]))

   if(payload.role !== role){
    alert("Selected role does not match your account role")
    return
   }

   localStorage.setItem("token",token)

   if(role === "host"){
    navigate("/host")
   }
   else if(role === "volunteer"){
    navigate("/scanner")
   }
   else{
    navigate("/events")
   }

  }catch{
   alert("Invalid email or password")
  }

}

 return(

 <div className="min-h-screen flex items-center justify-center bg-gray-100">

  <div className="bg-white shadow-xl rounded-2xl p-8 w-96">

   <h1 className="text-2xl font-bold text-center mb-6">
    Welcome to CampusIQ
   </h1>

   <p className="text-sm mb-2">Role Selection</p>

   <div className="flex bg-gray-200 rounded-full mb-5">

    <button
     onClick={()=>setRole("student")}
     className={`flex-1 py-2 rounded-full ${
      role==="student" ? "bg-blue-600 text-white" : ""
     }`}
    >
     Student
    </button>

    <button
     onClick={()=>setRole("host")}
     className={`flex-1 py-2 rounded-full ${
      role==="host" ? "bg-blue-600 text-white" : ""
     }`}
    >
     Host
    </button>

    <button
     onClick={()=>setRole("volunteer")}
     className={`flex-1 py-2 rounded-full ${
      role==="volunteer" ? "bg-blue-600 text-white" : ""
     }`}
    >
     Volunteer
    </button>

   </div>

   <input
    placeholder="Email Address"
    className="border p-2 w-full mb-3 rounded"
    onChange={(e)=>setEmail(e.target.value)}
   />

   <input
    type="password"
    placeholder="Password"
    className="border p-2 w-full mb-4 rounded"
    onChange={(e)=>setPassword(e.target.value)}
   />

   <button
    onClick={login}
    className="bg-blue-600 text-white w-full py-2 rounded-lg"
   >
    Login
   </button>

   <p className="text-sm text-center mt-4">
    Don't have an account?
    <span
     className="text-blue-600 cursor-pointer ml-1"
     onClick={()=>navigate("/")}
    >
     Register
    </span>
   </p>

  </div>

 </div>

 )

}

export default Login