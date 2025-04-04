import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { loginSchema, registerUserSchema, socialLoginSchema } from "@shared/schema";
import { z } from "zod";
import { Link } from "wouter";
import { signInWithGoogle, signInWithFacebook, signInWithApple } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Form values types
type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerUserSchema>;

export default function AuthPage() {
  const { loginMutation, registerMutation, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [socialLoading, setSocialLoading] = useState(false);

  // Handle redirect if user is already logged in
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Initialize login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Initialize registration form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  // Login form submission handler
  const handleLogin = (values: LoginFormValues) => {
    loginMutation.mutate(values, {
      onSuccess: () => {
        setLocation("/");
      }
    });
  };

  // Registration form submission handler
  const handleRegister = (values: RegisterFormValues) => {
    registerMutation.mutate(values, {
      onSuccess: () => {
        setLocation("/");
      }
    });
  };

  // Function to handle social login
  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'apple') => {
    try {
      setSocialLoading(true);
      
      // Get the appropriate sign-in function based on provider
      const signInFunction = 
        provider === 'google' ? signInWithGoogle : 
        provider === 'facebook' ? signInWithFacebook : 
        signInWithApple;
      
      // Perform the Firebase authentication
      const result = await signInFunction();
      const user = result.user;
      
      if (!user || !user.email) {
        throw new Error("Failed to get user information");
      }
      
      // Prepare data for backend
      const socialData = {
        email: user.email,
        username: user.displayName || user.email.split('@')[0],
        providerId: user.uid,
        provider: provider,
        photoURL: user.photoURL || null
      };
      
      // Send to our backend to create/login user
      const response = await apiRequest("POST", "/api/social-login", socialData);
      if (!response.ok) {
        throw new Error("Failed to authenticate with server");
      }
      
      // Refresh the user state
      window.location.href = "/";
      
    } catch (error: any) {
      console.error("Social login error:", error);
      toast({
        title: "Authentication Failed",
        description: typeof error.message === 'string' 
          ? error.message 
          : "Could not sign in with social provider",
        variant: "destructive"
      });
    } finally {
      setSocialLoading(false);
    }
  };

  // Background style with overlapping gradients
  const backgroundStyle = {
    backgroundImage: "url('https://images.unsplash.com/photo-1505144808419-1957a94ca61e?q=80&w=1776&auto=format&fit=crop')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <div className="min-h-screen flex" style={backgroundStyle}>
      {/* Left Side - Branding */}
      <div className="hidden md:flex md:flex-col md:w-1/2 p-12 text-white justify-center">
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold">WM</span>
            </div>
            <span className="text-2xl font-bold text-white">HighBridge</span>
          </div>
        </div>
        
        <div className="max-w-md">
          <h1 className="text-4xl font-bold mb-4">Building the Future...</h1>
          <p className="text-lg text-white text-opacity-80 mb-8">
            Our platform helps you visualize, manage, and automate your workflows
            with an intuitive drag-and-drop interface.
          </p>
        </div>
      </div>
      
      {/* Right Side - Auth Forms */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl p-8 shadow-lg">
          {/* Login Form */}
          <div>
            <div className="mb-6">
              <h2 className="text-sm font-medium text-gray-500 uppercase">WELCOME BACK!</h2>
              <h1 className="text-2xl font-bold mt-1">Log In to your Account</h1>
            </div>
            
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="Type here..." 
                          className="rounded-md h-11" 
                          {...field}
                          required
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel className="text-sm font-medium">Password</FormLabel>
                        <Link href="/forgot-password" className="text-xs text-gray-500 hover:text-gray-700">
                          Forgot Password?
                        </Link>
                      </div>
                      <FormControl>
                        <Input type="password" placeholder="Type here..." className="rounded-md h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex items-center space-x-2 mb-6">
                  <Checkbox id="remember-me" />
                  <label htmlFor="remember-me" className="text-sm font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Remember me
                  </label>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-red-500 hover:bg-red-600 rounded-md"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing in..." : "Log in"}
                </Button>
              </form>
            </Form>
            
            <div className="my-6 text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-2 text-sm text-gray-500">Or</span>
                </div>
              </div>
            </div>
            
            {/* Social Login Options */}
            <div className="space-y-3">
              <div className="w-full flex items-center justify-center gap-2 h-11 rounded-md border border-gray-300 bg-gray-50 text-sm font-medium cursor-not-allowed opacity-70">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                <span>Log in with Google</span>
              </div>
              
              <div className="w-full flex items-center justify-center gap-2 h-11 rounded-md border border-gray-300 bg-gray-50 text-sm font-medium cursor-not-allowed opacity-70">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                <span>Log in with Facebook</span>
              </div>
              
              <div className="w-full flex items-center justify-center gap-2 h-11 rounded-md border border-gray-300 bg-gray-50 text-sm font-medium cursor-not-allowed opacity-70">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="18" height="18"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                <span>Log in with Apple</span>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                New User? <Link href="/register" className="font-medium text-black hover:underline">SIGN UP HERE</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}