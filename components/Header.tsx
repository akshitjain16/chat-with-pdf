import { SignedIn, UserButton } from "@clerk/nextjs"
import Link from "next/dist/client/link"
import { Button } from "./ui/button"
import { FilePlus2 } from "lucide-react";


function Header() {
  return (
    <div className="flex justify-between bg-white shadow-sm p-5 border-b">
      <Link href="/dashboard" className="text-2xl">
        Chat with <span className="text-indigo-600 ">PDFY</span>
      </Link>

      <SignedIn>
        <div className="flex items-center space-x-2 ">
          <Button asChild variant="outline" className="">
            <Link href="/dashboard">My Documents</Link>
          </Button>

          <Button asChild variant="outline" className="hidden md:flex">
            <Link href="/dashboard/upgrade">Pricing</Link>
          </Button>

          <Button asChild variant="outline" className="border-indigo-600">
            <Link href="/dashboard/upload">
              <p className="pr-1">Upload</p>
              <FilePlus2 className="text-indigo-600" />
            </Link>
          </Button>
          {/*upgrade button*/}
          <UserButton />
        </div>
      </SignedIn>
    </div>
  );
}

export default Header