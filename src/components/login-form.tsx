"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { KeyRound, Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { authStorage } from "@/lib/auth-storage"
import { AuthValidator } from "@/lib/auth-validation"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { User } from "@/types/auth"

const MOCK_CREDENTIALS = {
  email: 'admin@demo.com',
  password: 'password',
}

const MOCK_USER: User = {
  id: 1,
  email: 'admin@demo.com',
  name: 'Demo Admin',
  phone_number: null,
  is_active: true,
  organization_id: 'org-demo-123',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  organization: { id: 'org-demo-123', name: 'Demo Organization' },
  permissions: {
    user_id: 1,
    roles: [],
    role_permissions: ['system.admin'],
    granted_permissions: ['system.admin'],
    denied_permissions: [],
    effective_permissions: [
      'system.admin',
      'organization.read',
      'organization.update',
      'organization.delete',
    ],
    field_permissions: {},
  },
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Simulate a brief loading delay
    await new Promise(res => setTimeout(res, 600))

    if (email === MOCK_CREDENTIALS.email && password === MOCK_CREDENTIALS.password) {
      AuthValidator.setMockToken()
      authStorage.setUser(MOCK_USER)
      toast.success('Welcome back, Demo Admin!')
      router.push('/dashboard')
    } else {
      setError('Invalid email or password.')
      toast.error('Login failed', { description: 'Invalid email or password.' })
    }

    setIsLoading(false)
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Enter your credentials below to access the dashboard
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            placeholder="admin@demo.com"
            type="email"
            autoComplete="email"
            defaultValue="admin@demo.com"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              placeholder="Enter your password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              defaultValue="password"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="sr-only">{showPassword ? "Hide" : "Show"} password</span>
            </Button>
          </div>
        </div>

        <div className="rounded-md bg-muted px-4 py-3 text-xs text-muted-foreground">
          <strong>Demo credentials:</strong><br />
          Email: <code>admin@demo.com</code><br />
          Password: <code>password</code>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Signing in...
            </span>
          ) : (
            <>
              <KeyRound className="mr-2 h-4 w-4" />
              Sign in
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
