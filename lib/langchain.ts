import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import pineconeClient from "./pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { PineconeConflictError } from "@pinecone-database/pinecone/dist/errors";
import { Index, RecordMetadata } from "@pinecone-database/pinecone";
import { adminDB } from "@/firebaseAdmin";
import { auth } from "@clerk/nextjs/server";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";

// const model = new HuggingFaceTransformersEmbeddings({
//   model: "Xenova/all-MiniLM-L6-v2",
// });

const model = new ChatOpenAI({
  apiKey: process.env.OPEN_API_KEY,
  modelName: "gpt-4o",
});

export const indexName = "garuda";

export async function generateDocs(docId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User Not Found!");
  }

  console.log("--- Fetching the download URL from Firebase... ---");

  const firebaseRef = await adminDB
    .collection("users")
    .doc(userId)
    .collection("files")
    .doc(docId)
    .get();

  const downloadUrl = firebaseRef.data()?.downloadUrl;

  if (!downloadUrl) {
    throw new Error("Download URL not Found");
  }

  console.log(`--- Download URL fetched Successfully: ${downloadUrl} ---`);

  //fetching pdf from url
  const response = await fetch(downloadUrl);

  //Loading into pdf format
  const data = await response.blob();

  //load pdf from specified path
  console.log("--- Loading PDF Document... ---");
  const loader = new PDFLoader(data);
  const docs = await loader.load();

  //split the loaded documnet into smaller parts for easy processing
  console.log("--- Splitting the document into smaller parts... ---");
  const splitter = new RecursiveCharacterTextSplitter();

  const splitDocs = await splitter.splitDocuments(docs);
  console.log(`---Split into ${splitDocs.length} parts ---`);

  return splitDocs;
}

async function namespaceExists(
  index: Index<RecordMetadata>,
  namespace: string
) {
  if (namespace === null) throw new Error("No namespace value provided");
  const { namespaces } = await index.describeIndexStats();
  return namespaces?.[namespace] !== undefined;
}

export async function generateEmbeddingsInPineconeVectorStore(docId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User Not Found!");
  }

  let pineconeVectorStore;

  //generating embeddings
  console.log("--- Generating embeddings... ---");
  const embeddings = new OpenAIEmbeddings();

  const index = await pineconeClient.Index(indexName);
  const nameSpaceAlreadyExists = await namespaceExists(index, docId);

  if (nameSpaceAlreadyExists) {
    console.log(
      `--- Namespace ${docId} already exists, reusing existing embeddings... ---`
    );

    pineconeVectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      namespace: docId,
    });

    return pineconeVectorStore;
  } else {
    //if namespace already exists, download the pdf from firestore via stored downloading URL & generate the embeddings and store them in pinecone vector store.

    const splitDocs = await generateDocs(docId);

    console.log(
      `--- Starting embeddings in namespace ${docId} in the ${indexName} pinecone vector store... ---`
    );

    pineconeVectorStore = await PineconeStore.fromDocuments(
      splitDocs,
      embeddings,
      {
        pineconeIndex: index,
        namespace: docId,
      }
    );
    return pineconeVectorStore;
  }
}
