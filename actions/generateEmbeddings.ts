'use server'

import { generateEmbeddingsInPineconeVectorStore } from "@/lib/langchain";
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache";

export async function generateEmbeddings(docId:string) {
    auth().protect  //protect route with sign ins using clerk

    //turn a pdf into embeddings eg. 0.02335223 ....
    await generateEmbeddingsInPineconeVectorStore(docId);

    revalidatePath('/dashboard');

    return {completed : true};
}