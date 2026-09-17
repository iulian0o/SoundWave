import { useSignIn } from "@clerk/react";
import { Button } from "./ui/button";

export default function SignInOAuthButtons() {
  const { signIn } = useSignIn();

  const signInWithGoogle = async () => {
    console.log("button clicked");
    console.log("signIn object:", signIn);
    console.log("typeof signIn.sso:", typeof signIn?.sso);

    const { error } = await signIn.sso({
      strategy: "oauth_google",
      redirectCallbackUrl: "/sso-callback",
      redirectUrl: "/auth-callback",
    });

    if (error) {
      console.error(JSON.stringify(error, null, 2));
    }
  };

  return (
    <Button
      onClick={signInWithGoogle}
      variant={"secondary"}
      className="w-full text-white border-winc-200 h-11"
    >
      Continue with Google
    </Button>
  );
}
