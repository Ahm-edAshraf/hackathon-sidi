"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { setSession } from "@/lib/session";

const schemas = {
  login: z.object({
    email: z.string(),
    password: z.string(),
  }),
  register: z.object({
    name: z.string(),
    company: z.string(),
    email: z.string(),
    password: z.string(),
  }),
} as const;

type AuthMode = keyof typeof schemas;

type FormValues<T extends AuthMode> = z.infer<(typeof schemas)[T]>;

const successCopy: Record<AuthMode, string> = {
  login: "Signed in successfully. Replace this with the real auth callback later.",
  register: "Account created. Wire this to your backend when ready.",
};

interface AuthFormProps {
  mode: AuthMode;
  onAuthenticated?: () => void;
}

export function AuthForm({ mode, onAuthenticated }: AuthFormProps) {
  const schema = schemas[mode];
  const form = useForm<FormValues<typeof mode>>({
    resolver: zodResolver(schema),
    defaultValues:
      mode === "register"
        ? {
            name: "",
            company: "",
            email: "",
            password: "",
          }
        : {
            email: "",
            password: "",
          },
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const router = useRouter();

  function onSubmit(values: FormValues<typeof mode>) {
    setIsSubmitting(true);
    // Simulated async so the UI feels real today.
    setTimeout(() => {
      toast.success("UI flow ready", {
        description: successCopy[mode],
      });
      console.log(`${mode} request`, values);
      setIsSubmitting(false);
      setSession();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("ledgerly-session"));
      }
      onAuthenticated?.();
      router.push("/dashboard");
    }, 900);
  }

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        {mode === "register" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Alex Morgan"
                      autoComplete="name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Northstar Studio"
                      autoComplete="organization"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="finance@business.com"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Minimum 8 characters"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          size="lg"
          className="w-full rounded-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              {mode === "login" ? "Signing in" : "Creating account"}...
            </span>
          ) : mode === "login" ? (
            "Sign in"
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </Form>
  );
}
