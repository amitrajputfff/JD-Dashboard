"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AuthValidator } from "@/lib/auth-validation"
import { authStorage } from "@/lib/auth-storage"
import { User } from "@/types/auth"

const MOCK_USER: User = {
  id: 1,
  email: "admin@demo.com",
  name: "Demo Admin",
  phone_number: null,
  is_active: true,
  organization_id: "org-demo-123",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  organization: { id: "org-demo-123", name: "Demo Organization" },
  permissions: {
    user_id: 1,
    roles: [],
    role_permissions: ["system.admin"],
    granted_permissions: ["system.admin"],
    denied_permissions: [],
    effective_permissions: [
      "system.admin",
      "organization.read",
      "organization.update",
      "organization.delete",
    ],
    field_permissions: {},
  },
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (email === "admin@demo.com" && password === "password") {
      AuthValidator.setMockToken()
      authStorage.setUser(MOCK_USER)
      router.push("/dashboard")
    } else {
      setError("Invalid email or password")
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-xl font-bold">JustDial</h1>
            <FieldDescription>Sign in to your account</FieldDescription>
          </div>
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="admin@demo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          <Field>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center text-xs text-muted-foreground">
        Demo credentials: admin@demo.com / password
      </FieldDescription>
    </div>
  )
}
