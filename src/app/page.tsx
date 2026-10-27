"use client"
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Page = () =>{
  let [val , setval] = useState(0);
  let somehing = true ;
  return (
    <>
   <div className="min-h-screen min-w-screen flex items-center justify-center">
    <Button onClick={()=>{
     setval(val+1)
    }}>click me </Button>
 
   </div>
      <div>{val}</div>
   </>
  );
}


export default Page ;