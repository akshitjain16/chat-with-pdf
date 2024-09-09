'use client'

import { generateEmbeddings } from "@/actions/generateEmbeddings";
import { db, storage } from "@/firebase";
import { useUser } from "@clerk/nextjs";
import { doc, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { useRouter } from "next/navigation";
import { useState } from "react"
import { v4 as uuidv4 } from 'uuid';

export enum StatusText{
    UPLOADING ="Uplaoding File...",
    UPLOADED = "File Uploaded Successfully",
    SAVING = "Saving File to database...",
    Generating = "Generating AI Embeddings, This will take a few Seconds..."
}

export type Status = StatusText[keyof StatusText];

function useUpload() {
   const [progress, setProgress] = useState< number | null>(null);
   const [fileId, setFileId] = useState< string | null>(null);
   const [status, setStatus] = useState< Status | null>(null);
   const {user} = useUser();
   const router = useRouter;

   const handleUpload = async(file: File) =>{
    if(!file || !user) return;
    // pro limitations ... to make

    const fileIdToUploadTo = uuidv4();

    const storageRef = ref(storage, `users/${user.id}/files/${fileIdToUploadTo}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on("state_changed", (snapshot) => {
        const percent = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        setStatus(StatusText.UPLOADING);
        setProgress(percent);
    }, (error) =>{
        console.error("Error Uplaoding File", error);
    }, async ()=>{
        //uploading to storage
        setStatus(StatusText.UPLOADED);
        //creating a reference in storage
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        //saving to storage
        setStatus(StatusText.SAVING);
        // downloading from storage
        await setDoc(doc(db, "users", user.id, 'files', fileIdToUploadTo), {
            name: file.name,
            size: file.size,
            type: file.type,
            downloadUrl: downloadUrl,
            ref: uploadTask.snapshot.ref.fullPath,
            createdAt: new Date(),
        })

        setStatus(StatusText.Generating);
        // Generating AI embeddings
        await generateEmbeddings(fileIdToUploadTo);
        
        setFileId(fileIdToUploadTo);

    }
);

   }
   return {progress, status, fileId, handleUpload};
}

export default useUpload;