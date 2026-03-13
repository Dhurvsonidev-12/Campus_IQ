import { useDropzone } from "react-dropzone"

function PosterUpload({setPoster}){

 const {getRootProps,getInputProps} = useDropzone({
  accept:"image/*",
  onDrop:(files)=>{
   setPoster(files[0])
  }
 })

 return(

 <div
  {...getRootProps()}
  className="border-dashed border-2 p-6 text-center rounded-lg cursor-pointer"
 >

  <input {...getInputProps()} />

  <p>Drag & Drop Event Poster</p>
  <p className="text-sm text-gray-500">Click to upload</p>

 </div>

 )

}

export default PosterUpload