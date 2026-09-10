import React from "react";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { GoogleIcon } from "../shared/Icon";


export default function SocialAuth() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 ">
        <Separator className="flex-1" />
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          Or Continue with
        </span>
        <Separator className="flex-1" />
      </div>

      {/* Google */}
      <Button type="button" variant="outline" className="w-full h-12">
        <GoogleIcon />
        Sign in with Google
      </Button>
    </div>
  );
}
