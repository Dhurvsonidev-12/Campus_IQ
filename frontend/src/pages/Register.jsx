import { useState } from "react"
import API from "../api/api"
import { useNavigate } from "react-router-dom"
import { GraduationCap, Megaphone, User } from "lucide-react"

function Register(){

 const navigate = useNavigate()

 const [name,setName] = useState("")
 const [email,setEmail] = useState("")
 const [password,setPassword] = useState("")
 const [role,setRole] = useState("student")

 const register = async () => {

  try {

    const res = await API.post("/register", {
      name: name,
      email: email,
      password: password,
      role: role
    })

    alert("Account created successfully")

    navigate("/login")

  } catch (err) {

    console.log(err.response)

    alert(err.response?.data?.detail || "Registration failed")

  }

}

 return(

 <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-blue-100">

  <div className="bg-white shadow-xl rounded-2xl p-8 w-96">

   <h1 className="text-2xl font-bold mb-4">
    Create your CampusIQ account
   </h1>

   <p className="text-gray-500 mb-6">
    Sign up to discover, book, and host campus events.
   </p>

   <input
    placeholder="Full Name"
    className="border p-2 w-full mb-3 rounded"
    onChange={(e)=>setName(e.target.value)}
   />

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

   <p className="text-sm mb-2">I want to join as:</p>

   <div className="flex bg-gray-200 rounded-full p-1 mb-5">

    <button
     onClick={()=>setRole("student")}
     className={`flex items-center justify-center gap-2 flex-1 py-2 rounded-full ${
      role==="student" ? "bg-blue-600 text-white" : ""
     }`}
    >
     <GraduationCap size={18}/> Student
    </button>

    <button
     onClick={()=>setRole("host")}
     className={`flex items-center justify-center gap-2 flex-1 py-2 rounded-full ${
      role==="host" ? "bg-blue-600 text-white" : ""
     }`}
    >
     <Megaphone size={18}/> Host
    </button>

    <button
     onClick={()=>setRole("volunteer")}
     className={`flex items-center justify-center gap-2 flex-1 py-2 rounded-full ${
      role==="volunteer" ? "bg-blue-600 text-white" : ""
     }`}
    >
     <User size={18}/> Volunteer
    </button>

   </div>

   <button
    onClick={register}
    className="bg-blue-600 text-white w-full py-2 rounded-lg"
   >
    Create account
   </button>

   <p className="text-center text-sm mt-4">

    Already registered?

    <span
     className="text-blue-600 cursor-pointer ml-1"
     onClick={()=>navigate("/login")}
    >
     Login
    </span>

   </p>

  </div>

 </div>

 )

}

export default Register